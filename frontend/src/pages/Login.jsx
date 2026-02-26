import { useState } from 'react';
import { Link } from 'react-router-dom';
import { login, register } from '../api/user';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('user');
  const [invitationCode, setInvitationCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister && password !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }

    try {
      if (isRegister) {
        const res = await register(email, password, confirmPassword, role, invitationCode);
        alert('注册成功！即将自动登录');
        localStorage.setItem('token', res.token);
        window.location.href = '/';
      } else {
        const res = await login(email, password);
        alert('登录成功！');
        localStorage.setItem('token', res.token);
        window.location.href = '/';
      }
    } catch (err) {
      alert(err.response?.data?.message || '操作失败，请重试');
    }
  };

  return (
    <div style={{ width: '400px', margin: '100px auto' }}>
      <h2 style={{ textAlign: 'center' }}>
        {isRegister ? '校园食物共享-注册' : '校园食物共享-登录'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ margin: '10px 0' }}>
          <label>校园邮箱：</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="比如：test@bupt.edu.cn"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label>密码：</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少6位，含大小写、数字、特殊字符"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        {isRegister && (
          <>
            <div style={{ margin: '10px 0' }}>
              <label>确认密码：</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
              />
            </div>

            <div style={{ margin: '10px 0' }}>
              <label>注册为：</label>
              <div>
                <label style={{ marginRight: '20px' }}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={role === 'user'}
                    onChange={(e) => setRole(e.target.value)}
                  /> 普通用户
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={(e) => setRole(e.target.value)}
                  /> 管理员
                </label>
              </div>
            </div>

            {role === 'admin' && (
              <div style={{ margin: '10px 0' }}>
                <label>管理员邀请码：</label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="请输入邀请码"
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  required
                />
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#ff6700',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          {isRegister ? '注册' : '登录'}
        </button>
      </form>

      {/* 忘记密码链接（仅登录模式显示） */}
      {!isRegister && (
        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link to="/forgot-password" style={{ color: '#0088ff' }}>忘记密码？</Link>
        </p>
      )}

      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        {isRegister ? (
          <span onClick={() => setIsRegister(false)} style={{ color: '#0088ff', cursor: 'pointer' }}>
            已有账号？点击登录
          </span>
        ) : (
          <span onClick={() => setIsRegister(true)} style={{ color: '#0088ff', cursor: 'pointer' }}>
            没有账号？点击注册
          </span>
        )}
      </p>
    </div>
  );
};

export default Login;