import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getAvatarUrl } from '../utils/avatar';
import api from '../utils/api';
import { CATEGORIES } from '../data/categories';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, setTheme } = useTheme();
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState({});
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [editMode, setEditMode] = useState(localStorage.getItem('editMode') === 'true');
  const timeoutRef = useRef(null);
  const themeMenuRef = useRef(null);
  const profileDrawerRef = useRef(null);

  useEffect(() => {
    // 获取主板块（包含子板块信息）
    const loadCategories = async () => {
      try {
        const response = await api.get('/categories');
        const mainData = response.data;
        const cats = [];
        Object.keys(mainData).forEach(key => {
          const value = key; // 包括plaza在内的所有板块都使用key作为value
          // subcategories现在包含key字段
          const subcats = (mainData[key].subcategories || []).map(subCatObj => ({
            value: subCatObj.key || subCatObj.name,
            name: subCatObj.name || '',
            desc: subCatObj.desc || ''
          }));
          cats.push({
            name: mainData[key].name,
            value: value,
            icon: mainData[key].icon,
            subcategories: subcats
          });
        });
        setCategories(cats);
      } catch (err) {
        // 如果 API 失败，使用静态数据
        console.error('获取板块失败:', err);
        const cats = [];
        Object.keys(CATEGORIES).forEach(key => {
          const cat = CATEGORIES[key];
          if (!cat.parent) {
            const subcats = (cat.subcategories || []).map(subKey => ({
              value: subKey,
              name: CATEGORIES[subKey]?.name || '',
              desc: CATEGORIES[subKey]?.desc || ''
            }));
            cats.push({
              name: cat.name,
              value: key,
              icon: cat.icon,
              subcategories: subcats
            });
          }
        });
        setCategories(cats);
      }
    };
    loadCategories();
  }, []);

  const handleMouseEnter = (cat) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (cat.subcategories && cat.subcategories.length > 0) {
      setHoveredCategory(cat.value);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 200);
  };

  const isActive = (catValue) => {
    // 首页默认不激活任何板块
    if (location.pathname === '/' && !location.search.includes('category=')) {
      return false;
    }
    return location.search.includes(`category=${catValue}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
      if (profileDrawerRef.current && !profileDrawerRef.current.contains(event.target)) {
        setShowProfileDrawer(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 监听 editMode 变化
  useEffect(() => {
    const handleStorageChange = () => {
      setEditMode(localStorage.getItem('editMode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    // 也监听同标签页的变化
    const interval = setInterval(() => {
      const currentEditMode = localStorage.getItem('editMode') === 'true';
      if (currentEditMode !== editMode) {
        setEditMode(currentEditMode);
      }
    }, 100);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [editMode]);

  const handleModeToggle = () => {
    const newEditMode = !editMode;
    localStorage.setItem('editMode', newEditMode.toString());
    setEditMode(newEditMode);
    
    // 获取当前路径和查询参数
    let currentPath = location.pathname;
    const currentSearch = location.search;
    const currentHash = location.hash;
    
    // 清理路径，移除 index.html 和多余的斜杠
    if (currentPath.includes('index.html')) {
      currentPath = currentPath.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
    }
    
    // 确保路径以 / 开头
    if (!currentPath.startsWith('/')) {
      currentPath = '/' + currentPath;
    }
    
    // 触发 storage 事件，让其他组件知道模式已改变
    window.dispatchEvent(new Event('storage'));
    
    // 构建目标 URL，确保不包含 index.html
    const basePath = import.meta.env.BASE_URL || '/bbs/';
    let targetPath = currentPath;
    
    // 确保路径包含 base path（如果设置了）
    if (basePath !== '/' && !targetPath.startsWith(basePath)) {
      if (targetPath === '/') {
        targetPath = basePath.slice(0, -1); // 移除末尾的 /
      } else {
        targetPath = basePath + targetPath.replace(/^\//, '');
      }
    }
    
    // 确保路径不以 / 结尾（除非是根路径），避免 GitHub Pages 重定向到 index.html
    if (targetPath !== basePath.slice(0, -1) && targetPath.endsWith('/')) {
      targetPath = targetPath.slice(0, -1);
    }
    
    // 构建完整 URL，确保不包含 index.html
    const fullUrl = window.location.origin + targetPath + currentSearch + currentHash;
    
    // 使用 navigate 先更新路由状态
    navigate(currentPath + currentSearch + currentHash, { replace: true });
    
    // 然后使用 window.location.href 来刷新，但确保路径正确
    // 使用 setTimeout 确保 navigate 先执行
    setTimeout(() => {
      // 再次检查当前路径，确保不包含 index.html
      const checkPath = window.location.pathname;
      if (checkPath.includes('index.html')) {
        // 如果已经跳转到 index.html，使用 replace 修正
        window.location.replace(fullUrl);
      } else {
        // 否则直接刷新当前页面
        window.location.href = fullUrl;
      }
    }, 10);
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return '🌙';
    return '☀️';
  };

  const getThemeName = () => {
    if (theme === 'dark') return '深色';
    return '浅色';
  };

  return (
    <nav className="theme-nav border-b-2 border-runeterra-gold shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 md:space-x-8">
            {/* 移动端菜单按钮 - 左侧 drawer，移到论坛名左侧 */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2"
              aria-label="菜单"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 theme-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <Link 
              to="/" 
              className="flex items-center space-x-1 md:space-x-2"
            >
              <span className="text-lg md:text-2xl font-bold text-runeterra-gold font-runeterra">
                班德尔密林
              </span>
              <span className="text-xs md:text-sm text-gray-400 hidden sm:inline">符文大陆里宇宙</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {categories.map((cat, index) => (
                <div
                  key={`cat-${cat.value || 'plaza'}-${index}`}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(cat)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    to={`/?category=${cat.value}`}
                    className={`px-5 py-2 text-base font-medium transition-colors ${
                      isActive(cat.value)
                        ? 'text-runeterra-gold'
                        : 'theme-nav-link'
                    }`}
                  >
                    {cat.name}
                  </Link>
                  
                  {hoveredCategory === cat.value && cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-48 theme-dropdown border border-runeterra-gold/30 rounded-md shadow-lg z-50">
                      {cat.subcategories.map((subCat, subIndex) => (
                        <Link
                          key={`subcat-${subCat.value}-${subIndex}`}
                          to={`/?category=${subCat.value}`}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            location.search.includes(`category=${subCat.value}`)
                              ? 'bg-runeterra-gold/20 text-runeterra-gold'
                              : 'theme-dropdown-item'
                          }`}
                        >
                          {subCat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* 主题和模式切换按钮 - 桌面端显示，移动端隐藏 */}
            <div className="relative hidden md:block" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center space-x-1 px-2 md:px-3 py-2 theme-button rounded-md transition-colors"
                title="切换主题和模式"
              >
                <span className="text-lg">{getThemeIcon()}</span>
                <span className="hidden lg:inline text-sm">{getThemeName()}</span>
              </button>
              {showThemeMenu && (
                <div className="absolute right-0 top-full mt-1 theme-dropdown border border-runeterra-gold/30 rounded-md shadow-lg z-50 min-w-[140px]">
                  <div className="px-3 py-2 text-xs theme-text-muted border-b border-runeterra-gold/20">
                    主题
                  </div>
                  <button
                    onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      theme === 'dark' ? 'bg-runeterra-gold/20 text-runeterra-gold' : 'theme-dropdown-item'
                    }`}
                  >
                    🌙 深色
                  </button>
                  <button
                    onClick={() => { setTheme('light-white'); setShowThemeMenu(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      theme === 'light-white' ? 'bg-runeterra-gold/20 text-runeterra-gold' : 'theme-dropdown-item'
                    }`}
                  >
                    ☀️ 浅色
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* 桌面端：保持原有样式 */}
                <Link
                  to="/create-post"
                  className="hidden sm:inline px-4 py-2 bg-runeterra-gold text-runeterra-dark hover:bg-yellow-600 transition-colors font-medium rounded-md"
                >
                  发帖
                </Link>
                {/* 移动端：SVG 铅笔图标幽灵按钮 */}
                <Link
                  to="/create-post"
                  className="sm:hidden p-2 theme-button rounded-md transition-colors"
                  title="发布新帖子"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M20.548 3.452a1.542 1.542 0 0 1 0 2.182l-7.636 7.636-3.273 1.091 1.091-3.273 7.636-7.636a1.542 1.542 0 0 1 2.182 0zM4 21h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-2 0v7H5V6h7a1 1 0 0 0 0-2H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1z" fill="currentColor"/>
                  </svg>
                </Link>
                {/* 桌面端：保持原有样式 */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="relative group">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 theme-nav-link hover:text-runeterra-gold transition-colors"
                    >
                      <div className="relative w-8 h-8">
                        {getAvatarUrl(user.avatar) ? (
                          <img
                            src={getAvatarUrl(user.avatar)}
                            alt={user.username}
                            className="w-8 h-8 rounded-full border-2 border-runeterra-gold theme-avatar-bg object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.nextElementSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 w-8 h-8 rounded-full border-2 border-runeterra-gold theme-avatar-bg flex items-center justify-center text-runeterra-gold text-sm font-bold ${getAvatarUrl(user.avatar) ? 'hidden' : ''}`}>
                          {user.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      </div>
                      <span className="hidden md:inline">{user.username}</span>
                    </Link>
                    <div className="absolute top-full right-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="theme-dropdown border border-runeterra-gold/30 rounded-md shadow-lg min-w-[100px]">
                        <button
                          onClick={onLogout}
                          className="block w-full text-left px-4 py-2 text-sm theme-dropdown-item hover:text-red-400 transition-colors rounded-md"
                        >
                          退出登录
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 桌面端：编辑模式按钮 */}
                  <button
                    onClick={handleModeToggle}
                    className={`px-3 py-2 rounded-md transition-colors font-medium text-sm ${
                      editMode 
                        ? 'bg-runeterra-purple text-white hover:bg-purple-600' 
                        : 'theme-button hover:bg-runeterra-gold/20'
                    }`}
                  >
                    {editMode ? '编辑模式' : '展示模式'}
                  </button>
                </div>
                
                {/* 移动端：头像按钮，点击打开右侧 drawer */}
                <button
                  onClick={() => setShowProfileDrawer(!showProfileDrawer)}
                  className="md:hidden flex items-center"
                  aria-label="用户菜单"
                >
                  <div className="relative w-8 h-8">
                    {getAvatarUrl(user.avatar) ? (
                      <img
                        src={getAvatarUrl(user.avatar)}
                        alt={user.username}
                        className="w-8 h-8 rounded-full border-2 border-runeterra-gold theme-avatar-bg object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 w-8 h-8 rounded-full border-2 border-runeterra-gold theme-avatar-bg flex items-center justify-center text-runeterra-gold text-sm font-bold ${getAvatarUrl(user.avatar) ? 'hidden' : ''}`}>
                      {user.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="theme-nav-link hover:text-runeterra-gold transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-3 md:px-4 py-2 bg-runeterra-purple text-white hover:bg-purple-600 transition-colors rounded-md text-sm md:text-base"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
        
      </div>
      
      {/* 移动端左侧 drawer - 模块列表 */}
      {showMobileMenu && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          {/* Drawer */}
          <div className="fixed left-0 top-0 bottom-0 w-64 theme-dropdown border-r border-runeterra-gold/30 shadow-lg z-50 md:hidden transform transition-transform duration-300">
            <div className="p-4 border-b border-runeterra-gold/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-runeterra-gold">板块</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-2xl theme-text-secondary hover:text-runeterra-gold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="overflow-y-auto h-full pb-20">
              <div className="px-4 py-3 space-y-2">
                {categories.map((cat, index) => (
                <div key={`mobile-cat-${cat.value || 'plaza'}-${index}`}>
                  <Link
                    to={`/?category=${cat.value}`}
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-4 py-2 rounded-md transition-colors ${
                      isActive(cat.value)
                        ? 'bg-runeterra-gold/20 text-runeterra-gold'
                        : 'theme-dropdown-item'
                    }`}
                  >
                    {cat.name}
                  </Link>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {cat.subcategories.map((subCat, subIndex) => (
                        <Link
                          key={`mobile-subcat-${subCat.value}-${subIndex}`}
                          to={`/?category=${subCat.value}`}
                          onClick={() => setShowMobileMenu(false)}
                          className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                            location.search.includes(`category=${subCat.value}`)
                              ? 'bg-runeterra-gold/20 text-runeterra-gold'
                              : 'theme-dropdown-item'
                          }`}
                        >
                          {subCat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* 移动端右侧 drawer - 个人资料菜单 */}
      {showProfileDrawer && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowProfileDrawer(false)}
          />
          {/* Drawer */}
          <div ref={profileDrawerRef} className="fixed right-0 top-0 bottom-0 w-64 theme-dropdown border-l border-runeterra-gold/30 shadow-lg z-50 md:hidden transform transition-transform duration-300">
            {/* 关闭按钮 */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setShowProfileDrawer(false)}
                className="text-2xl theme-text-secondary hover:text-runeterra-gold"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto h-full pb-20">
              <div className="p-6">
                {/* 头像居中大图 */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-24 h-24">
                    {getAvatarUrl(user.avatar) ? (
                      <img
                        src={getAvatarUrl(user.avatar)}
                        alt={user.username}
                        className="w-24 h-24 rounded-full border-4 border-runeterra-gold theme-avatar-bg object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 w-24 h-24 rounded-full border-4 border-runeterra-gold theme-avatar-bg flex items-center justify-center text-runeterra-gold text-3xl font-bold ${getAvatarUrl(user.avatar) ? 'hidden' : ''}`}>
                      {user.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                </div>
                
                {/* 用户名居中展示 */}
                <div className="text-center mb-6">
                  <div className="font-medium text-lg theme-text-primary">{user.username}</div>
                </div>
                
                <div className="border-t border-runeterra-gold/20 my-4"></div>
                
                {/* 个人资料 - 与主题模式同一级别 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileDrawer(false)}
                      className="text-sm theme-text-primary hover:text-runeterra-gold transition-colors"
                    >
                      个人资料
                    </Link>
                  </div>
                </div>
                
                <div className="border-t border-runeterra-gold/20 my-4"></div>
                
                {/* 深色主题 - Switch 按钮 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm theme-text-primary">深色主题</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={theme === 'dark'}
                        onChange={(e) => {
                          setTheme(e.target.checked ? 'dark' : 'light-white');
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-runeterra-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-runeterra-gold"></div>
                    </label>
                  </div>
                </div>
                
                <div className="border-t border-runeterra-gold/20 my-4"></div>
                
                {/* 编辑模式 - Switch 按钮 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm theme-text-primary">编辑模式</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editMode}
                        onChange={(e) => {
                          handleModeToggle();
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-runeterra-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-runeterra-purple"></div>
                    </label>
                  </div>
                </div>
                
                <div className="border-t border-runeterra-gold/20 my-4"></div>
                
                {/* 退出登录 */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      onLogout();
                      setShowProfileDrawer(false);
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-2 rounded-md theme-dropdown-item hover:bg-red-600/20 hover:text-red-400 transition-colors mx-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>退出登录</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
