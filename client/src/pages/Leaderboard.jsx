import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { getAvatarUrl } from '../utils/avatar';
import AvatarImage from '../components/AvatarImage';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/leaderboard');
      setUsers(response.data);
    } catch (error) {
      console.error('获取排行榜失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-runeterra-gold">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-runeterra-gold mb-6">排行榜</h1>
      <p className="theme-text-secondary mb-6">根据发帖数排名，活跃度越高排名越靠前</p>

      <div className="theme-card rounded-lg border border-runeterra-gold/20 overflow-hidden">
        <div className="divide-y divide-gray-700">
          {users.map((user, index) => (
            <div
              key={user.id}
              className={`p-4 theme-card-hover transition-colors ${
                index < 3 ? 'bg-runeterra-gold/10' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 text-center text-2xl font-bold text-runeterra-gold">
                  {getRankIcon(index)}
                </div>
                <div className="relative w-12 h-12">
                  <AvatarImage
                    avatar={user.avatar}
                    alt={user.username}
                    className="w-12 h-12 rounded-full border-2 border-runeterra-gold theme-avatar-bg object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className={`absolute inset-0 w-12 h-12 rounded-full border-2 border-runeterra-gold theme-avatar-bg flex items-center justify-center text-runeterra-gold text-sm font-bold ${getAvatarUrl(user.avatar) ? 'hidden' : ''}`}>
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/profile`}
                      className="text-runeterra-gold font-medium hover:underline"
                    >
                      {user.username}
                    </Link>
                    {user.rank && (
                      <span className="px-2 py-1 bg-runeterra-blue text-white rounded text-xs">
                        {user.rank}
                      </span>
                    )}
                  </div>
                  <div className="text-sm theme-text-secondary mt-1">
                    发帖数: {user.posts_count || 0}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-runeterra-gold font-bold">{user.posts_count || 0}</div>
                  <div className="text-sm theme-text-secondary">发帖数</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

