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
    const rawEmail = req.body.email || req.body.emailOrPhone;
    if (!rawEmail) return next(new AppError('Email address is required', 400));

    const normalizedEmail = rawEmail.toString().trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Always respond 200 to prevent email enumeration
    if (!user) {
      console.warn(`Forgot password requested for non-existent email: ${normalizedEmail}`);
      res.status(200).json({ status: 'success', message: 'If that email exists, an OTP has been sent.' });
      return;
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`Dispatched reset OTP for ${user.email}`);
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
      console.log(`Successfully sent OTP to ${user.email}`);
    } catch (emailErr: any) {
      console.error('Failed to send password reset email:', emailErr.message || emailErr);
    }

    res.status(200).json({ status: 'success', message: 'If that email exists, an OTP has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = (email || '').toString().trim().toLowerCase();
    const cleanOtp = (otp || '').toString().trim();

    const user = await User.findOne({ 
      email: normalizedEmail, 
      resetPasswordToken: cleanOtp,
      resetPasswordExpire: { $gt: new Date() }
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};
