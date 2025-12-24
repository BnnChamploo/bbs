import { useState, useRef } from 'react';
import api from '../utils/api';
import { clearPostsData, getDataStats } from '../utils/localStorage';
import { getAvatarUrl } from '../utils/avatar';
import AvatarImage from '../components/AvatarImage';

const Profile = ({ user, onUpdate }) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [avatarPreview, setAvatarPreview] = useState(null); // 头像预览（base64）
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dataStats, setDataStats] = useState(getDataStats());
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const updateData = {};
    if (username !== user.username) {
      updateData.username = username;
    }

    const file = fileInputRef.current?.files[0];
    if (file) {
      // 在纯前端模式下，将头像转换为 base64
      try {
        const base64Avatar = await new Promise((resolve, reject) => {
          // 检查文件大小（限制 5MB）
          if (file.size > 5 * 1024 * 1024) {
            reject(new Error('头像大小不能超过 5MB'));
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error('读取文件失败'));
          reader.readAsDataURL(file);
        });
        
        updateData.avatar = base64Avatar;
      } catch (err) {
        setError(err.message || '头像处理失败');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await api.put('/user', updateData);
      onUpdate(response.data);
      setSuccess('更新成功！');
      if (updateData.avatar) {
        setAvatar(response.data.avatar);
        setAvatarPreview(null); // 清除预览
        // 重置文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || '更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-4 py-4 md:py-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-runeterra-gold mb-4 md:mb-6">个人资料</h1>

      <div className="theme-card rounded-lg p-4 md:p-6 lg:p-8 border border-runeterra-gold/20">
        {error && (
          <div className="mb-4 p-3 theme-alert-error rounded border">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 theme-alert-success rounded border">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={username}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-runeterra-gold theme-avatar-bg object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : (
                <AvatarImage
                  avatar={avatar}
                  alt={username}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-runeterra-gold theme-avatar-bg object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              )}
              <div className={`absolute inset-0 w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-runeterra-gold theme-avatar-bg flex items-center justify-center text-runeterra-gold text-xl md:text-2xl font-bold ${(avatarPreview || getAvatarUrl(avatar)) ? 'hidden' : ''}`}>
                {username?.[0]?.toUpperCase() || '?'}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-runeterra-gold text-runeterra-dark rounded-full p-1.5 md:p-2 hover:bg-yellow-600 transition-colors text-sm md:text-base"
              >
                📷
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    const file = e.target.files[0];
                    // 检查文件大小
                    if (file.size > 5 * 1024 * 1024) {
                      setError('头像大小不能超过 5MB');
                      e.target.value = '';
                      return;
                    }
                    // 预览头像
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setAvatarPreview(event.target.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl md:text-2xl font-bold theme-text-primary mb-2">{username}</h2>
              {user.rank && (
                <div className="flex items-center justify-center sm:justify-start space-x-4">
                  <span className="px-2 md:px-3 py-1 bg-runeterra-blue text-white rounded text-xs md:text-sm">
                    {user.rank}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block theme-label mb-2 font-medium text-sm md:text-base">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 theme-input rounded-md text-sm md:text-base"
              required
            />
            <p className="mt-1 text-xs md:text-sm theme-text-muted">可以是英雄名字或符文大陆居民的名字</p>
          </div>
          <div>
            <label className="block theme-label mb-2 font-medium text-sm md:text-base">段位/外号</label>
            <input
              type="text"
              value={user.rank || ''}
              onChange={(e) => {
                const updated = { ...user, rank: e.target.value };
                onUpdate(updated);
              }}
              placeholder={user.identity === '英雄' ? '如：九尾妖狐、暗裔剑魔等' : '如：最强王者、璀璨钻石等'}
              className="w-full px-3 md:px-4 py-2 md:py-3 theme-input rounded-md text-sm md:text-base"
            />
            <p className="mt-1 text-xs md:text-sm theme-text-muted">
              {user.identity === '英雄' ? '英雄的外号（如：阿狸的外号是九尾妖狐）' : '召唤师的段位（如：最强王者、璀璨钻石等）'}
            </p>
          </div>

          <div>
            <label className="block theme-label mb-2 font-medium text-sm md:text-base">头像</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="w-full px-3 md:px-4 py-2 md:py-3 theme-input rounded-md file:mr-2 md:file:mr-4 file:py-1 md:file:py-2 file:px-2 md:file:px-4 file:rounded-md file:border-0 file:text-xs md:file:text-sm file:font-semibold file:bg-runeterra-gold hover:file:bg-yellow-600 text-sm md:text-base"
            />
            <p className="mt-1 text-xs md:text-sm theme-text-muted">支持 jpg, png, gif, webp 格式，最大 5MB</p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-runeterra-gold/20">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-runeterra-gold">{user.posts_count || 0}</div>
              <div className="text-xs md:text-sm theme-text-secondary">发帖数</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 md:py-3 bg-runeterra-gold text-runeterra-dark rounded-md hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 text-sm md:text-base"
          >
            {loading ? '保存中...' : '保存更改'}
          </button>
        </form>

        {/* 数据管理区域 */}
        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-runeterra-gold/20">
          <h3 className="text-base md:text-lg font-bold theme-text-primary mb-3 md:mb-4">数据管理</h3>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
            <div className="text-xs md:text-sm theme-text-secondary mb-2">当前数据统计：</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <div className="font-semibold text-runeterra-gold">{dataStats.posts}</div>
                <div className="theme-text-muted">帖子</div>
              </div>
              <div>
                <div className="font-semibold text-runeterra-gold">{dataStats.replies}</div>
                <div className="theme-text-muted">回复</div>
              </div>
              <div>
                <div className="font-semibold text-runeterra-gold">{dataStats.users}</div>
                <div className="theme-text-muted">用户</div>
              </div>
              <div>
                <div className="font-semibold text-runeterra-gold">{dataStats.likes}</div>
                <div className="theme-text-muted">点赞</div>
              </div>
            </div>
          </div>

          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full py-2 md:py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm md:text-base"
            >
              🗑️ 一键清除所有数据
            </button>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-3 md:p-4">
              <div className="text-red-800 dark:text-red-200 font-semibold mb-2 text-sm md:text-base">
                ⚠️ 警告：此操作不可恢复！
              </div>
              <div className="text-xs md:text-sm text-red-700 dark:text-red-300 mb-3 md:mb-4">
                清除后，所有帖子、回复、点赞数据将被永久删除，但用户数据会保留。此操作仅清除本地数据，不会影响其他用户。
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    clearPostsData();
                    setDataStats(getDataStats());
                    setShowClearConfirm(false);
                    setSuccess('帖子数据已清除！用户数据已保留。');
                    // 退出登录，让用户重新登录
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // 刷新页面
                    setTimeout(() => {
                      window.location.href = '/';
                    }, 1500);
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm md:text-base"
                >
                  确认清除
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium text-sm md:text-base"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

