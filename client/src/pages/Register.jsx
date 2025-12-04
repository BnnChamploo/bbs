import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Register = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 如果密码为空，使用默认密码 1234567
    const registerPassword = password || '1234567';
    const registerConfirmPassword = confirmPassword || '1234567';

    if (registerPassword !== registerConfirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (registerPassword.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      // 如果用户已存在，注册接口会自动登录
      const response = await api.post('/register', { username, password: registerPassword });
      onLogin(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="theme-card rounded-lg p-8 border border-runeterra-gold/20">
        <h2 className="text-3xl font-bold text-runeterra-gold mb-6 text-center">
          加入班德尔密林
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block theme-label mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 theme-input rounded-md"
              required
            />
            <p className="mt-1 text-sm theme-text-muted">可以是英雄名字或符文大陆居民的名字</p>
          </div>

          <div>
            <label className="block theme-label mb-2">密码（默认：1234567，可留空）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="留空或输入 1234567"
              className="w-full px-4 py-2 theme-input rounded-md"
            />
            <p className="mt-1 text-xs theme-text-muted">留空将使用默认密码 1234567</p>
          </div>

          <div>
            <label className="block theme-label mb-2">确认密码（默认：1234567，可留空）</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="留空或输入 1234567"
              className="w-full px-4 py-2 theme-input rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-runeterra-purple text-white rounded-md hover:bg-purple-600 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center theme-text-secondary">
          已有账号？{' '}
          <Link to="/login" className="text-runeterra-gold hover:underline">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

