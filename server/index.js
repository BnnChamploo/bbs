const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const heroes = require('./heroes');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'runeterra-secret-key-change-in-production';

// CORS 配置 - 支持环境变量
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

// 中间件
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
if (!fs.existsSync('uploads/avatars')) {
  fs.mkdirSync('uploads/avatars', { recursive: true });
}
if (!fs.existsSync('uploads/posts')) {
  fs.mkdirSync('uploads/posts', { recursive: true });
}

// 配置文件上传 - 头像
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 配置文件上传 - 帖子/回复图片
const postImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('只支持图片格式：jpeg, jpg, png, gif, webp'));
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
});

const uploadPostImages = multer({
  storage: postImageStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 增加到50MB
  fileFilter: imageFilter
});

// LOL段位映射
const RANK_NAMES = {
  1: '坚韧黑铁',
  2: '英勇黄铜',
  3: '不屈白银',
  4: '荣耀黄金',
  5: '华贵铂金',
  6: '流光翡翠',
  7: '璀璨钻石',
  8: '超凡大师',
  9: '傲世宗师',
  10: '最强王者'
};

// 板块分类（支持主板块和子板块）
const CATEGORIES = {
  'plaza': { 
    name: '瓦罗兰广场', 
    desc: '聊天/灌水/日常讨论', 
    icon: '🏛️',
    parent: null,
    subcategories: ['plaza_chat_daily', 'plaza_summoner_academic', 'plaza_news', 'plaza_activity']
  },
  'plaza_chat_daily': { 
    name: '聊天灌水', 
    desc: '日常聊天和讨论', 
    icon: '💧',
    parent: 'plaza'
  },
  'plaza_summoner_academic': { 
    name: '学徒交流', 
    desc: '真正的大师，永远怀着一颗学徒的心～', 
    icon: '📚',
    parent: 'plaza'
  },
  'plaza_news': { 
    name: '出大事了·公告板', 
    desc: '出大事了·公告板', 
    icon: '🪧',
    parent: 'plaza'
  },
  'plaza_activity': { 
    name: '活动', 
    desc: '活动专区', 
    icon: '🎡',
    parent: 'plaza'
  },
  'gossip': { 
    name: '八卦娱乐', 
    desc: '娱乐八卦专区', 
    icon: '🔥',
    parent: null,
    subcategories: ['gossip_fan', 'gossip_star', 'gossip_chat', 'gossip_bomb', 'gossip_melon']
  },
  'gossip_fan': { 
    name: '约德尔大饭堂', 
    desc: '璐璐大王命令你立刻做饭！', 
    icon: '💊',
    parent: 'gossip'
  },
  'gossip_star': { 
    name: '偶像明星', 
    desc: '大个子怪物们在这里', 
    icon: '🫧',
    parent: 'gossip'
  },
  'gossip_bomb': { 
    name: '爆破雷区', 
    desc: '即使是死亡，也会因为点炮拉踩而颤抖不已！', 
    icon: '💣',
    parent: 'gossip'
  },
  'gossip_melon': { 
    name: '吃瓜码头', 
    desc: '都是提莫打听来的', 
    icon: '🍉',
    parent: 'gossip'
  },
  'gossip_chat': { 
    name: '818', 
    desc: '闲聊八卦', 
    icon: '🔍',
    parent: 'gossip'
  },
  'emotion': { 
    name: '情感专区', 
    desc: '情感交流', 
    icon: '🌙',
    parent: null,
    subcategories: ['emotion_tree', 'emotion_love', 'emotion_consult', 'emotion_match']
  },
  'emotion_tree': { 
    name: '蘑菇树洞', 
    desc: '匿名倾诉', 
    icon: '🍄',
    parent: 'emotion'
  },
  'emotion_love': { 
    name: '恋爱分享', 
    desc: '恋爱话题', 
    icon: '🐾',
    parent: 'emotion'
  },
  'emotion_consult': { 
    name: '情感咨询', 
    desc: '情感建议', 
    icon: '🦄',
    parent: 'emotion'
  },
  'emotion_match': { 
    name: '相亲角', 
    desc: '寻找缘分', 
    icon: '💞',
    parent: 'emotion'
  },
  'life': { 
    name: '生活市集', 
    desc: '功能性板块', 
    icon: '🗺️',
    parent: null,
    subcategories: ['life_trade', 'life_team', 'life_rental', 'life_help']
  },
  'life_trade': { 
    name: '二手交易', 
    desc: '二手交易', 
    icon: '💸',
    parent: 'life'
  },
  'life_team': { 
    name: '招募队友', 
    desc: '招募队友', 
    icon: '🍻',
    parent: 'life'
  },
  'life_rental': { 
    name: '租赁', 
    desc: '租赁信息', 
    icon: '🏘️',
    parent: 'life'
  },
  'life_help': { 
    name: '求助', 
    desc: '求助信息', 
    icon: '❓',
    parent: 'life'
  }
};

// 瓦罗兰地区列表
const REGIONS = [
  '以绪塔尔', '德玛西亚', '诺克萨斯', '艾欧尼亚',
  '皮尔特沃夫', '祖安', '弗雷尔卓德', '班德尔城',
  '暗影岛', '巨神峰', '恕瑞玛', '比尔吉沃特', '虚空'
];

// 初始化数据库
const db = new sqlite3.Database('runeterra.db');

db.serialize(() => {
  // 用户表 - 添加头衔、身份、段位/外号（段位用于召唤师，外号用于英雄）
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT DEFAULT 'avatars/default-avatar.png',
    rank TEXT DEFAULT '坚韧黑铁', -- 段位（召唤师）或外号（英雄）
    title TEXT DEFAULT '',
    identity TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 帖子表 - 添加图片、匿名、自定义时间、地区、头衔、身份、排序、段位
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    images TEXT DEFAULT '[]',
    is_anonymous INTEGER DEFAULT 0,
    custom_time TEXT,
    region TEXT DEFAULT '',
    user_title TEXT DEFAULT '',
    user_identity TEXT DEFAULT '',
    user_rank TEXT DEFAULT '',
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 回复表 - 添加图片、匿名、自定义时间、地区、头衔、身份、排序、段位、楼层数
  db.run(`CREATE TABLE IF NOT EXISTS replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER,
    content TEXT NOT NULL,
    images TEXT DEFAULT '[]',
    is_anonymous INTEGER DEFAULT 0,
    custom_time TEXT,
    region TEXT DEFAULT '',
    user_title TEXT DEFAULT '',
    user_identity TEXT DEFAULT '',
    user_rank TEXT DEFAULT '',
    floor_number INTEGER DEFAULT NULL,
    likes INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 点赞表
  db.run(`CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 迁移现有数据（如果有）- 使用try-catch处理已存在的列
  const addColumnIfNotExists = (table, column, definition) => {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (err) => {
      // 忽略"duplicate column"错误
      if (err && !err.message.includes('duplicate column')) {
        console.error(`添加列 ${table}.${column} 失败:`, err.message);
      }
    });
  };

  addColumnIfNotExists('users', 'rank', 'TEXT DEFAULT \'坚韧黑铁\'');
  addColumnIfNotExists('users', 'title', 'TEXT DEFAULT \'\'');
  addColumnIfNotExists('users', 'identity', 'TEXT DEFAULT \'\'');
  addColumnIfNotExists('posts', 'images', 'TEXT DEFAULT \'[]\'');
  addColumnIfNotExists('posts', 'is_anonymous', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('posts', 'custom_time', 'TEXT');
  addColumnIfNotExists('posts', 'region', 'TEXT DEFAULT \'\'');
  addColumnIfNotExists('posts', 'user_title', 'TEXT DEFAULT \'\'');
  addColumnIfNotExists('posts', 'user_identity', 'TEXT DEFAULT \'\'');
  addColumnIfNotExists('posts', 'user_rank', 'TEXT DEFAULT \'\'');
  addColumnIfNotExists('posts', 'is_pinned', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('posts', 'sort_order', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('posts', 'custom_replies_count', 'INTEGER');
  addColumnIfNotExists('replies', 'images', 'TEXT DEFAULT \'[]\'');
  addColumnIfNotExists('replies', 'is_anonymous', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('replies', 'custom_time', 'TEXT');
  addColumnIfNotExists('replies', 'region', 'TEXT DEFAULT \'\'');
  addColumnIfNotExists('replies', 'user_title', 'TEXT DEFAULT \'\'');
  addColumnIfNotExists('replies', 'user_identity', 'TEXT DEFAULT \'\'');
  addColumnIfNotExists('replies', 'user_rank', 'TEXT DEFAULT \'\'');
  addColumnIfNotExists('replies', 'floor_number', 'INTEGER DEFAULT NULL');
  addColumnIfNotExists('replies', 'likes', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('replies', 'sort_order', 'INTEGER DEFAULT 0');

  // 导入英雄联盟所有英雄数据
  db.get('SELECT COUNT(*) as count FROM users WHERE identity = ?', ['英雄'], (err, result) => {
    if (err) {
      console.error('检查英雄数据失败:', err);
      return;
    }
    
    if (result.count === 0) {
      console.log('开始导入英雄数据...');
      bcrypt.hash('1234567', 10, (err, defaultPassword) => {
        if (err) {
          console.error('生成默认密码失败:', err);
          return;
        }
        
        let inserted = 0;
        let completed = 0;
        
        heroes.forEach((hero) => {
          db.run(
            'INSERT OR IGNORE INTO users (username, password, rank, title, identity) VALUES (?, ?, ?, ?, ?)',
            [hero.cnName, defaultPassword, hero.nickname, '', ''], // rank 是段位/外号，title 和 identity 都置空
            function(err) {
              completed++;
              if (err) {
                console.error(`导入英雄 ${hero.cnName} 失败:`, err);
              } else if (this.changes > 0) {
                inserted++;
              }
              
              if (completed === heroes.length) {
                console.log(`英雄数据导入完成，共导入 ${inserted} 个英雄`);
              }
            }
          );
        });
      });
    } else {
      console.log('英雄数据已存在，跳过导入');
    }
  });
});

// JWT验证中间件（可选，编辑模式下需要）
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 可选认证（编辑模式需要）
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
};

// 用户注册
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
      [username, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: '用户名已存在' });
        }
        return res.status(500).json({ error: '注册失败' });
      }

      const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
      res.json({ 
        token, 
        user: { 
          id: this.lastID, 
          username, 
          avatar: 'avatars/default-avatar.png',
          rank: '坚韧黑铁',
          title: '',
          identity: ''
        } 
      });
    });
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
});

// 用户登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '登录失败' });
    }

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    try {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          avatar: user.avatar || 'avatars/default-avatar.png',
          rank: user.rank || '坚韧黑铁',
          title: user.title || '',
          identity: user.identity || ''
        } 
      });
    } catch (error) {
      res.status(500).json({ error: '登录失败' });
    }
  });
});

// 获取所有用户（用于编辑模式选择）
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, avatar, rank, title, identity FROM users ORDER BY username', (err, users) => {
    if (err) {
      return res.status(500).json({ error: '获取用户列表失败' });
    }
    res.json(users);
  });
});

// 获取当前用户信息
app.get('/api/user', authenticateToken, (req, res) => {
  db.get('SELECT id, username, avatar, rank, title, identity FROM users WHERE id = ?', 
    [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '获取用户信息失败' });
    }
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  });
});

// 更新用户信息
app.put('/api/user', authenticateToken, uploadAvatar.single('avatar'), (req, res) => {
  const { username, rank, title, identity } = req.body; // rank现在是文本
  const updates = [];
  const values = [];

  if (username) {
    updates.push('username = ?');
    values.push(username);
  }
  if (rank !== undefined) {
    updates.push('rank = ?');
    values.push(rank);
  }
  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }
  if (identity !== undefined) {
    updates.push('identity = ?');
    values.push(identity);
  }
  if (req.file) {
    updates.push('avatar = ?');
    values.push(`avatars/${req.file.filename}`);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: '没有要更新的内容' });
  }

  values.push(req.user.id);
  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: '用户名已存在' });
      }
      return res.status(500).json({ error: '更新失败' });
    }

    db.get('SELECT id, username, avatar, rank, title, identity FROM users WHERE id = ?', 
      [req.user.id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: '获取更新后的用户信息失败' });
      }
      res.json(user);
    });
  });
});

// 上传帖子/回复图片
app.post('/api/upload-image', uploadPostImages.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '没有上传文件' });
  }

  const imageUrls = req.files.map(file => `posts/${file.filename}`);
  res.json({ images: imageUrls });
});

// 获取帖子列表
app.get('/api/posts', (req, res) => {
  const { category, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT p.*, 
    p.title as post_title,
    CASE WHEN p.is_anonymous = 1 THEN '匿名用户' ELSE u.username END as username,
    CASE WHEN p.is_anonymous = 1 THEN 'avatars/default-avatar.png' ELSE u.avatar END as avatar,
    CASE WHEN p.is_anonymous = 1 THEN '坚韧黑铁' ELSE COALESCE(p.user_rank, u.rank, '坚韧黑铁') END as rank,
    CASE WHEN p.is_anonymous = 1 THEN '' ELSE COALESCE(p.user_title, u.title, '') END as user_title_display,
    CASE WHEN p.is_anonymous = 1 THEN '' ELSE COALESCE(p.user_identity, u.identity, '') END as identity,
    COALESCE(p.custom_replies_count, (SELECT COUNT(*) FROM replies WHERE post_id = p.id)) as replies_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
  `;
  const params = [];

  if (category && category !== '') {
    // 检查是否是主板块，如果是，需要查询主板块和所有子板块
    const mainCategory = CATEGORIES[category];
    if (mainCategory && mainCategory.subcategories && mainCategory.subcategories.length > 0) {
      const subKeys = mainCategory.subcategories;
      query += ' WHERE (p.category = ?';
      params.push(category);
      subKeys.forEach(subKey => {
        query += ' OR p.category = ?';
        params.push(subKey);
      });
      query += ')';
    } else {
      query += ' WHERE p.category = ?';
      params.push(category);
    }
  }
  // 如果category为空，不添加WHERE条件，显示所有帖子

  query += ' ORDER BY p.is_pinned DESC, p.sort_order ASC, p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.all(query, params, (err, posts) => {
    if (err) {
      return res.status(500).json({ error: '获取帖子列表失败' });
    }
    res.json(posts.map(post => ({
      ...post,
      title: post.post_title || post.title, // 确保title是帖子标题
      user_title: post.user_title_display, // 用户头衔用于显示
      images: JSON.parse(post.images || '[]')
    })));
  });
});

// 获取单个帖子
app.get('/api/posts/:id', optionalAuth, (req, res) => {
  const postId = req.params.id;

  // 增加浏览量
  db.run('UPDATE posts SET views = views + 1 WHERE id = ?', [postId]);

  db.get(`
    SELECT p.*,
    p.title as post_title,
    CASE WHEN p.is_anonymous = 1 THEN '匿名用户' ELSE u.username END as username,
    CASE WHEN p.is_anonymous = 1 THEN 'avatars/default-avatar.png' ELSE u.avatar END as avatar,
    CASE WHEN p.is_anonymous = 1 THEN '坚韧黑铁' ELSE COALESCE(p.user_rank, u.rank, '坚韧黑铁') END as rank,
    CASE WHEN p.is_anonymous = 1 THEN '' ELSE COALESCE(p.user_title, u.title, '') END as user_title_display,
    CASE WHEN p.is_anonymous = 1 THEN '' ELSE COALESCE(p.user_identity, u.identity, '') END as identity,
    COALESCE(p.custom_replies_count, (SELECT COUNT(*) FROM replies WHERE post_id = p.id)) as replies_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `, [postId], (err, post) => {
    if (err) {
      return res.status(500).json({ error: '获取帖子失败' });
    }
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }
    res.json({
      ...post,
      title: post.post_title || post.title, // 确保title是帖子标题
      user_title: post.user_title_display, // 用户头衔用于显示
      images: JSON.parse(post.images || '[]')
    });
  });
});

// 创建帖子（支持编辑模式的手动填写）
app.post('/api/posts', authenticateToken, async (req, res) => {
  const { 
    title, 
    content, 
    category, 
    user_id, 
    is_anonymous, 
    custom_time, 
    region, 
    user_title, 
    user_identity,
    user_rank,
    images,
    sort_order
  } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ error: '标题、内容和分类不能为空' });
  }

  const userId = user_id || req.user.id;
  const imagesJson = JSON.stringify(images || []);

  db.run(`INSERT INTO posts (
    user_id, title, content, category, images, is_anonymous, 
    custom_time, region, user_title, user_identity, user_rank, sort_order
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [userId, title, content, category, imagesJson, is_anonymous ? 1 : 0, 
     custom_time, region, user_title, user_identity, user_rank || null, sort_order || 0], 
    async function(err) {
    if (err) {
      return res.status(500).json({ error: '发布帖子失败' });
    }

    db.get(`
      SELECT p.*,
      CASE WHEN p.is_anonymous = 1 THEN '匿名用户' ELSE u.username END as username,
      CASE WHEN p.is_anonymous = 1 THEN 'avatars/default-avatar.png' ELSE u.avatar END as avatar,
      CASE WHEN p.is_anonymous = 1 THEN 1 ELSE u.rank END as rank,
      CASE WHEN p.is_anonymous = 1 THEN '' ELSE COALESCE(p.user_title, u.title, '') END as title,
      CASE WHEN p.is_anonymous = 1 THEN '' ELSE COALESCE(p.user_identity, u.identity, '') END as identity
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [this.lastID], (err, post) => {
      if (err) {
        return res.status(500).json({ error: '获取帖子失败' });
      }
      res.status(201).json({
        ...post,
        images: JSON.parse(post.images || '[]')
      });
    });
  });
});

// 更新帖子（编辑模式）
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const { 
    title, content, category, user_id, is_anonymous, custom_time, 
    region, user_title, user_identity, user_rank, images, views, likes, is_pinned, sort_order, custom_replies_count
  } = req.body;

  const updates = [];
  const values = [];

  if (title !== undefined) updates.push('title = ?'), values.push(title);
  if (content !== undefined) updates.push('content = ?'), values.push(content);
  if (category !== undefined) updates.push('category = ?'), values.push(category);
  if (user_id !== undefined) updates.push('user_id = ?'), values.push(user_id);
  if (is_anonymous !== undefined) updates.push('is_anonymous = ?'), values.push(is_anonymous ? 1 : 0);
  if (custom_time !== undefined) updates.push('custom_time = ?'), values.push(custom_time);
  if (region !== undefined) updates.push('region = ?'), values.push(region);
  if (user_title !== undefined) updates.push('user_title = ?'), values.push(user_title);
  if (user_identity !== undefined) updates.push('user_identity = ?'), values.push(user_identity);
  if (user_rank !== undefined) updates.push('user_rank = ?'), values.push(user_rank);
  if (images !== undefined) updates.push('images = ?'), values.push(JSON.stringify(images));
  if (views !== undefined) updates.push('views = ?'), values.push(views);
  if (likes !== undefined) updates.push('likes = ?'), values.push(likes);
  if (is_pinned !== undefined) updates.push('is_pinned = ?'), values.push(is_pinned ? 1 : 0);
  if (sort_order !== undefined) updates.push('sort_order = ?'), values.push(sort_order);
  if (custom_replies_count !== undefined) {
    if (custom_replies_count === null || custom_replies_count === '') {
      updates.push('custom_replies_count = NULL');
    } else {
      updates.push('custom_replies_count = ?'), values.push(parseInt(custom_replies_count) || 0);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: '没有要更新的内容' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(postId);

  db.run(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: '更新帖子失败' });
    }

    db.get(`
      SELECT p.*,
      p.title as post_title,
      CASE WHEN p.is_anonymous = 1 THEN '匿名用户' ELSE u.username END as username,
      CASE WHEN p.is_anonymous = 1 THEN 'avatars/default-avatar.png' ELSE u.avatar END as avatar,
      CASE WHEN p.is_anonymous = 1 THEN 1 ELSE u.rank END as rank,
      CASE WHEN p.is_anonymous = 1 THEN '' ELSE COALESCE(p.user_title, u.title, '') END as user_title_display,
      CASE WHEN p.is_anonymous = 1 THEN '' ELSE COALESCE(p.user_identity, u.identity, '') END as identity,
      COALESCE(p.custom_replies_count, (SELECT COUNT(*) FROM replies WHERE post_id = p.id)) as replies_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [postId], (err, post) => {
      if (err) {
        return res.status(500).json({ error: '获取帖子失败' });
      }
      res.json({
        ...post,
        title: post.post_title || post.title, // 确保title是帖子标题
        user_title: post.user_title_display, // 用户头衔用于显示
        images: JSON.parse(post.images || '[]')
      });
    });
  });
});

// 删除帖子
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const postId = req.params.id;

  db.run('DELETE FROM posts WHERE id = ?', [postId], function(err) {
    if (err) {
      return res.status(500).json({ error: '删除帖子失败' });
    }
    res.json({ success: true });
  });
});

// 获取帖子回复
app.get('/api/posts/:id/replies', (req, res) => {
  const postId = req.params.id;

  db.all(`
    SELECT r.*,
    CASE WHEN r.is_anonymous = 1 THEN '匿名用户' ELSE u.username END as username,
    CASE WHEN r.is_anonymous = 1 THEN 'avatars/default-avatar.png' ELSE u.avatar END as avatar,
    CASE WHEN r.is_anonymous = 1 THEN '坚韧黑铁' ELSE COALESCE(r.user_rank, u.rank, '坚韧黑铁') END as rank,
    CASE WHEN r.is_anonymous = 1 THEN '' ELSE COALESCE(r.user_title, u.title, '') END as title,
    CASE WHEN r.is_anonymous = 1 THEN '' ELSE COALESCE(r.user_identity, u.identity, '') END as identity,
    r.likes
    FROM replies r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.post_id = ?
    ORDER BY r.sort_order ASC, r.created_at ASC
  `, [postId], (err, replies) => {
    if (err) {
      return res.status(500).json({ error: '获取回复失败' });
    }
    // 自动计算楼层数（如果未设置）
    let floorCounter = 1;
    const processedReplies = replies.map((reply, index) => {
      if (reply.floor_number === null || reply.floor_number === undefined) {
        reply.floor_number = floorCounter;
      }
      floorCounter = Math.max(floorCounter, reply.floor_number) + 1;
      return {
        ...reply,
        images: JSON.parse(reply.images || '[]')
      };
    });
    res.json(processedReplies);
  });
});

// 创建回复
app.post('/api/posts/:id/replies', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const { 
    content, 
    user_id, 
    is_anonymous, 
    custom_time, 
    region, 
    user_title, 
    user_identity,
    user_rank,
    floor_number,
    images,
    sort_order
  } = req.body;

  if (!content) {
    return res.status(400).json({ error: '回复内容不能为空' });
  }

  const userId = user_id || req.user.id;
  const imagesJson = JSON.stringify(images || []);

  db.run(`INSERT INTO replies (
    post_id, user_id, content, images, is_anonymous, 
    custom_time, region, user_title, user_identity, user_rank, floor_number, likes, sort_order
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [postId, userId, content, imagesJson, is_anonymous ? 1 : 0, 
     custom_time, region, user_title, user_identity, user_rank || null, floor_number || null, 0, sort_order || 0], 
    async function(err) {
    if (err) {
      return res.status(500).json({ error: '发布回复失败' });
    }

    db.get(`
      SELECT r.*,
      CASE WHEN r.is_anonymous = 1 THEN '匿名用户' ELSE u.username END as username,
      CASE WHEN r.is_anonymous = 1 THEN 'avatars/default-avatar.png' ELSE u.avatar END as avatar,
      CASE WHEN r.is_anonymous = 1 THEN 1 ELSE u.rank END as rank,
      CASE WHEN r.is_anonymous = 1 THEN '' ELSE COALESCE(r.user_title, u.title, '') END as title,
      CASE WHEN r.is_anonymous = 1 THEN '' ELSE COALESCE(r.user_identity, u.identity, '') END as identity,
      r.likes
      FROM replies r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [this.lastID], (err, reply) => {
      if (err) {
        return res.status(500).json({ error: '获取回复失败' });
      }
      res.status(201).json({
        ...reply,
        images: JSON.parse(reply.images || '[]')
      });
    });
  });
});

// 更新回复（编辑模式）
app.put('/api/replies/:id', authenticateToken, async (req, res) => {
  const replyId = req.params.id;
  const { 
    content, user_id, is_anonymous, custom_time, region, 
    user_title, user_identity, user_rank, floor_number, images, likes, sort_order
  } = req.body;

  const updates = [];
  const values = [];

  if (content !== undefined) updates.push('content = ?'), values.push(content);
  if (user_id !== undefined) updates.push('user_id = ?'), values.push(user_id);
  if (is_anonymous !== undefined) updates.push('is_anonymous = ?'), values.push(is_anonymous ? 1 : 0);
  if (custom_time !== undefined) updates.push('custom_time = ?'), values.push(custom_time);
  if (region !== undefined) updates.push('region = ?'), values.push(region);
  if (user_title !== undefined) updates.push('user_title = ?'), values.push(user_title);
  if (user_identity !== undefined) updates.push('user_identity = ?'), values.push(user_identity);
  if (user_rank !== undefined) updates.push('user_rank = ?'), values.push(user_rank);
  if (floor_number !== undefined) updates.push('floor_number = ?'), values.push(floor_number);
  if (images !== undefined) updates.push('images = ?'), values.push(JSON.stringify(images));
  if (likes !== undefined) updates.push('likes = ?'), values.push(likes);
  if (sort_order !== undefined) updates.push('sort_order = ?'), values.push(sort_order);

  if (updates.length === 0) {
    return res.status(400).json({ error: '没有要更新的内容' });
  }

  values.push(replyId);

  db.run(`UPDATE replies SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: '更新回复失败' });
    }

    db.get(`
      SELECT r.*,
      CASE WHEN r.is_anonymous = 1 THEN '匿名用户' ELSE u.username END as username,
      CASE WHEN r.is_anonymous = 1 THEN 'avatars/default-avatar.png' ELSE u.avatar END as avatar,
      CASE WHEN r.is_anonymous = 1 THEN 1 ELSE u.rank END as rank,
      CASE WHEN r.is_anonymous = 1 THEN '' ELSE COALESCE(r.user_title, u.title, '') END as title,
      CASE WHEN r.is_anonymous = 1 THEN '' ELSE COALESCE(r.user_identity, u.identity, '') END as identity
      FROM replies r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [replyId], (err, reply) => {
      if (err) {
        return res.status(500).json({ error: '获取回复失败' });
      }
      res.json({
        ...reply,
        images: JSON.parse(reply.images || '[]')
      });
    });
  });
});

// 删除回复
app.delete('/api/replies/:id', authenticateToken, (req, res) => {
  const replyId = req.params.id;

  db.run('DELETE FROM replies WHERE id = ?', [replyId], function(err) {
    if (err) {
      return res.status(500).json({ error: '删除回复失败' });
    }
    res.json({ success: true });
  });
});

// 点赞帖子
app.post('/api/posts/:id/like', optionalAuth, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(401).json({ error: '需要登录才能点赞' });
  }

  db.run('INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)', 
    [postId, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: '点赞失败' });
    }

    if (this.changes > 0) {
      db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId]);
      res.json({ liked: true });
    } else {
      db.run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err) => {
        if (err) {
          return res.status(500).json({ error: '取消点赞失败' });
        }
        db.run('UPDATE posts SET likes = likes - 1 WHERE id = ?', [postId]);
        res.json({ liked: false });
      });
    }
  });
});

// 检查用户是否已点赞
app.get('/api/posts/:id/like', optionalAuth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.json({ liked: false });
  }

  db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', 
    [postId, userId], (err, like) => {
    if (err) {
      return res.status(500).json({ error: '检查点赞状态失败' });
    }
    res.json({ liked: !!like });
  });
});

// 批量更新回复排序（编辑模式拖拽）
app.put('/api/posts/:id/replies/order', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const { replyOrders } = req.body; // [{id: 1, sort_order: 0}, {id: 2, sort_order: 1}]

  if (!Array.isArray(replyOrders)) {
    return res.status(400).json({ error: '无效的排序数据' });
  }

  const updates = replyOrders.map(({ id, sort_order }) => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE replies SET sort_order = ? WHERE id = ? AND post_id = ?', 
        [sort_order, id, postId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  Promise.all(updates)
    .then(() => res.json({ success: true }))
    .catch(err => res.status(500).json({ error: '更新排序失败' }));
});

// 获取板块列表（返回主板块和子板块结构）
app.get('/api/categories', (req, res) => {
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
  res.json(mainCategories);
});

// 获取所有板块（包括子板块）
app.get('/api/categories/all', (req, res) => {
  res.json(CATEGORIES);
});

// 获取地区列表
app.get('/api/regions', (req, res) => {
  res.json(REGIONS);
});

app.listen(PORT, () => {
  console.log(`班德尔花园论坛服务器运行在 http://localhost:${PORT}`);
});
