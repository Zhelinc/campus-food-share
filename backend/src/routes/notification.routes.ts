import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { getMyNotifications, getUnreadCount, markAsRead } from '../controllers/notification.controller';

const router = Router();
router.use(verifyToken);
router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/mark-read', markAsRead);
export default router;