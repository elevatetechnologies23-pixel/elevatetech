import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'supersecretaccesskey1234567890123456',
    { expiresIn: '1d' } // Access token valid for 1 day
  );
};

export const generateRefreshToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey1234567890123456',
    { expiresIn: '7d' } // Refresh token valid for 7 days
  );
};
