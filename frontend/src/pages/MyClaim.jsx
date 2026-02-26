// frontend/src/pages/MyClaim.jsx
import { useState, useEffect } from 'react';
import { getUserInfo } from '../api/user';

const MyClaim = () => {
  const [user, setUser] = useState(null);
  const [claimedFoods, setClaimedFoods] = useState([]);

  useEffect(() => {
    const initData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const userRes = await getUserInfo();
        setUser(userRes.user);
        // 注意：getUserInfo 返回的 claimedFoods 字段可能不完整，可根据实际需求扩展后端
        setClaimedFoods(userRes.user.claimedFoods || []);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          alert('加载认领列表失败：' + (err.response?.data?.message || err.message));
        }
      }
    };
    initData();
  }, []);

  return (
    <div style={{ width: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>我的认领</h2>
      
      {claimedFoods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
          你还没有认领任何食物，快去首页看看吧～
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {claimedFoods.map((food) => (
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
                <p style={{ margin: '5px 0', color: '#666' }}>位置：{food.location || '未知'}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>质量：{food.quality || '未知'}</p>
                <p style={{ 
                  margin: '5px 0', 
                  color: food.status === 'AVAILABLE' ? '#4caf50' : '#f44336' 
                }}>
                  状态：{food.status === 'AVAILABLE' ? '可认领' : '已认领'}
                </p>
                {/* 如果需要显示认领确认状态，可以扩展后端返回的数据 */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClaim;