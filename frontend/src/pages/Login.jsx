// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase'; // 导入 Firebase 认证实例
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification 
} from 'firebase/auth';
import { login as apiLogin, register as apiRegister } from '../api/user';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('user');
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        // 注册模式
        if (password !== confirmPassword) {
          alert('两次输入的密码不一致');
          setLoading(false);
          return;
        }

        // 1. 在 Firebase 创建用户
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // 2. 发送验证邮件
        await sendEmailVerification(firebaseUser);
        alert('注册成功！验证邮件已发送至您的邮箱，请查收并验证。');

        // 3. 将用户信息同步到后端数据库
        await apiRegister(email, role, invitationCode, firebaseUser.uid);

        // 提示用户去验证邮箱，不自动登录
        setIsRegister(false); // 切换回登录表单
        setEmail('');
        setPassword('');
      } else {
        // 登录模式
        // 1. Firebase 登录
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. 检查邮箱是否已验证
        if (!user.emailVerified) {
          alert('您的邮箱尚未验证，请先查收邮件并完成验证。');
          // 可选：重新发送验证邮件
          // await sendEmailVerification(user);
          setLoading(false);
          return;
        }

        // 3. 获取 Firebase ID Token
        const idToken = await user.getIdToken();

        // 4. 调用后端登录接口，验证 token 并获取用户信息
        const res = await apiLogin(idToken);
        localStorage.setItem('token', res.token); // 后端返回的 token（如果有）
        // 注意：后续请求可使用 Firebase ID Token 或后端返回的 token，取决于你的设计。
        // 这里假设后端返回了一个 token 供后续请求使用，与之前一致。

        alert('登录成功！');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('认证失败:', error);
      alert('操作失败：' + (error.message || '请稍后重试'));
    } finally {
      setLoading(false);
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
            placeholder="至少6位"
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
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#ff6700',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
        </button>
      </form>

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