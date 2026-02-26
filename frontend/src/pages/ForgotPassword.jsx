import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: 输入邮箱, 2: 输入验证码和新密码
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/users/forgot-password', { email });
      setMessage('验证码已发送到您的邮箱（模拟），请查收。');
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('两次密码不一致');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/users/reset-password', {
        email,
        code,
        newPassword,
        confirmNewPassword,
      });
      alert('密码重置成功！请用新密码登录。');
      window.location.href = '/login';
    } catch (err) {
      alert(err.response?.data?.message || '重置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '400px', margin: '100px auto' }}>
      <h2 style={{ textAlign: 'center' }}>忘记密码</h2>
      {step === 1 ? (
        <form onSubmit={handleSendCode}>
          <div style={{ marginBottom: '15px' }}>
            <label>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#ff6700',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {loading ? '发送中...' : '发送验证码'}
          </button>
          {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <div style={{ marginBottom: '15px' }}>
            <label>验证码</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>确认新密码</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#ff6700',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {loading ? '重置中...' : '重置密码'}
          </button>
        </form>
      )}
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        <Link to="/login" style={{ color: '#0088ff' }}>返回登录</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;