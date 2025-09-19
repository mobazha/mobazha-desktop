<template>
  <div 
    class="chat-head-item"
    :class="{ 
      active: isActive, 
      unread: hasUnread,
      'has-avatar': hasAvatar
    }"
    @click="handleClick"
  >
    <div class="avatar-container">
      <div 
        class="avatar"
        :style="avatarStyle"
      >
        <span v-if="!hasAvatar" class="avatar-initials">
          {{ initials }}
        </span>
      </div>
      <div v-if="hasUnread" class="unread-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </div>
      <div v-if="isOnline" class="online-indicator"></div>
    </div>
    
    <div class="conversation-info">
      <div class="conversation-header">
        <span class="conversation-name">{{ conversation.name || conversation.peerID }}</span>
        <span class="conversation-time">{{ formatTime(conversation.timestamp) }}</span>
      </div>
      <div class="conversation-preview">
        <span class="last-message">{{ getLastMessage() }}</span>
        <div v-if="hasUnread" class="unread-indicator"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import app from '../../backbone/app';

export default {
  name: 'ChatHead',
  props: {
    conversation: {
      type: Object,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    hasAvatar: {
      type: Boolean,
      default: false
    },
    avatarUrl: {
      type: String,
      default: ''
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    const { t } = useI18n();
    
    const hasUnread = computed(() => {
      return props.conversation.unread && props.conversation.unread > 0;
    });
    
    const unreadCount = computed(() => {
      return props.conversation.unread || 0;
    });
    
    const isOnline = computed(() => {
      // 这里可以根据实际需求判断用户是否在线
      return false;
    });
    
    const initials = computed(() => {
      const name = props.conversation.name || props.conversation.peerID;
      if (!name) return '?';
      
      const words = name.split(' ');
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    });
    
    const avatarStyle = computed(() => {
      if (props.hasAvatar && props.avatarUrl) {
        return {
          backgroundImage: `url(${props.avatarUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        };
      }
      return {};
    });
    
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffInHours < 48) {
        return '昨天';
      } else {
        return date.toLocaleDateString('zh-CN', { 
          month: '2-digit', 
          day: '2-digit' 
        });
      }
    };
    
    const getLastMessage = () => {
      if (!props.conversation.lastMessage) {
        return t('receivingAccounts.noMessage');
      }
      
      // 处理图片消息
      if (props.conversation.lastMessage.includes('[图片]')) {
        return '📷 [图片]';
      }
      
      // 处理文件消息
      if (props.conversation.lastMessage.includes('[文件]')) {
        return '📎 [文件]';
      }
      
      // 截断长消息
      const message = props.conversation.lastMessage;
      return message.length > 30 ? message.substring(0, 30) + '...' : message;
    };
    
    const handleClick = () => {
      emit('click', props.conversation);
    };
    
    return {
      hasUnread,
      unreadCount,
      isOnline,
      initials,
      avatarStyle,
      formatTime,
      getLastMessage,
      handleClick
    };
  }
};
</script>

<style lang="scss" scoped>
@use "sass:color";
@use '@/assets/scss/variables' as *;

.chat-head-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  border-radius: 16px;
  margin-bottom: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 2px solid transparent;
  background: $overlayP;
  backdrop-filter: blur(8px);
}

.chat-head-item:hover {
  background: color.adjust($overlayP, $alpha: +0.1);
  backdrop-filter: blur(12px);
  border-color: color.adjust($emphasis1, $alpha: -0.7);
  transform: translateX(4px) translateY(-1px);
  box-shadow: 0 8px 24px rgba($text3, 0.2);
}

.chat-head-item.active {
  background: color.adjust($overlayP, $alpha: +0.1);
  backdrop-filter: blur(12px);
  border-color: $emphasis1;
  box-shadow: 0 8px 24px rgba($emphasis1, 0.3);
}

.chat-head-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: linear-gradient(180deg, #409eff 0%, #337ecc 100%);
  border-radius: 0 4px 4px 0;
}

.chat-head-item.unread {
  background: rgba(254, 243, 199, 0.8);
  backdrop-filter: blur(8px);
  border-color: rgba(245, 108, 108, 0.3);
  animation: pulse 2s infinite;
}

.avatar-container {
  position: relative;
  margin-right: 16px;
  flex-shrink: 0;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, color.adjust($primary, $lightness: -5%) 0%, color.adjust($primary, $lightness: -10%) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid $border;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba($text, 0.1);
  position: relative;
  overflow: hidden;
}

.chat-head-item:hover .avatar {
  transform: scale(1.05);
  border-color: $emphasis1;
  box-shadow: 0 6px 20px rgba($emphasis1, 0.2);
}

.chat-head-item.active .avatar {
  border-color: $emphasis1;
  box-shadow: 0 6px 20px rgba($emphasis1, 0.3);
}

.avatar-initials {
  font-size: 18px;
  font-weight: 700;
  color: $text2;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.unread-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #f56c6c 0%, #e74c3c 100%);
  color: white;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 11px;
  min-width: 20px;
  text-align: center;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
  border: 2px solid white;
  animation: pulse 2s infinite;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.conversation-name {
  font-weight: 600;
  color: $text;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.conversation-time {
  font-size: 12px;
  color: $text4;
  font-weight: 500;
  flex-shrink: 0;
}

.conversation-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.last-message {
  font-size: 13px;
  color: $text3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  line-height: 1.4;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  margin-left: 8px;
  flex-shrink: 0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-head-item {
    padding: 12px 16px;
    margin-bottom: 6px;
  }
  
  .avatar {
    width: 44px;
    height: 44px;
  }
  
  .avatar-initials {
    font-size: 16px;
  }
  
  .conversation-name {
    font-size: 14px;
  }
  
  .last-message {
    font-size: 12px;
  }
}
</style>