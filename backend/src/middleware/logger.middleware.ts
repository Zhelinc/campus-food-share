import { Request, Response, NextFunction } from 'express';  
/**  
 * 请求日志中间件  
 */  
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {  
  const start = Date.now();  
  const originalSend = res.send;  
  res.send = function(data) {  
    const duration = Date.now() - start;  
    const statusCode = res.statusCode;  
    const method = req.method;  
    const path = req.path;  
    const timestamp = new Date().toISOString();  
    // 根据状态码选择日志级别  
    if (statusCode >= 500) {  
      console.error(`[${timestamp}] ❌ ${method} ${path} - ${statusCode} (${duration}ms)`);  
    } else if (statusCode >= 400) {  
      console.warn(`[${timestamp}] ⚠️  ${method} ${path} - ${statusCode} (${duration}ms)`);  
    } else {  
      console.log(`[${timestamp}] ✅ ${method} ${path} - ${statusCode} (${duration}ms)`);  
    }  
    return originalSend.call(this, data);  
  };  
  next();  
};  
