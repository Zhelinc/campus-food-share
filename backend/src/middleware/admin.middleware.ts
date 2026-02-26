import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/db';

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: '未登录',
        errorCode: 'auth/unauthorized'
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({
        message: '需要管理员权限',
        errorCode: 'auth/forbidden'
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      message: '权限验证失败',
      error: error.message
    });
  }
};