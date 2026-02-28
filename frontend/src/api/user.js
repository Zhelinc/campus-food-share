// frontend/src/api/user.js
import api from '../utils/axios';

// 登录接口：发送 Firebase ID Token 到后端进行验证
export const login = (idToken) => {
  return api.post('/api/users/login', { idToken });
};

// 注册接口：将 Firebase 创建的用户信息同步到后端数据库
export const register = (email, role, invitationCode, firebaseUid) => {
  return api.post('/api/users/register', { 
    email, 
    role, 
    invitationCode,
    firebaseUid
  });
};

// 获取用户信息（保持不变）
export const getUserInfo = () => {
  return api.get('/api/users/info');
};