import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import { generateAccessToken, generateRefreshToken } from '../utils/token';
import { AppError } from '../app';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail, testSmtpConnection } from '../utils/emailService';

// Controller to test SMTP configuration and diagnose credentials
export const testSmtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const toEmail = req.query.email as string | undefined || req.body?.email;
    const result = await testSmtpConnection(toEmail);
    res.status(result.success ? 200 : 400).json({
      status: result.success ? 'success' : 'fail',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// First user to register becomes admin for easy bootstrapping
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, password, role: bodyRole } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already registered', 400));
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return next(new AppError('Mobile number already registered', 400));
      }
    }

    const countUsers = await User.countDocuments();
    let role = countUsers === 0 ? 'admin' : 'customer';

    if (bodyRole && (bodyRole === 'admin' || bodyRole === 'employee')) {
      role = bodyRole;
    }

    const user = await User.create({
      name,
      email,
      phone: phone || undefined,
      password,
      role,
      isVerified: role === 'admin' || role === 'employee'
    });

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);

    user.refreshToken = refreshToken;
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: 'USER_REGISTER',
      details: `User registered with role ${user.role}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailOrPhone, email, phone, username, password } = req.body;
    const rawIdentifier = (emailOrPhone || email || phone || username || '').toString().trim();

    if (!rawIdentifier || !password) {
      return next(new AppError('Please provide email/phone and password', 400));
    }

    // Detect if input is a phone number (10 digits) or email
    const isPhone = /^[6-9]\d{9}$/.test(rawIdentifier);
    const query = isPhone ? { phone: rawIdentifier } : { email: rawIdentifier.toLowerCase() };

    const user = await User.findOne(query).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect credentials', 401));
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);

    user.refreshToken = refreshToken;
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: 'USER_LOGIN',
      details: `User logged in via ${isPhone ? 'phone' : 'email'} successfully`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey1234567890123456') as { id: string; role: string };

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString(), user.role);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(new AppError('Invalid or expired refresh token', 401));
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawIdentifier = (req.body.email || req.body.emailOrPhone || '').toString().trim();
    if (!rawIdentifier) return next(new AppError('Email address or mobile number is required', 400));

    const normalizedEmail = rawIdentifier.toLowerCase();
    
    // Support lookup by either email or registered phone number
    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: rawIdentifier }
      ]
    });

    if (!user) {
      console.warn(`Forgot password requested for non-existent account: ${rawIdentifier}`);
      return next(new AppError('No account found with this email or mobile number', 404));
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15-minute expiration
    await user.save();

    console.log(`[AUTH] Generated reset OTP for ${user.email} (Name: ${user.name}): ${resetToken}`);
    
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
      console.log(`[AUTH] Successfully sent OTP email to ${user.email}`);
    } catch (emailErr: any) {
      console.error('[AUTH] Failed to send password reset email:', emailErr.message || emailErr);
      return next(new AppError(emailErr.message || 'Failed to dispatch OTP email. Please try again later or contact support.', 500));
    }

    // Mask the email for safe client UI display (e.g. a***e@gmail.com)
    const [namePart, domainPart] = user.email.split('@');
    const maskedName = namePart.length > 2 
      ? `${namePart[0]}${'*'.repeat(Math.min(namePart.length - 2, 4))}${namePart[namePart.length - 1]}`
      : `${namePart[0]}*`;
    const maskedEmail = `${maskedName}@${domainPart}`;

    res.status(200).json({
      status: 'success',
      message: `OTP sent successfully to ${maskedEmail}`,
      data: {
        email: user.email,
        maskedEmail
      }
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, emailOrPhone, otp, newPassword } = req.body;
    const rawIdentifier = (email || emailOrPhone || '').toString().trim();
    const cleanOtp = (otp || '').toString().trim();

    if (!rawIdentifier) return next(new AppError('Email or mobile number is required', 400));
    if (!cleanOtp) return next(new AppError('6-digit OTP code is required', 400));
    if (!newPassword || newPassword.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    const normalizedEmail = rawIdentifier.toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: rawIdentifier }
      ],
      resetPasswordToken: cleanOtp,
      resetPasswordExpire: { $gt: new Date() }
    });

    if (!user) {
      return next(new AppError('Invalid or expired OTP. Please request a new code.', 400));
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};
