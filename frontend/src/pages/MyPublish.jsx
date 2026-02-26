import { useState, useEffect } from 'react';
import { getUserInfo } from '../api/user';
import { getMyPublishedFoods, updateFood, deleteFood } from '../api/food';

const MyPublish = () => {
  const [user, setUser] = useState(null);
  const [myFoods, setMyFoods] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditFood, setCurrentEditFood] = useState(null);
  const [editFoodData, setEditFoodData] = useState({
    title: '',
    description: '',
    location: '',
    quality: '',
    category: ''
  });

  // 加载我的发布
  useEffect(() => {
    const initData = async () => {
      try {
        // 先检查token是否存在，不存在直接跳登录（不删token）
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const userRes = await getUserInfo();
        setUser(userRes.user);

        const foodRes = await getMyPublishedFoods();
        setMyFoods(foodRes.foods || []);
      } catch (err) {
        // 关键修复：只在明确401（token失效）时才删token，其他错误只提示
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          // 其他错误（网络错、500、404等）不删token，只提示用户
          alert('加载我的发布失败：' + (err.response?.data?.message || err.message || '请稍后重试'));
          console.error('加载我的发布失败：', err);
        }
      }
    };
    initData();
  }, []);

  // 打开修改弹窗
  const openEditModal = (food) => {
    setCurrentEditFood(food);
    setEditFoodData({
      title: food.title,
      description: food.description || '',
      location: food.location,
      quality: food.quality,
      category: food.category
    });
    setShowEditModal(true);
  };

  // 提交修改
  const submitEdit = async () => {
    if (!currentEditFood) return;
    try {
      await updateFood(currentEditFood.id, editFoodData);
      alert('修改成功！');
      setShowEditModal(false);
      // 刷新列表
      const foodRes = await getMyPublishedFoods();
      setMyFoods(foodRes.foods || []);
    } catch (err) {
      alert('修改失败：' + (err.response?.data?.message || err.message));
    }
  };

  // 删除食物
  const handleDelete = async (foodId) => {
    if (window.confirm('确定删除？')) {
      try {
        await deleteFood(foodId);
        alert('删除成功！');
        // 刷新列表
        const foodRes = await getMyPublishedFoods();
        setMyFoods(foodRes.foods || []);
      } catch (err) {
        alert('删除失败：' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div style={{ width: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>我的发布</h2>
      
      {myFoods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
          你还没有发布任何食物，快去首页发布吧～
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {myFoods.map((food) => (
            <div 
              key={food.id} 
              style={{ 
                backgroundColor: 'white', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <img 
                src={food.imageUrl || 'https://via.placeholder.com/300x200?text=食物图片'} 
                alt={food.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
              <div style={{ padding: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{food.title}</h4>
                <p style={{ margin: '5px 0', color: '#666' }}>描述：{food.description || '无'}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>位置：{food.location}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>质量：{food.quality}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>类别：{food.category}</p>
                <p style={{ 
                  margin: '5px 0', 
                  color: food.status === 'AVAILABLE' ? '#4caf50' : '#f44336' 
                }}>
                  状态：{food.status === 'AVAILABLE' ? '可认领' : '已认领'}
                </p>
                {/* 认领状态（对接Claim模型） */}
                {food.claim && (
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    认领状态：{food.claim.status === 'PENDING' ? '待确认' : '已确认'}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    onClick={() => openEditModal(food)}
                    style={{ 
                      flex: 1, 
                      padding: '8px',
                      backgroundColor: '#4299e1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    修改
                  </button>
                  <button
                    onClick={() => handleDelete(food.id)}
                    style={{ 
                      flex: 1, 
                      padding: '8px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 修改弹窗（和首页的弹窗代码一致） */}
      {showEditModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            width: '500px'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>修改食物信息</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>标题：</label>
              <input
                type="text"
                value={editFoodData.title}
                onChange={(e) => setEditFoodData({ ...editFoodData, title: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>描述：</label>
              <textarea
                value={editFoodData.description}
                onChange={(e) => setEditFoodData({ ...editFoodData, description: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>食堂位置：</label>
              <input
                type="text"
                value={editFoodData.location}
                onChange={(e) => setEditFoodData({ ...editFoodData, location: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>质量：</label>
              <input
                type="text"
                value={editFoodData.quality}
                onChange={(e) => setEditFoodData({ ...editFoodData, quality: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>类别：</label>
              <input
                type="text"
                value={editFoodData.category}
                onChange={(e) => setEditFoodData({ ...editFoodData, category: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#ddd',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={submitEdit}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPublish;