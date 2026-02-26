import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/db';
import { generateId } from '../utils/idGenerator';

const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || '123456';
const SALT_ROUNDS = 10;

// 临时存储验证码（内存，生产环境应使用 Redis）
const resetCodes = new Map<string, { code: string; expires: number }>();

/**
 * 用户注册
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, role = 'user', invitationCode } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: '邮箱、密码和确认密码为必填项', errorCode: 'auth/empty-params' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '两次输入的密码不一致', errorCode: 'auth/password-mismatch' });
    }

    const AUTHORIZED_SCHOOL_DOMAINS = ['bupt.edu.cn', 'qmul.ac.uk'];
    const isAuthorized = AUTHORIZED_SCHOOL_DOMAINS.some(domain => email.endsWith(`@${domain}`));
    if (!isAuthorized) {
      return res.status(400).json({ message: '该邮箱域名未授权', errorCode: 'auth/invalid-email-domain' });
    }

    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ message: '密码复杂度不足', errorCode: 'auth/weak-password' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: '该邮箱已注册', errorCode: 'auth/email-already-exists' });
    }

    if (role === 'admin') {
      if (!invitationCode || invitationCode !== ADMIN_INVITE_CODE) {
        return res.status(403).json({ message: '管理员邀请码错误', errorCode: 'auth/invalid-invitation-code' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const firebaseUid = 'mock-' + Date.now() + Math.random().toString(36).substr(2, 8);
    const newUser = await prisma.user.create({
      data: {
        id: generateId(),
        firebaseUid,
        email,
        password: hashedPassword,
        role: role === 'admin' ? 'admin' : 'user',
        updatedAt: new Date(),
      }
    });

    const mockFirebaseToken = `mock-token-${newUser.firebaseUid}`;
    return res.status(201).json({
      message: '注册成功',
      token: mockFirebaseToken,
      user: {
        uid: newUser.firebaseUid,
        email: newUser.email,
        role: newUser.role,
        dbUserId: newUser.id
      }
    });

  } catch (error: any) {
    console.error('注册失败：', error);
    return res.status(500).json({ message: '注册失败', error: error.message });
  }
};

/**
 * 用户登录
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '邮箱和密码为必填项', errorCode: 'auth/empty-params' });
    }

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      return res.status(401).json({ message: '邮箱或密码错误', errorCode: 'auth/invalid-credentials' });
    }

    // 密码验证（兼容旧用户无密码的情况，但正常情况应有密码）
    if (dbUser.password) {
      const valid = await bcrypt.compare(password, dbUser.password);
      if (!valid) {
        return res.status(401).json({ message: '邮箱或密码错误', errorCode: 'auth/invalid-credentials' });
      }
    } else {
      // 开发环境临时处理：无密码用户允许任意密码登录，并提示设置密码
      console.warn(`用户 ${email} 没有设置密码，使用临时登录。请提醒用户尽快设置密码。`);
    }

    const mockFirebaseToken = `mock-token-${dbUser.firebaseUid}`;
    return res.status(200).json({
      message: '登录成功',
      token: mockFirebaseToken,
      expiresIn: 7200,
      user: {
        uid: dbUser.firebaseUid,
        email: dbUser.email,
        emailVerified: true,
        dbUserId: dbUser.id,
        role: dbUser.role
      }
    });

  } catch (error: any) {
    console.error('登录失败：', error);
    return res.status(400).json({ message: error.message || '登录失败', errorCode: error.code || 'UNKNOWN_ERROR' });
  }
};

/**
 * 获取用户信息
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

    // 移除密码字段
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
 * 修改密码
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: '未登录', errorCode: 'auth/unauthorized' });
    }

    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: '所有字段均为必填', errorCode: 'auth/empty-params' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: '新密码不一致', errorCode: 'auth/password-mismatch' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid }
    });
    if (!dbUser) {
      return res.status(404).json({ message: '用户不存在', errorCode: 'auth/user-not-found' });
    }

    if (dbUser.password) {
      const valid = await bcrypt.compare(oldPassword, dbUser.password);
      if (!valid) {
        return res.status(401).json({ message: '旧密码错误', errorCode: 'auth/invalid-old-password' });
      }
    }

    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ message: '新密码复杂度不足', errorCode: 'auth/weak-password' });
    }

    const hashedNew = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashedNew, updatedAt: new Date() }
    });

    return res.status(200).json({ message: '密码修改成功' });
  } catch (error: any) {
    console.error('修改密码失败：', error);
    return res.status(500).json({ message: '修改密码失败', error: error.message });
  }
};

/**
 * 忘记密码 - 发送验证码
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: '邮箱不能为空', errorCode: 'auth/empty-params' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 为安全，返回相同消息
      return res.status(200).json({ message: '如果邮箱存在，重置验证码已发送' });
    }

    // 生成6位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10分钟有效
    resetCodes.set(email, { code, expires });

    // 模拟发送邮件（实际应调用邮件服务）
    console.log(`[模拟邮件] 向 ${email} 发送重置密码验证码: ${code}`);

    return res.status(200).json({ message: '验证码已发送至您的邮箱，请查收' });
  } catch (error: any) {
    return res.status(500).json({ message: '发送失败', error: error.message });
  }
};

/**
 * 重置密码
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword, confirmNewPassword } = req.body;
    if (!email || !code || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: '所有字段均为必填', errorCode: 'auth/empty-params' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: '两次密码不一致', errorCode: 'auth/password-mismatch' });
    }

    // 密码复杂度校验
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ message: '密码复杂度不足', errorCode: 'auth/weak-password' });
    }

    const stored = resetCodes.get(email);
    if (!stored || stored.code !== code || stored.expires < Date.now()) {
      return res.status(400).json({ message: '验证码无效或已过期', errorCode: 'auth/invalid-code' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: '用户不存在', errorCode: 'auth/user-not-found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, updatedAt: new Date() }
    });

    // 清除验证码
    resetCodes.delete(email);

    return res.status(200).json({ message: '密码重置成功' });
  } catch (error: any) {
    return res.status(500).json({ message: '重置失败', error: error.message });
  }
};