import * as admin from 'firebase-admin';

// 从Firebase项目设置 → 服务账号 → 生成新私钥
// 下载 JSON 文件，重命名为 firebase-service-account.json
// 放入 backend/src/config/ 目录

const serviceAccount = require('../config/campus-food-share-10f92-firebase-adminsdk-fbsvc-02a197251b.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const verifyIdToken = async (token: string) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 额外验证：必须是学校邮箱
    if (!decodedToken.email?.endsWith('@university.edu')) {
      throw new Error('仅限学校邮箱注册');
    }
    
    return decodedToken;
  } catch (error) {
    throw new Error('无效的认证令牌');
  }
};

export default admin;
