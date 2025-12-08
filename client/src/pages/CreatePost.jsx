import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../utils/api';
import { getImageUrl } from '../utils/image';

const CreatePost = ({ user }) => {
  const navigate = useNavigate();
  const quillRef = useRef(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [allCategories, setAllCategories] = useState({});
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
  const [images, setImages] = useState([]);
  const [users, setUsers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories/all')
      .then(res => {
        const data = res.data;
        const cats = [];
        // 先添加主板块
        Object.keys(data).forEach(key => {
          const cat = data[key];
          if (!cat.parent) {
            cats.push({
              value: key,
              label: cat.name,
              desc: cat.desc,
              icon: cat.icon,
              subcategories: cat.subcategories || []
            });
          }
        });
        setCategories(cats);
      })
      .catch(err => console.error('获取板块失败:', err));
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRegions();
    api.get('/categories/all')
      .then(res => {
        const data = res.data;
        setAllCategories(data);
        // 获取所有主板块，排除召唤师学院
        const mainCats = Object.keys(data).filter(key => !data[key].parent && key !== 'academy');
        const cats = [];
        mainCats.forEach(key => {
          const cat = data[key];
          if (key === 'plaza') {
            // 瓦罗兰广场：作为主板块显示，但只能选择子板块
            cats.push({
              value: key,
              label: cat.name,
              desc: cat.desc,
              icon: cat.icon,
              subcategories: (cat.subcategories || []).map(subKey => ({
                value: subKey,
                name: data[subKey]?.name || subKey,
                desc: data[subKey]?.desc || ''
              })),
              isSubcategory: false,
              onlySubcategories: true // 标记只能选择子板块
            });
          } else {
            // 其他主板块：只能选择子板块
            cats.push({
              value: key,
              label: cat.name,
              desc: cat.desc,
              icon: cat.icon,
              subcategories: (cat.subcategories || []).map(subKey => ({
                value: subKey,
                name: data[subKey]?.name || subKey,
                desc: data[subKey]?.desc || ''
              })),
              isSubcategory: false,
              onlySubcategories: true // 所有主板块都只能选择子板块
            });
          }
        });
        setCategories(cats);
        // 默认选择第一个板块的第一个子板块
        if (cats.length > 0) {
          const firstCat = cats[0];
          if (firstCat.subcategories && firstCat.subcategories.length > 0) {
            setCategory(firstCat.subcategories[0].value);
          }
        }
      })
      .catch(err => console.error('获取板块失败:', err));
  }, []);

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await api.post('/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImages([...images, ...response.data.images]);
    } catch (error) {
      console.error('上传图片失败:', error);
      setError('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空');
      return;
    }

    setLoading(true);
    try {
      // 格式化时间：如果输入了年月日时分，自动生成 YY-MM-DD HH:mm 或 YYYY-MM-DD HH:mm 格式
      let formattedTime = null;
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
      
      const postData = {
        title,
        content,
        category,
        is_anonymous: isAnonymous,
        custom_time: formattedTime,
        region: region || null,
        user_title: userTitle || null,
        user_identity: userIdentity || null,
        user_rank: userRank || null,
        floor_number: floorNumber ? parseInt(floorNumber) : null,
        user_id: isAnonymous ? null : (selectedUserId || user?.id),
        images,
      };

      const response = await api.post('/posts', postData);
      navigate(`/post/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-4 py-4 md:py-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-runeterra-gold mb-4 md:mb-6">发布新帖子</h1>

      {error && (
        <div className="mb-3 md:mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm md:text-base">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="theme-card rounded-lg p-4 md:p-6 lg:p-8 border border-runeterra-gold/20">
        <div className="mb-4 md:mb-6">
          <label className="block theme-label mb-2 font-medium text-sm md:text-base">选择分类</label>
          <div className="space-y-3 md:space-y-4">
            {categories.map(cat => (
              <div key={cat.value} className="border border-runeterra-gold/20 rounded-lg p-3 md:p-4 theme-card">
                <div className="mb-2 md:mb-3">
                  <div className="flex items-center space-x-2">
                    {cat.icon && <span className="text-base md:text-lg">{cat.icon}</span>}
                    <span className="font-medium theme-text-primary text-sm md:text-base">{cat.label}</span>
                  </div>
                  <p className="ml-4 md:ml-6 text-xs md:text-sm theme-text-secondary">{cat.desc}</p>
                  {cat.onlySubcategories && (
                    <p className="ml-4 md:ml-6 text-xs theme-text-muted mt-1">（请选择下方子板块）</p>
                  )}
                </div>
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="ml-4 md:ml-6 mt-2 space-y-2">
                    {cat.subcategories.map((subCat, subIndex) => {
                      // 从allCategories获取子板块的icon
                      const subCatData = allCategories[subCat.value];
                      const subCatIcon = subCatData?.icon || '';
                      return (
                        <div key={`${cat.value}-subcat-${subCat.value}-${subIndex}`} className="mb-2">
                          <label
                            className={`cursor-pointer flex items-center space-x-2 text-xs md:text-sm ${
                              category === subCat.value ? 'text-runeterra-gold' : 'theme-label'
                            }`}
                          >
                            <input
                              type="radio"
                              value={subCat.value}
                              checked={category === subCat.value}
                              onChange={(e) => setCategory(e.target.value)}
                              className="mr-2"
                            />
                            {subCatIcon && <span>{subCatIcon}</span>}
                            <span>{subCat.name}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 md:mb-6">
          <label className="block theme-label mb-2 font-medium text-sm md:text-base">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入帖子标题..."
            className="w-full px-3 md:px-4 py-2 md:py-3 theme-input rounded-md text-sm md:text-base"
            required
          />
        </div>

        <div className="mb-4 md:mb-6">
          <label className="block theme-label mb-2 font-medium text-sm md:text-base">内容</label>
          <div className="theme-input rounded-md">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              placeholder="分享你在符文大陆的见闻..."
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
          <style>{`
            [data-theme="dark"] .quill {
              background-color: #374151;
            }
            [data-theme="light-white"] .quill {
              background-color: #f3f4f6;
            }
            [data-theme="dark"] .ql-container {
              background-color: #374151;
              color: white;
              min-height: 300px;
            }
            [data-theme="light-white"] .ql-container {
              background-color: #f3f4f6;
              color: #1f2937;
              min-height: 300px;
            }
            [data-theme="dark"] .ql-editor {
              color: white;
              min-height: 300px;
            }
            [data-theme="light-white"] .ql-editor {
              color: #1f2937;
              min-height: 300px;
            }
            [data-theme="dark"] .ql-editor.ql-blank::before {
              color: #9CA3AF;
            }
            [data-theme="light-white"] .ql-editor.ql-blank::before {
              color: #9ca3af;
            }
            [data-theme="dark"] .ql-toolbar {
              background-color: #4B5563;
              border-top-left-radius: 0.375rem;
              border-top-right-radius: 0.375rem;
              border-bottom: 1px solid #4B5563;
            }
            [data-theme="light-white"] .ql-toolbar {
              background-color: #e5e7eb;
              border-top-left-radius: 0.375rem;
              border-top-right-radius: 0.375rem;
              border-bottom: 1px solid #d1d5db;
            }
            [data-theme="dark"] .ql-toolbar .ql-stroke {
              stroke: white;
            }
            [data-theme="light-white"] .ql-toolbar .ql-stroke {
              stroke: #1f2937;
            }
            [data-theme="dark"] .ql-toolbar .ql-fill {
              fill: white;
            }
            [data-theme="light-white"] .ql-toolbar .ql-fill {
              fill: #1f2937;
            }
            .ql-toolbar button:hover,
            .ql-toolbar button.ql-active {
              color: #FCD34D;
            }
            .ql-container {
              border-bottom-left-radius: 0.375rem;
              border-bottom-right-radius: 0.375rem;
            }
            [data-theme="dark"] .ql-editor {
              color: #E5E7EB !important;
            }
            [data-theme="light-white"] .ql-editor {
              color: #1f2937 !important;
            }
            [data-theme="dark"] .ql-editor p {
              color: #E5E7EB !important;
            }
            [data-theme="light-white"] .ql-editor p {
              color: #1f2937 !important;
            }
            .ql-editor strong {
              color: #FCD34D !important;
            }
            [data-theme="dark"] .ql-picker-label {
              color: white !important;
            }
            [data-theme="light-white"] .ql-picker-label {
              color: #1f2937 !important;
            }
            [data-theme="dark"] .ql-picker-options {
              background-color: #4B5563 !important;
              border: 1px solid #6B7280 !important;
            }
            [data-theme="light-white"] .ql-picker-options {
              background-color: #ffffff !important;
              border: 1px solid #d1d5db !important;
            }
            [data-theme="dark"] .ql-picker-item {
              color: white !important;
            }
            [data-theme="light-white"] .ql-picker-item {
              color: #1f2937 !important;
            }
            [data-theme="dark"] .ql-picker-item:hover {
              background-color: #6B7280 !important;
            }
            [data-theme="light-white"] .ql-picker-item:hover {
              background-color: #f3f4f6 !important;
            }
            .ql-picker-item.ql-selected {
              background-color: #FCD34D !important;
              color: #1F2937 !important;
            }
          `}</style>
        </div>

        <div className="mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="block theme-label mb-2 font-medium text-sm md:text-base">发帖人</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isAnonymous}
              className="w-full px-3 md:px-4 py-2 theme-input rounded-md text-sm md:text-base"
            >
              <option value="">选择用户</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="theme-label text-sm md:text-base">匿名发帖</span>
            </label>
          </div>
          <div>
            <label className="block theme-label mb-2 font-medium text-sm md:text-base">时间（瓦罗兰历）</label>
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
                  className="flex-[1.2] px-2 md:px-4 py-2 theme-input rounded-md min-w-[60px] md:min-w-[100px] text-sm md:text-base"
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
                  className="flex-1 px-2 md:px-4 py-2 theme-input rounded-md min-w-[70px] md:min-w-[110px] text-sm md:text-base"
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
                  className="flex-1 px-2 md:px-4 py-2 theme-input rounded-md min-w-[70px] md:min-w-[110px] text-sm md:text-base"
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
                  className="flex-1 px-2 md:px-4 py-2 theme-input rounded-md text-sm md:text-base"
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
                  className="flex-1 px-2 md:px-4 py-2 theme-input rounded-md text-sm md:text-base"
                />
              </div>
            </div>
            {customTimeYear && (
              <p className="mt-1 text-xs theme-text-muted break-words">
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
            <label className="block theme-label mb-2 font-medium text-sm md:text-base">地区</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 md:px-4 py-2 theme-input rounded-md h-[42px] text-sm md:text-base"
            >
              <option value="">选择地区</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block theme-label mb-2 font-medium text-sm md:text-base">头衔</label>
            <input
              type="text"
              value={userTitle}
              onChange={(e) => setUserTitle(e.target.value)}
              placeholder="如：九尾妖狐"
              className="w-full px-3 md:px-4 py-2 theme-input rounded-md h-[42px] text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block theme-label mb-2 font-medium text-sm md:text-base">身份</label>
            <input
              type="text"
              value={userIdentity}
              onChange={(e) => setUserIdentity(e.target.value)}
              placeholder="如：版主"
              className="w-full px-3 md:px-4 py-2 theme-input rounded-md h-[42px] text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block theme-label mb-2 font-medium text-sm md:text-base">段位/外号</label>
            <input
              type="text"
              value={userRank}
              onChange={(e) => setUserRank(e.target.value)}
              placeholder="如：最强王者、璀璨钻石等（召唤师）或九尾妖狐、暗裔剑魔等（英雄外号）"
              className="w-full px-3 md:px-4 py-2 theme-input rounded-md text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2 font-medium text-sm md:text-base">楼层数（仅回复时使用）</label>
            <input
              type="number"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              placeholder="留空则自动计数"
              className="w-full px-3 md:px-4 py-2 theme-input rounded-md text-sm md:text-base"
              min="1"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 md:px-6 py-2 theme-button rounded-md transition-colors text-sm md:text-base w-full sm:w-auto"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 md:px-6 py-2 bg-runeterra-gold text-runeterra-dark rounded-md hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 text-sm md:text-base w-full sm:w-auto"
          >
            {loading ? '发布中...' : '发布帖子'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
