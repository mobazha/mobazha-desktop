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
        <h3>聊天</h3>
        <el-button type="text" @click="closeChat" class="close-btn">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <!-- 聊天主体区域 -->
      <div class="chat-body">
        <!-- 左侧会话列表 -->
        <div class="conversations-sidebar">
          <div class="conversations-list">
            <div 
              v-for="conversation in conversations" 
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
                <div class="conversation-name">{{ conversation.peerID }}</div>
                <div class="conversation-last-message" v-html="conversation.lastMessage"></div>
              </div>
              
              <div class="conversation-time">
                {{ formatTime(conversation.timestamp) }}
              </div>
            </div>
            
            <div v-if="loading" class="loading-container">
              <el-loading />
            </div>
            
            <div v-if="error" class="error-container">
              <el-alert :title="error" type="error" show-icon />
            </div>
            
            <div v-if="conversations.length === 0 && !loading" class="no-conversations">
              <el-empty description="暂无会话" />
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
            <el-empty description="选择一个会话开始聊天" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import { ElButton, ElIcon, ElAvatar, ElBadge, ElLoading, ElAlert, ElEmpty } from 'element-plus';
import { ChatDotRound, Close } from '@element-plus/icons-vue';
import ChatMessages from './ChatMessages.vue';
import moment from 'moment';
import { getAvatarBgImage } from '../../../backbone/utils/responsive';

export default {
  name: 'ChatContainer',
  components: {
    ElButton,
    ElIcon,
    ElAvatar,
    ElBadge,
    ElLoading,
    ElAlert,
    ElEmpty,
    ChatMessages,
    ChatDotRound,
    Close
  },
  setup() {
    const chatStore = useChatStore();
    const isOpen = ref(false);
    const debug = ref(false);
    
    // 计算属性
    const conversations = computed(() => chatStore.conversations);
    const currentConversation = computed(() => chatStore.currentConversation);
    const currentMessages = computed(() => chatStore.currentMessages);
    const unreadCount = computed(() => chatStore.unreadCount);
    const loading = computed(() => chatStore.loading);
    const error = computed(() => chatStore.error);
    
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
    
    // 生命周期
    onMounted(async () => {
      await chatStore.fetchConversations();
      
      // 开发模式下启用debug
      if (import.meta.env.DEV) {
        debug.value = true;
      }
    });
    
    return {
      isOpen,
      debug,
      conversations,
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
      formatTime
    };
  }
};
</script>

<style scoped>
.chat-container {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 1000;
}

.chat-container .chat-icon-container {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.3);
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
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
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(228, 231, 237, 0.8);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1001;
  backdrop-filter: blur(10px);
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
  border-bottom: 1px solid rgba(228, 231, 237, 0.6);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
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
  color: #1e293b;
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
  color: #64748b;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.chat-container .chat-main-container .chat-header .close-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  transform: scale(1.1);
}

.chat-container .chat-main-container .chat-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-container .chat-main-container .chat-body .conversations-sidebar {
  width: 320px;
  border-right: 1px solid rgba(228, 231, 237, 0.6);
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
}

@media (max-width: 768px) {
  .chat-container .chat-main-container .chat-body .conversations-sidebar {
    width: 100%;
    border-right: none;
  }
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list {
  height: 100%;
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
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: rgba(64, 158, 255, 0.2);
  transform: translateX(4px);
}

.chat-container .chat-main-container .chat-body .conversations-sidebar .conversations-list .conversation-item.active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
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
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
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
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1e293b;
  font-size: 14px;
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
  background: #ffffff;
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
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
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