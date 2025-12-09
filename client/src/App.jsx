import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import api from './utils/api';

// 处理 404.html 重定向的组件（必须在 Router 内部）
function RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 检查 sessionStorage 中是否有重定向路径
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      console.log('[RedirectHandler] Found redirectPath:', redirectPath);
      
      // 清除 sessionStorage
      sessionStorage.removeItem('redirectPath');
      
      // 如果 redirectPath 以 / 开头，说明是完整路径
      // 如果以 ? 或 # 开头，说明只有查询参数或hash
      let targetPath = '/';
      let targetSearch = '';
      let targetHash = '';
      
      if (redirectPath.startsWith('/')) {
        // 完整路径，解析URL
        try {
          const url = new URL(redirectPath, window.location.origin);
          targetPath = url.pathname;
          targetSearch = url.search;
          targetHash = url.hash;
          
          // 移除 base path（React Router 的 basename 会自动处理）
          const basePath = import.meta.env.BASE_URL || '/bbs/';
          if (basePath !== '/' && targetPath.startsWith(basePath.slice(0, -1))) {
            targetPath = targetPath.slice(basePath.slice(0, -1).length) || '/';
          }
        } catch (e) {
          // 如果 URL 解析失败，直接使用 redirectPath 作为路径
          console.error('[RedirectHandler] Failed to parse URL:', e);
          targetPath = redirectPath.split('?')[0].split('#')[0];
          const searchMatch = redirectPath.match(/\?([^#]*)/);
          const hashMatch = redirectPath.match(/#(.*)/);
          targetSearch = searchMatch ? '?' + searchMatch[1] : '';
          targetHash = hashMatch ? '#' + hashMatch[1] : '';
        }
      } else if (redirectPath.startsWith('?')) {
        // 只有查询参数
        targetSearch = redirectPath.split('#')[0];
        targetHash = redirectPath.includes('#') ? '#' + redirectPath.split('#').slice(1).join('#') : '';
      } else if (redirectPath.startsWith('#')) {
        // 只有hash
        targetHash = redirectPath;
      }
      
      // 确保路径以 / 开头
      if (!targetPath.startsWith('/')) {
        targetPath = '/' + targetPath;
      }
      
      // 使用 navigate 跳转到正确路径（replace 避免在历史记录中留下记录）
      const targetUrl = targetPath + targetSearch + targetHash;
      
      console.log('[RedirectHandler] Navigating to:', targetUrl);
      console.log('[RedirectHandler] Current location:', location.pathname + location.search + location.hash);
      
      // 如果当前路径和目标路径不同，才进行跳转
      if (location.pathname + location.search + location.hash !== targetUrl) {
        // 使用 setTimeout 确保在下一个事件循环中执行，避免与 React Router 的初始化冲突
        setTimeout(() => {
          navigate(targetUrl, { replace: true });
        }, 0);
      }
    }
  }, [navigate]); // 移除 location 依赖，避免重复执行

  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/user')
        .then(res => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    // 清除所有可能的登录相关缓存
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('runeterra_token');
    localStorage.removeItem('runeterra_user');
    localStorage.removeItem('runeterra_current_user');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center theme-bg">
        <div className="text-runeterra-gold text-2xl">加载中...</div>
      </div>
      </ThemeProvider>
    );
  }

  // 获取 base path（GitHub Pages 使用 /bbs/）
  const basePath = import.meta.env.BASE_URL || '/bbs/';
  const basename = basePath === '/' ? '/' : basePath.slice(0, -1); // 移除末尾的 /

  return (
    <ThemeProvider>
      <Router basename={basename}>
        <RedirectHandler />
        <div className="min-h-screen theme-bg">
          <Navbar user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} 
            />
            <Route path="/post/:id" element={<PostDetail user={user} />} />
            <Route 
              path="/create-post" 
              element={user ? <CreatePost user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <Profile user={user} onUpdate={updateUser} /> : <Navigate to="/login" />} 
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;

