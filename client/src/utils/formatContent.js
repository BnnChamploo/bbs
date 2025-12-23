// 格式化内容，处理@用户和引用

// 处理@用户，将 @用户名 转换为高亮显示
export function formatMentions(content) {
  if (!content) return content;
  
  // 匹配 @用户名 格式（支持中文、英文、数字、下划线）
  // 格式：@用户名（用户名后跟空格、标点或HTML标签）
  const mentionRegex = /@([\u4e00-\u9fa5a-zA-Z0-9_]+)/g;
  
  return content.replace(mentionRegex, (match, username) => {
    return `<span class="mention-user" style="color: #C9AA71; font-weight: 500; cursor: pointer;">@${username}</span>`;
  });
}

// 处理HTML内容中的@用户（简化版本，直接使用正则替换）
export function formatContentWithMentions(htmlContent) {
  if (!htmlContent) return htmlContent;
  
  // 匹配@用户名，但避免匹配已经在HTML标签中的内容
  // 这个正则会匹配 @用户名，但确保不在HTML标签内
  const mentionRegex = /@([\u4e00-\u9fa5a-zA-Z0-9_]+)(?![^<]*>)/g;
  
  return htmlContent.replace(mentionRegex, (match, username) => {
    return `<span class="mention-user" style="color: #C9AA71; font-weight: 500; cursor: pointer;">@${username}</span>`;
  });
}

