// backend/src/controllers/food.controller.ts
import { Request, Response } from 'express';
import prisma from '../utils/db';
import { generateId } from '../utils/idGenerator'; // 请确保此文件存在并导出 generateId

/**
 * 发布食物接口
 */
export const publishFood = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: '未登录',
        errorCode: 'auth/unauthorized'
      });
    }

    const { title, description, allergens, campus, location, quality, imageUrl } = req.body;

    // 校验必填项
    if (!title || !description || !campus || !location || !quality) {
      return res.status(400).json({
        message: '标题、描述、校区、分享地址、质量为必填项',
        errorCode: 'food/missing-params'
      });
    }

    // 查找/创建用户（需提供 id 和 updatedAt）
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

    // 创建食物记录
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
        User: { select: { email: true } } // 关联发布者信息，字段名为 User
      }
    });

    return res.status(201).json({
      message: '食物发布成功',
      foodId: food.id,
      food: food
    });

  } catch (error: any) {
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
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: '未登录',
        errorCode: 'auth/unauthorized'
      });
    }

    const { foodId, title, description, allergens, campus, location, quality, imageUrl, status } = req.body;

    if (!foodId) {
      return res.status(400).json({
        message: '食物ID为必填项',
        errorCode: 'food/missing-food-id'
      });
    }

    // 查找食物，并包含发布者信息
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

    // 验证发布者身份
    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid }
    });
    if (!dbUser || food.publisherId !== dbUser.id) {
      return res.status(403).json({
        message: '无权限编辑该食物（仅发布者可编辑）',
        errorCode: 'food/forbidden-edit'
      });
    }

    // 构建更新数据（只更新传入的字段）
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (allergens) updateData.allergens = allergens;
    if (campus) updateData.campus = campus;
    if (location) updateData.location = location;
    if (quality) updateData.quality = quality;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status) updateData.status = status;
    updateData.updatedAt = new Date(); // 手动更新 updatedAt

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
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: '未登录',
        errorCode: 'auth/unauthorized'
      });
    }

    const { foodId } = req.body;
    if (!foodId) {
      return res.status(400).json({
        message: '食物ID为必填项',
        errorCode: 'food/missing-food-id'
      });
    }

    // 查找食物，包含可能的认领信息
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

    // 如果该食物已被认领，给认领者发送通知
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

    // 先删除关联的认领记录
    await prisma.claim.deleteMany({
      where: { foodId: foodId }
    });

    // 再删除食物
    await prisma.food.delete({
      where: { id: foodId }
    });

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
 * 获取食物列表接口（支持筛选：校区、状态、过敏原、质量、分享地址、关键词）
 */
export const getFoodList = async (req: Request, res: Response) => {
  try {
    const { status, allergens, quality, campus, location, keyword } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (allergens) where.allergens = { hasSome: (allergens as string).split(',') };
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
        User: { select: { email: true } },          // 发布者信息
        Claim: { select: { User: { select: { email: true } } } } // 认领者信息
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
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: '未登录',
        errorCode: 'auth/unauthorized'
      });
    }

    const { foodId } = req.body;
    if (!foodId) {
      return res.status(400).json({
        message: '食物ID为必填项',
        errorCode: 'food/missing-food-id'
      });
    }

    // 查找食物，关联发布者和可能的认领记录
    const food = await prisma.food.findUnique({
      where: { id: foodId },
      include: {
        User: true,   // 发布者
        Claim: true   // 认领记录（一对一）
      }
    });
    if (!food) {
      return res.status(404).json({
        message: '食物不存在',
        errorCode: 'food/not-found'
      });
    }

    // 检查食物是否已被认领
    if (food.status !== 'AVAILABLE' || food.Claim) {
      return res.status(400).json({
        message: '该食物已被认领',
        errorCode: 'food/already-claimed'
      });
    }

    // 查找/创建认领者
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

    // 禁止发布者认领自己的食物
    if (food.publisherId === claimant.id) {
      return res.status(403).json({
        message: '禁止认领自己发布的食物',
        errorCode: 'food/forbid-claim-own-food'
      });
    }

    // 创建认领记录
    const claim = await prisma.claim.create({
      data: {
        id: generateId(),
        foodId: food.id,
        claimantId: claimant.id,
        status: 'PENDING',
        updatedAt: new Date(),
      }
    });

    // 更新食物状态为 CLAIMED
    await prisma.food.update({
      where: { id: foodId },
      data: {
        status: 'CLAIMED',
        updatedAt: new Date(),
      }
    });

    // 为发布者创建通知
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

    // 查找认领记录，包含关联的食物和食物的发布者
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        Food: { include: { User: true } } // 食物及其发布者
      }
    });
    if (!claim) {
      return res.status(404).json({
        message: '认领记录不存在',
        errorCode: 'food/claim-not-found'
      });
    }

    // 验证当前用户是否为食物的发布者
    if (claim.Food.User.firebaseUid !== user.uid) {
      return res.status(403).json({
        message: '无权限确认该认领',
        errorCode: 'food/forbidden-confirm'
      });
    }

    // 更新认领状态和食物状态
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'ACCEPTED',
        updatedAt: new Date(),
      }
    });
    await prisma.food.update({
      where: { id: claim.foodId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date(),
      }
    });

    // 为认领者创建通知
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
      include: {
        User: { select: { email: true } }
      },
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