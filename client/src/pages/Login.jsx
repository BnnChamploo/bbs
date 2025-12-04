import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 如果密码为空，使用默认密码 1234567
      const loginPassword = password || '1234567';
      const response = await api.post('/login', { username, password: loginPassword });
      onLogin(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="theme-card rounded-lg p-8 border border-runeterra-gold/20">
        <h2 className="text-3xl font-bold text-runeterra-gold mb-6 text-center">
          登录班德尔密林
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
            <p className="mt-1 text-xs theme-text-muted">留空或输入 1234567 即可登录，用户不存在会自动创建</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-runeterra-gold text-runeterra-dark rounded-md hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center theme-text-secondary">
          还没有账号？{' '}
          <Link to="/register" className="text-runeterra-gold hover:underline">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

