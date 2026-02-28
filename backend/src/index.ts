import express, { Request, Response, NextFunction } from 'express';  
import cors from 'cors';  
import path from 'path';  
import routes from './routes/index';  
import { initializeDatabase, disconnectDatabase } from './utils/db';  
import { validateEnv, getConfig } from './config/env';  
import { requestLogger } from './middleware/logger.middleware';  
// 验证环境变量  
try {  
  validateEnv();  
} catch (error) {  
  console.error(error);  
  process.exit(1);  
}  
const config = getConfig();  
const app = express();  
const PORT = config.port;  
// 中间件  
app.use(cors());  
app.use(express.json({ limit: '10mb' }));  
app.use(express.urlencoded({ extended: true, limit: '10mb' }));  
app.use(requestLogger); // 请求日志  
// 静态文件服务  
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));  
// 健康检查（不依赖数据库）  
app.get('/health', (req, res) => {  
  res.status(200).json({  
    status: 'ok',  
    message: '服务器运行正常',  
    timestamp: new Date().toISOString(),  
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
  process.exit(1);  
});  
// 错误处理中间件  
app.use((err: any, req: Request, res: Response, next: NextFunction) => {  
  console.error('❌ 请求错误:', err);  
  if (res.headersSent) {  
    return next(err);  
  }  
  res.status(err.status || 500).json({  
    message: err.message || '服务器内部错误',  
    errorCode: err.errorCode || 'INTERNAL_SERVER_ERROR',  
    timestamp: new Date().toISOString(),  
  });  
});  
// 404 处理  
app.use((req: Request, res: Response) => {  
  res.status(404).json({  
    message: '路由不存在',  
    errorCode: 'NOT_FOUND',  
    path: req.path,  
    timestamp: new Date().toISOString(),  
  });  
});  
// 启动服务器  
const server = app.listen(PORT, async () => {  
  console.log(`\n${'='.repeat(50)}`);  
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);  
  console.log(`📝 环境: ${config.nodeEnv}`);  
  console.log(`${'='.repeat(50)}\n`);  
  // 初始化数据库  
  try {  
    await initializeDatabase();  
    console.log(`${'='.repeat(50)}`);  
    console.log('✅ 应用启动成功，所有系统就绪');  
    console.log(`${'='.repeat(50)}\n`);  
  } catch (error) {  
    console.error('❌ 数据库初始化失败，服务器将关闭');  
    console.error(error);  
    server.close();  
    process.exit(1);  
  }  
});  
// 优雅关闭  
const gracefulShutdown = async (signal: string) => {  
  console.log(`\n收到 ${signal} 信号，开始优雅关闭...`);  
  server.close(async () => {  
    console.log('✅ HTTP 服务器已关闭');  
    await disconnectDatabase();  
    console.log('✅ 应用已完全关闭');  
    process.exit(0);  
  });  
  // 如果 30 秒后还没关闭，强制退出  
  setTimeout(() => {  
    console.error('❌ 强制关闭应用（超时）');  
    process.exit(1);  
  }, 30000);  
};  
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));  
process.on('SIGINT', () => gracefulShutdown('SIGINT'));  
export default app;  
