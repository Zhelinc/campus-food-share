import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase-admin';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        emailVerified: boolean;
      };
    }
  }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供有效的Token', errorCode: 'auth/missing-token' });
    }

    const idToken = authHeader.split(' ')[1];
    if (!idToken) {
      return res.status(401).json({ message: 'Token格式错误', errorCode: 'auth/invalid-token' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
    };

    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(401).json({ message: 'Token验证失败', errorCode: 'auth/token-verify-failed' });
  }
};