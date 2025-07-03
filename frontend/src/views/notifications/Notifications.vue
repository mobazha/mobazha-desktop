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
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  .notifications-header {
    padding: 20px 24px 0;
    
    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
  
  .notifications-tabs {
    padding: 0 24px;
    
    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: 1px solid var(--el-border-color-light);
    }
    
    :deep(.el-tabs__nav-wrap) {
      &::after {
        display: none;
      }
    }
    
    :deep(.el-tabs__item) {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      
      &.is-active {
        color: var(--el-color-primary);
        font-weight: 600;
      }
      
      &:hover {
        color: var(--el-color-primary);
      }
    }
    
    :deep(.el-tabs__active-bar) {
      background-color: var(--el-color-primary);
    }
  }
  
  .notifications-list-container {
    max-height: 400px;
    overflow-y: auto;
    padding: 16px 24px 24px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: var(--el-fill-color-lighter);
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 3px;
      
      &:hover {
        background: var(--el-border-color-darker);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .notifications-container {
    .notifications-header {
      padding: 16px 16px 0;
      
      h1 {
        font-size: 18px;
      }
    }
    
    .notifications-tabs {
      padding: 0 16px;
      
      :deep(.el-tabs__item) {
        font-size: 13px;
        padding: 0 12px;
      }
    }
    
    .notifications-list-container {
      padding: 12px 16px 16px;
      max-height: 350px;
    }
  }
}

// 深色主题适配
@media (prefers-color-scheme: dark) {
  .notifications-container {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}
</style>
