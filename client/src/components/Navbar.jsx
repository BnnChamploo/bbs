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
  const [editMode, setEditMode] = useState(localStorage.getItem('editMode') === 'true');
  const timeoutRef = useRef(null);
  const themeMenuRef = useRef(null);

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
    // 获取当前完整 URL，确保包含 base path
    const currentUrl = window.location.href;
    // 如果当前路径不是以 /bbs/ 开头，可能是直接访问的路径，需要添加 base path
    const basePath = import.meta.env.BASE_URL || '/bbs/';
    let targetUrl = currentUrl;
    
    // 如果当前 URL 不包含 base path，添加它
    if (!currentUrl.includes('/bbs/') && basePath !== '/') {
      const url = new URL(currentUrl);
      const path = url.pathname;
      // 移除开头的 /，添加 base path
      const newPath = basePath + path.replace(/^\//, '');
      targetUrl = url.origin + newPath + url.search + url.hash;
    }
    
    // 刷新页面
    window.location.href = targetUrl;
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
              onClick={(e) => {
                e.preventDefault();
                navigate('/', { replace: true });
              }}
              className="flex items-center space-x-1 md:space-x-2"
            >
              <span className="text-lg md:text-2xl font-bold text-runeterra-gold font-runeterra">
                班德尔密林
              </span>
              <span className="text-xs md:text-sm text-gray-400 hidden sm:inline">符文大陆里宇宙</span>
            </Link>
            
            {/* 移动端菜单按钮 */}
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
                <Link
                  to="/create-post"
                  className="px-3 md:px-4 py-2 bg-runeterra-gold text-runeterra-dark hover:bg-yellow-600 transition-colors font-medium rounded-md text-sm md:text-base"
                >
                  <span className="hidden sm:inline">发帖</span>
                  <span className="sm:hidden">✏️</span>
                </Link>
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
        
        {/* 移动端菜单 */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-runeterra-gold/20 theme-dropdown">
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
        )}
      </div>
    </nav>
  );
};

export default Navbar;
