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

app.listen(PORT, () => {
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
});