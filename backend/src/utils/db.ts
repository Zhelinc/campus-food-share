import { PrismaClient } from '@prisma/client';  
// 强制校验环境变量  
const DATABASE_URL = process.env.DATABASE_URL;  
if (!DATABASE_URL) {  
  throw new Error('❌ 环境变量DATABASE_URL未配置');  
}  
// 创建 Prisma Client，配置连接池以适应 Neon 的限制  
const prismaClientSingleton = () => {  
  return new PrismaClient({  
    // 减少日志输出以提高性能  
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],  
    // 配置连接池参数  
    datasources: {  
      db: {  
        url: DATABASE_URL,  
      },  
    },  
  });  
};  
declare global {  
  var prisma: PrismaClient | undefined;  
}  
const prisma: PrismaClient = globalThis.prisma ?? prismaClientSingleton();  
if (process.env.NODE_ENV !== 'production') {  
  globalThis.prisma = prisma;  
}  
// 数据库连接  
(async () => {  
  try {  
    await prisma.$connect();  
    console.log('✅ 数据库连接成功');  
  } catch (err) {  
    console.error('❌ 数据库连接失败：', err);  
  }  
})();  
export default prisma;  
