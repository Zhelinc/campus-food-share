import { Request, Response } from 'express';
import prisma from '../utils/db';

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: '未登录', errorCode: 'auth/unauthorized' });

    const dbUser = await prisma.user.findUnique({ where: { firebaseUid: user.uid } });
    if (!dbUser) return res.status(404).json({ message: '用户不存在', errorCode: 'auth/user-not-found' });

    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const notifications = await prisma.notification.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.notification.count({ where: { userId: dbUser.id } });

    return res.status(200).json({
      notifications,
      pagination: { page: parseInt(page as string), limit: take, total, pages: Math.ceil(total / take) }
    });
  } catch (error: any) {
    return res.status(500).json({ message: '获取通知失败', error: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: '未登录', errorCode: 'auth/unauthorized' });

    const dbUser = await prisma.user.findUnique({ where: { firebaseUid: user.uid } });
    if (!dbUser) return res.status(404).json({ message: '用户不存在', errorCode: 'auth/user-not-found' });

    const count = await prisma.notification.count({
      where: { userId: dbUser.id, isRead: false }
    });
    return res.status(200).json({ unreadCount: count });
  } catch (error: any) {
    return res.status(500).json({ message: '获取未读数失败', error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: '未登录', errorCode: 'auth/unauthorized' });

    const dbUser = await prisma.user.findUnique({ where: { firebaseUid: user.uid } });
    if (!dbUser) return res.status(404).json({ message: '用户不存在', errorCode: 'auth/user-not-found' });

    const { notificationId, all } = req.body;
    if (all) {
      await prisma.notification.updateMany({
        where: { userId: dbUser.id, isRead: false },
        data: { isRead: true, updatedAt: new Date() }
      });
      return res.status(200).json({ message: '所有通知已标记为已读' });
    } else if (notificationId) {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId: dbUser.id }
      });
      if (!notification) return res.status(404).json({ message: '通知不存在或无权限', errorCode: 'notification/not-found' });
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, updatedAt: new Date() }
      });
      return res.status(200).json({ message: '通知已标记为已读' });
    } else {
      return res.status(400).json({ message: '请提供 notificationId 或 all 参数', errorCode: 'notification/missing-params' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: '操作失败', error: error.message });
  }
};