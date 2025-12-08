// 图片工具函数

/**
 * 获取图片 URL
 * 支持 base64 格式和服务器路径格式
 */
export function getImageUrl(img) {
  if (!img) {
    return null;
  }
  
  // 如果是 base64 格式，直接返回
  if (img.startsWith('data:image')) {
    return img;
  }
  
  // 如果已经是完整 URL，直接返回
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  }
  
  // 在纯前端模式下，如果图片不是 base64，可能是服务器路径
  const useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';
  if (useLocalStorage) {
    // 纯前端模式下，如果不是 base64，返回 null（图片可能不存在）
    return null;
  }
  
  // 后端模式下，使用服务器路径
  return `http://localhost:3001/uploads/${img}`;
}


