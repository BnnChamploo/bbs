// localStorage 数据管理工具

const STORAGE_KEYS = {
  USERS: 'runeterra_users',
  POSTS: 'runeterra_posts',
  REPLIES: 'runeterra_replies',
  LIKES: 'runeterra_likes',
  CURRENT_USER: 'runeterra_current_user',
  TOKEN: 'runeterra_token'
};

// 生成唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 获取数据
export function getStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`读取 ${key} 失败:`, error);
    return null;
  }
}

// 保存数据
export function setStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`保存 ${key} 失败:`, error);
    return false;
  }
}

// 用户管理
export function getUsers() {
  return getStorage(STORAGE_KEYS.USERS) || [];
}

export function saveUser(user) {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  setStorage(STORAGE_KEYS.USERS, users);
  return user;
}

export function findUserById(id) {
  if (!id) return null;
  const users = getUsers();
  const idStr = String(id);
  // 尝试严格匹配和字符串匹配（因为ID可能是字符串或数字）
  return users.find(u => u.id === id || String(u.id) === idStr) || null;
}

export function findUserByUsername(username) {
  const users = getUsers();
  return users.find(u => u.username === username) || null;
}

// 帖子管理
export function getPosts() {
  return getStorage(STORAGE_KEYS.POSTS) || [];
}

export function savePost(post) {
  const posts = getPosts();
  
  if (post.id) {
    // 更新
    const index = posts.findIndex(p => p.id === post.id);
    if (index >= 0) {
      posts[index] = { ...post, updated_at: new Date().toISOString() };
    } else {
      posts.push({ ...post, id: generateId(), created_at: new Date().toISOString() });
    }
  } else {
    // 新建
    posts.push({
      ...post,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views: 0,
      likes: 0,
      sort_order: 0,
      is_pinned: 0
    });
  }
  
  setStorage(STORAGE_KEYS.POSTS, posts);
  return posts.find(p => p.id === post.id || p.id === posts[posts.length - 1].id);
}

export function findPostById(id) {
  const posts = getPosts();
  return posts.find(p => p.id === id) || null;
}

export function deletePost(id) {
  const posts = getPosts();
  const filtered = posts.filter(p => p.id !== id);
  setStorage(STORAGE_KEYS.POSTS, filtered);
  
  // 同时删除相关回复
  const replies = getReplies();
  const filteredReplies = replies.filter(r => r.post_id !== id);
  setStorage(STORAGE_KEYS.REPLIES, filteredReplies);
  
  return true;
}

// 回复管理
export function getReplies() {
  return getStorage(STORAGE_KEYS.REPLIES) || [];
}

export function getRepliesByPostId(postId) {
  const replies = getReplies();
  return replies.filter(r => r.post_id === postId);
}

export function saveReply(reply) {
  const replies = getReplies();
  
  if (reply.id) {
    // 更新
    const index = replies.findIndex(r => r.id === reply.id);
    if (index >= 0) {
      replies[index] = reply;
    } else {
      replies.push({ ...reply, id: generateId(), created_at: new Date().toISOString() });
    }
  } else {
    // 新建
    replies.push({
      ...reply,
      id: generateId(),
      created_at: new Date().toISOString(),
      likes: 0,
      sort_order: 0
    });
  }
  
  setStorage(STORAGE_KEYS.REPLIES, replies);
  return replies.find(r => r.id === reply.id || r.id === replies[replies.length - 1].id);
}

export function deleteReply(id) {
  const replies = getReplies();
  const filtered = replies.filter(r => r.id !== id);
  setStorage(STORAGE_KEYS.REPLIES, filtered);
  return true;
}

// 点赞管理
export function getLikes() {
  return getStorage(STORAGE_KEYS.LIKES) || [];
}

export function toggleLike(postId, userId) {
  const likes = getLikes();
  const existingIndex = likes.findIndex(l => l.post_id === postId && l.user_id === userId);
  
  if (existingIndex >= 0) {
    // 取消点赞
    likes.splice(existingIndex, 1);
    setStorage(STORAGE_KEYS.LIKES, likes);
    return false;
  } else {
    // 点赞
    likes.push({ post_id: postId, user_id: userId, created_at: new Date().toISOString() });
    setStorage(STORAGE_KEYS.LIKES, likes);
    return true;
  }
}

export function isLiked(postId, userId) {
  const likes = getLikes();
  return likes.some(l => l.post_id === postId && l.user_id === userId);
}

// 一键清除帖子数据（保留用户数据）
export function clearPostsData() {
  localStorage.removeItem(STORAGE_KEYS.POSTS);
  localStorage.removeItem(STORAGE_KEYS.REPLIES);
  localStorage.removeItem(STORAGE_KEYS.LIKES);
  // 清除当前登录状态，但保留用户数据
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  // 确保清除所有可能的用户相关缓存
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return true;
}

// 一键清除所有数据（包括用户数据，谨慎使用）
export function clearAllData() {
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.POSTS);
  localStorage.removeItem(STORAGE_KEYS.REPLIES);
  localStorage.removeItem(STORAGE_KEYS.LIKES);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  // 确保清除所有可能的用户相关缓存
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // 清除可能的其他缓存
  localStorage.removeItem('runeterra_token');
  localStorage.removeItem('runeterra_user');
  return true;
}

// 获取数据统计
export function getDataStats() {
  return {
    users: getUsers().length,
    posts: getPosts().length,
    replies: getReplies().length,
    likes: getLikes().length
  };
}

