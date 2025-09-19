import DOMPurify from 'dompurify';
import twemoji from 'twemoji';
import { getEmojiByName } from '../../backbone/data/emojis';
import moment from 'moment';

/**
 * 处理消息内容，包括emoji转换、链接处理等
 */
export function processMessage(message) {
  if (typeof message !== 'string') {
    throw new Error('Please provide a message as a string.');
  }

  let processedMessage = message;

  // 处理emoji占位符 (例如 :smile:)
  const emojiPlaceholderRegEx = new RegExp(':.+?:', 'g');
  const matches = processedMessage.match(emojiPlaceholderRegEx);

  if (matches) {
    matches.forEach((match) => {
      const emoji = getEmojiByName(match);
      if (emoji && emoji.char) {
        processedMessage = processedMessage.replace(match, emoji.char);
      }
    });
  }

  // 清理HTML
  processedMessage = DOMPurify.sanitize(processedMessage);

  // 处理链接
  processedMessage = processLinks(processedMessage);

  // 转换emoji为图片
  processedMessage = twemoji.parse(
    processedMessage,
    (icon) => (`../imgs/emojis/72X72/${icon}.png`),
  );

  return processedMessage;
}

/**
 * 处理消息中的链接
 */
function processLinks(message) {
  // 匹配各种链接格式
  const linkRegex = /(https?:\/\/[^\s]+|ob:\/\/[^\s]+|@[^\s]+)/g;
  
  return message.replace(linkRegex, (match) => {
    let href = match;
    
    // 处理OB链接
    if (match.startsWith('ob://')) {
      href = `#${match}`;
    }
    
    // 处理@用户名
    if (match.startsWith('@')) {
      href = `#ob://${match}`;
    }
    
    return `<a href="${href}" class="chat-link" target="_blank">${match}</a>`;
  });
}

/**
 * 格式化时间
 */
export function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  
  const now = moment();
  const messageTime = moment(timestamp);
  const diffDays = now.diff(messageTime, 'days');
  
  if (diffDays === 0) {
    return messageTime.format('HH:mm');
  } else if (diffDays === 1) {
    return '昨天 ' + messageTime.format('HH:mm');
  } else if (diffDays < 7) {
    return messageTime.format('ddd HH:mm');
  } else {
    return messageTime.format('MM-DD HH:mm');
  }
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  return moment(timestamp).fromNow();
}

/**
 * 获取文件大小格式化字符串
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * 获取用户头像URL
 */
export function getAvatarUrl(profile, size = 'medium') {
  if (!profile || !profile.avatarHashes) return null;
  
  const hashes = profile.avatarHashes;
  const hash = hashes[size] || hashes.medium || hashes.small;
  
  if (hash) {
    return app.getServerUrl(`ob/image/${hash}`);
  }
  
  return null;
}

/**
 * 获取用户显示名称
 */
export function getDisplayName(profile, peerID) {
  if (profile && profile.handle) {
    return profile.handle;
  }
  return peerID;
}

/**
 * 获取用户首字母
 */
export function getInitials(profile, peerID) {
  const name = getDisplayName(profile, peerID);
  return name.substring(0, 2).toUpperCase();
}

/**
 * 检查消息是否包含图片
 */
export function hasImage(message) {
  const imgRegex = /<img[^>]+src="[^"]+"[^>]*>/gi;
  return imgRegex.test(message);
}

/**
 * 检查消息是否包含链接
 */
export function hasLinks(message) {
  const linkRegex = /(https?:\/\/[^\s]+|ob:\/\/[^\s]+|@[^\s]+)/g;
  return linkRegex.test(message);
}

/**
 * 提取消息中的图片URL
 */
export function extractImageUrls(message) {
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  const urls = [];
  let match;
  
  while ((match = imgRegex.exec(message)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}

/**
 * 提取消息中的链接
 */
export function extractLinks(message) {
  const linkRegex = /(https?:\/\/[^\s]+|ob:\/\/[^\s]+|@[^\s]+)/g;
  return message.match(linkRegex) || [];
}

/**
 * 截断长消息
 */
export function truncateMessage(message, maxLength = 100) {
  if (message.length <= maxLength) return message;
  
  // 移除HTML标签
  const textOnly = message.replace(/<[^>]*>/g, '');
  
  if (textOnly.length <= maxLength) return message;
  
  return textOnly.substring(0, maxLength) + '...';
}

/**
 * 防抖函数
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 生成唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 检查是否为有效的peerID
 */
export function isValidPeerID(peerID) {
  // 这里可以根据实际的peerID格式进行验证
  return peerID && typeof peerID === 'string' && peerID.length > 0;
}

/**
 * 检查是否为有效的消息
 */
export function isValidMessage(message) {
  return message && 
         typeof message === 'string' && 
         message.trim().length > 0 && 
         message.length <= 20000; // 最大消息长度
}