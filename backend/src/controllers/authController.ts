import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import { generateAccessToken, generateRefreshToken } from '../utils/token';
import { AppError } from '../app';
import jwt from 'jsonwebtoken';

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
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return next(new AppError('Please provide email/phone and password', 400));
    }

    // Detect if input is a phone number (10 digits) or email
    const isPhone = /^[6-9]\d{9}$/.test(emailOrPhone.trim());
    const query = isPhone ? { phone: emailOrPhone.trim() } : { email: emailOrPhone.trim().toLowerCase() };

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
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('There is no user with that email address.', 404));
    }
    // MOCK flow: generate a random token for password reset
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit reset code
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to your email (Mock: ' + resetToken + ')'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ 
      email, 
      resetPasswordToken: otp,
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
