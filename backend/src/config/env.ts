/**  
 * 环境变量验证  
 */  
export const validateEnv = () => {  
  const required = ['DATABASE_URL', 'FIREBASE_SERVICE_ACCOUNT'];  
  const missing = required.filter(key => !process.env[key]);  
  if (missing.length > 0) {  
    throw new Error(`❌ 缺少必需的环境变量: ${missing.join(', ')}`);  
  }  
  console.log('✅ 环境变量验证成功');  
};  
/**  
 * 获取配置  
 */  
export const getConfig = () => {  
  return {  
    port: parseInt(process.env.PORT || '8080', 10),  
    nodeEnv: process.env.NODE_ENV || 'development',  
    databaseUrl: process.env.DATABASE_URL,  
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,  
    adminInviteCode: process.env.ADMIN_INVITE_CODE || '123456',  
  };  
};  
