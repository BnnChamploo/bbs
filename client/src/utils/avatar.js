// 头像工具函数

/**
 * 获取所有可能的头像 URL（按优先级排序）
 * 用于在加载失败时尝试下一个扩展名
 */
function getAvatarUrls(avatar) {
  if (!avatar) {
    return [];
  }
  
  // 如果是 base64 格式或完整 URL，直接返回
  if (avatar.startsWith('data:image') || avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return [avatar];
  }
  
  // 如果是 avatar 文件夹中的英雄头像（avatar/英雄名 或 avatar/英雄名.png）
  if (avatar.startsWith('avatar/')) {
    const basePath = import.meta.env.BASE_URL || '/';
    const avatarPath = `${basePath}${avatar}`;
    const parts = avatarPath.split('/');
    const fileName = parts[parts.length - 1];
    const encodedBaseName = encodeURIComponent(fileName);
    
    // 如果已经有扩展名，直接返回
    if (fileName.includes('.') && (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp'))) {
      return [parts.slice(0, -1).join('/') + '/' + encodedBaseName];
    }
    
    // 不带扩展名，返回所有可能的扩展名（按优先级）
    // 优先尝试 .jpg（更常见），然后 .jpeg, .png, .webp
    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
    return extensions.map(ext => parts.slice(0, -1).join('/') + '/' + encodedBaseName + ext);
  }
  
  // 如果路径不包含 avatar/ 但看起来像是英雄头像文件名
  if (avatar && !avatar.includes('/') && (avatar.endsWith('.png') || avatar.endsWith('.jpg') || avatar.endsWith('.jpeg') || avatar.endsWith('.webp'))) {
    const basePath = import.meta.env.BASE_URL || '/';
    return [`${basePath}avatar/${avatar}`];
  }
  
  // 如果是相对路径（avatars/xxx），在纯前端模式下尝试转换为 avatar/ 路径
  if (avatar.startsWith('avatars/')) {
    const useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';
    if (useLocalStorage) {
      if (avatar === 'avatars/default-avatar.png') {
        return [];
      }
      const fileName = avatar.replace('avatars/', '');
      const basePath = import.meta.env.BASE_URL || '/';
      return [`${basePath}avatar/${fileName}`];
    }
    return [`http://localhost:3001/uploads/${avatar}`];
  }
  
  // 默认情况
  const useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';
  if (useLocalStorage) {
    if (avatar && (avatar.endsWith('.png') || avatar.endsWith('.jpg') || avatar.endsWith('.jpeg') || avatar.endsWith('.webp'))) {
      const basePath = import.meta.env.BASE_URL || '/';
      return [`${basePath}avatar/${avatar}`];
    }
    return [];
  }
  return [`http://localhost:3001/uploads/${avatar}`];
}

/**
 * 获取头像 URL（返回第一个可能的 URL，用于向后兼容）
 * 支持 base64 格式、avatar 文件夹、服务器路径格式
 * 支持多种文件名格式：英文名、中文名、小写等
 */
export function getAvatarUrl(avatar) {
  const urls = getAvatarUrls(avatar);
  return urls[0] || null;
}

/**
 * 获取头像 URL 和所有可能的回退 URL
 * 返回 { url: string, fallbacks: string[] }
 */
export function getAvatarUrlWithFallbacks(avatar) {
  const urls = getAvatarUrls(avatar);
  return {
    url: urls[0] || null,
    fallbacks: urls.slice(1)
  };
}

