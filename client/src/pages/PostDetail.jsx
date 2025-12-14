import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../utils/api';
import { formatRuneterraTime } from '../utils/runeterraTime';
import { getAvatarUrl } from '../utils/avatar';
import { getImageUrl } from '../utils/image';

// 可拖拽的回复项组件
const SortableReplyItem = ({ reply, index, isEditMode, onEdit, onDelete, users, regions }) => {
  const replyQuillRef = useRef(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: reply.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // ReactQuill 模块配置
  const replyQuillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: async function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();
          input.onchange = async () => {
            const file = input.files[0];
            if (file) {
              const formData = new FormData();
              formData.append('images', file);
              try {
                const response = await api.post('/upload-image', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                const imageUrl = `http://localhost:3001/uploads/${response.data.images[0]}`;
                const quill = replyQuillRef.current?.getEditor();
                if (quill) {
                  const range = quill.getSelection(true);
                  quill.insertEmbed(range.index, 'image', imageUrl);
                  quill.setSelection(range.index + 1);
                }
              } catch (error) {
                console.error('上传图片失败:', error);
                alert('图片上传失败');
              }
            }
          };
        }
      }
    }
  }), []);

  if (isEditMode) {
    return (
      <div ref={setNodeRef} style={style} className="border-b border-gray-700 pb-4 mb-4 last:border-0">
        <div className="theme-card p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <button
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing theme-text-secondary hover:theme-text-primary"
                >
                  ⋮⋮
                </button>
                <span className="text-sm theme-text-secondary">楼层</span>
                <input
                  type="number"
                  value={reply.floor_number || index + 1}
                  onChange={(e) => onEdit(reply.id, { floor_number: parseInt(e.target.value) || null })}
                  className="w-16 px-2 py-1 theme-input rounded text-sm"
                  min="1"
                />
              </div>
              <button
                onClick={() => onDelete(reply.id)}
                className="px-3 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md text-sm transition-colors"
              >
                删除
              </button>
            </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-xs theme-text-secondary mb-1">回复人</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 mb-1">
                  <input
                    type="checkbox"
                    checked={!!reply.custom_username}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onEdit(reply.id, { custom_username: reply.username || '', user_id: null });
                      } else {
                        onEdit(reply.id, { custom_username: null, user_id: reply.user_id || null });
                      }
                    }}
                    className="w-3 h-3"
                  />
                  <span className="text-xs theme-text-secondary">自定义名称</span>
                </label>
                {reply.custom_username !== undefined && reply.custom_username !== null ? (
                  <input
                    type="text"
                    value={reply.custom_username || ''}
                    onChange={(e) => onEdit(reply.id, { custom_username: e.target.value, user_id: null })}
                    placeholder="输入回复人名称"
                    className="w-full px-2 py-1 theme-input rounded text-sm"
                  />
                ) : (
                  <select
                    value={reply.user_id || ''}
                    onChange={(e) => onEdit(reply.id, { user_id: parseInt(e.target.value) || null, custom_username: null })}
                    className="w-full px-2 py-1 theme-input rounded text-sm"
                  >
                    <option value="">匿名</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs theme-text-secondary mb-1">匿名</label>
              <input
                type="checkbox"
                checked={reply.is_anonymous === 1}
                onChange={(e) => {
                  const isAnonymous = e.target.checked;
                  onEdit(reply.id, { 
                    is_anonymous: isAnonymous ? 1 : 0,
                    // 如果勾选匿名，清空头衔和身份
                    user_title: isAnonymous ? '' : reply.user_title,
                    user_identity: isAnonymous ? '' : reply.user_identity
                  });
                }}
                className="mt-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">时间</label>
              <input
                type="text"
                value={reply.custom_time || ''}
                onChange={(e) => onEdit(reply.id, { custom_time: e.target.value })}
                placeholder="瓦罗兰新历时间"
                className="w-full px-2 py-1 theme-input rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">地区</label>
              <select
                value={reply.region || ''}
                onChange={(e) => onEdit(reply.id, { region: e.target.value })}
                className="w-full px-2 py-1 theme-input rounded text-sm"
              >
                <option value="">选择地区</option>
                {regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">头衔</label>
              <input
                type="text"
                value={reply.user_title || ''}
                onChange={(e) => onEdit(reply.id, { user_title: e.target.value })}
                placeholder="如：九尾妖狐"
                className="w-full px-2 py-1 theme-input rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">身份</label>
              <input
                type="text"
                value={reply.user_identity || ''}
                onChange={(e) => onEdit(reply.id, { user_identity: e.target.value })}
                placeholder="如：版主"
                className="w-full px-2 py-1 theme-input rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">段位/外号</label>
              <input
                type="text"
                value={reply.user_rank || ''}
                onChange={(e) => onEdit(reply.id, { user_rank: e.target.value })}
                placeholder="如：最强王者或九尾妖狐"
                className="w-full px-2 py-1 theme-input rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">楼层数</label>
              <input
                type="number"
                value={reply.floor_number || ''}
                onChange={(e) => onEdit(reply.id, { floor_number: parseInt(e.target.value) || null })}
                placeholder="留空则自动计数"
                className="w-full px-2 py-1 theme-input rounded text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">收藏数</label>
              <input
                type="number"
                value={reply.likes || 0}
                onChange={(e) => onEdit(reply.id, { likes: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 theme-input rounded text-sm"
                min="0"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="block text-xs theme-text-secondary mb-1">内容</label>
            <div className="theme-input rounded">
              <ReactQuill
                ref={replyQuillRef}
                theme="snow"
                value={reply.content || ''}
                onChange={(content) => onEdit(reply.id, { content })}
                modules={replyQuillModules}
                formats={[
                  'header',
                  'bold', 'italic', 'underline', 'strike',
                  'list', 'bullet',
                  'link', 'image'
                ]}
                className="theme-quill"
                style={{ minHeight: '150px' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="border-b border-gray-700 pb-3 md:pb-4 mb-3 md:mb-4 last:border-0">
      <div className="flex items-start space-x-2 md:space-x-3">
        <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
          {getAvatarUrl(reply.avatar) ? (
            <img
              src={getAvatarUrl(reply.avatar)}
              alt={reply.username}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-runeterra-gold theme-avatar-bg object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`absolute inset-0 w-8 h-8 md:w-10 md:h-10 rounded-full border border-runeterra-gold theme-avatar-bg flex items-center justify-center text-runeterra-gold text-xs md:text-sm font-bold ${getAvatarUrl(reply.avatar) ? 'hidden' : ''}`}>
            {reply.username?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1 md:gap-2 mb-1">
            <span className="text-xs md:text-sm theme-text-muted">#{reply.floor_number || index + 1}</span>
            <span className="text-xs md:text-sm text-runeterra-gold font-medium">{reply.username || '匿名用户'}</span>
            {reply.user_title && (
              <span className="text-xs bg-runeterra-purple/30 text-runeterra-purple px-1 md:px-2 py-0.5 md:py-1 rounded">
                {reply.user_title}
              </span>
            )}
            {reply.user_identity && (
              <span className="text-xs bg-runeterra-blue/30 text-runeterra-blue px-1 md:px-2 py-0.5 md:py-1 rounded">
                {reply.user_identity}
              </span>
            )}
            <span className="text-xs text-runeterra-gold">{reply.rank || '坚韧黑铁'}</span>
            <span className="theme-text-secondary hidden sm:inline">|</span>
            <span className="text-xs md:text-sm text-gray-400 whitespace-nowrap">发布于{formatRuneterraTime(reply.created_at, reply.custom_time)}</span>
            {reply.region && <><span className="text-gray-400 hidden sm:inline"> | </span><span className="text-xs md:text-sm text-gray-400 whitespace-nowrap">来自 {reply.region}</span></>}
            {isEditMode && (
              <>
                <span className="text-gray-400 hidden sm:inline"> | </span>
                <input
                  type="number"
                  value={reply.likes || 0}
                  onChange={(e) => onEdit(reply.id, { likes: parseInt(e.target.value) || 0 })}
                  className="w-12 md:w-16 px-1 md:px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs md:text-sm"
                  min="0"
                />
                <span className="text-xs text-gray-500 hidden sm:inline">点赞</span>
              </>
            )}
            {!isEditMode && (
              <>
                <span className="text-gray-400 hidden sm:inline"> | </span>
                <span className="text-xs md:text-sm text-gray-400 whitespace-nowrap">点赞({reply.likes || 0})</span>
              </>
            )}
          </div>
          <div className="theme-text-primary mb-2 text-sm md:text-base" dangerouslySetInnerHTML={{ __html: reply.content }} />
          {reply.images && reply.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {reply.images.map((img, idx) => {
                const imageUrl = getImageUrl(img);
                return imageUrl ? (
                  <img
                    key={idx}
                    src={imageUrl}
                    alt={`回复图片${idx + 1}`}
                    className="max-w-full sm:max-w-xs rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PostDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [users, setUsers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editingReplies, setEditingReplies] = useState([]);
  const postQuillRef = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const editMode = localStorage.getItem('editMode') === 'true';
    setIsEditMode(editMode);
    fetchPost();
    fetchReplies();
    fetchUsers();
    fetchRegions();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data);
      setEditingPost(response.data);
    } catch (error) {
      console.error('获取帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await api.get(`/posts/${id}/replies`);
      setReplies(response.data);
      setEditingReplies(response.data);
    } catch (error) {
      console.error('获取回复失败:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions');
      setRegions(response.data);
    } catch (error) {
      console.error('获取地区列表失败:', error);
    }
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

  const [categoryMap, setCategoryMap] = useState({});

  useEffect(() => {
    // 使用 api.get 而不是 fetch，以支持纯前端模式
    api.get('/categories/all')
      .then(res => {
        const data = res.data;
        const map = {};
        Object.keys(data).forEach(key => {
          map[key] = data[key].name;
        });
        setCategoryMap(map);
      })
      .catch(err => {
        console.error('获取板块名称失败:', err);
        // 如果 API 失败，使用静态数据作为后备
        const { CATEGORIES } = require('../data/categories');
        const map = {};
        Object.keys(CATEGORIES).forEach(key => {
          map[key] = CATEGORIES[key].name;
        });
        setCategoryMap(map);
      });
  }, []);

  const getCategoryName = (category) => {
    return categoryMap[category] || category;
  };

  // 帖子编辑的 ReactQuill 模块配置
  const postQuillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: async function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();
          input.onchange = async () => {
            const file = input.files[0];
            if (file) {
              const formData = new FormData();
              formData.append('images', file);
              try {
                const response = await api.post('/upload-image', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                // 在纯前端模式下，返回的是 base64，直接使用
                const imageUrl = response.data.images[0];
                const quill = postQuillRef.current?.getEditor();
                if (quill) {
                  const range = quill.getSelection(true);
                  quill.insertEmbed(range.index, 'image', imageUrl);
                  quill.setSelection(range.index + 1);
                }
              } catch (error) {
                console.error('上传图片失败:', error);
                alert('图片上传失败');
              }
            }
          };
        }
      }
    }
  }), []);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = editingReplies.findIndex(r => r.id === active.id);
    const newIndex = editingReplies.findIndex(r => r.id === over.id);
    const newReplies = arrayMove(editingReplies, oldIndex, newIndex);
    
    // 更新排序
    const replyOrders = newReplies.map((reply, idx) => ({
      id: reply.id,
      sort_order: idx
    }));

    try {
      await api.put(`/posts/${id}/replies/order`, { replyOrders });
      setEditingReplies(newReplies);
    } catch (error) {
      console.error('更新排序失败:', error);
    }
  };

  const handleReplyEdit = (replyId, updates) => {
    const updated = editingReplies.map(r => 
      r.id === replyId ? { ...r, ...updates } : r
    );
    setEditingReplies(updated);
  };

  const handleReplyUpdate = async (replyId) => {
    const reply = editingReplies.find(r => r.id === replyId);
    if (!reply) return;
    
    try {
      await api.put(`/replies/${replyId}`, reply);
      fetchReplies();
    } catch (error) {
      console.error('更新回复失败:', error);
      alert('更新失败，请重试');
    }
  };

  const handleReplyDelete = async (replyId) => {
    if (!confirm('确定删除这条回复吗？')) return;
    try {
      await api.delete(`/replies/${replyId}`);
      setEditingReplies(editingReplies.filter(r => r.id !== replyId));
      fetchReplies();
    } catch (error) {
      console.error('删除回复失败:', error);
    }
  };

  const handlePostUpdate = async () => {
    try {
      // 如果选择了用户ID，但该用户可能不存在，尝试从用户列表中获取用户名
      let postData = { ...editingPost };
      if (postData.user_id && !postData.custom_username) {
        const selectedUser = users.find(u => u.id === postData.user_id);
        if (!selectedUser && postData._selected_username) {
          // 用户不存在，但保存了用户名，使用用户名作为自定义用户名
          postData.custom_username = postData._selected_username;
          postData.user_id = null;
        }
      }
      // 移除临时字段
      delete postData._selected_username;
      
      await api.put(`/posts/${id}`, postData);
      // 重新获取帖子数据以显示正确的用户名等信息
      await fetchPost();
      alert('帖子更新成功！');
    } catch (error) {
      console.error('更新帖子失败:', error);
      alert('更新失败，请重试');
    }
  };


  const handleSaveAll = async () => {
    try {
      // 如果选择了用户ID，但该用户可能不存在，尝试从用户列表中获取用户名
      let postData = { ...editingPost };
      if (postData.user_id && !postData.custom_username) {
        const selectedUser = users.find(u => u.id === postData.user_id);
        if (!selectedUser && postData._selected_username) {
          // 用户不存在，但保存了用户名，使用用户名作为自定义用户名
          postData.custom_username = postData._selected_username;
          postData.user_id = null;
        }
      }
      // 移除临时字段
      delete postData._selected_username;
      
      // 保存帖子
      await api.put(`/posts/${id}`, postData);
      
      // 保存所有回复
      for (const reply of editingReplies) {
        await api.put(`/replies/${reply.id}`, reply);
      }
      
      // 更新排序
      const replyOrders = editingReplies.map((reply, idx) => ({
        id: reply.id,
        sort_order: idx
      }));
      await api.put(`/posts/${id}/replies/order`, { replyOrders });
      
      // 重新获取帖子数据以显示正确的用户名和回复数等信息
      await fetchPost();
      await fetchReplies();
      alert('所有更改已保存！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-runeterra-gold">加载中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-runeterra-gold">帖子不存在</div>
      </div>
    );
  }

  const displayReplies = isEditMode ? editingReplies : replies;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-4 py-4 md:py-8">
      <Link to="/" className="inline-block mb-3 md:mb-4 text-runeterra-gold hover:underline text-sm md:text-base">
        ← 返回首页
      </Link>

      {isEditMode && (
        <div className="mb-3 md:mb-4 p-3 md:p-4 bg-runeterra-purple/20 border border-runeterra-purple rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-runeterra-purple font-bold text-sm md:text-base">编辑模式</span>
            <button
              onClick={handleSaveAll}
              className="px-3 md:px-4 py-2 bg-runeterra-gold text-runeterra-dark rounded-md hover:bg-yellow-600 transition-colors font-medium text-sm md:text-base w-full sm:w-auto"
            >
              保存所有更改
            </button>
          </div>
        </div>
      )}

      <article className="theme-card rounded-lg p-4 md:p-6 lg:p-8 border border-runeterra-gold/20 mb-4 md:mb-6">
        {isEditMode ? (
          <div className="space-y-4">
            <div>
              <label className="block theme-label mb-2 font-medium">标题</label>
              <input
                type="text"
                value={editingPost?.title || ''}
                onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                className="w-full px-4 py-2 theme-input rounded-md"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block theme-label mb-2 font-medium text-sm md:text-base">发帖人</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 mb-1">
                    <input
                      type="checkbox"
                      checked={!!editingPost.custom_username}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingPost({ ...editingPost, custom_username: editingPost.username || '', user_id: null });
                        } else {
                          setEditingPost({ ...editingPost, custom_username: null, user_id: editingPost.user_id || null });
                        }
                      }}
                      className="w-3 h-3"
                    />
                    <span className="text-xs theme-text-secondary">自定义名称</span>
                  </label>
                  {editingPost.custom_username !== undefined && editingPost.custom_username !== null ? (
                    <input
                      type="text"
                      value={editingPost.custom_username || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, custom_username: e.target.value, user_id: null })}
                      placeholder="输入发帖人名称"
                      className="w-full px-3 md:px-4 py-2 theme-input rounded-md text-sm md:text-base"
                    />
                  ) : (
                    <select
                      value={editingPost.user_id || ''}
                      onChange={(e) => {
                        const selectedUserId = e.target.value || null;
                        const selectedUser = selectedUserId ? users.find(u => String(u.id) === String(selectedUserId)) : null;
                        setEditingPost({ 
                          ...editingPost, 
                          user_id: selectedUserId, // 保持原始类型（字符串或数字）
                          custom_username: null,
                          // 保存用户名，以便在保存时如果找不到用户可以使用
                          _selected_username: selectedUser?.username || null
                        });
                      }}
                      className="w-full px-3 md:px-4 py-2 theme-input rounded-md text-sm md:text-base"
                    >
                      <option value="">匿名</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="block theme-label mb-2 font-medium text-sm md:text-base">匿名</label>
                <input
                  type="checkbox"
                  checked={editingPost.is_anonymous === 1 || editingPost.is_anonymous === true}
                  onChange={(e) => setEditingPost({ ...editingPost, is_anonymous: e.target.checked ? 1 : 0 })}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="block theme-label mb-2 font-medium">时间</label>
                <input
                  type="text"
                  value={editingPost.custom_time || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, custom_time: e.target.value })}
                  placeholder="瓦罗兰历时间（格式：YYYY-MM-DD HH:mm）"
                  className="w-full px-4 py-2 theme-input rounded-md"
                />
              </div>
              <div>
                <label className="block theme-label mb-2 font-medium">地区</label>
                <select
                  value={editingPost.region || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, region: e.target.value })}
                  className="w-full px-4 py-2 theme-input rounded-md"
                >
                  <option value="">选择地区</option>
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block theme-label mb-2 font-medium">头衔</label>
                <input
                  type="text"
                  value={editingPost.user_title || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, user_title: e.target.value })}
                  placeholder="如：九尾妖狐"
                  className="w-full px-4 py-2 theme-input rounded-md"
                />
              </div>
              <div>
                <label className="block theme-label mb-2 font-medium">身份</label>
                <input
                  type="text"
                  value={editingPost.user_identity || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, user_identity: e.target.value })}
                  placeholder="如：版主"
                  className="w-full px-4 py-2 theme-input rounded-md"
                />
              </div>
              <div>
                <label className="block theme-label mb-2 font-medium">段位/外号</label>
                <input
                  type="text"
                  value={editingPost.user_rank || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, user_rank: e.target.value })}
                  placeholder="如：最强王者（召唤师）或九尾妖狐（英雄外号）"
                  className="w-full px-4 py-2 theme-input rounded-md"
                />
              </div>
              <div>
                <label className="block theme-label mb-2 font-medium">浏览量</label>
                <input
                  type="number"
                  value={editingPost.views || 0}
                  onChange={(e) => setEditingPost({ ...editingPost, views: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 theme-input rounded-md"
                />
              </div>
              <div>
                <label className="block theme-label mb-2 font-medium">收藏数</label>
                <input
                  type="number"
                  value={editingPost.likes || 0}
                  onChange={(e) => setEditingPost({ ...editingPost, likes: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 theme-input rounded-md"
                />
              </div>
              <div>
                <label className="block theme-label mb-2 font-medium">回复数</label>
                <input
                  type="number"
                  value={editingPost.custom_replies_count !== undefined && editingPost.custom_replies_count !== null ? editingPost.custom_replies_count : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditingPost({ 
                      ...editingPost, 
                      custom_replies_count: value === '' ? null : parseInt(value) || 0 
                    });
                  }}
                  placeholder="留空则使用实际回复数"
                  className="w-full px-4 py-2 theme-input rounded-md"
                  min="0"
                />
              </div>
              <div>
                <label className="block theme-label mb-2 font-medium">置顶</label>
                <input
                  type="checkbox"
                  checked={editingPost.is_pinned === 1}
                  onChange={(e) => setEditingPost({ ...editingPost, is_pinned: e.target.checked ? 1 : 0 })}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <label className="block theme-label mb-2 font-medium">内容</label>
              <div className="theme-input rounded-md">
                <ReactQuill
                  ref={postQuillRef}
                  theme="snow"
                  value={editingPost?.content || ''}
                  onChange={(content) => setEditingPost({ ...editingPost, content })}
                  modules={postQuillModules}
                  formats={[
                    'header',
                    'bold', 'italic', 'underline', 'strike',
                    'list', 'bullet',
                    'link', 'image'
                  ]}
                  className="theme-quill"
                />
              </div>
            </div>
            <button
              onClick={handlePostUpdate}
              className="px-4 py-2 bg-runeterra-gold text-runeterra-dark rounded-md hover:bg-yellow-600 transition-colors"
            >
              保存帖子更改
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-4">
              <span className={`px-3 py-1 rounded text-sm ${getCategoryColor(post.category)}`}>
                {getCategoryName(post.category)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold theme-text-primary mb-3 md:mb-4">{post.title}</h1>
            <div className="flex items-center flex-wrap gap-2 mb-3 md:mb-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <div className="relative w-6 h-6 md:w-8 md:h-8">
                  {getAvatarUrl(post.avatar) ? (
                    <img
                      src={getAvatarUrl(post.avatar)}
                      alt={post.username}
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-runeterra-gold bg-gray-700 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 w-6 h-6 md:w-8 md:h-8 rounded-full border border-runeterra-gold bg-gray-700 flex items-center justify-center text-runeterra-gold text-xs font-bold ${getAvatarUrl(post.avatar) ? 'hidden' : ''}`}>
                    {post.username?.[0]?.toUpperCase() || '?'}
                  </div>
                </div>
                <span className="text-runeterra-gold">{post.username || '匿名用户'}</span>
                {post.user_title && (
                  <span className="text-xs bg-runeterra-purple/30 text-runeterra-purple px-1 md:px-2 py-0.5 md:py-1 rounded">
                    {post.user_title}
                  </span>
                )}
                {post.user_identity && (
                  <span className="text-xs bg-runeterra-blue/30 text-runeterra-blue px-1 md:px-2 py-0.5 md:py-1 rounded">
                    {post.user_identity}
                  </span>
                )}
                <span className="text-xs text-runeterra-gold">{post.rank || '坚韧黑铁'}</span>
              </div>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <span className="text-gray-400 whitespace-nowrap">发布于{formatRuneterraTime(post.created_at, post.custom_time)}</span>
              {post.region && <><span className="text-gray-400 hidden sm:inline"> | </span><span className="text-gray-400 whitespace-nowrap">来自 {post.region}</span></>}
              <span className="text-gray-400 hidden sm:inline"> | </span>
              <span className="text-gray-400 whitespace-nowrap">浏览量({post.views || 0})</span>
              <span className="text-gray-400 hidden sm:inline"> | </span>
              <span className="text-gray-400 whitespace-nowrap">评论({post.replies_count !== undefined ? post.replies_count : replies.length})</span>
              <span className="text-gray-400 hidden sm:inline"> | </span>
              <span className="text-gray-400 whitespace-nowrap">收藏({post.likes || 0})</span>
            </div>
            <div className="prose prose-invert max-w-none mb-6">
              <div className="theme-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
            {post.images && post.images.length > 0 && (
              <div className="flex flex-wrap gap-2 md:gap-4 mb-4 md:mb-6">
                {post.images.map((img, idx) => {
                  const imageUrl = getImageUrl(img);
                  return imageUrl ? (
                    <img
                      key={idx}
                      src={imageUrl}
                      alt={`帖子图片${idx + 1}`}
                      className="max-w-full sm:max-w-md rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : null;
                })}
              </div>
            )}
          </>
        )}
      </article>

      <div className="theme-card rounded-lg p-4 md:p-6 border border-runeterra-gold/20 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-runeterra-gold mb-3 md:mb-4">
          回复 ({displayReplies.length})
        </h2>

        {displayReplies.length === 0 ? (
          <p className="theme-text-secondary text-center py-3 md:py-4 text-sm md:text-base">暂无回复</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            enabled={isEditMode}
          >
            <SortableContext
              items={displayReplies.map(r => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 md:space-y-4">
                {displayReplies.map((reply, index) => (
                  <SortableReplyItem
                    key={reply.id}
                    reply={reply}
                    index={index}
                    isEditMode={isEditMode}
                    onEdit={handleReplyEdit}
                    onDelete={handleReplyDelete}
                    users={users}
                    regions={regions}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {!isEditMode && user && (
        <ReplyForm
          postId={id}
          user={user}
          users={users}
          regions={regions}
          replies={replies}
          onReply={fetchReplies}
        />
      )}

      {user && (
        <div className="mt-3 md:mt-4">
          <button
            onClick={async () => {
              if (!confirm('确定要删除这个帖子吗？此操作不可恢复！')) return;
              try {
                await api.delete(`/posts/${id}`);
                alert('帖子已删除');
                navigate('/');
              } catch (error) {
                console.error('删除帖子失败:', error);
                alert('删除失败，请重试');
              }
            }}
            className="px-3 md:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm md:text-base w-full sm:w-auto"
          >
            删除帖子
          </button>
        </div>
      )}
    </div>
  );
};

// 回复表单组件
const ReplyForm = ({ postId, user, users, regions, replies, onReply }) => {
  const quillRef = useRef(null);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [customTimeYear, setCustomTimeYear] = useState('');
  const [customTimeMonth, setCustomTimeMonth] = useState('');
  const [customTimeDay, setCustomTimeDay] = useState('');
  const [customTimeHour, setCustomTimeHour] = useState('');
  const [customTimeMinute, setCustomTimeMinute] = useState('');
  const [region, setRegion] = useState('');
  const [userTitle, setUserTitle] = useState('');
  const [userIdentity, setUserIdentity] = useState('');
  const [userRank, setUserRank] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
  const [customUsername, setCustomUsername] = useState(''); // 自定义回复人名称
  const [useCustomUsername, setUseCustomUsername] = useState(false); // 是否使用自定义用户名
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 当选择用户改变时，自动填充该用户在该帖子中的最后一次回复的值
  useEffect(() => {
    // 如果是匿名回复，不自动填充
    if (isAnonymous) {
      return;
    }

    let userReplies = [];

    if (useCustomUsername && customUsername.trim()) {
      // 如果使用自定义用户名，查找该自定义用户名的回复
      userReplies = replies
        .filter(reply => {
          // 匹配自定义用户名（通过 username 字段或 custom_username 字段）
          const replyUsername = reply.custom_username || reply.username;
          return replyUsername && replyUsername === customUsername.trim();
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // 按时间降序
    } else if (selectedUserId) {
      // 如果使用用户ID，查找该用户ID的回复
      userReplies = replies
        .filter(reply => {
          // 匹配用户ID
          if (reply.user_id && reply.user_id.toString() === selectedUserId.toString()) {
            return true;
          }
          return false;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // 按时间降序
    } else {
      return;
    }

    if (userReplies.length > 0) {
      const lastReply = userReplies[0];
      
      // 填充表单字段
      if (lastReply.user_identity) {
        setUserIdentity(lastReply.user_identity);
      }
      if (lastReply.user_title) {
        setUserTitle(lastReply.user_title);
      }
      if (lastReply.region) {
        setRegion(lastReply.region);
      }
      if (lastReply.user_rank) {
        setUserRank(lastReply.user_rank);
      }
      
      // 解析时间字符串，填充到年月日时分字段
      if (lastReply.custom_time) {
        const timeStr = lastReply.custom_time;
        // 格式可能是：YY-MM-DD HH:mm 或 YYYY-MM-DD HH:mm
        const timeMatch = timeStr.match(/(\d{2,4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})/);
        if (timeMatch) {
          setCustomTimeYear(timeMatch[1]);
          setCustomTimeMonth(timeMatch[2]);
          setCustomTimeDay(timeMatch[3]);
          setCustomTimeHour(timeMatch[4]);
          setCustomTimeMinute(timeMatch[5]);
        } else {
          // 如果格式不匹配，直接设置到 customTime
          setCustomTime(timeStr);
        }
      }
    }
  }, [selectedUserId, useCustomUsername, customUsername, isAnonymous, replies]);

  // 使用 useMemo 优化 ReactQuill 模块配置，减少 findDOMNode 警告
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: async function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();
          input.onchange = async () => {
            const file = input.files[0];
            if (file) {
              setUploading(true);
              const formData = new FormData();
              formData.append('images', file);
              try {
                const response = await api.post('/upload-image', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                // 在纯前端模式下，返回的是 base64，直接使用
                const imageUrl = response.data.images[0];
                const quill = quillRef.current?.getEditor();
                if (quill) {
                  const range = quill.getSelection(true);
                  quill.insertEmbed(range.index, 'image', imageUrl);
                  quill.setSelection(range.index + 1);
                }
              } catch (error) {
                console.error('上传图片失败:', error);
                alert('图片上传失败');
              } finally {
                setUploading(false);
              }
            }
          };
        }
      }
    }
  }), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      // 格式化时间：如果输入了年月日时分，自动生成 YY-MM-DD HH:mm 或 YYYY-MM-DD HH:mm 格式
      let formattedTime = customTime || null;
      if (customTimeYear) {
        // 年份格式化：1-9年显示为01-09，10年以上显示原样
        const yearNum = parseInt(customTimeYear);
        const year = yearNum < 10 ? String(yearNum).padStart(2, '0') : String(customTimeYear);
        const month = customTimeMonth ? String(customTimeMonth).padStart(2, '0') : '01';
        const day = customTimeDay ? String(customTimeDay).padStart(2, '0') : '01';
        const hour = customTimeHour ? String(customTimeHour).padStart(2, '0') : '00';
        const minute = customTimeMinute ? String(customTimeMinute).padStart(2, '0') : '00';
        formattedTime = `${year}-${month}-${day} ${hour}:${minute}`;
      }
      
      // 确定回复人：如果使用自定义用户名，传递用户名；否则传递用户ID
      let replyUserId = null;
      let replyUsername = null;
      if (!isAnonymous) {
        if (useCustomUsername && customUsername.trim()) {
          // 使用自定义用户名
          replyUsername = customUsername.trim();
        } else if (selectedUserId) {
          // 使用选择的用户ID
          replyUserId = selectedUserId;
        } else {
          // 使用当前登录用户
          replyUserId = user?.id;
        }
      }
      
      await api.post(`/posts/${postId}/replies`, {
        content,
        is_anonymous: isAnonymous,
        custom_time: formattedTime,
        region: region || null,
        // 匿名回复时，头衔和身份应该为 null
        user_title: isAnonymous ? null : (userTitle || null),
        user_identity: isAnonymous ? null : (userIdentity || null),
        user_rank: userRank || null,
        floor_number: floorNumber ? parseInt(floorNumber) : null,
        user_id: replyUserId,
        username: replyUsername, // 自定义用户名
        images: [],
      });
      setContent('');
      setCustomTime('');
      setCustomTimeYear('');
      setCustomTimeMonth('');
      setCustomTimeDay('');
      setCustomTimeHour('');
      setCustomTimeMinute('');
      setRegion('');
      setUserTitle('');
      setUserIdentity('');
      setUserRank('');
      setFloorNumber('');
      setCustomUsername('');
      setUseCustomUsername(false);
      setSelectedUserId(user?.id || '');
      onReply();
    } catch (error) {
      console.error('发布回复失败:', error);
      alert('发布回复失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="theme-card rounded-lg p-4 md:p-6 border border-runeterra-gold/20">
      <h3 className="text-base md:text-lg font-bold text-runeterra-gold mb-3 md:mb-4">发表回复</h3>
      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
        <div className="theme-input rounded-md">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            placeholder="写下你的回复..."
            modules={quillModules}
            formats={[
              'header',
              'bold', 'italic', 'underline', 'strike',
              'list', 'bullet',
              'link', 'image'
            ]}
            className="theme-quill"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="block theme-label mb-2 text-sm">回复人</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={useCustomUsername}
                  onChange={(e) => {
                    setUseCustomUsername(e.target.checked);
                    if (!e.target.checked) {
                      setCustomUsername('');
                    }
                  }}
                  disabled={isAnonymous}
                  className="w-4 h-4"
                />
                <span className="theme-label text-xs">自定义名称</span>
              </label>
              {useCustomUsername ? (
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  placeholder="输入回复人名称"
                  disabled={isAnonymous}
                  className="w-full px-3 py-2 theme-input rounded-md text-sm"
                />
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={isAnonymous}
                  className="w-full px-3 py-2 theme-input rounded-md text-sm"
                >
                  <option value="">选择用户</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsAnonymous(checked);
                  // 如果勾选匿名，清空头衔和身份
                  if (checked) {
                    setUserTitle('');
                    setUserIdentity('');
                  }
                }}
                className="w-4 h-4"
              />
              <span className="theme-label text-sm">匿名回复</span>
            </label>
          </div>
          <div>
            <label className="block theme-label mb-2 text-sm">时间（瓦罗兰历）</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customTimeYear || ''}
                  onChange={(e) => {
                    const year = e.target.value;
                    setCustomTimeYear(year);
                  }}
                  placeholder="年"
                  className="flex-[1.2] px-3 py-2 theme-input rounded-md text-sm min-w-[80px]"
                  min="1"
                />
                <input
                  type="number"
                  value={customTimeMonth || ''}
                  onChange={(e) => {
                    const month = e.target.value;
                    if (month === '' || (!isNaN(month) && parseInt(month) >= 1 && parseInt(month) <= 12)) {
                      setCustomTimeMonth(month);
                    }
                  }}
                  placeholder="月（1-12）"
                  min="1"
                  max="12"
                  className="flex-1 px-3 py-2 theme-input rounded-md text-sm min-w-[90px]"
                />
                <input
                  type="number"
                  value={customTimeDay || ''}
                  onChange={(e) => {
                    const day = e.target.value;
                    if (day === '' || (!isNaN(day) && parseInt(day) >= 1 && parseInt(day) <= 31)) {
                      setCustomTimeDay(day);
                    }
                  }}
                  placeholder="日（1-31）"
                  min="1"
                  max="31"
                  className="flex-1 px-3 py-2 theme-input rounded-md text-sm min-w-[90px]"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customTimeHour || ''}
                  onChange={(e) => {
                    const hour = e.target.value;
                    if (hour === '' || (!isNaN(hour) && parseInt(hour) >= 0 && parseInt(hour) <= 23)) {
                      setCustomTimeHour(hour);
                    }
                  }}
                  placeholder="时（0-23）"
                  min="0"
                  max="23"
                  className="flex-1 px-3 py-2 theme-input rounded-md text-sm"
                />
                <input
                  type="number"
                  value={customTimeMinute || ''}
                  onChange={(e) => {
                    const minute = e.target.value;
                    if (minute === '' || (!isNaN(minute) && parseInt(minute) >= 0 && parseInt(minute) <= 59)) {
                      setCustomTimeMinute(minute);
                    }
                  }}
                  placeholder="分（0-59）"
                  min="0"
                  max="59"
                  className="flex-1 px-3 py-2 theme-input rounded-md text-sm"
                />
              </div>
            </div>
            {customTimeYear && (
              <p className="mt-1 text-xs theme-text-muted">
                将显示为：瓦罗兰历 {(() => {
                  const yearNum = parseInt(customTimeYear);
                  const year = yearNum < 10 ? String(yearNum).padStart(2, '0') : String(customTimeYear);
                  const month = customTimeMonth ? String(customTimeMonth).padStart(2, '0') : '01';
                  const day = customTimeDay ? String(customTimeDay).padStart(2, '0') : '01';
                  const hour = customTimeHour ? String(customTimeHour).padStart(2, '0') : '00';
                  const minute = customTimeMinute ? String(customTimeMinute).padStart(2, '0') : '00';
                  return `${year}-${month}-${day} ${hour}:${minute}`;
                })()}
              </p>
            )}
          </div>
          <div>
            <label className="block theme-label mb-2 text-sm">地区</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 theme-input rounded-md text-sm h-[42px]"
            >
              <option value="">选择地区</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block theme-label mb-2 text-sm">头衔</label>
            <input
              type="text"
              value={userTitle}
              onChange={(e) => setUserTitle(e.target.value)}
              placeholder="如：九尾妖狐"
              disabled={isAnonymous}
              className="w-full px-3 py-2 theme-input rounded-md text-sm h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block theme-label mb-2 text-sm">身份</label>
            <input
              type="text"
              value={userIdentity}
              onChange={(e) => setUserIdentity(e.target.value)}
              placeholder="如：版主"
              disabled={isAnonymous}
              className="w-full px-3 py-2 theme-input rounded-md text-sm h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block theme-label mb-2 text-sm">段位/外号</label>
            <input
              type="text"
              value={userRank}
              onChange={(e) => setUserRank(e.target.value)}
              placeholder="如：最强王者或九尾妖狐"
              className="w-full px-3 py-2 theme-input rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block theme-label mb-2 text-sm">楼层数</label>
            <input
              type="number"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              placeholder="留空则自动计数"
              className="w-full px-3 py-2 theme-input rounded-md text-sm"
              min="1"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="w-full sm:w-auto px-4 py-2 bg-runeterra-gold text-runeterra-dark hover:bg-yellow-600 transition-colors font-medium rounded-md disabled:opacity-50 text-sm md:text-base"
        >
          {submitting ? '发布中...' : '发布回复'}
        </button>
      </form>
    </div>
  );
};

export default PostDetail;
