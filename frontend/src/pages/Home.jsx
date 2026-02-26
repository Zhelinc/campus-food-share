// frontend/src/pages/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { getUserInfo } from '../api/user';
import { getFoodList, claimFood, updateFood, deleteFood, publishFood } from '../api/food';

const Home = () => {
  const [user, setUser] = useState(null);
  const [foodList, setFoodList] = useState([]);
  const [filters, setFilters] = useState({
    campus: '',
    category: '',
    keyword: ''
  });

  // 修改弹窗
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditFood, setCurrentEditFood] = useState(null);
  const [editFoodData, setEditFoodData] = useState({
    title: '', description: '', location: '', quality: '', category: ''
  });

  // 发布弹窗
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishFoodData, setPublishFoodData] = useState({
    title: '', description: '', campus: '', location: '', quality: '', category: '', allergens: '', imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // 用户菜单状态
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }

        const userRes = await getUserInfo();
        setUser(userRes.user);

        const foodRes = await getFoodList();
        setFoodList(foodRes.foods || []);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          alert('加载数据失败：' + (err.response?.data?.message || err.message));
        }
      }
    };
    initData();
  }, []);

  // 获取未读消息数
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/api/notifications/unread-count');
        setUnreadCount(res.unreadCount);
      } catch (err) { /* 忽略 */ }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async () => {
    try {
      const foodRes = await getFoodList({
        ...filters,
        campus: filters.campus || undefined
      });
      setFoodList(foodRes.foods || []);
    } catch (err) {
      alert('获取食物列表失败：' + (err.response?.data?.message || err.message));
    }
  };

  const handleClaim = async (foodId) => {
    if (window.confirm('确定要认领这份食物吗？')) {
      try {
        await claimFood(foodId);
        alert('认领成功！等待发布者确认');
        handleSearch();
      } catch (err) {
        alert('认领失败：' + (err.response?.data?.message || err.message));
      }
    }
  };

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

  const submitEdit = async () => {
    if (!currentEditFood) return;
    try {
      await updateFood(currentEditFood.id, editFoodData);
      alert('修改成功！');
      setShowEditModal(false);
      handleSearch();
    } catch (err) {
      alert('修改失败：' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (foodId) => {
    if (window.confirm('确定要删除这条发布吗？')) {
      try {
        await deleteFood(foodId);
        alert('删除成功！');
        handleSearch();
      } catch (err) {
        alert('删除失败：' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setPublishFoodData({ ...publishFoodData, imageUrl: data.url });
        alert('图片上传成功');
      } else {
        alert('上传失败：' + data.message);
      }
    } catch (err) {
      alert('上传失败：' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // 前端筛选（基于校区、类别、关键词）
  const filteredFoods = foodList.filter(food => {
    return (
      (filters.campus ? food.campus === filters.campus : true) &&
      (filters.category ? food.category === filters.category : true) &&
      (filters.keyword ? food.title?.includes(filters.keyword) : true)
    );
  });

  return (
    <div style={{ width: '1200px', margin: '0 auto', fontFamily: 'Arial' }}>
      {/* 顶部栏 */}
      <div style={{
        backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', gap: '30px', marginBottom: '20px'
      }}>
        <span style={{ color: '#ff6700', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setShowPublishModal(true)}>发布食物</span>
        <Link to="/my-publish" style={{ color: '#666', textDecoration: 'none' }}>我的发布</Link>
        <Link to="/my-claim" style={{ color: '#666', textDecoration: 'none' }}>我的认领</Link>
        {user?.role === 'admin' && <Link to="/admin" style={{ color: '#ff6700', textDecoration: 'none' }}>管理后台</Link>}

        {/* 用户头像下拉菜单 */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <div
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <span style={{ color: '#ff6700', marginRight: '5px' }}>{user?.email}</span>
            <div style={{ position: 'relative' }}>
              <span style={{ fontSize: '20px' }}>👤</span>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'red', color: 'white',
                  borderRadius: '50%', padding: '2px 6px', fontSize: '12px', minWidth: '16px', textAlign: 'center'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </div>
          {showUserMenu && (
            <div style={{
              position: 'absolute', top: '30px', right: '0', backgroundColor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderRadius: '4px', width: '150px', zIndex: 1000
            }}>
              <Link to="/my-account" style={{ display: 'block', padding: '10px', borderBottom: '1px solid #eee', textDecoration: 'none', color: '#333' }}
                onClick={() => setShowUserMenu(false)}>我的账号</Link>
              <Link to="/my-messages" style={{ display: 'block', padding: '10px', textDecoration: 'none', color: '#333', position: 'relative' }}
                onClick={() => setShowUserMenu(false)}>
                我的消息
                {unreadCount > 0 && <span style={{ marginLeft: '5px', backgroundColor: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '12px' }}>{unreadCount}</span>}
              </Link>
            </div>
          )}
        </div>

        <span style={{ cursor: 'pointer', color: '#f44336' }} onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>退出登录</span>
      </div>

      {/* 搜索框 */}
      <div style={{ backgroundColor: '#fff8f0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="搜索食物（如：红烧肉）" value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} style={{ flex: 1, padding: '10px 15px', border: '1px solid #ff6700', borderRadius: '4px 0 0 4px', outline: 'none' }} />
          <button onClick={handleSearch} style={{ backgroundColor: '#ff6700', color: 'white', border: 'none', padding: '0 20px', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>搜索</button>
        </div>
      </div>

      {/* 左侧筛选 + 中间列表 */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 左侧筛选栏 */}
        <div style={{ width: '200px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderRadius: '8px', padding: '15px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>校区</h3>
          <select value={filters.campus} onChange={(e) => setFilters({ ...filters, campus: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="">全部校区</option>
            <option value="伦敦">伦敦</option>
            <option value="海淀">海淀</option>
            <option value="沙河">沙河</option>
            <option value="海南">海南</option>
          </select>

          <h3 style={{ margin: '20px 0 15px 0', fontSize: '16px' }}>食物类别</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['主食', '零食', '水果'].map(cat => (
              <div key={cat} onClick={() => setFilters({ ...filters, category: cat })} style={{
                padding: '8px 10px', cursor: 'pointer', borderRadius: '4px',
                backgroundColor: filters.category === cat ? '#fff8f0' : 'white'
              }}>{cat}</div>
            ))}
          </div>
        </div>

        {/* 中间食物列表 */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {filteredFoods.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: '#999' }}>暂无食物数据，快去发布吧～</div>
          ) : (
            filteredFoods.map(food => (
              <div key={food.id} style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <img src={food.imageUrl || 'https://via.placeholder.com/300x200?text=食物图片'} alt={food.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{food.title}</h4>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>校区：{food.campus}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>分享地址：{food.location}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>类别：{food.category}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>质量：{food.quality}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: food.status === 'AVAILABLE' ? '#4caf50' : '#f44336' }}>
                    状态：{food.status === 'AVAILABLE' ? '可认领' : '已认领'}
                  </p>
                  {food.publisherId === user?.id ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button onClick={() => openEditModal(food)} style={{ flex: 1, padding: '10px', backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>修改</button>
                      <button onClick={() => handleDelete(food.id)} style={{ flex: 1, padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>删除</button>
                    </div>
                  ) : (
                    <button disabled={food.status !== 'AVAILABLE'} onClick={() => handleClaim(food.id)} style={{
                      width: '100%', marginTop: '15px', padding: '10px', backgroundColor: '#ff6700', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                      opacity: food.status !== 'AVAILABLE' ? 0.6 : 1
                    }}>
                      {food.status === 'AVAILABLE' ? '立即认领' : '已被认领'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 修改食物弹窗 */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>修改食物信息</h3>
            <div style={{ marginBottom: '15px' }}>
              <label>标题：</label>
              <input type="text" value={editFoodData.title} onChange={e => setEditFoodData({ ...editFoodData, title: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>描述：</label>
              <textarea value={editFoodData.description} onChange={e => setEditFoodData({ ...editFoodData, description: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>校区：</label>
              <input type="text" value={editFoodData.campus} onChange={e => setEditFoodData({ ...editFoodData, campus: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>分享地址：</label>
              <input type="text" value={editFoodData.location} onChange={e => setEditFoodData({ ...editFoodData, location: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>质量：</label>
              <input type="text" value={editFoodData.quality} onChange={e => setEditFoodData({ ...editFoodData, quality: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>类别：</label>
              <input type="text" value={editFoodData.category} onChange={e => setEditFoodData({ ...editFoodData, category: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(false)} style={{ padding: '8px 16px', backgroundColor: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
              <button onClick={submitEdit} style={{ padding: '8px 16px', backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>保存修改</button>
            </div>
          </div>
        </div>
      )}

      {/* 发布食物弹窗 */}
      {showPublishModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>发布新食物</h3>
            <div style={{ marginBottom: '15px' }}>
              <label>标题 *</label>
              <input type="text" value={publishFoodData.title} onChange={e => setPublishFoodData({ ...publishFoodData, title: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} placeholder="例如：红烧肉" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>描述</label>
              <textarea value={publishFoodData.description} onChange={e => setPublishFoodData({ ...publishFoodData, description: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }} placeholder="食物的详细描述..." />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>校区 *</label>
              <select value={publishFoodData.campus} onChange={e => setPublishFoodData({ ...publishFoodData, campus: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} required>
                <option value="">请选择校区</option>
                <option value="伦敦">伦敦</option>
                <option value="海淀">海淀</option>
                <option value="沙河">沙河</option>
                <option value="海南">海南</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>分享地址 *</label>
              <input type="text" value={publishFoodData.location} onChange={e => setPublishFoodData({ ...publishFoodData, location: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} placeholder="例如：第一食堂二楼" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>质量 *</label>
              <select value={publishFoodData.quality} onChange={e => setPublishFoodData({ ...publishFoodData, quality: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option value="">请选择</option>
                <option value="新鲜">新鲜</option>
                <option value="临期">临期</option>
                <option value="已开封">已开封</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>类别</label>
              <input type="text" value={publishFoodData.category} onChange={e => setPublishFoodData({ ...publishFoodData, category: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} placeholder="例如：主食、零食" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>过敏原（逗号分隔）</label>
              <input type="text" value={publishFoodData.allergens} onChange={e => setPublishFoodData({ ...publishFoodData, allergens: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} placeholder="例如：花生, 海鲜" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>食物图片</label>
              <input type="file" accept="image/*" onChange={handleFileSelect} disabled={uploading} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              {uploading && <p style={{ color: '#ff6700' }}>上传中...</p>}
              {previewUrl && <div><img src={previewUrl} alt="预览" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', marginTop: '10px' }} /></div>}
              {publishFoodData.imageUrl && !previewUrl && <div><img src={publishFoodData.imageUrl} alt="已上传" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', marginTop: '10px' }} /></div>}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowPublishModal(false); setPublishFoodData({ title: '', description: '', campus: '', location: '', quality: '', category: '', allergens: '', imageUrl: '' }); setPreviewUrl(''); }} style={{ padding: '8px 16px', backgroundColor: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
              <button onClick={async () => {
                if (!publishFoodData.title || !publishFoodData.campus || !publishFoodData.location || !publishFoodData.quality) {
                  alert('请填写标题、校区、分享地址和质量');
                  return;
                }
                try {
                  const submitData = {
                    ...publishFoodData,
                    allergens: publishFoodData.allergens ? publishFoodData.allergens.split(',').map(s => s.trim()) : []
                  };
                  await publishFood(submitData);
                  alert('发布成功！');
                  setShowPublishModal(false);
                  handleSearch();
                  setPublishFoodData({ title: '', description: '', campus: '', location: '', quality: '', category: '', allergens: '', imageUrl: '' });
                  setPreviewUrl('');
                } catch (err) {
                  alert('发布失败：' + (err.response?.data?.message || err.message));
                }
              }} disabled={uploading} style={{ padding: '8px 16px', backgroundColor: '#ff6700', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                {uploading ? '上传中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;