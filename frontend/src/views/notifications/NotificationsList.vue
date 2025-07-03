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
      return this.$moment ? this.$moment(timestamp).fromNow() : '';
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
  overflow-y: auto;
  max-height: 400px;
  // 保证只有这一层有滚动条
  .notifications-list {
    .notification-card {
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid var(--el-border-color-light);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      &.unread {
        border-left: 4px solid var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .notification-avatar {
          flex-shrink: 0;
          
          .crypto-icon {
            width: 40px;
            height: 40px;
  display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--el-color-primary-light-8);
            border-radius: 50%;
            color: var(--el-color-primary);
          }
          
          .avatar-container {
            .el-avatar {
              border: 2px solid var(--el-border-color-light);
            }
          }
        }
        
        .notification-body {
          flex: 1;
          min-width: 0;
          
          .notification-message {
            font-size: 14px;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
            line-height: 1.4;
          }
          
          .notification-time {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
        
        .unread-indicator {
          flex-shrink: 0;
        }
      }
    }
  }
  
  .empty-state {
    padding: 40px 20px;
    text-align: center;
    
    .empty-icon {
      color: var(--el-text-color-placeholder);
    }
  }
  
  .loading-container {
    padding: 20px;
  }
  
  .error-container {
    padding: 20px;
  }
  
  .load-more-loading {
    padding: 20px;
    text-align: center;
  }
  
  .no-more-data {
    padding: 20px;
    text-align: center;
    
    .no-more-text {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .notifications-list-container {
    .notifications-list {
      .notification-card {
        .notification-content {
          gap: 8px;
          
          .notification-avatar {
            .crypto-icon,
            .avatar-container .el-avatar {
              width: 32px;
              height: 32px;
            }
          }
          
          .notification-body {
            .notification-message {
              font-size: 13px;
            }
            
            .notification-time {
              font-size: 11px;
            }
          }
        }
      }
    }
  }
}
</style>
