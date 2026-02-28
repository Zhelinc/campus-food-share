// backend/src/controllers/users.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/db';
import { generateId } from '../utils/idGenerator';
import admin from '../config/firebase-admin'; // Firebase Admin SDK

const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || '123456';
const SALT_ROUNDS = 10;

// 临时存储验证码（用于兼容旧版忘记密码，新用户请使用 Firebase 客户端直接发送重置邮件）
const resetCodes = new Map<string, { code: string; expires: number }>();

/**
 * 用户注册（仅将 Firebase 用户同步到本地数据库）
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, role = 'user', invitationCode, firebaseUid } = req.body;

    if (!email || !firebaseUid) {
      return res.status(400).json({ message: '邮箱和Firebase UID为必填项', errorCode: 'auth/empty-params' });
    }

    // 校园邮箱授权
    const AUTHORIZED_SCHOOL_DOMAINS = ['bupt.edu.cn', 'qmul.ac.uk'];
    const isAuthorized = AUTHORIZED_SCHOOL_DOMAINS.some(domain => email.endsWith(`@${domain}`));
    if (!isAuthorized) {
      return res.status(400).json({ message: '该邮箱域名未授权', errorCode: 'auth/invalid-email-domain' });
    }

    // 管理员验证
    if (role === 'admin') {
      if (!invitationCode || invitationCode !== ADMIN_INVITE_CODE) {
        return res.status(403).json({ message: '管理员邀请码错误', errorCode: 'auth/invalid-invitation-code' });
      }
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ firebaseUid }, { email }] }
    });
    if (existingUser) {
      return res.status(409).json({ message: '该邮箱或用户已注册', errorCode: 'auth/email-already-exists' });
    }

    const newUser = await prisma.user.create({
      data: {
        id: generateId(),
        firebaseUid,
        email,
        role: role === 'admin' ? 'admin' : 'user',
        updatedAt: new Date(),
      }
    });

    return res.status(201).json({
      message: '注册成功',
      userId: newUser.id,
      firebaseUid: newUser.firebaseUid,
      email: newUser.email,
      role: newUser.role
    });

  } catch (error: any) {
    console.error('注册失败：', error);
    return res.status(500).json({ message: '注册失败', error: error.message });
  }
};

/**
 * 用户登录（验证 Firebase ID Token，返回用户信息）
 */
export const loginUser = async (req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] loginUser 开始`);
  try {
    const { idToken } = req.body;
    console.log(`[${new Date().toISOString()}] 收到 idToken: ${idToken ? '存在' : '不存在'}`);

    if (!idToken) {
      console.log(`[${new Date().toISOString()}] 缺少 idToken，返回 400`);
      return res.status(400).json({ message: 'ID Token 为必填项', errorCode: 'auth/empty-params' });
    }

    console.log(`[${new Date().toISOString()}] 开始验证 Firebase ID Token...`);
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log(`[${new Date().toISOString()}] Token 验证成功，uid: ${decodedToken.uid}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Token 验证失败:`, error);
      return res.status(401).json({ message: '无效的ID Token', errorCode: 'auth/invalid-token' });
    }

    const { uid, email, email_verified } = decodedToken;
    console.log(`[${new Date().toISOString()}] 邮箱验证状态: ${email_verified}`);

    if (!email_verified) {
      console.log(`[${new Date().toISOString()}] 邮箱未验证，返回 403`);
      return res.status(403).json({ message: '邮箱未验证，请先验证邮箱', errorCode: 'auth/email-not-verified' });
    }

    console.log(`[${new Date().toISOString()}] 开始查询数据库用户，uid: ${uid}`);
    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: uid }
    });
    console.log(`[${new Date().toISOString()}] 数据库查询完成，用户存在: ${!!dbUser}`);

    if (!dbUser) {
      console.log(`[${new Date().toISOString()}] 用户不存在，返回 404`);
      return res.status(404).json({ message: '用户不存在，请先注册', errorCode: 'auth/user-not-found' });
    }

    console.log(`[${new Date().toISOString()}] 登录成功，返回用户信息`);
    return res.status(200).json({
      message: '登录成功',
      user: {
        uid: dbUser.firebaseUid,
        email: dbUser.email,
        emailVerified: true,
        dbUserId: dbUser.id,
        role: dbUser.role
      }
    });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] 登录失败，捕获到错误:`, error);
    return res.status(500).json({ message: '登录失败', error: error.message });
  } finally {
    console.log(`[${new Date().toISOString()}] loginUser 结束`);
  }
};

/**
 * 获取用户信息（需 Token）
 */
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: '未登录', errorCode: 'auth/unauthorized' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid },
      include: {
        Food: { select: { title: true, status: true, location: true, quality: true, campus: true } },
        Claim: { include: { Food: { select: { title: true, status: true } } } }
      }
    });

    if (!dbUser) {
      return res.status(404).json({ message: '用户不存在', errorCode: 'auth/user-not-found' });
    }

    // 移除密码字段（如果存在）
    const { password, ...userWithoutPassword } = dbUser;
    return res.status(200).json({
      message: '获取用户信息成功',
      user: {
        ...userWithoutPassword,
        publishedFoods: dbUser.Food,
        claimedFoods: dbUser.Claim.map(c => c.Food)
      }
    });

  } catch (error: any) {
    console.error('获取用户信息失败：', error);
    return res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
};

/**
 * 修改密码（使用 Firebase Admin SDK 更新密码）
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: '未登录', errorCode: 'auth/unauthorized' });
    }

    const { newPassword, confirmNewPassword } = req.body;
    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: '新密码和确认密码为必填项', errorCode: 'auth/empty-params' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: '两次密码不一致', errorCode: 'auth/password-mismatch' });
    }

    // 密码复杂度校验（可选）
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ message: '新密码复杂度不足', errorCode: 'auth/weak-password' });
    }

    // 使用 Firebase Admin SDK 更新用户密码
    try {
      await admin.auth().updateUser(user.uid, { password: newPassword });
    } catch (error) {
      console.error('Firebase 更新密码失败：', error);
      return res.status(500).json({ message: '密码修改失败', errorCode: 'auth/password-update-failed' });
    }

    // 可选：更新本地数据库中的更新时间（不需要存储密码）
    await prisma.user.update({
      where: { firebaseUid: user.uid },
      data: { updatedAt: new Date() }
    });

    return res.status(200).json({ message: '密码修改成功' });
  } catch (error: any) {
    console.error('修改密码失败：', error);
    return res.status(500).json({ message: '修改密码失败', error: error.message });
  }
};

/**
 * 忘记密码 - 发送验证码（已弃用，请使用 Firebase 客户端发送重置邮件）
 */
export const forgotPassword = async (req: Request, res: Response) => {
  return res.status(200).json({ 
    message: '此接口已弃用，请使用 Firebase 客户端 SDK 的 sendPasswordResetEmail 方法重置密码',
    deprecated: true 
  });
};

/**
 * 重置密码（已弃用，请使用 Firebase 客户端重置流程）
 */
export const resetPassword = async (req: Request, res: Response) => {
  return res.status(200).json({ 
    message: '此接口已弃用，请使用 Firebase 客户端 SDK 的 confirmPasswordReset 方法',
    deprecated: true 
  });
};