/**
 * 格式化工具
 * 时间、字节、数字、设备状态等格式化
 */

/** 默认时间格式（与后端 Go 格式保持一致） */
export const DATE_FORMAT = {
  full: 'YYYY-MM-DD HH:mm:ss',
  date: 'YYYY-MM-DD',
  time: 'HH:mm:ss',
  short: 'MM-DD HH:mm',
};

/**
 * 简易日期格式化（避免引入 dayjs 等大库）
 * @param date 日期对象/时间戳/字符串
 * @param format 格式模板，支持 YYYY MM DD HH mm ss
 */
export function formatDate(
  date: Date | number | string | null | undefined,
  format = DATE_FORMAT.full
): string {
  if (!date) return '-';

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';

  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m]);
}

/**
 * 格式化时间戳（毫秒/秒自动识别）
 */
export function formatTimestamp(ts: number, format?: string): string {
  // 小于 1e10 视为秒级
  const ms = ts < 1e10 ? ts * 1000 : ts;
  return formatDate(ms, format);
}

/**
 * 相对时间（"刚刚"、"x 分钟前"、"x 小时前"、"x 天前"）
 */
export function formatRelativeTime(date: Date | number | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';

  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (sec < 60) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  if (hour < 24) return `${hour} 小时前`;
  if (day < 7) return `${day} 天前`;
  if (day < 30) return `${Math.floor(day / 7)} 周前`;
  if (day < 365) return `${Math.floor(day / 30)} 个月前`;
  return `${Math.floor(day / 365)} 年前`;
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unit = units[i] ?? 'B';
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(num: number | string, decimals = 0): string {
  const n = typeof num === 'string' ? Number(num) : num;
  if (isNaN(n)) return '-';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals = 1): string {
  if (value == null || isNaN(value)) return '-';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 格式化时长（秒 → HH:mm:ss）
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/**
 * 设备状态 → 显示文本
 */
export function formatDeviceStatus(status: string): string {
  const map: Record<string, string> = {
    online: '在线',
    offline: '离线',
    warning: '告警',
    error: '故障',
    pending: '待激活',
  };
  return map[status] ?? status;
}

/**
 * 设备状态 → Tag type
 */
export function statusTagType(status: string): 'success' | 'info' | 'warning' | 'danger' | 'primary' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'primary'> = {
    online: 'success',
    offline: 'info',
    warning: 'warning',
    error: 'danger',
    pending: 'primary',
  };
  return map[status] ?? 'info';
}

/**
 * 截断字符串并添加省略号
 */
export function truncate(str: string, maxLen = 50): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

/**
 * 文本大小写转换：snake_case → camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * 文本大小写转换：camelCase → snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * 颜色明暗（用于根据背景色返回前景色）
 */
export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#000';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}
