import { useState, useEffect } from 'react';
import { getAllFoods, updateAnyFood, deleteAnyFood } from '../api/admin';

const AdminFoods = () => {
  const [foods, setFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    quality: '',
    status: 'AVAILABLE'
  });

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const res = await getAllFoods();
      setFoods(res.foods || []);
    } catch (err) {
      alert('加载失败：' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    setFormData({
      title: food.title,
      description: food.description || '',
      location: food.location,
      quality: food.quality,
      status: food.status
    });
  };

  const handleUpdate = async () => {
    try {
      await updateAnyFood(editingFood.id, formData);
      alert('更新成功');
      setEditingFood(null);
      loadFoods();
    } catch (err) {
      alert('更新失败：' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除此食物？')) return;
    try {
      await deleteAnyFood(id);
      alert('删除成功');
      loadFoods();
    } catch (err) {
      alert('删除失败：' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h2>食物管理</h2>

      {/* 编辑弹窗（简单内联） */}
      {editingFood && (
        <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', backgroundColor: 'white' }}>
          <h3>编辑食物</h3>
          <div style={{ marginBottom: '10px' }}>
            <input
              placeholder="标题"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              placeholder="描述"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '8px', minHeight: '60px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              placeholder="位置"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              placeholder="质量"
              value={formData.quality}
              onChange={e => setFormData({ ...formData, quality: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="AVAILABLE">可认领</option>
              <option value="CLAIMED">已认领</option>
              <option value="COMPLETED">已完成</option>
            </select>
          </div>
          <button onClick={handleUpdate} style={{ marginRight: '10px' }}>保存</button>
          <button onClick={() => setEditingFood(null)}>取消</button>
        </div>
      )}

      {/* 食物列表表格 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>标题</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>发布者</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>状态</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {foods.map(f => (
            <tr key={f.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{f.id}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{f.title}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{f.publisher?.email}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{f.status}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <button onClick={() => handleEdit(f)}>修改</button>
                <button onClick={() => handleDelete(f.id)} style={{ marginLeft: '5px' }}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminFoods;