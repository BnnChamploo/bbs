// 板块分类（静态数据）
export const CATEGORIES = {
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
export const REGIONS = [
  '以绪塔尔', '德玛西亚', '诺克萨斯', '艾欧尼亚',
  '皮尔特沃夫', '祖安', '弗雷尔卓德', '班德尔城',
  '暗影岛', '巨神峰', '恕瑞玛', '比尔吉沃特', '虚空'
];

// 段位映射
export const RANK_NAMES = {
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




