import { Router } from 'express';
import {
  publishFood,
  getFoodList,
  claimFood,
  confirmClaim,
  editFood,
  deleteFood,
  getMyPublishedFoods   // 新增导入
} from '../controllers/food.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// 发布食物（需Token）
router.post('/publish', verifyToken, publishFood);

// 编辑食物（需Token，仅发布者可操作）
router.post('/edit', verifyToken, editFood);

// 删除食物（需Token，仅发布者可操作）
router.post('/delete', verifyToken, deleteFood);

// 获取食物列表（公开）
router.get('/list', getFoodList);

// 认领食物（需Token）
router.post('/claim', verifyToken, claimFood);

// 确认认领（需Token）
router.post('/confirm-claim', verifyToken, confirmClaim);

// 新增：获取当前用户发布的食物列表（需Token）
router.get('/my-publish', verifyToken, getMyPublishedFoods);

export default router;