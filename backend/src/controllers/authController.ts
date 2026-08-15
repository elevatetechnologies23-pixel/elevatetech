import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import { generateAccessToken, generateRefreshToken } from '../utils/token';
import { AppError } from '../app';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Helper: send OTP email for password reset
const sendPasswordResetEmail = async (toEmail: string, recipientName: string, otp: string) => {
  let transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        // Remove spaces from Gmail App Password if present
        pass: (process.env.SMTP_PASS || '').replace(/\s/g, '')
      },
      tls: { rejectUnauthorized: false }
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Elevate Technology" <${process.env.SMTP_USER || 'no-reply@elevatetechnology.com'}>`,
    to: toEmail,
    subject: '🔐 Password Reset OTP — Elevate Technology',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;background:#fff">
        <div style="text-align:center;border-bottom:2px solid #0052FF;padding-bottom:14px;margin-bottom:20px">
          <h2 style="color:#0052FF;margin:0">Elevate Technology</h2>
          <p style="color:#64748b;font-size:13px;margin-top:4px">Password Reset Request</p>
        </div>
        <p style="font-size:15px;color:#1e293b">Hello <strong>${recipientName || 'Valued User'}</strong>,</p>
        <p style="font-size:13px;color:#475569;line-height:1.6">
          We received a request to reset your account password. Use the OTP below to continue. It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#f8fafc;border:2px dashed #0052FF;border-radius:10px;padding:20px;text-align:center;margin:24px 0">
          <span style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:bold;letter-spacing:1px;display:block;margin-bottom:8px">Your One-Time Password (OTP)</span>
          <strong style="font-size:36px;color:#0052FF;font-family:monospace;letter-spacing:8px">${otp}</strong>
        </div>
        <p style="font-size:12px;color:#94a3b8">If you did not request this, please ignore this email. Your account remains secure.</p>
        <div style="border-top:1px solid #e2e8f0;margin-top:20px;padding-top:14px;text-align:center;font-size:11px;color:#94a3b8">
          Elevate Technology | +91 9922567375 | elevatetechnologies23@gmail.com
        </div>
      </div>
    `
  });
  console.log(`Password reset OTP email sent to ${toEmail}: ${info.messageId}`);
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
    if (!email) return next(new AppError('Email address is required', 400));

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond 200 to prevent email enumeration
    if (!user) {
      res.status(200).json({ status: 'success', message: 'If that email exists, an OTP has been sent.' });
      return;
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email — await so errors are visible in server logs
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr);
      // OTP is saved; don't fail the request — user can retry
    }

    res.status(200).json({ status: 'success', message: 'If that email exists, an OTP has been sent.' });
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
