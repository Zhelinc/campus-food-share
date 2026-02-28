// backend/src/config/firebase-admin.ts
import * as admin from 'firebase-admin';
import * as path from 'path';

// 如果使用服务账号文件（建议在开发环境使用）
const serviceAccountPath = path.join(__dirname, './campus-food-share-10f92-firebase-adminsdk-fbsvc-02a197251b.json');
// 或者使用环境变量中的私钥（生产环境更安全）
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

try {
  // 检查是否已有初始化
  if (!admin.apps.length) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK 初始化成功');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK 初始化失败:', error);
  // 可以选择抛出错误，让应用无法启动
  throw new Error('Firebase Admin SDK 初始化失败，请检查服务账号文件或环境变量');
}

export const firebaseAuth = admin.auth();
export default admin;