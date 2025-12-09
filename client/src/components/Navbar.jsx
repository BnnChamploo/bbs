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
    const currentPath = location.pathname;
    const currentSearch = location.search;
    
    // 触发 storage 事件，让其他组件知道模式已改变
    window.dispatchEvent(new Event('storage'));
    
    // 使用 navigate 导航到当前路径，触发重新渲染
    // 不直接刷新，而是通过路由更新来触发组件重新渲染
    navigate(currentPath + currentSearch, { replace: true });
    
    // 延迟刷新以确保状态更新（但避免跳转到 index.html）
    setTimeout(() => {
      // 检查当前路径，如果不是 index.html，才刷新
      if (!window.location.pathname.includes('index.html')) {
        window.location.reload();
      }
    }, 100);
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
            <Link 
              to="/" 
              className="flex items-center space-x-1 md:space-x-2"
            >
              <span className="text-lg md:text-2xl font-bold text-runeterra-gold font-runeterra">
                班德尔密林
              </span>
              <span className="text-xs md:text-sm text-gray-400 hidden sm:inline">符文大陆里宇宙</span>
            </Link>
            
            {/* 移动端菜单按钮 - 左侧 drawer */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden px-2 py-1 theme-button rounded-md"
              aria-label="菜单"
            >
              <span className="text-xl">☰</span>
            </button>
            
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
            {/* 主题和模式切换按钮 */}
            <div className="relative" ref={themeMenuRef}>
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
                  <div className="px-3 py-2 text-xs theme-text-muted border-t border-runeterra-gold/20 mt-1">
                    模式
                  </div>
                  <button
                    onClick={() => { handleModeToggle(); setShowThemeMenu(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      editMode ? 'bg-runeterra-purple/20 text-runeterra-purple' : 'theme-dropdown-item'
                    }`}
                  >
                    {editMode ? '✏️ 编辑模式' : '👁️ 展示模式'}
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
                <div className="hidden md:block relative group">
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
            <div className="p-4 border-b border-runeterra-gold/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-runeterra-gold">菜单</h2>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="text-2xl theme-text-secondary hover:text-runeterra-gold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="overflow-y-auto h-full pb-20">
              <div className="p-4 space-y-2">
                {/* 个人资料区域 - 点击跳转 */}
                <Link
                  to="/profile"
                  onClick={() => setShowProfileDrawer(false)}
                  className="flex items-center space-x-3 p-3 rounded-md theme-dropdown-item hover:bg-runeterra-gold/10 transition-colors"
                >
                  <div className="relative w-12 h-12">
                    {getAvatarUrl(user.avatar) ? (
                      <img
                        src={getAvatarUrl(user.avatar)}
                        alt={user.username}
                        className="w-12 h-12 rounded-full border-2 border-runeterra-gold theme-avatar-bg object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 w-12 h-12 rounded-full border-2 border-runeterra-gold theme-avatar-bg flex items-center justify-center text-runeterra-gold text-lg font-bold ${getAvatarUrl(user.avatar) ? 'hidden' : ''}`}>
                      {user.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium theme-text-primary">{user.username}</div>
                    <div className="text-sm theme-text-muted">查看个人资料</div>
                  </div>
                </Link>
                
                <div className="border-t border-runeterra-gold/20 my-2"></div>
                
                {/* 主题切换 */}
                <div className="p-3">
                  <div className="text-sm theme-text-muted mb-2">主题</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setTheme('dark'); setShowProfileDrawer(false); }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                        theme === 'dark' ? 'bg-runeterra-gold/20 text-runeterra-gold' : 'theme-dropdown-item'
                      }`}
                    >
                      <span>🌙</span>
                      <span>深色模式</span>
                    </button>
                    <button
                      onClick={() => { setTheme('light-white'); setShowProfileDrawer(false); }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                        theme === 'light-white' ? 'bg-runeterra-gold/20 text-runeterra-gold' : 'theme-dropdown-item'
                      }`}
                    >
                      <span>☀️</span>
                      <span>浅色模式</span>
                    </button>
                  </div>
                </div>
                
                <div className="border-t border-runeterra-gold/20 my-2"></div>
                
                {/* 编辑/展示模式切换 */}
                <div className="p-3">
                  <div className="text-sm theme-text-muted mb-2">模式</div>
                  <button
                    onClick={() => { handleModeToggle(); setShowProfileDrawer(false); }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      editMode ? 'bg-runeterra-purple/20 text-runeterra-purple' : 'theme-dropdown-item'
                    }`}
                  >
                    <span>{editMode ? '✏️' : '👁️'}</span>
                    <span>{editMode ? '编辑模式' : '展示模式'}</span>
                  </button>
                </div>
                
                <div className="border-t border-runeterra-gold/20 my-2"></div>
                
                {/* 退出登录 */}
                <div className="p-3">
                  <button
                    onClick={() => {
                      onLogout();
                      setShowProfileDrawer(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md theme-dropdown-item hover:bg-red-600/20 hover:text-red-400 transition-colors"
                  >
                    <span>🚪</span>
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
