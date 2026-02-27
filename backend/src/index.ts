import express, { Request, Response, NextFunction } from 'express';  
import cors from 'cors';  
import path from 'path';  
import routes from './routes/index';  
const app = express();  
const PORT = process.env.PORT || 5000;  
app.use(cors());  
app.use(express.json({ limit: '10mb' }));  
app.use(express.urlencoded({ extended: true, limit: '10mb' }));  
// 静态文件服务  
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));  
// 健康检查（不依赖数据库）  
app.get('/health', (req, res) => {  
  res.status(200).json({ status: 'ok', message: '服务器运行正常' });  
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
// 优雅关闭  
process.on('SIGTERM', () => {  
  console.log('收到 SIGTERM 信号，开始关闭...');  
  server.close(() => {  
    console.log('服务器已关闭');  
    process.exit(0);  
  });  
});  
export default app;  
