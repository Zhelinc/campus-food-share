// frontend/src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase'; // 导入 Firebase 认证实例
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      // 调用 Firebase 发送重置密码邮件
      await sendPasswordResetEmail(auth, email);
      setMessage('密码重置邮件已发送，请检查您的邮箱（包括垃圾邮件）');
    } catch (err) {
      console.error('发送重置邮件失败:', err);
      // 处理常见错误
      switch (err.code) {
        case 'auth/user-not-found':
          setError('该邮箱未注册，请检查后重试');
          break;
        case 'auth/invalid-email':
          setError('邮箱格式不正确');
          break;
        case 'auth/too-many-requests':
          setError('操作过于频繁，请稍后再试');
          break;
        default:
          setError('发送失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '400px', margin: '100px auto' }}>
      <h2 style={{ textAlign: 'center' }}>重置密码</h2>
      <form onSubmit={handleSubmit}>
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

        {message && <p style={{ color: 'green', marginBottom: '10px' }}>{message}</p>}
        {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

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
          {loading ? '发送中...' : '发送重置邮件'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        <Link to="/login" style={{ color: '#0088ff' }}>返回登录</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;