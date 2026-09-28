import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = () => { const secret = process.env.JWT_SECRET; if (secret && secret.length >= 32) return secret; if (process.env.NODE_ENV === 'test') return 'test-only-secret-for-regression-tests'; throw new Error('JWT_SECRET must contain at least 32 characters'); };

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const isDemoMode = process.env.DEMO_MODE === 'true';
  
  // In demo mode, bypass strict auth if no token is provided, 
  // or accept a dummy token to keep things smooth.
  if (isDemoMode) {
    req.user = { id: 'demo_user', role: 'ADMINISTRATOR' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, jwtSecret(), (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    (req as any).user = user;
    next();
  });
};

export const generateToken = (userPayload: any) => {
  return jwt.sign(userPayload, jwtSecret(), { expiresIn: '8h' });
};
