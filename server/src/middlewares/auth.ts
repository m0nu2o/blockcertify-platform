
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../models/User.js';
import { verifyToken } from '../utils/token.js';

interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'institution' | 'student';
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Authentication required' });
    }

    const decoded = verifyToken<JwtPayload>(token);
    const user = await User.findById(decoded.sub).select('-password');

    if (!user || !user.isActive) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Invalid user session' });
    }

    req.user = { _id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (_error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: Array<'admin' | 'institution' | 'student'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as 'admin' | 'institution' | 'student')) {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};
