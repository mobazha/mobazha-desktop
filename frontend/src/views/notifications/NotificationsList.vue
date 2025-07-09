<template>
  <div 
    class="notifications-list-container"
    v-infinite-scroll="onScroll"
    :infinite-scroll-disabled="loading || !hasMore"
    :infinite-scroll-distance="100"
    :infinite-scroll-immediate="false"
  >
    <!-- 通知列表 -->
    <div v-if="notifications.length" class="notifications-list">
      <el-card 
        v-for="(notif, index) in notifications" 
        :key="notif.notification && notif.notification.notificationID ? notif.notification.notificationID : index"
        class="notification-card"
        :class="{ 'unread': !notif.read }"
        shadow="hover"
        @click="handleNotificationClick(notif)"
      >
        <div class="notification-content">
          <!-- 通知图标/头像 -->
          <div class="notification-avatar">
            <div v-if="isOrderNotification(notif)" class="crypto-icon">
              <el-icon :size="24">
                <Coin />
              </el-icon>
            </div>
            <div v-else class="avatar-container">
              <el-avatar 
                :size="40"
                :src="getAvatarSrc(notif.notification ? (notif.notification.thumbnail || notif.notification.avatarHashes || {}) : {})"
                :style="getAvatarStyle(notif.notification ? (notif.notification.thumbnail || notif.notification.avatarHashes || {}) : {})"
              >
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
          </div>

          <!-- 通知内容 -->
          <div class="notification-body">
            <div class="notification-message" v-html="getNotificationText(notif)"></div>
            <div class="notification-time">{{ getTimeAgo(notif.timestamp) }}</div>
          </div>

          <!-- 未读标识 -->
          <div v-if="!notif.read" class="unread-indicator">
            <el-badge is-dot />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && !fetchFailed" class="empty-state">
      <el-empty 
        :description="$t('notifications.noResults')"
        :image-size="120"
      >
        <template #image>
          <el-icon :size="60" class="empty-icon">
            <Bell />
          </el-icon>
        </template>
      </el-empty>
    </div>

    <!-- 初始加载状态 -->
    <div v-if="loading && !notifications.length" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 错误状态 -->
    <div v-if="fetchFailed" class="error-container">
      <el-result 
        icon="error" 
        :title="$t('notifications.errorHeading')"
        :sub-title="fetchError"
      >
        <template #extra>
          <el-button type="primary" @click="loadNotifications(true)">
            {{$t('notifications.btnRetry')}}
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 加载更多状态 -->
    <div v-if="loading && notifications.length" class="load-more-loading">
      <el-skeleton :rows="2" animated />
    </div>

    <!-- 没有更多数据提示 -->
    <div v-if="!hasMore && notifications.length && !loading" class="no-more-data">
      <el-divider>
        <span class="no-more-text">{{$t('notifications.noMoreData')}}</span>
      </el-divider>
    </div>
  </div>
</template>

<script>
import { myGet } from '../../api/api';
import { getNotifDisplayData } from '../../../backbone/collections/Notifications';
import { User, Bell, Coin } from '@element-plus/icons-vue';
import { getSocket } from '../../../backbone/utils/serverConnect';
import moment from 'moment';

export default {
  components: {
    User,
    Bell,
    Coin
  },
  
  props: {
    options: {
      type: Object,
      default: () => ({
        filter: '',
        scrollContainer: undefined,
      }),
    },
  },
  
  data() {
    return {
      notifications: [],
      total: 0,
      loading: false,
        fetchFailed: false,
        fetchError: '',
      noResults: false,
      notifsPerFetch: 20,
      hasMore: true,
      lastOffsetID: '',
      socket: null,
    };
  },
  
  created() {
    this.loadNotifications(true);
    // 实时通知监听
    const socket = getSocket();
    if (socket) {
      this.socket = socket;
      socket.on('message', (e) => {
          if (e.jsonData.notification && e.jsonData.notification.type !== 'unfollow') {
            const { type } = e.jsonData.notification;
            const filters = (this.options.filter || '')
              .split(',')
              .filter((filter) => filter.trim().length)
              .map((filter) => filter.trim());
            if (!filters.length || filters.indexOf(type) > -1) {
            // 新通知插入最前面
            this.notifications.unshift({
              ...e.jsonData,
                read: false,
                timestamp: new Date().toISOString(),
            });
            this.total += 1;
            this.noResults = false;
          }
        }
      });
    }
  },
  
  beforeUnmount() {
    // 可选：移除 socket 监听，防止内存泄漏
    if (this.socket) {
      this.socket.off && this.socket.off('message');
    }
  },
  
  methods: {
    async loadNotifications(isFirstPage = false) {
      if (this.loading) return;
      this.loading = true;
      this.fetchFailed = false;
      this.fetchError = '';
      this.noResults = false;
      const params = {
        limit: this.notifsPerFetch,
      };
      if (!isFirstPage && this.lastOffsetID) {
        params.offsetID = this.lastOffsetID;
      }
      if (this.options.filter) {
        params.filter = this.options.filter;
      }
      try {
        // 将 jQuery Deferred 转换为 Promise
        const deferred = myGet('/v1/ob/notifications', params);
        const data = await new Promise((resolve, reject) => {
          deferred.then((...args) => resolve(args[0])).catch(reject);
        });
        
        if (isFirstPage) {
          this.notifications = data.notifications || [];
        } else {
          this.notifications = this.notifications.concat(data.notifications || []);
        }
        this.total = data.total || 0;
        this.hasMore = this.notifications.length < this.total;
        if (data.notifications && data.notifications.length > 0) {
          this.lastOffsetID = data.notifications[data.notifications.length - 1].notification.notificationID;
        }
        this.noResults = this.notifications.length === 0;
      } catch (error) {
        this.fetchFailed = true;
        this.fetchError = error?.message || '加载失败';
      } finally {
        this.loading = false;
      }
    },

    onScroll() {
      if (this.loading || !this.hasMore) return;
      this.loadNotifications(false);
    },

    getNotificationText(notif) {
      const notification = notif.notification;
      if (!notification) return '未知通知';
      try {
        const displayData = getNotifDisplayData(notification);
        return displayData.text;
      } catch {
        return '新通知';
      }
    },

    getTimeAgo(timestamp) {
      return moment ? moment(timestamp).fromNow() : '';
    },

    getAvatarSrc(avatarHashes) {
      if (avatarHashes && avatarHashes.tiny) {
        return `data:image/jpeg;base64,${avatarHashes.tiny}`;
      }
      return '';
    },

    getAvatarStyle(avatarHashes) {
      if (!avatarHashes || !avatarHashes.tiny) {
        return {
          backgroundColor: 'var(--el-color-primary)',
          color: 'white'
        };
      }
      return {};
    },

    isOrderNotification(notif) {
      const notification = notif.notification;
      if (!notification) return false;
      return !!notification.orderID || !!notification.purchaseOrderID || !!notification.disputeCaseId;
    },

    handleNotificationClick(notif) {
      if (!notif || !notif.notification) return;
      // 标记为已读等逻辑可补充
      const displayData = getNotifDisplayData(notif.notification);
      if (displayData.route) {
        location.hash = displayData.route;
        this.$emit('notifNavigate');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.notifications-list-container {
  // 设置最大高度和滚动，因为这里有无限滚动逻辑
  max-height: 400px;
  overflow-y: auto;
  
  // 自定义滚动条样式 - 符合设计规范
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(220, 225, 230, 0.2);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 3px;
    transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      background: rgba(102, 126, 234, 0.5);
    }
  }
  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 6px; // 使用gap替代margin-bottom，更紧凑的间距
    
    .notification-card {
      cursor: pointer;
      // 符合设计规范的卡片样式
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(220, 225, 230, 0.4);
      border-radius: 10px; // 符合设计规范的圆角
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); // 设计规范指定的缓动函数
      
      // 移除默认的card样式
      :deep(.el-card__body) {
        padding: 12px 16px; // 减少内边距使更紧凑
      }
      
      &:hover {
        transform: translateY(-1px); // 符合设计规范的轻微上浮
        box-shadow: 0 4px 16px rgba(100, 115, 135, 0.15);
        background: rgba(255, 255, 255, 0.95);
      }
      
      &.unread {
        border-left: 3px solid #667eea; // 使用设计规范的主色调
        background: rgba(102, 126, 234, 0.05);
        
        &:hover {
          background: rgba(102, 126, 234, 0.08);
        }
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px; // 减少间距
        
        .notification-avatar {
          flex-shrink: 0;
          
          .crypto-icon {
            width: 36px; // 减少头像尺寸
            height: 36px;
  display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 50%;
            color: #667eea;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .avatar-container {
            .el-avatar {
              width: 36px; // 统一头像尺寸
              height: 36px;
              border: 2px solid rgba(220, 225, 230, 0.4);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
          }
        }
        
        .notification-body {
          flex: 1;
          min-width: 0;
          
          .notification-message {
            font-size: 13px; // 略微减小字体
            color: #2d3748;
            margin-bottom: 2px; // 减少间距
            line-height: 1.4;
            // 限制显示行数，避免过长
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .notification-time {
            font-size: 11px; // 减小时间字体
            color: #8892a6;
            font-weight: 500;
          }
        }
        
        .unread-indicator {
          flex-shrink: 0;
          
          :deep(.el-badge__content) {
            background: #667eea;
          }
        }
      }
    }
  }
  
  // 状态组件样式优化
  .empty-state {
    padding: 32px 16px; // 减少padding
    text-align: center;
    
    .empty-icon {
      color: #8892a6;
    }
    
    :deep(.el-empty__description) {
      color: #556080;
      font-size: 13px;
    }
  }
  
  .loading-container {
    padding: 16px; // 减少padding
    
    :deep(.el-skeleton__item) {
      background: linear-gradient(90deg, rgba(220, 225, 230, 0.2) 25%, rgba(220, 225, 230, 0.4) 50%, rgba(220, 225, 230, 0.2) 75%);
    }
  }
  
  .error-container {
    padding: 16px;
    
    :deep(.el-result) {
      .el-result__title {
        font-size: 16px;
        color: #2d3748;
      }
      
      .el-result__subtitle {
        font-size: 13px;
        color: #556080;
      }
    }
  }
  
  .load-more-loading {
    padding: 12px;
    text-align: center;
  }
  
  .no-more-data {
    padding: 16px;
    text-align: center;
    
    .no-more-text {
      color: #8892a6;
      font-size: 11px;
      font-weight: 500;
    }
    
    :deep(.el-divider__text) {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(4px);
    }
  }
}

// 悬停时头像动画
.notification-card:hover {
  .notification-avatar {
    .crypto-icon {
      transform: scale(1.05);
      background: rgba(102, 126, 234, 0.15);
    }
    
    .avatar-container .el-avatar {
      transform: scale(1.05);
      border-color: #667eea;
    }
  }
}

// 响应式设计 - 移动端进一步紧凑
@media (max-width: 768px) {
  .notifications-list-container {
    max-height: 350px; // 移动端较小的最大高度
    
    // 移动端滚动条样式优化
    &::-webkit-scrollbar {
      width: 4px; // 更细的滚动条
    }
    
    .notifications-list {
      gap: 4px; // 移动端更紧凑的间距
      
      .notification-card {
        :deep(.el-card__body) {
          padding: 10px 12px; // 移动端更小的内边距
        }
        
        .notification-content {
          gap: 8px; // 减少移动端间距
          
          .notification-avatar {
            .crypto-icon,
            .avatar-container .el-avatar {
              width: 32px; // 移动端更小的头像
              height: 32px;
            }
          }
          
          .notification-body {
            .notification-message {
              font-size: 12px;
              -webkit-line-clamp: 1; // 移动端只显示一行
            }
            
            .notification-time {
              font-size: 10px;
            }
          }
        }
      }
    }
    
    .empty-state {
      padding: 24px 12px;
    }
    
    .loading-container,
    .error-container {
      padding: 12px;
    }
  }
}

// 深色主题适配
@media (prefers-color-scheme: dark) {
  .notifications-list-container {
    // 深色主题滚动条样式
    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(102, 126, 234, 0.4);
      
      &:hover {
        background: rgba(102, 126, 234, 0.6);
      }
    }
    
    .notifications-list {
      .notification-card {
        background: rgba(45, 55, 72, 0.8);
        border-color: rgba(255, 255, 255, 0.1);
        
        &:hover {
          background: rgba(45, 55, 72, 0.95);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        
        &.unread {
          border-left-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          
          &:hover {
            background: rgba(102, 126, 234, 0.15);
          }
        }
        
        .notification-content {
          .notification-body {
            .notification-message {
              color: #f7fafc;
            }
            
            .notification-time {
              color: #a0aec0;
            }
          }
        }
      }
    }
    
    .empty-state {
      :deep(.el-empty__description) {
        color: #a0aec0;
      }
    }
  }
}
</style>
