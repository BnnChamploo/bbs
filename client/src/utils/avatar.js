// 头像工具函数

/**
 * 获取头像 URL
 * 支持 base64 格式、avatar 文件夹、服务器路径格式
 * 支持多种文件名格式：英文名、中文名、小写等
 */
export function getAvatarUrl(avatar) {
  if (!avatar) {
    return null;
  }
  
  // 如果是 base64 格式，直接返回
  if (avatar.startsWith('data:image')) {
    return avatar;
  }
  
  // 如果已经是完整 URL，直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // 如果是 avatar 文件夹中的英雄头像（avatar/英雄名.png）
  if (avatar.startsWith('avatar/')) {
    // 在纯前端模式下，从 public 文件夹读取
    // 格式：/avatar/英雄名.png 或 /runeterra_f/avatar/英雄名.png（GitHub Pages）
    // 对中文文件名进行 URL 编码，确保浏览器能正确加载
    const basePath = import.meta.env.BASE_URL || '/';
    const avatarPath = `${basePath}${avatar}`;
    // 分离路径和文件名，只对文件名部分进行编码
    const parts = avatarPath.split('/');
    const fileName = parts[parts.length - 1];
    const encodedFileName = encodeURIComponent(fileName);
    const encodedPath = parts.slice(0, -1).join('/') + '/' + encodedFileName;
    return encodedPath;
  }
  
  // 如果路径不包含 avatar/ 但看起来像是英雄头像文件名
  // 尝试添加 avatar/ 前缀（支持直接传入文件名，如 "Ahri.png"）
  if (avatar && !avatar.includes('/') && (avatar.endsWith('.png') || avatar.endsWith('.jpg') || avatar.endsWith('.jpeg') || avatar.endsWith('.webp'))) {
    const basePath = import.meta.env.BASE_URL || '/';
    return `${basePath}avatar/${avatar}`;
  }
  
  // 如果是相对路径（avatars/xxx），在纯前端模式下尝试转换为 avatar/ 路径
  if (avatar.startsWith('avatars/')) {
    const useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';
    if (useLocalStorage) {
      // 纯前端模式下，尝试从 avatar 文件夹读取
      // 将 avatars/default-avatar.png 转换为 /avatar/default-avatar.png
      // 但如果是默认头像，返回 null 使用占位符
      if (avatar === 'avatars/default-avatar.png') {
        return null;
      }
      // 其他情况，尝试从 avatar 文件夹读取
      const fileName = avatar.replace('avatars/', '');
      const basePath = import.meta.env.BASE_URL || '/';
      return `${basePath}avatar/${fileName}`;
    }
    // 后端模式下，使用服务器路径
    return `http://localhost:3001/uploads/${avatar}`;
  }
  
  // 默认情况
  const useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';
  if (useLocalStorage) {
    // 纯前端模式下，如果看起来像是文件名，尝试从 avatar 文件夹读取
    if (avatar && (avatar.endsWith('.png') || avatar.endsWith('.jpg') || avatar.endsWith('.jpeg') || avatar.endsWith('.webp'))) {
      const basePath = import.meta.env.BASE_URL || '/';
      return `${basePath}avatar/${avatar}`;
    }
    return null;
  }
  return `http://localhost:3001/uploads/${avatar}`;
}

