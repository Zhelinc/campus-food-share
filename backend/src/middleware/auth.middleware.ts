import { Request, Response, NextFunction } from 'express';

// 扩展Request类型，添加user属性
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

/**
 * Token验证中间件（模拟Firebase Token验证）
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 获取请求头中的Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: '未提供有效的Token',
        errorCode: 'auth/missing-token'
      });
    }

    // 解析Token（模拟逻辑，真实环境替换为Firebase验证）
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'Token格式错误',
        errorCode: 'auth/invalid-token'
      });
    }

    // 模拟从Token中提取用户信息（关联数据库的firebaseUid）
    const firebaseUid = token.replace('mock-token-', '');
    const mockUserInfo = {
      uid: firebaseUid,
      email: `${firebaseUid}@xxx.edu.cn`,
      emailVerified: true
    };

    // 将用户信息挂载到req上，供后续接口使用
    req.user = mockUserInfo;
    next();

  } catch (error: any) {
    return res.status(401).json({
      message: 'Token验证失败',
      errorCode: 'auth/token-verify-failed',
      error: error.message
    });
  }
};