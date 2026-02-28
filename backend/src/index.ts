import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes/index';
import prisma from './utils/db';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查（立即响应，不依赖数据库）
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// API 路由
app.use('/api', routes);

// 全局错误处理
process.on('unhandledRejection', (reason: any) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ 未捕获的异常:', error);
});

// 错误处理中间件
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ 请求错误:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    errorCode: err.errorCode || 'INTERNAL_SERVER_ERROR'
  });
});

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    message: '路由不存在',
    errorCode: 'NOT_FOUND'
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
});

// 异步初始化数据库（不阻塞服务器启动）
(async () => {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    // 继续运行，不要退出
  }
})();

// 优雅关闭 - 修复版本
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，开始关闭...');
  
  server.close(async () => {
    try {
      // 关闭数据库连接
      await prisma.$disconnect();
      console.log('✅ 数据库连接已关闭');
    } catch (error) {
      console.error('❌ 数据库断开连接失败:', error);
    }
    
    console.log('✅ 应用已完全关闭');
    process.exit(0);
  });
});

// 同样处理 SIGINT（Ctrl+C）
process.on('SIGINT', async () => {
  console.log('收到 SIGINT 信号，开始关闭...');
  
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('✅ 数据库连接已关闭');
    } catch (error) {
      console.error('❌ 数据库断开连接失败:', error);
    }
    
    console.log('✅ 应用已完全关闭');
    process.exit(0);
  });
});

export default app;