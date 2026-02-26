import { Router } from 'express';
import userRoutes from './users.routes';
import foodRoutes from './food.routes';
import uploadRoutes from './upload.routes';
import adminRoutes from './admin.routes';
import notificationRoutes from './notification.routes'; // 新增

const router = Router();

// 挂载用户路由
router.use('/users', userRoutes);

// 挂载食物路由
router.use('/food', foodRoutes);

// 挂载上传路由
router.use('/upload', uploadRoutes);

// 挂载管理员路由
router.use('/admin', adminRoutes);

// 挂载通知路由
router.use('/notifications', notificationRoutes);

export default router;