import { Router } from 'express';
import { validateAuth, validateAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Admin login
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // In a real app, you would validate against your admin users table
    // For now, we'll use environment variables for the demo
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        error: {
          message: 'Invalid credentials',
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: 'admin',
        role: 'admin',
      },
      process.env.JWT_SECRET || 'your-secret-key',
      {
        expiresIn: '24h',
      }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return res.json({
      message: 'Login successful',
      user: {
        email,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    return res.status(500).json({
      error: {
        message: 'Error processing login',
      },
    });
  }
});

// Admin logout
router.post('/logout', validateAuth, validateAdmin, (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({
    message: 'Logout successful',
  });
});

// Get current admin session
router.get('/session', validateAuth, validateAdmin, (req: Request, res: Response) => {
  return res.json({
    user: req.user,
  });
});

export default router;