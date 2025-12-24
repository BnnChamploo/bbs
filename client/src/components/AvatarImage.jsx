import React, { useState, useEffect } from 'react';
import { getAvatarUrlWithFallbacks } from '../utils/avatar';

/**
 * 可复用的头像图片组件
 * 自动尝试不同的文件扩展名（.jpg, .jpeg, .png, .webp）
 * 与现有的 onError 处理逻辑兼容
 */
const AvatarImage = ({ 
  avatar, 
  alt = '', 
  className = '',
  onError: externalOnError,
  ...props
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const { url, fallbacks } = getAvatarUrlWithFallbacks(avatar);
  const allUrls = url ? [url, ...fallbacks] : [];

  // 当 avatar 改变时，重置状态
  useEffect(() => {
    setCurrentUrlIndex(0);
    setHasError(false);
  }, [avatar]);

  const handleError = (e) => {
    // 如果还有回退 URL，尝试下一个
    if (currentUrlIndex < allUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
    } else {
      // 所有 URL 都失败了，调用外部 onError 处理（显示占位符）
      setHasError(true);
      if (externalOnError) {
        externalOnError(e);
      } else {
        // 默认行为：隐藏图片
        e.target.style.display = 'none';
      }
    }
  };

  // 如果没有头像 URL，返回 null（让父组件显示占位符）
  if (!url) {
    return null;
  }

  // 如果所有尝试都失败，返回 null（让父组件显示占位符）
  if (hasError) {
    return null;
  }

  return (
    <img
      src={allUrls[currentUrlIndex]}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};

export default AvatarImage;

