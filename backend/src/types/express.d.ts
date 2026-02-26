// backend/src/types/express.d.ts
// 引入Express原生类型，进行扩展
import { Request } from 'express';

// 声明要扩展的模块（必须与原模块一致）
declare module 'express' {
  // 扩展Request接口，添加自定义user属性
  interface Request {
    // user属性类型可根据decodedToken的实际结构定义（通用写法为any，快速解决；后续可细化为具体接口）
    user?: any; 
  }
}