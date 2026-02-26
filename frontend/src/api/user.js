// 导入刚才封装好的axios实例
import api from '../utils/axios';

// 1. 登录接口（对接后端：POST /api/users/login）
export const login = (email, password) => {
  return api.post('/api/users/login', { email, password });
};

// 2. 注册接口（新增角色、邀请码和确认密码）
export const register = (email, password, confirmPassword, role = 'user', invitationCode = '') => {
  return api.post('/api/users/register', { 
    email, 
    password, 
    confirmPassword, 
    role, 
    invitationCode 
  });
};

// 3. 获取用户信息接口（对接后端：GET /api/users/info）
export const getUserInfo = () => {
  return api.get('/api/users/info');
};