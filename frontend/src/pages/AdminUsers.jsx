// frontend/src/pages/AdminUsers.jsx
import { useState, useEffect } from 'react';
import { getAllUsers, deleteUser } from '../api/admin';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res.users || []);
    } catch (err) {
      alert('加载用户列表失败：' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除此用户吗？此操作不可逆，将同时删除该用户的所有发布和认领记录！')) return;
    try {
      await deleteUser(id);
      alert('用户删除成功');
      loadUsers();
    } catch (err) {
      alert('删除失败：' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h2>用户管理</h2>
      {loading && <p>加载中...</p>}
      {!loading && users.length === 0 && <p>暂无用户</p>}
      {!loading && users.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>邮箱</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>角色</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>注册时间</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.id}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.email}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.role}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(u.createdAt).toLocaleString()}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => handleDelete(u.id)} style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsers;