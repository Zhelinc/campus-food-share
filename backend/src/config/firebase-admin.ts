import * as admin from 'firebase-admin';

try {
  if (!admin.apps.length) {
    // 从环境变量读取服务账号 JSON 字符串
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountEnv) {
      throw new Error('环境变量 FIREBASE_SERVICE_ACCOUNT 未设置');
    }

    // 解析 JSON 字符串
    const serviceAccount = JSON.parse(serviceAccountEnv);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK 初始化成功（通过环境变量）');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK 初始化失败:', error);
  throw new Error('Firebase Admin SDK 初始化失败，请检查环境变量配置');
}

export const firebaseAuth = admin.auth();
export default admin;