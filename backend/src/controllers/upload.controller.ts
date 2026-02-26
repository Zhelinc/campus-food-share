// backend/src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    // 生成可访问的URL（假设后端运行在 http://localhost:5000）
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    return res.status(200).json({
      message: '上传成功',
      url: fileUrl
    });
  } catch (error: any) {
    console.error('上传失败：', error);
    return res.status(500).json({
      message: '上传失败',
      error: error.message
    });
  }
};