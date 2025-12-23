// 纯前端 API 模拟层（使用 localStorage）
// 这个文件替换原来的 api.js，用于纯前端部署

import * as storage from './localStorage';
import { getHeroUsers } from '../data/heroes';
import { CATEGORIES, REGIONS } from '../data/categories';

// 模拟延迟
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// 创建模拟的 axios 响应对象
function createResponse(data, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {}
  };
}

// 创建错误响应
function createError(message, status = 400) {
  const error = new Error(message);
  error.response = {
    data: { error: message },
    status,
    statusText: 'Error'
  };
  return Promise.reject(error);
}

const api = {
  // GET 请求
  async get(url, config = {}) {
    await delay();
    
    const params = config.params || {};
    
    // 用户相关
    if (url === '/user') {
      const token = localStorage.getItem('token');
      if (!token) {
        return createError('未授权访问', 401);
      }
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return createResponse(user);
    }
    
    if (url === '/users') {
      const users = storage.getUsers();
      const heroUsers = getHeroUsers();
      return createResponse([...users, ...heroUsers]);
    }
    
    // 帖子相关
    if (url === '/posts') {
      let posts = storage.getPosts();
      
      // 分类筛选
      if (params.category) {
        const mainCategory = CATEGORIES[params.category];
        if (mainCategory && mainCategory.subcategories) {
          const subKeys = mainCategory.subcategories;
          posts = posts.filter(p => p.category === params.category || subKeys.includes(p.category));
        } else {
          posts = posts.filter(p => p.category === params.category);
        }
      }
      
      // 关联用户信息
      posts = posts.map(post => {
        const userIdStr = post.user_id ? String(post.user_id) : null;
        const user = storage.findUserById(post.user_id) || 
                    (userIdStr ? getHeroUsers().find(u => String(u.id) === userIdStr) : null);
        return {
          ...post,
          username: post.is_anonymous ? '匿名用户' : (user?.username || '未知用户'),
          avatar: post.is_anonymous ? 'avatars/default-avatar.png' : (user?.avatar || 'avatars/default-avatar.png'),
          rank: post.is_anonymous ? '坚韧黑铁' : (post.user_rank || user?.rank || '坚韧黑铁'),
          user_title: post.is_anonymous ? '' : (post.user_title || user?.title || ''),
          identity: post.is_anonymous ? '' : (post.user_identity || user?.identity || ''),
          replies_count: (post.custom_replies_count !== undefined && post.custom_replies_count !== null)
            ? post.custom_replies_count 
            : storage.getRepliesByPostId(post.id).length,
          images: typeof post.images === 'string' ? JSON.parse(post.images || '[]') : (post.images || [])
        };
      });
      
      // 排序
      posts.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      return createResponse(posts);
    }
    
    if (url.startsWith('/posts/') && url.endsWith('/replies')) {
      const postId = url.split('/')[2];
      let replies = storage.getRepliesByPostId(postId);
      
      // 关联用户信息
      replies = replies.map(reply => {
        let user = null;
        let username = '未知用户';
        let avatar = 'avatars/default-avatar.png';
        let rank = '坚韧黑铁';
        let title = '';
        let identity = '';
        
        if (reply.is_anonymous) {
          username = '匿名用户';
        } else if (reply.custom_username) {
          // 使用自定义用户名
          username = reply.custom_username;
          // 尝试从英雄数据中查找匹配的头像等信息
          const heroUser = getHeroUsers().find(u => u.username === reply.custom_username);
          if (heroUser) {
            avatar = heroUser.avatar || 'avatars/default-avatar.png';
            rank = reply.user_rank || heroUser.rank || '坚韧黑铁';
            title = reply.user_title || heroUser.title || '';
            identity = reply.user_identity || heroUser.identity || '';
          } else {
            rank = reply.user_rank || '坚韧黑铁';
            title = reply.user_title || '';
            identity = reply.user_identity || '';
          }
        } else {
          // 使用用户ID查找用户（尝试字符串和数字两种方式）
          const userIdStr = reply.user_id ? String(reply.user_id) : null;
          user = storage.findUserById(reply.user_id) || 
                (userIdStr ? getHeroUsers().find(u => String(u.id) === userIdStr) : null);
          username = user?.username || '未知用户';
          avatar = user?.avatar || 'avatars/default-avatar.png';
          rank = reply.user_rank || user?.rank || '坚韧黑铁';
          title = reply.user_title || user?.title || '';
          identity = reply.user_identity || user?.identity || '';
        }
        
        return {
          ...reply,
          username,
          avatar,
          rank,
          title,
          identity,
          images: typeof reply.images === 'string' ? JSON.parse(reply.images || '[]') : (reply.images || []),
          quoted_reply: reply.quoted_reply || null // 保留引用回复信息
        };
      });
      
      // 自动计算楼层数（先计算，再排序）
      let floorCounter = 1;
      replies = replies.map(reply => {
        if (reply.floor_number === null || reply.floor_number === undefined) {
          reply.floor_number = floorCounter;
        }
        floorCounter = Math.max(floorCounter, reply.floor_number) + 1;
        return reply;
      });
      
      // 排序：先按 sort_order，再按 floor_number，最后按 created_at
      replies.sort((a, b) => {
        // 1. 先按 sort_order 排序（用于编辑模式下的拖拽排序）
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        // 2. 再按 floor_number 排序（楼层数）
        const floorA = a.floor_number || 0;
        const floorB = b.floor_number || 0;
        if (floorA !== floorB) return floorA - floorB;
        // 3. 最后按 created_at 排序（创建时间）
        return new Date(a.created_at) - new Date(b.created_at);
      });
      
      return createResponse(replies);
    }
    
    if (url.startsWith('/posts/') && url.endsWith('/like')) {
      const postId = url.split('/')[2];
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        return createError('需要登录才能点赞', 401);
      }
      
      const liked = storage.toggleLike(postId, user.id);
      const post = storage.findPostById(postId);
      if (post) {
        post.likes = storage.getLikes().filter(l => l.post_id === postId).length;
        storage.savePost(post);
      }
      
      return createResponse({ liked });
    }
    
    if (url.startsWith('/posts/') && url.split('/').length === 3) {
      const postId = url.split('/')[2];
      const post = storage.findPostById(postId);
      
      if (!post) {
        return createError('帖子不存在', 404);
      }
      
      // 增加浏览量
      post.views = (post.views || 0) + 1;
      storage.savePost(post);
      
      // 关联用户信息
      let postUser = null;
      let postUsername = '未知用户';
      let postAvatar = 'avatars/default-avatar.png';
      let postRank = '坚韧黑铁';
      let postTitle = '';
      let postIdentity = '';
      
      if (post.is_anonymous) {
        postUsername = '匿名用户';
      } else if (post.custom_username) {
        // 使用自定义用户名
        postUsername = post.custom_username;
        // 尝试从英雄数据中查找匹配的头像等信息
        const heroUser = getHeroUsers().find(u => u.username === post.custom_username);
        if (heroUser) {
          postAvatar = heroUser.avatar || 'avatars/default-avatar.png';
          postRank = post.user_rank || heroUser.rank || '坚韧黑铁';
          postTitle = post.user_title || heroUser.title || '';
          postIdentity = post.user_identity || heroUser.identity || '';
        } else {
          postRank = post.user_rank || '坚韧黑铁';
          postTitle = post.user_title || '';
          postIdentity = post.user_identity || '';
        }
      } else {
        // 使用用户ID查找用户（尝试字符串和数字两种方式）
        const userIdStr = post.user_id ? String(post.user_id) : null;
        postUser = storage.findUserById(post.user_id) || 
                  (userIdStr ? getHeroUsers().find(u => String(u.id) === userIdStr) : null);
        postUsername = postUser?.username || '未知用户';
        postAvatar = postUser?.avatar || 'avatars/default-avatar.png';
        postRank = post.user_rank || postUser?.rank || '坚韧黑铁';
        postTitle = post.user_title || postUser?.title || '';
        postIdentity = post.user_identity || postUser?.identity || '';
      }
      
      const result = {
        ...post,
        username: postUsername,
        avatar: postAvatar,
        rank: postRank,
        user_title: postTitle,
        identity: postIdentity,
        replies_count: post.custom_replies_count !== undefined 
          ? post.custom_replies_count 
          : storage.getRepliesByPostId(post.id).length,
        images: typeof post.images === 'string' ? JSON.parse(post.images || '[]') : (post.images || [])
      };
      
      return createResponse(result);
    }
    
    // 板块相关
    if (url === '/categories') {
      const mainCategories = {};
      Object.keys(CATEGORIES).forEach(key => {
        const cat = CATEGORIES[key];
        if (!cat.parent) {
          mainCategories[key] = {
            ...cat,
            subcategories: cat.subcategories ? cat.subcategories.map(subKey => ({
              key: subKey,
              ...CATEGORIES[subKey]
            })) : []
          };
        }
      });
      return createResponse(mainCategories);
    }
    
    if (url === '/categories/all') {
      return createResponse(CATEGORIES);
    }
    
    // 地区相关
    if (url === '/regions') {
      return createResponse(REGIONS);
    }
    
    return createError('未找到接口', 404);
  },
  
  // POST 请求
  async post(url, data = {}) {
    await delay();
    
    // 用户注册（禁止重复用户名）
    if (url === '/register') {
      const { username, password } = data;
      if (!username) {
        return createError('用户名不能为空', 400);
      }
      
      // 默认密码
      const DEFAULT_PASSWORD = '1234567';
      const userPassword = password || DEFAULT_PASSWORD;
      
      // 检查用户是否已存在
      const existingUser = storage.findUserByUsername(username);
      if (existingUser) {
        // 如果用户已存在，禁止注册
        return createError('用户名已存在，请使用其他用户名', 400);
      }
      
      // 检查是否是英雄名称（英雄名称不能作为用户名）
      const heroUsers = getHeroUsers();
      const isHeroName = heroUsers.some(hero => hero.username === username);
      if (isHeroName) {
        return createError('该用户名已被保留，请使用其他用户名', 400);
      }
      
      // 创建新用户
      const user = {
        id: Date.now().toString(),
        username,
        password: userPassword, // 使用提供的密码或默认密码
        avatar: 'avatars/default-avatar.png',
        rank: '坚韧黑铁',
        title: '',
        identity: ''
      };
      
      storage.saveUser(user);
      const token = 'local_token_' + Date.now();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...user, password: undefined }));
      
      return createResponse({
        token,
        user: { ...user, password: undefined }
      });
    }
    
    // 用户登录（支持自动注册）
    if (url === '/login') {
      const { username, password } = data;
      
      if (!username) {
        return createError('用户名不能为空', 400);
      }
      
      // 默认密码
      const DEFAULT_PASSWORD = '1234567';
      
      // 查找用户（先在 localStorage 中查找）
      let user = storage.findUserByUsername(username);
      
      // 如果用户不存在，检查是否是英雄名称
      if (!user) {
        const heroUsers = getHeroUsers();
        const heroUser = heroUsers.find(hero => hero.username === username);
        
        if (heroUser) {
          // 如果是英雄名称，使用英雄数据创建账号并保存到 localStorage
          user = {
            ...heroUser,
            password: DEFAULT_PASSWORD, // 设置默认密码
            id: heroUser.id // 使用英雄的中文名作为 ID
          };
          storage.saveUser(user);
        } else {
          // 如果不是英雄名称，创建新用户
          user = {
            id: Date.now().toString(),
            username,
            password: DEFAULT_PASSWORD, // 使用默认密码
            avatar: 'avatars/default-avatar.png',
            rank: '坚韧黑铁',
            title: '',
            identity: ''
          };
          storage.saveUser(user);
        }
      }
      
      // 验证密码：如果密码是默认密码或匹配用户密码，都允许登录
      const isDefaultPassword = password === DEFAULT_PASSWORD;
      const isUserPassword = user.password === password;
      
      if (!isDefaultPassword && !isUserPassword) {
        return createError('密码错误', 401);
      }
      
      // 如果用户密码不是默认密码，但登录时使用了默认密码，更新用户密码为默认密码
      if (isDefaultPassword && user.password !== DEFAULT_PASSWORD) {
        user.password = DEFAULT_PASSWORD;
        storage.saveUser(user);
      }
      
      const token = 'local_token_' + Date.now();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...user, password: undefined }));
      
      return createResponse({
        token,
        user: { ...user, password: undefined }
      });
    }
    
    // 创建帖子
    if (url === '/posts') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        return createError('需要登录', 401);
      }
      
      const post = storage.savePost({
        ...data,
        user_id: data.user_id || user.id,
        images: Array.isArray(data.images) ? data.images : []
      });
      
      // 关联用户信息返回
      let postUser = null;
      let postUsername = '未知用户';
      let postAvatar = 'avatars/default-avatar.png';
      let postRank = '坚韧黑铁';
      let postTitle = '';
      let postIdentity = '';
      
      if (post.is_anonymous) {
        postUsername = '匿名用户';
      } else if (post.custom_username) {
        // 使用自定义用户名
        postUsername = post.custom_username;
        // 尝试从英雄数据中查找匹配的头像等信息
        const heroUser = getHeroUsers().find(u => u.username === post.custom_username);
        if (heroUser) {
          postAvatar = heroUser.avatar || 'avatars/default-avatar.png';
          postRank = post.user_rank || heroUser.rank || '坚韧黑铁';
          postTitle = post.user_title || heroUser.title || '';
          postIdentity = post.user_identity || heroUser.identity || '';
        } else {
          postRank = post.user_rank || '坚韧黑铁';
          postTitle = post.user_title || '';
          postIdentity = post.user_identity || '';
        }
      } else {
        // 使用用户ID查找用户（尝试字符串和数字两种方式）
        const userIdStr = post.user_id ? String(post.user_id) : null;
        postUser = storage.findUserById(post.user_id) || 
                  (userIdStr ? getHeroUsers().find(u => String(u.id) === userIdStr) : null);
        postUsername = postUser?.username || '未知用户';
        postAvatar = postUser?.avatar || 'avatars/default-avatar.png';
        postRank = post.user_rank || postUser?.rank || '坚韧黑铁';
        postTitle = post.user_title || postUser?.title || '';
        postIdentity = post.user_identity || postUser?.identity || '';
      }
      
      return createResponse({
        ...post,
        username: postUsername,
        avatar: postAvatar,
        rank: postRank,
        user_title: postTitle,
        identity: postIdentity,
        images: Array.isArray(post.images) ? post.images : JSON.parse(post.images || '[]')
      }, 201);
    }
    
    // 创建回复
    if (url.startsWith('/posts/') && url.endsWith('/replies')) {
      const postId = url.split('/')[2];
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        return createError('需要登录', 401);
      }
      
      // 如果提供了自定义用户名，保存到回复数据中
      const replyData = {
        ...data,
        post_id: postId,
        user_id: data.user_id || user.id,
        images: Array.isArray(data.images) ? data.images : []
      };
      
      // 如果提供了自定义用户名，保存到回复数据中（用于显示）
      if (data.username && !data.user_id) {
        // 自定义用户名，不设置 user_id，而是保存 username 到回复数据
        replyData.user_id = null;
        replyData.custom_username = data.username; // 保存自定义用户名
      }
      
      // 如果有引用回复，保存引用信息
      if (data.quoted_reply) {
        replyData.quoted_reply = data.quoted_reply;
      }
      
      const reply = storage.saveReply(replyData);
      
      // 关联用户信息返回
      let replyUser = null;
      let replyUsername = '未知用户';
      let replyAvatar = 'avatars/default-avatar.png';
      let replyRank = '坚韧黑铁';
      let replyTitle = '';
      let replyIdentity = '';
      
      if (reply.is_anonymous) {
        replyUsername = '匿名用户';
      } else if (reply.custom_username) {
        // 使用自定义用户名
        replyUsername = reply.custom_username;
        // 尝试从英雄数据中查找匹配的头像等信息
        const heroUser = getHeroUsers().find(u => u.username === reply.custom_username);
        if (heroUser) {
          replyAvatar = heroUser.avatar || 'avatars/default-avatar.png';
          replyRank = reply.user_rank || heroUser.rank || '坚韧黑铁';
          replyTitle = reply.user_title || heroUser.title || '';
          replyIdentity = reply.user_identity || heroUser.identity || '';
        } else {
          replyRank = reply.user_rank || '坚韧黑铁';
          replyTitle = reply.user_title || '';
          replyIdentity = reply.user_identity || '';
        }
      } else {
        // 使用用户ID查找用户（尝试字符串和数字两种方式）
        const userIdStr = reply.user_id ? String(reply.user_id) : null;
        replyUser = storage.findUserById(reply.user_id) || 
                   (userIdStr ? getHeroUsers().find(u => String(u.id) === userIdStr) : null);
        replyUsername = replyUser?.username || '未知用户';
        replyAvatar = replyUser?.avatar || 'avatars/default-avatar.png';
        replyRank = reply.user_rank || replyUser?.rank || '坚韧黑铁';
        replyTitle = reply.user_title || replyUser?.title || '';
        replyIdentity = reply.user_identity || replyUser?.identity || '';
      }
      
      return createResponse({
        ...reply,
        username: replyUsername,
        avatar: replyAvatar,
        rank: replyRank,
        title: replyTitle,
        identity: replyIdentity,
        images: Array.isArray(reply.images) ? reply.images : JSON.parse(reply.images || '[]'),
        quoted_reply: reply.quoted_reply || null // 保留引用回复信息
      }, 201);
    }
    
    // 上传图片（转换为 base64）
    if (url === '/upload-image') {
      // 从 FormData 中获取文件
      const formData = data;
      const files = [];
      
      // 处理 FormData（如果是 FormData 对象）
      if (formData instanceof FormData) {
        const fileEntries = formData.getAll('images');
        for (const file of fileEntries) {
          if (file instanceof File) {
            files.push(file);
          }
        }
      } else if (data.images) {
        // 兼容直接传递文件数组
        files.push(...(Array.isArray(data.images) ? data.images : [data.images]));
      }
      
      if (files.length === 0) {
        return createError('没有上传文件', 400);
      }
      
      // 将文件转换为 base64
      const imagePromises = files.map(file => {
        return new Promise((resolve, reject) => {
          // 检查文件大小（限制 5MB）
          if (file.size > 5 * 1024 * 1024) {
            reject(new Error('图片大小不能超过 5MB'));
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target.result); // base64 字符串
          };
          reader.onerror = () => reject(new Error('读取文件失败'));
          reader.readAsDataURL(file);
        });
      });
      
      try {
        const base64Images = await Promise.all(imagePromises);
        return createResponse({
          images: base64Images
        });
      } catch (error) {
        return createError(error.message || '图片上传失败', 400);
      }
    }
    
    return createError('未找到接口', 404);
  },
  
  // PUT 请求
  async put(url, data = {}) {
    await delay();
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      return createError('需要登录', 401);
    }
    
    // 更新用户信息
    if (url === '/user') {
      // 从存储中获取完整用户数据（包含密码）
      const storedUser = storage.findUserById(user.id);
      if (!storedUser) {
        return createError('用户不存在', 404);
      }
      
      // 处理 FormData（如果是 FormData 对象，转换为普通对象）
      let updateData = data;
      if (data instanceof FormData) {
        updateData = {};
        for (const [key, value] of data.entries()) {
          updateData[key] = value;
        }
      }
      
      // 如果尝试修改用户名，检查新用户名是否已被使用
      if (updateData.username && updateData.username !== storedUser.username) {
        // 检查新用户名是否已被其他用户使用
        const existingUser = storage.findUserByUsername(updateData.username);
        if (existingUser && existingUser.id !== storedUser.id) {
          return createError('该用户名已被使用，请选择其他用户名', 400);
        }
        
        // 检查是否是英雄名称（英雄名称不能作为用户名）
        const heroUsers = getHeroUsers();
        const isHeroName = heroUsers.some(hero => hero.username === updateData.username);
        if (isHeroName) {
          return createError('该用户名已被保留，请使用其他用户名', 400);
        }
      }
      
      // 更新用户信息，但保留密码
      const updatedUser = { 
        ...storedUser,  // 使用存储中的完整用户数据（包含密码）
        ...updateData,  // 应用更新
        password: storedUser.password  // 确保密码不被覆盖
      };
      
      // 如果头像更新了，且是 base64 格式，直接使用
      // 如果是文件对象，需要转换为 base64（但这里应该已经在 Profile 组件中处理了）
      
      // 保存到存储
      storage.saveUser(updatedUser);
      
      // 更新 localStorage 中的 user（不包含密码）
      const userForStorage = { ...updatedUser, password: undefined };
      localStorage.setItem('user', JSON.stringify(userForStorage));
      
      return createResponse(userForStorage);
    }
    
    // 更新帖子
    if (url.startsWith('/posts/') && !url.includes('/replies')) {
      const postId = url.split('/')[2];
      const post = storage.findPostById(postId);
      if (!post) {
        return createError('帖子不存在', 404);
      }
      
      // 如果提供了 user_id 但找不到用户，且提供了 _selected_username，自动使用自定义用户名
      let updateData = { ...data };
      if (updateData.user_id && !updateData.custom_username && updateData._selected_username) {
        // 尝试用字符串和数字两种方式查找用户（因为ID可能是字符串或数字）
        const userIdStr = String(updateData.user_id);
        const postUser = storage.findUserById(updateData.user_id) || 
                        storage.getUsers().find(u => String(u.id) === userIdStr) ||
                        getHeroUsers().find(u => String(u.id) === userIdStr);
        if (!postUser) {
          // 用户不存在，使用用户名作为自定义用户名
          updateData.custom_username = updateData._selected_username;
          updateData.user_id = null;
        }
      }
      // 移除临时字段
      delete updateData._selected_username;
      
      const updatedPost = storage.savePost({ ...post, ...updateData, id: postId });
      
      // 关联用户信息返回（与获取帖子详情时相同的逻辑）
      let postUser = null;
      let postUsername = '未知用户';
      let postAvatar = 'avatars/default-avatar.png';
      let postRank = '坚韧黑铁';
      let postTitle = '';
      let postIdentity = '';
      
      if (updatedPost.is_anonymous) {
        postUsername = '匿名用户';
      } else if (updatedPost.custom_username) {
        // 使用自定义用户名
        postUsername = updatedPost.custom_username;
        // 尝试从英雄数据中查找匹配的头像等信息
        const heroUser = getHeroUsers().find(u => u.username === updatedPost.custom_username);
        if (heroUser) {
          postAvatar = heroUser.avatar || 'avatars/default-avatar.png';
          postRank = updatedPost.user_rank || heroUser.rank || '坚韧黑铁';
          postTitle = updatedPost.user_title || heroUser.title || '';
          postIdentity = updatedPost.user_identity || heroUser.identity || '';
        } else {
          postRank = updatedPost.user_rank || '坚韧黑铁';
          postTitle = updatedPost.user_title || '';
          postIdentity = updatedPost.user_identity || '';
        }
      } else {
        // 使用用户ID查找用户（尝试字符串和数字两种方式）
        const userIdStr = String(updatedPost.user_id);
        postUser = storage.findUserById(updatedPost.user_id) || 
                  storage.getUsers().find(u => String(u.id) === userIdStr) ||
                  getHeroUsers().find(u => String(u.id) === userIdStr);
        
        if (!postUser && updatedPost.user_id) {
          // 如果找不到用户，但提供了用户ID，尝试从英雄数据中通过ID查找
          // 或者，如果数据中有 username 字段，使用它作为自定义用户名
          if (updatedPost.username) {
            // 如果返回的数据中有 username，说明可能是自定义用户名
            postUsername = updatedPost.username;
            postRank = updatedPost.user_rank || '坚韧黑铁';
            postTitle = updatedPost.user_title || '';
            postIdentity = updatedPost.user_identity || '';
          } else {
            postUsername = '未知用户';
            postAvatar = 'avatars/default-avatar.png';
            postRank = updatedPost.user_rank || '坚韧黑铁';
            postTitle = updatedPost.user_title || '';
            postIdentity = updatedPost.user_identity || '';
          }
        } else {
          postUsername = postUser?.username || '未知用户';
          postAvatar = postUser?.avatar || 'avatars/default-avatar.png';
          postRank = updatedPost.user_rank || postUser?.rank || '坚韧黑铁';
          postTitle = updatedPost.user_title || postUser?.title || '';
          postIdentity = updatedPost.user_identity || postUser?.identity || '';
        }
      }
      
      return createResponse({
        ...updatedPost,
        username: postUsername,
        avatar: postAvatar,
        rank: postRank,
        user_title: postTitle,
        identity: postIdentity,
        replies_count: updatedPost.custom_replies_count !== undefined 
          ? updatedPost.custom_replies_count 
          : storage.getRepliesByPostId(updatedPost.id).length,
        images: typeof updatedPost.images === 'string' ? JSON.parse(updatedPost.images || '[]') : (updatedPost.images || [])
      });
    }
    
    // 更新回复
    if (url.startsWith('/replies/')) {
      const replyId = url.split('/')[2];
      const replies = storage.getReplies();
      const reply = replies.find(r => r.id === replyId);
      if (!reply) {
        return createError('回复不存在', 404);
      }
      
      const updatedReply = storage.saveReply({ ...reply, ...data, id: replyId });
      
      // 关联用户信息返回（与创建回复时相同的逻辑）
      let replyUser = null;
      let replyUsername = '未知用户';
      let replyAvatar = 'avatars/default-avatar.png';
      let replyRank = '坚韧黑铁';
      let replyTitle = '';
      let replyIdentity = '';
      
      if (updatedReply.is_anonymous) {
        replyUsername = '匿名用户';
      } else if (updatedReply.custom_username) {
        // 使用自定义用户名
        replyUsername = updatedReply.custom_username;
        // 尝试从英雄数据中查找匹配的头像等信息
        const heroUser = getHeroUsers().find(u => u.username === updatedReply.custom_username);
        if (heroUser) {
          replyAvatar = heroUser.avatar || 'avatars/default-avatar.png';
          replyRank = updatedReply.user_rank || heroUser.rank || '坚韧黑铁';
          replyTitle = updatedReply.user_title || heroUser.title || '';
          replyIdentity = updatedReply.user_identity || heroUser.identity || '';
        } else {
          replyRank = updatedReply.user_rank || '坚韧黑铁';
          replyTitle = updatedReply.user_title || '';
          replyIdentity = updatedReply.user_identity || '';
        }
      } else {
        // 使用用户ID查找用户（尝试字符串和数字两种方式）
        const userIdStr = updatedReply.user_id ? String(updatedReply.user_id) : null;
        replyUser = storage.findUserById(updatedReply.user_id) || 
                   (userIdStr ? getHeroUsers().find(u => String(u.id) === userIdStr) : null);
        replyUsername = replyUser?.username || '未知用户';
        replyAvatar = replyUser?.avatar || 'avatars/default-avatar.png';
        replyRank = updatedReply.user_rank || replyUser?.rank || '坚韧黑铁';
        replyTitle = updatedReply.user_title || replyUser?.title || '';
        replyIdentity = updatedReply.user_identity || replyUser?.identity || '';
      }
      
      return createResponse({
        ...updatedReply,
        username: replyUsername,
        avatar: replyAvatar,
        rank: replyRank,
        title: replyTitle,
        identity: replyIdentity,
        images: Array.isArray(updatedReply.images) ? updatedReply.images : JSON.parse(updatedReply.images || '[]')
      });
    }
    
    // 批量更新回复排序
    if (url.endsWith('/replies/order')) {
      const postId = url.split('/')[2];
      const { replyOrders } = data;
      
      if (!Array.isArray(replyOrders)) {
        return createError('无效的排序数据', 400);
      }
      
      replyOrders.forEach(({ id, sort_order }) => {
        const reply = storage.getReplies().find(r => r.id === id && r.post_id === postId);
        if (reply) {
          storage.saveReply({ ...reply, sort_order });
        }
      });
      
      return createResponse({ success: true });
    }
    
    return createError('未找到接口', 404);
  },
  
  // DELETE 请求
  async delete(url) {
    await delay();
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      return createError('需要登录', 401);
    }
    
    // 删除帖子
    if (url.startsWith('/posts/')) {
      const postId = url.split('/')[2];
      storage.deletePost(postId);
      return createResponse({ success: true });
    }
    
    // 删除回复
    if (url.startsWith('/replies/')) {
      const replyId = url.split('/')[2];
      storage.deleteReply(replyId);
      return createResponse({ success: true });
    }
    
    return createError('未找到接口', 404);
  },
  
  // 拦截器（保持兼容性）
  interceptors: {
    request: {
      use: () => {}
    },
    response: {
      use: () => {}
    }
  }
};

export default api;

