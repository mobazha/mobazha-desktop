<template>
  <div class="notifications-container">
    <!-- 标题 -->
    <div class="notifications-header">
      <h1>{{ ob.polyT('notifications.title') }}</h1>
    </div>

    <!-- 标签页 -->
    <div class="notifications-tabs">
      <el-tabs v-model="activeTab" @tab-click="onClickTab">
        <el-tab-pane 
          v-for="tab in tabs" 
          :key="tab.key"
          :label="ob.polyT(`notifications.tab${capitalize(tab.key)}`)" 
          :name="tab.key"
        />
      </el-tabs>
    </div>

    <!-- 通知列表容器 -->
    <div 
      v-infinite-scroll="onScroll" 
      ref="tabContainer" 
      class="notifications-list-container"
    >
      <NotificationsList 
        :key="activeTab" 
        ref="notifLists" 
        :options="{ filter, scrollContainer }" 
        @notifNavigate="$emit('notifNavigate', { list })" 
      />
    </div>
  </div>
</template>

<script>
import $ from 'jquery';
import app from '../../../backbone/app';
import { myPost } from '../../api/api';
import { capitalize } from '../../../backbone/utils/string';
import { recordEvent } from '../../../backbone/utils/metrics';

import NotificationsList from './NotificationsList.vue';

export default {
  components: {
    NotificationsList,
  },
  
  props: {
    options: {
      type: Object,
      default: {},
    },
    bb: Function,
  },
  
  data() {
    return {
      activeTab: 'all',
      list: 'all',
      tabs: [
        { key: 'all', name: 'all' },
        { key: 'orders', name: 'orders' },
        { key: 'followers', name: 'followers' }
      ]
    };
  },
  
  created() {
    // 移除 initEventChain 调用，因为不再使用 Backbone
  },
  
  mounted() {},
  
  computed: {
    filter() {
      switch (this.activeTab) {
        case 'orders':
          this.list = 'order';
          return (
            'order,orderDeclined,cancel,refund,fulfillment,orderComplete,disputeOpen,' +
            'disputeUpdate,disputeClose,disputeAccepted,vendorDisputeTimeout,buyerDisputeTimeout' +
            'buyerDisputeExpiry,moderatorDisputeExpiry'
          );
        case 'followers':
          this.list = 'follow';
          return 'follow';
        default:
          this.list = 'all';
          return '';
      }
    },

    scrollContainer() {
      return $('.notifications-list-container');
    },
  },
  
  methods: {
    onScroll() {
      // 直接调用 NotificationsList 的 onScroll 方法
      if (this.$refs.notifLists && this.$refs.notifLists.onScroll) {
        this.$refs.notifLists.onScroll();
      }
    },
    
    capitalize,

    loadData() {
      this.activeTab = this.options.tab;
    },

    onClickTab(tab) {
      recordEvent('Notifications_Tab', { tab: tab.name });
      // Timeout needed so event can bubble to a page nav handler before the view is re-rendered
      // and the target element is ripped out of the dom.
      setTimeout(() => {
        this.activeTab = tab.name;
      });
    },

    /**
     * If there are any loaded notifications, this method will kick off a server
     * call that will mark all notifications (seen and unseen) as read. If there
     * are no loaded notifications (possibly because a initial page is being fetched),
     * it will return false and not kick off any server call.
     * @return {boolean|object} False if no notifications have been loaded, otherwise
     *   the xhr of the call to the server
     */
    markNotifsAsRead() {
      // 通知列表会自动更新状态
      return myPost(app.getServerUrl('ob/marknotificationsasread'));
    },

    /**
     * Will set the tab to 'All' and set the scroll position to the top - useful
     * when hiding the menu so that it resets to a standard initial position. It will
     * leave the collections intact, so the user won't need to fetch notifications
     * already fetched.
     */
    reset() {
      this.activeTab = 'all';
      if (this.scrollContainer) {
        this.scrollContainer.scrollTop = 0;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.notifications-container {
  // 符合设计规范的半透明+毛玻璃效果
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(220, 225, 230, 0.6);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(100, 115, 135, 0.15);
  overflow: hidden;
  
  .notifications-header {
    padding: 16px 20px 8px; // 减少上下间距
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border-bottom: 1px solid rgba(220, 225, 230, 0.3);
    
    h1 {
      margin: 0;
      font-size: 18px; // 略微减小字体
      font-weight: 600;
      color: #2d3748;
    }
  }
  
  .notifications-tabs {
    padding: 0 20px;
    background: rgba(255, 255, 255, 0.5);
    
    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: 1px solid rgba(220, 225, 230, 0.4);
    }
    
    :deep(.el-tabs__nav-wrap) {
      &::after {
        display: none;
      }
    }
    
    :deep(.el-tabs__item) {
      padding: 8px 16px; // 减少标签页内边距
      font-size: 13px; // 略微减小字体
      font-weight: 500;
      color: #556080;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &.is-active {
        color: #667eea;
        font-weight: 600;
      }
      
      &:hover {
        color: #667eea;
        transform: translateY(-1px);
      }
    }
    
    :deep(.el-tabs__active-bar) {
      background: linear-gradient(135deg, #667eea, #764ba2);
      height: 3px;
    }
  }
  
  .notifications-list-container {
    // 移除固定高度和滚动，让内容自适应
    padding: 12px 20px 16px; // 减少内边距
  }
}

// 响应式设计 - 移动端优化
@media (max-width: 768px) {
  .notifications-container {
    border-radius: 8px;
    
    .notifications-header {
      padding: 12px 16px 6px;
      
      h1 {
        font-size: 16px;
      }
    }
    
    .notifications-tabs {
      padding: 0 16px;
      
      :deep(.el-tabs__item) {
        padding: 6px 12px;
        font-size: 12px;
      }
    }
    
    .notifications-list-container {
      padding: 8px 16px 12px;
      // 移除 max-height，让 NotificationsList 组件处理
    }
  }
}

// 深色主题适配
@media (prefers-color-scheme: dark) {
  .notifications-container {
    background: rgba(45, 55, 72, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    
    .notifications-header {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border-bottom-color: rgba(255, 255, 255, 0.1);
      
      h1 {
        color: #f7fafc;
      }
    }
    
    .notifications-tabs {
      background: rgba(45, 55, 72, 0.5);
      
      :deep(.el-tabs__header) {
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }
      
      :deep(.el-tabs__item) {
        color: #a0aec0;
        
        &.is-active,
        &:hover {
          color: #667eea;
        }
      }
    }
  }
}
</style>
