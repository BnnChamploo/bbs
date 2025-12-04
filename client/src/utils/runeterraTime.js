// 瓦罗兰新历时间转换
// 将现实时间转换为瓦罗兰纪元（可以自定义格式）

export const formatRuneterraTime = (dateString, customTime = null) => {
  if (customTime) {
    // 如果自定义时间已经是 YYYY-MM-DD HH:mm 或 YY-MM-DD HH:mm 格式，添加"瓦罗兰历"前缀
    if (/^\d{2,4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(customTime)) {
      // 解析年份，如果是1-9年，格式化为01-09
      const parts = customTime.split(' ');
      const datePart = parts[0];
      const timePart = parts[1];
      const [year, month, day] = datePart.split('-');
      const formattedYear = parseInt(year) < 10 ? year.padStart(2, '0') : year;
      return `瓦罗兰历 ${formattedYear}-${month}-${day} ${timePart}`;
    }
    // 如果包含"瓦罗兰历"或"瓦罗兰纪元"前缀，直接返回
    if (customTime.includes('瓦罗兰历') || customTime.includes('瓦罗兰纪元')) {
      return customTime;
    }
    // 否则尝试解析为 YYYY-MM-DD HH:mm 格式
    return `瓦罗兰历 ${customTime}`;
  }

  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  // 瓦罗兰历格式：瓦罗兰历 YY-MM-DD HH:mm 或 瓦罗兰历 YYYY-MM-DD HH:mm
  // 计算瓦罗兰历年份（从某个基准年开始，这里假设从2000年开始）
  const baseYear = 2000;
  const runeterraYear = date.getFullYear() - baseYear + 1;
  // 年份格式化：1-9年显示为01-09，10年以上显示原样
  const formattedYear = runeterraYear < 10 ? String(runeterraYear).padStart(2, '0') : String(runeterraYear);
  const runeterraMonth = String(date.getMonth() + 1).padStart(2, '0');
  const runeterraDay = String(date.getDate()).padStart(2, '0');
  const runeterraHour = String(date.getHours()).padStart(2, '0');
  const runeterraMinute = String(date.getMinutes()).padStart(2, '0');
  
  return `瓦罗兰历 ${formattedYear}-${runeterraMonth}-${runeterraDay} ${runeterraHour}:${runeterraMinute}`;
};

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

