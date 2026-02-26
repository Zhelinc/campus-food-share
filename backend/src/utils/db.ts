import { PrismaClient } from '@prisma/client';

// 第一步：强制校验环境变量，确保DATABASE_URL存在（提前终止错误）
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('❌ 环境变量DATABASE_URL未配置，请检查.env文件');
}

// 第二步：单例模式创建Prisma Client（类型安全版）
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query'],
    // 核心修复：使用已校验的DATABASE_URL（类型为string，无undefined）
    datasources: {
      db: {
        url: DATABASE_URL, // 此时类型是string，完全匹配Prisma要求
      },
    },
  });
};

// 第三步：全局声明，避免热重载重复创建（TS类型安全）
declare global {
  // 明确类型：undefined 或 PrismaClient实例
  var prisma: PrismaClient | undefined;
}

// 第四步：单例逻辑（全局复用实例）
const prisma: PrismaClient = globalThis.prisma ?? prismaClientSingleton();

// 开发环境缓存实例（避免nodemon热重载重复创建）
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// 第五步：数据库连接（带错误处理）
(async () => {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功（Neon PostgreSQL）');
  } catch (err) {
    console.error('❌ 数据库连接失败：', err);
    // 重试一次连接
    try {
      await prisma.$connect();
      console.log('✅ 重试后数据库连接成功');
    } catch (err2) {
      console.error('❌ 重试连接仍失败：', err2);
    }
  }
})();

export default prisma;