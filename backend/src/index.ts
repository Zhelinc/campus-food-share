import express from 'express';  
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
// ===== 全局错误处理 =====  
// 捕获未处理的 Promise 拒绝  
process.on('unhandledRejection', (reason, promise) => {  
  console.error('❌ 未处理的 Promise 拒绝:', reason);  
});  
// 捕获未捕获的异常  
process.on('uncaughtException', (error) => {  
  console.error('❌ 未捕获的异常:', error);  
});  
// 全局错误处理中间件（必须在所有其他中间件之后）  
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {  
  console.error('❌ 请求处理错误:', err);  
  res.status(500).json({  
    message: '服务器内部错误',  
    error: process.env.NODE_ENV === 'development' ? err.message : undefined  
  });  
});  
// 处理 404  
app.use((req, res) => {  
  res.status(404).json({ message: '路由不存在' });  
});  
app.listen(PORT, () => {  
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);  
});  
