<template>
  <div class="chat-container" :class="{ 'chat-open': isOpen }">
    <!-- 聊天关闭状态 - 只显示图标 -->
    <div v-if="!isOpen" class="chat-icon-container" @click="openChat">
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="chat-badge">
        <div class="chat-icon">
          <el-icon size="24"><ChatDotRound /></el-icon>
        </div>
      </el-badge>
    </div>

    <!-- 聊天打开状态 - 显示完整聊天界面 -->
    <div v-else class="chat-main-container">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <div class="chat-header-content">
          <h3 v-if="!currentConversation">{{ $t('chat.title') }}</h3>
          
          <!-- 用户信息显示区域 -->
          <div v-if="currentConversation" class="user-info-section">
            <div class="user-details">
              <div class="user-name">
                {{ getUserDisplayName(currentConversation) }}
              </div>
              <div class="user-location">
                {{ currentConversation.profile?.location || $t('userPage.noLocation') }}
                <a class="ratingStrip clickable" 
                   v-if="currentConversation.profile?.stats"
                   @click="goToUserRating(currentConversation.peerID)"
                   :title="$t('chat.userInfo.viewRating')"
                   v-html="formatRating(currentConversation.profile.stats.averageRating, currentConversation.profile.stats.ratingCount)">
                </a>
              </div>
              <div class="user-id">
                <span class="id-label">{{ $t('chat.userInfo.idLabel') }}</span>
                <span class="id-value clickable" @click="goToUserStore(currentConversation.peerID)">
                  {{ currentConversation.peerID }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <el-button type="text" @click="closeChat" class="close-btn">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <!-- 聊天主体区域 -->
      <div class="chat-body">
        <!-- 左侧会话列表 -->
        <div class="conversations-sidebar">
          <!-- 搜索框 -->
          <div class="search-section">
            <div class="search-container">
              <el-input
                v-model="searchQuery"
                :placeholder="$t('chat.conversations.searchPlaceholder')"
                class="search-input"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
          
          <div class="conversations-list">
            <div 
              v-for="conversation in filteredConversations" 
              :key="conversation.peerID"
              class="conversation-item"
              :class="{ 
                'active': currentConversation?.peerID === conversation.peerID,
                'unread': conversation.unread > 0
              }"
              @click="selectConversation(conversation)"
            >
              <div class="conversation-avatar">
                <div 
                  class="avatar-disc" 
                  :style="getAvatarStyle(conversation)"
                  :title="conversation.profile?.handle || conversation.peerID"
                >
                  <span v-if="!getAvatarUrl(conversation)" class="avatar-initials">
                    {{ getInitials(conversation.peerID) }}
                  </span>
                </div>
                <div v-if="conversation.unread > 0" class="unread-badge">
                  {{ conversation.unread > 99 ? '99+' : conversation.unread }}
                </div>
              </div>
              
              <div class="conversation-info">
                <div class="conversation-name">{{ getUserDisplayName(conversation) }}</div>
                <div class="conversation-last-message" v-html="conversation.lastMessage"></div>
              </div>
              
              <div class="conversation-time">
                {{ formatTime(conversation.timestamp) }}
              </div>
            </div>
            
            <div v-if="loading" class="loading-container" v-loading="loading">
              <div class="loading-content">
                <div class="loading-text">{{ $t('chat.loading') }}</div>
              </div>
            </div>
            
            <div v-if="error" class="error-container">
              <el-alert :title="error" type="error" show-icon />
            </div>
            
            <div v-if="filteredConversations.length === 0 && !loading" class="no-conversations">
              <el-empty :description="searchQuery ? $t('chat.conversations.noMatchingConversations') : $t('chat.conversations.noConversations')" />
            </div>
          </div>
        </div>

        <!-- 右侧聊天区域 -->
        <div class="chat-messages-area">
          <div v-if="currentConversation" class="messages-container">
            <ChatMessages 
              :conversation="currentConversation"
              :messages="currentMessages"
              :debug="debug"
              @send-message="sendMessage"
              @close="closeChat"
            />
          </div>
          
          <!-- 未选择会话时的提示 -->
          <div v-else class="no-conversation-selected">
            <el-empty :description="$t('chat.conversations.selectConversation')" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChatStore } from '@/stores/chat';
import { ElButton, ElIcon, ElAvatar, ElBadge, ElAlert, ElEmpty, ElInput } from 'element-plus';
import { ChatDotRound, Close, Search } from '@element-plus/icons-vue';
import ChatMessages from './ChatMessages.vue';
import moment from 'moment';
import { getAvatarBgImage } from '../../../backbone/utils/responsive';
import { formatRating } from '../../../backbone/utils/templateHelpers';

export default {
  name: 'ChatContainer',
  components: {
    ElButton,
    ElIcon,
    ElAvatar,
    ElBadge,
    ElAlert,
    ElEmpty,
    ElInput,
    ChatMessages,
    ChatDotRound,
    Close,
    Search
  },
  setup() {
    const { t } = useI18n();
    const chatStore = useChatStore();
    const isOpen = ref(false);
    const debug = ref(false);
    const searchQuery = ref('');
    
    // 计算属性
    const conversations = computed(() => chatStore.conversations);
    const currentConversation = computed(() => chatStore.currentConversation);
    const currentMessages = computed(() => chatStore.currentMessages);
    const unreadCount = computed(() => chatStore.unreadCount);
    const loading = computed(() => chatStore.loading);
    const error = computed(() => chatStore.error);
    
    // 过滤后的会话列表
    const filteredConversations = computed(() => {
      if (!searchQuery.value.trim()) {
        return conversations.value;
      }
      
      const query = searchQuery.value.toLowerCase().trim();
      return conversations.value.filter(conversation => {
        const userName = getUserDisplayName(conversation).toLowerCase();
        const userID = conversation.peerID.toLowerCase();
        const userLocation = (conversation.profile?.location || '').toLowerCase();
        
        return userName.includes(query) || 
               userID.includes(query) || 
               userLocation.includes(query);
      });
    });
    
    // 方法
    const openChat = () => {
      isOpen.value = true;
    };
    
    const closeChat = () => {
      isOpen.value = false;
    };
    
    const selectConversation = async (conversation) => {
      await chatStore.setCurrentConversationAndFetch(conversation);
    };
    
    const sendMessage = async (message, file = null) => {
      if (!currentConversation.value) return;
      
      try {
        await chatStore.sendMessage(
          currentConversation.value.peerID,
          message,
          file
        );
      } catch (error) {
        console.error('发送消息失败:', error);
      }
    };
    
    const getAvatarUrl = (conversation) => {
      if (conversation.profile && conversation.profile.avatarHashes) {
        return getAvatarBgImage(conversation.profile.avatarHashes, {}, true);
      }
      return null;
    };
    
    const getAvatarStyle = (conversation) => {
      if (conversation.profile && conversation.profile.avatarHashes) {
        return getAvatarBgImage(conversation.profile.avatarHashes);
      }
      return '';
    };
    
    const getInitials = (peerID) => {
      return peerID.substring(0, 2).toUpperCase();
    };
    
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      return moment(timestamp).fromNow();
    };
    
    // 获取用户显示名称
    const getUserDisplayName = (conversation) => {
      if (conversation.profile?.name) {
        return conversation.profile.name;
      }
      if (conversation.profile?.handle) {
        return `@${conversation.profile.handle}`;
      }
      return conversation.peerID;
    };
    
    // 跳转到用户店铺页面
    const goToUserStore = (peerID) => {
      // 使用backbone路由系统导航到用户页面
      if (window.app && window.app.router) {
        window.app.router.navigate(`${peerID}/store`, { trigger: true });
      } else {
        // 备用方案：直接修改hash
        window.location.hash = `#${peerID}/store`;
      }
    };
    
    // 跳转到用户评价页面
    const goToUserRating = (peerID) => {
      // 使用backbone路由系统导航到用户评价页面
      if (window.app && window.app.router) {
        window.app.router.navigate(`ob://${peerID}/reputation`, { trigger: true });
      } else {
        // 备用方案：直接修改hash
        window.location.hash = `#ob://${peerID}/reputation`;
      }
    };
    
    
    // 生命周期
    onMounted(async () => {
      await chatStore.fetchConversations();
      
      // 开发模式下启用debug
      if (import.meta.env.DEV) {
        debug.value = true;
      }
    });
    
    return {
      t,
      isOpen,
      debug,
      searchQuery,
      conversations,
      filteredConversations,
      currentConversation,
      currentMessages,
      unreadCount,
      loading,
      error,
      openChat,
      closeChat,
      selectConversation,
      sendMessage,
      getAvatarUrl,
      getAvatarStyle,
      getInitials,
      formatTime,
      getUserDisplayName,
      goToUserStore,
      goToUserRating,
      formatRating
    };
  }
};
</script>

<style lang="scss" scoped>
@use "sass:color";
@use '@/assets/scss/variables' as *;

.chat-container {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 1000;
}

.chat-container .chat-icon-container {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba($emphasis1, 0.3);
  border-radius: 50%;
  background: $emphasisGradient;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.chat-container .chat-icon-container:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 8px 30px rgba(64, 158, 255, 0.4);
}

.chat-container .chat-icon-container:active {
  transform: scale(0.95);
}

.chat-container .chat-icon-container .chat-badge {
  position: relative;
}

.chat-container .chat-icon-container .chat-badge .chat-icon {
  width: 100%;
  height: 100%;
  background: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  transition: all 0.2s ease;
}

.chat-container .chat-icon-container .chat-badge .chat-icon:hover {
  background: transparent;
}

.chat-container .chat-icon-container .chat-badge .unread-badge {
  position: absolute;
  top: -8px;
  right: -8px;
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

.chat-container .chat-main-container {
  position: absolute;
  right: 0;
  bottom: 80px;
  width: 900px;
  height: 650px;
  background: $overlayP;
  backdrop-filter: blur(8px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba($text, 0.15);
  border: 1px solid color.adjust($border, $alpha: -0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1001;
  animation: slideInUp 0.3s ease-out;
}

@media (max-width: 768px) {
  .chat-container .chat-main-container {
    width: calc(100vw - 32px);
    height: calc(100vh - 100px);
    right: 16px;
    bottom: 80px;
    border-radius: 16px;
  }
}

.chat-container .chat-main-container .chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid color.adjust($border, $alpha: -0.4);
  background: linear-gradient(180deg, $primary 0%, color.adjust($primary, $lightness: -3%) 100%);
  position: relative;
}

.chat-container .chat-main-container .chat-header .chat-header-content {
  flex: 1;
  display: flex;
  align-items: center;
}

.chat-container .chat-main-container .chat-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(64, 158, 255, 0.2) 50%, transparent 100%);
}

.chat-container .chat-main-container .chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: $text;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-container .chat-main-container .chat-header h3::before {
  content: '💬';
  font-size: 20px;
}

.chat-container .chat-main-container .chat-header .close-btn {
  padding: 8px;
  color: $text3;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.chat-container .chat-main-container .chat-header .close-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  transform: scale(1.1);
}

/* 用户信息区域样式 */
.chat-container .chat-main-container .chat-header .user-info-section {
  display: flex;
  align-items: center;
  flex: 1;
}

.chat-container .chat-main-container .chat-header .user-info-section .user-details {
  flex: 1;
  min-width: 0;
}

.chat-container .chat-main-container .chat-header .user-info-section .user-details .user-name {
  font-size: 18px;
  font-weight: 700;
  color: $text;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.chat-container .chat-main-container .chat-header .user-info-section .user-details .user-location {
  font-size: 13px;
  color: $text3;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chat-container .chat-main-container .chat-header .user-info-section .user-details .user-location::before {
  content: '📍';
  font-size: 12px;
}

.chat-container .chat-main-container .chat-header .user-info-section .user-details .user-id {
  font-size: 12px;
  color: $text3;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-container .chat-main-container .chat-header .user-info-section .user-details .user-id .id-label {
  font-weight: 600;
  color: $text2;
}

.chat-container .chat-main-container .chat-header .user-info-section .user-details .user-id .id-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  user-select: all;
}

.chat-container .chat-main-container .chat-header .user-info-section .user-details .user-id .id-value.clickable:hover {
  background: $emphasis1;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  border-color: $emphasis1;
}

.chat-container .chat-main-container .chat-header .user-info-section .user-details .user-id .id-value.clickable:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.chat-container .chat-main-container .chat-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar {
  width: 320px;
  border-right: 1px solid color.adjust($border, $alpha: -0.4);
  background: linear-gradient(180deg, $primary 0%, color.adjust($primary, $lightness: -3%) 100%);
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 搜索区域样式 */
.search-section {
  padding: 16px;
  border-bottom: 1px solid color.adjust($border, $alpha: -0.4);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
}

.search-container {
  position: relative;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid color.adjust($border, $alpha: -0.6);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(100, 115, 135, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input :deep(.el-input__wrapper):hover {
  border-color: $emphasis1;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: $emphasis1;
  box-shadow: 0 0 0 3px color.adjust($emphasis1, $alpha: -0.9);
}

.search-input :deep(.el-input__inner) {
  color: $text;
  font-size: 14px;
}

.search-input :deep(.el-input__inner)::placeholder {
  color: $text3;
}

.search-input :deep(.el-input__prefix-inner) {
  color: $text3;
}

@media (max-width: 768px) {
  .chat-container .chat-main-container .chat-body .conversations-sidebar {
    width: 100%;
    border-right: none;
  }
  
  .chat-container .chat-main-container .chat-header {
    padding: 16px 20px;
  }
  
  .chat-container .chat-main-container .chat-header .user-info-section {
    gap: 12px;
  }
  
  .chat-container .chat-main-container .chat-header .user-info-section .user-details .user-name {
    font-size: 14px;
  }
  
  .chat-container .chat-main-container .chat-header .user-info-section .user-details .user-location {
    font-size: 12px;
  }
  
  .chat-container .chat-main-container .chat-header .user-info-section .user-details .user-id {
    font-size: 11px;
  }
  
  .chat-container .chat-main-container .chat-header .user-info-section .user-details .user-id .id-value {
    padding: 1px 6px;
    font-size: 10px;
  }
  
  .search-section {
    padding: 12px;
  }
  
  .search-input :deep(.el-input__wrapper) {
    border-radius: 10px;
  }
  
  .search-input :deep(.el-input__inner) {
    font-size: 13px;
  }
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list::-webkit-scrollbar {
  width: 6px;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list::-webkit-scrollbar-track {
  background: transparent;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid transparent;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item:hover {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-color: rgba(64, 158, 255, 0.2);
  transform: translateX(4px) translateY(-1px);
  box-shadow: 0 4px 16px rgba(100, 115, 135, 0.15);
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item.active {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: linear-gradient(180deg, #409eff 0%, #337ecc 100%);
  border-radius: 0 2px 2px 0;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item.unread {
  background: rgba(254, 243, 199, 0.8);
  backdrop-filter: blur(8px);
  border-color: rgba(245, 108, 108, 0.2);
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item .conversation-avatar {
  position: relative;
  margin-right: 16px;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item .conversation-avatar .avatar-disc {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 3px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item .conversation-avatar .avatar-disc .avatar-initials {
  font-size: 16px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item .conversation-avatar .unread-badge {
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

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item .conversation-info {
  flex: 1;
  min-width: 0;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item .conversation-info .conversation-name {
  font-weight: 600;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1e293b;
  font-size: 15px;
  line-height: 1.3;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item .conversation-info .conversation-last-message {
  font-size: 13px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item .conversation-time {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  margin-left: 8px;
}

.chat-container .chat-main-container .chat-body .chat-messages-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
}

.chat-container .chat-main-container .chat-body .chat-messages-area .messages-container {
  flex: 1;
  overflow: hidden;
}

.chat-container .chat-main-container .chat-body .chat-messages-area .no-conversation-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(180deg, #fafbfc 0%, #f4f6f8 100%);
}

.chat-container .chat-main-container .chat-body .chat-messages-area .no-conversation-selected .el-empty .el-empty__description {
  color: #64748b;
  font-size: 16px;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.loading-container .el-loading-spinner .el-loading-text {
  color: #409eff;
  font-weight: 600;
}

.error-container {
  padding: 20px;
}

.error-container .el-alert {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
}

.no-conversations {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.no-conversations .el-empty .el-empty__description {
  color: #64748b;
  font-size: 16px;
}
</style>