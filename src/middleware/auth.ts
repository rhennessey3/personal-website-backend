import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const validateAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
        },
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as {
      id: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        message: 'Invalid or expired token',
      },
    });
  }
};

export const validateAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          message: 'Admin access required',
        },
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({
      error: {
        message: 'Access denied',
      },
    });
  }
};