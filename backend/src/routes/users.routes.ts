// backend/src/routes/users.routes.ts
import { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserInfo, 
  changePassword,
  forgotPassword,  // 新增
  resetPassword    // 新增
} from '../controllers/users.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// 注册
router.post('/register', registerUser);

// 登录
router.post('/login', loginUser);

// 获取用户信息（需Token）
router.get('/info', verifyToken, getUserInfo);

// 修改密码（需Token）
router.post('/change-password', verifyToken, changePassword);

// 忘记密码（发送验证码）
router.post('/forgot-password', forgotPassword);

// 重置密码
router.post('/reset-password', resetPassword);

export default router;