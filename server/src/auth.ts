import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key';

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

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    (req as any).user = user;
    next();
  });
};

export const generateToken = (userPayload: any) => {
  return jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });
};
