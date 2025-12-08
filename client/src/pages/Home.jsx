import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { formatRuneterraTime } from '../utils/runeterraTime';
import { getAvatarUrl } from '../utils/avatar';
import { CATEGORIES } from '../data/categories';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || null; // null表示显示全部帖子

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts', {
        params: { category: category || undefined }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('获取帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const [categoryMap, setCategoryMap] = useState({});
  const [categoryDescMap, setCategoryDescMap] = useState({});

  useEffect(() => {
    // 使用静态数据或 API
    const loadCategories = async () => {
      try {
        const response = await api.get('/categories/all');
        const data = response.data;
        const map = {};
        const descMap = {};
        Object.keys(data).forEach(key => {
          map[key] = data[key].name;
          descMap[key] = data[key].desc || '';
        });
        setCategoryMap(map);
        setCategoryDescMap(descMap);
      } catch (err) {
        // 如果 API 失败，使用静态数据
        const map = {};
        const descMap = {};
        Object.keys(CATEGORIES).forEach(key => {
          map[key] = CATEGORIES[key].name;
          descMap[key] = CATEGORIES[key].desc || '';
        });
        setCategoryMap(map);
        setCategoryDescMap(descMap);
      }
    };
    loadCategories();
  }, []);

  const getCategoryName = (category) => {
    return categoryMap[category] || category;
  };

  const getCategoryDesc = (category) => {
    return categoryDescMap[category] || '';
  };

  // 根据板块获取主板块，用于确定标签颜色
  const getMainCategory = (category) => {
    if (!category) return null;
    if (category.startsWith('plaza_')) return 'plaza';
    if (category.startsWith('gossip_')) return 'gossip';
    if (category.startsWith('emotion_')) return 'emotion';
    if (category.startsWith('life_')) return 'life';
    if (category === 'plaza') return 'plaza';
    if (category === 'gossip') return 'gossip';
    if (category === 'emotion') return 'emotion';
    if (category === 'life') return 'life';
    return null;
  };

  // 根据主板块返回标签颜色类
  const getCategoryColor = (category) => {
    const mainCategory = getMainCategory(category);
    switch (mainCategory) {
      case 'plaza':
        return 'bg-runeterra-purple/30 text-runeterra-purple';
      case 'gossip':
        return 'bg-orange-500/30 text-orange-400';
      case 'emotion':
        return 'bg-pink-500/30 text-pink-400';
      case 'life':
        return 'bg-green-500/30 text-green-400';
      default:
        return 'bg-runeterra-purple/30 text-runeterra-purple';
    }
  };

  // 去除HTML标签，只显示纯文本预览
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-runeterra-gold">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8 pr-[calc(0.75rem+96px)] sm:pr-[calc(1rem+96px)] md:pr-[calc(1.5rem+96px)] lg:pr-[calc(2rem+96px)]">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-runeterra-gold mb-2">
          {category ? getCategoryName(category) : '最新帖子'}
        </h1>
        <p className="theme-text-secondary text-sm md:text-base">
          {category ? (() => {
            // 特定板块使用描述作为欢迎词
            const specialCategories = ['gossip_fan', 'gossip_bomb', 'plaza_summoner_academic', 'gossip_star', 'gossip_melon'];
            if (specialCategories.includes(category)) {
              const desc = getCategoryDesc(category);
              return desc || `欢迎来到${getCategoryName(category)}，分享你在符文大陆的见闻`;
            }
            return `欢迎来到${getCategoryName(category)}，分享你在符文大陆的见闻`;
          })() : '欢迎来到班德尔密林，分享你在符文大陆的见闻'}
        </p>
      </div>

      <div className="space-y-3 md:space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-8 md:py-12 theme-card rounded-lg border border-runeterra-gold/20">
            <p className="theme-text-secondary text-base md:text-lg">暂无帖子，成为第一个发帖的人吧！</p>
          </div>
        ) : (
          posts.map(post => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="block theme-card rounded-lg p-4 md:p-6 transition-colors border border-runeterra-gold/20 hover:border-runeterra-gold/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {post.is_pinned === 1 && (
                      <span className="px-2 py-1 bg-runeterra-gold text-runeterra-dark rounded text-xs font-bold flex-shrink-0 whitespace-nowrap">
                        置顶
                      </span>
                    )}
                    <span className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm flex-shrink-0 whitespace-nowrap ${getCategoryColor(post.category)}`}>
                      {getCategoryName(post.category)}
                    </span>
                    <h2 className="text-base md:text-xl font-semibold theme-text-primary min-w-0 break-words flex-1">{post.title}</h2>
                  </div>
                  <p className="theme-text-secondary mb-3 md:mb-4 line-clamp-2 text-sm md:text-base">{stripHtml(post.content)}</p>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm theme-text-muted">
                    <div className="flex items-center space-x-2">
                      {getAvatarUrl(post.avatar) ? (
                        <img
                          src={getAvatarUrl(post.avatar)}
                          alt={post.username}
                          className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-runeterra-gold theme-avatar-bg object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border border-runeterra-gold theme-avatar-bg flex items-center justify-center text-runeterra-gold text-xs font-bold ${getAvatarUrl(post.avatar) ? 'hidden' : ''}`}>
                        {post.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-runeterra-gold">{post.username || '匿名用户'}</span>
                      {post.user_title && (
                        <span className="text-xs bg-runeterra-purple/30 text-runeterra-purple px-1 py-0.5 rounded hidden sm:inline">
                          {post.user_title}
                        </span>
                      )}
                      {post.identity && (
                        <span className="text-xs bg-runeterra-blue/30 text-runeterra-blue px-1 py-0.5 rounded hidden sm:inline">
                          {post.identity}
                        </span>
                      )}
                      <span className="text-xs text-runeterra-gold">{post.rank || '坚韧黑铁'}</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">{formatRuneterraTime(post.created_at, post.custom_time)}</span>
                    {post.region && <><span className="hidden sm:inline">•</span><span className="whitespace-nowrap">📍 {post.region}</span></>}
                    <span className="hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">💬 {post.replies_count || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;

