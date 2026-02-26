import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyAdmin } from '../middleware/admin.middleware';
import {
  getAllUsers,
  updateUser,
  deleteUser,
  getAllFoods,
  updateAnyFood,
  deleteAnyFood
} from '../controllers/admin.controller';

const router = Router();

// 所有管理员路由均需验证 token 和管理员身份
router.use(verifyToken, verifyAdmin);

// 用户管理
router.get('/users', getAllUsers);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// 食物管理
router.get('/foods', getAllFoods);
router.put('/foods/:foodId', updateAnyFood);
router.delete('/foods/:foodId', deleteAnyFood);

export default router;