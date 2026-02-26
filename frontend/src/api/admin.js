import api from '../utils/axios';

// 获取所有用户
export const getAllUsers = () => api.get('/api/admin/users');

// 更新用户
export const updateUser = (userId, data) => api.put(`/api/admin/users/${userId}`, data);

// 删除用户
export const deleteUser = (userId) => api.delete(`/api/admin/users/${userId}`);

// 获取所有食物
export const getAllFoods = () => api.get('/api/admin/foods');

// 更新任意食物
export const updateAnyFood = (foodId, data) => api.put(`/api/admin/foods/${foodId}`, data);

// 删除任意食物
export const deleteAnyFood = (foodId) => api.delete(`/api/admin/foods/${foodId}`);