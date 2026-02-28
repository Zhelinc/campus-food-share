// backend/src/controllers/food.controller.ts
import { Request, Response } from 'express';
import prisma from '../utils/db';
import { generateId } from '../utils/idGenerator';
import { z } from 'zod';

// ==================== 验证 Schema ====================
const publishFoodSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().min(1, '描述不能为空'),
  campus: z.string().min(1, '校区不能为空'),
  location: z.string().min(1, '分享地址不能为空'),
  quality: z.string().min(1, '质量不能为空'),
  allergens: z.array(z.string()).optional(),
  imageUrl: z.string().url('图片 URL 格式不正确').optional(),
});

const editFoodSchema = publishFoodSchema.extend({
  foodId: z.string().min(1, '食物 ID 不能为空'),
  status: z.string().optional(),
});

const claimFoodSchema = z.object({
  foodId: z.string().min(1, '食物 ID 不能为空'),
});

// ==================== 控制器函数 ====================

/**
 * 发布食物接口
 */
export const publishFood = async (req: Request, res: Response) => {
  try {
    const validated = publishFoodSchema.parse(req.body);
    const { title, description, allergens, campus, location, quality, imageUrl } = validated;

    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: '未登录',
        errorCode: 'auth/unauthorized'
      });
    }

    // 查找/创建用户
    let dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid }
    });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: generateId(),
          firebaseUid: user.uid,
          email: user.email || `${user.uid}@mock.com`,
          updatedAt: new Date(),
        }
      });
    }

    const food = await prisma.food.create({
      data: {
        id: generateId(),
        title,
        description,
        allergens: allergens || [],
        campus,
        location,
        quality,
        imageUrl: imageUrl || null,
        publisherId: dbUser.id,
        updatedAt: new Date(),
      },
      include: {
        User: { select: { email: true } }
      }
    });

    return res.status(201).json({
      message: '食物发布成功',
      foodId: food.id,
      food: food
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: error.errors
      });
    }
    console.error('发布食物失败：', error);
    return res.status(500).json({
      message: '发布失败',
      errorCode: 'food/publish-failed',
      error: error.message
    });
  }
};

/**
 * 编辑食物接口（仅发布者可编辑）
 */
export const editFood = async (req: Request, res: Response) => {
  try {
    const validated = editFoodSchema.parse(req.body);
    const { foodId, title, description, allergens, campus, location, quality, imageUrl, status } = validated;

    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: '未登录',
        errorCode: 'auth/unauthorized'
      });
    }

    const food = await prisma.food.findUnique({
      where: { id: foodId },
      include: { User: true }
    });
    if (!food) {
      return res.status(404).json({
        message: '食物不存在',
        errorCode: 'food/not-found'
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid }
    });
    if (!dbUser || food.publisherId !== dbUser.id) {
      return res.status(403).json({
        message: '无权限编辑该食物（仅发布者可编辑）',
        errorCode: 'food/forbidden-edit'
      });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (allergens) updateData.allergens = allergens;
    if (campus) updateData.campus = campus;
    if (location) updateData.location = location;
    if (quality) updateData.quality = quality;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status) updateData.status = status;
    updateData.updatedAt = new Date();

    const updatedFood = await prisma.food.update({
      where: { id: foodId },
      data: updateData,
      include: { User: { select: { email: true } } }
    });

    return res.status(200).json({
      message: '食物编辑成功',
      food: updatedFood
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: error.errors
      });
    }
    console.error('编辑食物失败：', error);
    return res.status(500).json({
      message: '编辑失败',
      errorCode: 'food/edit-failed',
      error: error.message
    });
  }
};

/**
 * 删除食物接口（仅发布者可删除）
 */
export const deleteFood = async (req: Request, res: Response) => {
  try {
    const { foodId } = req.body;
    if (!foodId) {
      return res.status(400).json({
        message: '食物ID为必填项',
        errorCode: 'food/missing-food-id'
      });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: '未登录',
        errorCode: 'auth/unauthorized'
      });
    }

    const food = await prisma.food.findUnique({
      where: { id: foodId },
      include: { User: true, Claim: true }
    });
    if (!food) {
      return res.status(404).json({
        message: '食物不存在',
        errorCode: 'food/not-found'
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid }
    });
    if (!dbUser || food.publisherId !== dbUser.id) {
      return res.status(403).json({
        message: '无权限删除该食物（仅发布者可删除）',
        errorCode: 'food/forbidden-delete'
      });
    }

    if (food.Claim) {
      await prisma.notification.create({
        data: {
          id: generateId(),
          userId: food.Claim.claimantId,
          type: 'FOOD_DELETED',
          content: `您认领的食物 "${food.title}" 已被发布者删除。`,
          updatedAt: new Date(),
        }
      });
    }

    await prisma.claim.deleteMany({ where: { foodId: foodId } });
    await prisma.food.delete({ where: { id: foodId } });

    return res.status(200).json({
      message: '食物删除成功',
      foodId: foodId
    });

  } catch (error: any) {
    console.error('删除食物失败：', error);
    return res.status(500).json({
      message: '删除失败',
      errorCode: 'food/delete-failed',
      error: error.message
    });
  }
};

/**
 * 获取食物列表接口
 */
export const getFoodList = async (req: Request, res: Response) => {
  try {
    const { status, allergens, quality, campus, location, keyword } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (allergens) {
      try {
        const allergenList = (allergens as string).split(',').filter(a => a.trim());
        if (allergenList.length > 0) {
          where.allergens = { hasSome: allergenList };
        }
      } catch (e) {
        console.error('过敏原查询参数错误:', e);
      }
    }
    if (quality) where.quality = quality;
    if (campus) where.campus = campus as string;
    if (location) where.location = { contains: location as string };
    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string } },
        { description: { contains: keyword as string } }
      ];
    }

    const foods = await prisma.food.findMany({
      where,
      include: {
        User: { select: { email: true } },
        Claim: { select: { User: { select: { email: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      message: '获取列表成功',
      total: foods.length,
      foods: foods
    });

  } catch (error: any) {
    console.error('获取食物列表失败：', error);
    return res.status(500).json({
      message: '获取列表失败',
      errorCode: 'food/list-failed',
      error: error.message
    });
  }
};

/**
 * 认领食物接口（禁止发布者认领自己的食物）
 */
export const claimFood = async (req: Request, res: Response) => {
  try {
    const validated = claimFoodSchema.parse(req.body);
    const { foodId } = validated;

    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: '未登录',
        errorCode: 'auth/unauthorized'
      });
    }

    const food = await prisma.food.findUnique({
      where: { id: foodId },
      include: { User: true, Claim: true }
    });
    if (!food) {
      return res.status(404).json({
        message: '食物不存在',
        errorCode: 'food/not-found'
      });
    }

    if (food.status !== 'AVAILABLE' || food.Claim) {
      return res.status(400).json({
        message: '该食物已被认领',
        errorCode: 'food/already-claimed'
      });
    }

    let claimant = await prisma.user.findUnique({
      where: { firebaseUid: user.uid }
    });
    if (!claimant) {
      claimant = await prisma.user.create({
        data: {
          id: generateId(),
          firebaseUid: user.uid,
          email: user.email || `${user.uid}@mock.com`,
          updatedAt: new Date(),
        }
      });
    }

    if (food.publisherId === claimant.id) {
      return res.status(403).json({
        message: '禁止认领自己发布的食物',
        errorCode: 'food/forbid-claim-own-food'
      });
    }

    const claim = await prisma.claim.create({
      data: {
        id: generateId(),
        foodId: food.id,
        claimantId: claimant.id,
        status: 'PENDING',
        updatedAt: new Date(),
      }
    });

    await prisma.food.update({
      where: { id: foodId },
      data: { status: 'CLAIMED', updatedAt: new Date() }
    });

    await prisma.notification.create({
      data: {
        id: generateId(),
        userId: food.publisherId,
        type: 'CLAIM',
        content: `您的食物 "${food.title}" 被用户 ${claimant.email} 认领，请及时确认。`,
        updatedAt: new Date(),
      }
    });

    return res.status(200).json({
      message: '认领成功，等待发布者确认',
      claimId: claim.id,
      foodStatus: 'CLAIMED'
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: error.errors
      });
    }
    console.error('认领食物失败：', error);
    return res.status(500).json({
      message: '认领失败',
      errorCode: 'food/claim-failed',
      error: error.message
    });
  }
};

/**
 * 确认认领接口
 */
export const confirmClaim = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: '未登录',
        errorCode: 'auth/unauthorized'
      });
    }

    const { claimId } = req.body;
    if (!claimId) {
      return res.status(400).json({
        message: '认领记录ID为必填项',
        errorCode: 'food/missing-claim-id'
      });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { Food: { include: { User: true } } }
    });
    if (!claim) {
      return res.status(404).json({
        message: '认领记录不存在',
        errorCode: 'food/claim-not-found'
      });
    }

    if (claim.Food.User.firebaseUid !== user.uid) {
      return res.status(403).json({
        message: '无权限确认该认领',
        errorCode: 'food/forbidden-confirm'
      });
    }

    await prisma.claim.update({
      where: { id: claimId },
      data: { status: 'ACCEPTED', updatedAt: new Date() }
    });
    await prisma.food.update({
      where: { id: claim.foodId },
      data: { status: 'COMPLETED', updatedAt: new Date() }
    });

    await prisma.notification.create({
      data: {
        id: generateId(),
        userId: claim.claimantId,
        type: 'CLAIM_CONFIRMED',
        content: `您认领的食物 "${claim.Food.title}" 已被发布者确认，可以取餐了。`,
        updatedAt: new Date(),
      }
    });

    return res.status(200).json({
      message: '认领确认成功',
      claimStatus: 'ACCEPTED',
      foodStatus: 'COMPLETED'
    });

  } catch (error: any) {
    console.error('确认认领失败：', error);
    return res.status(500).json({
      message: '确认认领失败',
      errorCode: 'food/confirm-failed',
      error: error.message
    });
  }
};

/**
 * 获取当前用户发布的食物列表
 */
export const getMyPublishedFoods = async (req: Request, res: Response) => {
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
    if (!dbUser) {
      return res.status(404).json({
        message: '用户不存在',
        errorCode: 'auth/user-not-found'
      });
    }

    const foods = await prisma.food.findMany({
      where: { publisherId: dbUser.id },
      include: { User: { select: { email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      message: '获取我的发布成功',
      foods
    });
  } catch (error: any) {
    console.error('获取我的发布失败：', error);
    return res.status(500).json({
      message: '获取失败',
      errorCode: 'food/my-publish-failed',
      error: error.message
    });
  }
};