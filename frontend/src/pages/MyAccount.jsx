import { useState } from 'react';
import api from '../utils/axios';

const MyAccount = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('两次新密码不一致');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/users/change-password', { oldPassword, newPassword, confirmNewPassword });
      alert('密码修改成功！');
      setOldPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err) {
      alert(err.response?.data?.message || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '400px', margin: '50px auto' }}>
      <h2>修改密码</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>旧密码</label>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>新密码</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
          <small>至少6位，含大小写、数字、特殊字符</small>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>确认新密码</label>
          <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#ff6700', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? '提交中...' : '修改密码'}
        </button>
      </form>
    </div>
  );
};

export default MyAccount;