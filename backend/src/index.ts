import express, { Request, Response, NextFunction } from 'express';  
import cors from 'cors';  
import path from 'path';  
import routes from './routes/index';  
const app = express();  
const PORT = process.env.PORT || 5000;  
app.use(cors());  
app.use(express.json());  
app.use(express.urlencoded({ extended: true }));  
// 静态文件服务，使上传的图片可通过 /uploads 访问  
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));  
app.use('/api', routes);  
app.get('/health', (req, res) => {  
  res.status(200).json({ status: 'ok', message: '服务器运行正常' });  
});  
// ===== 全局错误处理中间件 =====  
// 捕获未处理的 Promise 拒绝  
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {  
  console.error('❌ 未处理的 Promise 拒绝:', reason);  
});  
// 捕获未捕获的异常  
process.on('uncaughtException', (error: Error) => {  
  console.error('❌ 未捕获的异常:', error);  
});  
// 全局错误处理中间件（必须在所有其他中间件之后）  
app.use((err: any, req: Request, res: Response, next: NextFunction) => {  
  console.error('❌ 请求处理错误:', err);  
    
  // 避免重复发送响应  
  if (res.headersSent) {  
    return next(err);  
  }  
    
  res.status(err.status || 500).json({  
    message: err.message || '服务器内部错误',  
    errorCode: err.errorCode || 'INTERNAL_SERVER_ERROR',  
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })  
  });  
});  
// 处理 404  
app.use((req: Request, res: Response) => {  
  res.status(404).json({   
    message: '路由不存在',  
    errorCode: 'NOT_FOUND',  
    path: req.path  
  });  
});  
// 启动服务器  
const server = app.listen(PORT, () => {  
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);  
});  
// 优雅关闭  
process.on('SIGTERM', () => {  
  console.log('SIGTERM 信号收到，开始优雅关闭...');  
  server.close(() => {  
    console.log('服务器已关闭');  
    process.exit(0);  
  });  
});  
process.on('SIGINT', () => {  
  console.log('SIGINT 信号收到，开始优雅关闭...');  
  server.close(() => {  
    console.log('服务器已关闭');  
    process.exit(0);  
  });  
});  
export default app;  
