import { createApp } from 'vue';
import ChatContainer from '../components/chat/ChatContainer.vue';
import { getSocket } from '../../backbone/utils/serverConnect';
import i18n from '../i18n';

export default {
  install(app, options = {}) {
    // 创建聊天容器
    const chatContainer = document.createElement('div');
    chatContainer.id = 'vue-chat-container';
    document.body.appendChild(chatContainer);
    
    // 创建聊天应用实例
    const chatApp = createApp(ChatContainer);
    
    // 使用相同的store和i18n
    chatApp.use(app.config.globalProperties.$store);
    chatApp.use(i18n);
    
    // 挂载聊天应用
    const chatInstance = chatApp.mount(chatContainer);
    
    // 初始化WebSocket连接
    const socket = getSocket();
    if (socket) {
      app.config.globalProperties.$store.dispatch('chat/initSocket', socket);
    }
    
    // 提供全局方法
    app.config.globalProperties.$chat = {
      // 打开聊天
      open() {
        chatInstance.openChat();
      },
      
      // 关闭聊天
      close() {
        chatInstance.closeChat();
      },
      
      // 发送消息
      async sendMessage(peerID, message) {
        return await app.config.globalProperties.$store.dispatch('chat/sendMessage', {
          peerID,
          message
        });
      },
      
      // 获取会话列表
      async getConversations() {
        return await app.config.globalProperties.$store.dispatch('chat/fetchConversations');
      },
      
      // 选择会话
      selectConversation(conversation) {
        app.config.globalProperties.$store.dispatch('chat/setCurrentConversation', conversation);
      },
      
      // 获取未读消息数
      getUnreadCount() {
        return app.config.globalProperties.$store.getters['chat/unreadCount'];
      },
      
      // 标记会话为已读
      async markAsRead(peerID) {
        return await app.config.globalProperties.$store.dispatch('chat/markAsRead', peerID);
      }
    };
    
    // 提供全局属性
    app.config.globalProperties.$chatInstance = chatInstance;
    
    // 在组件销毁时清理
    app.unmount = () => {
      chatApp.unmount();
      document.body.removeChild(chatContainer);
    };
  }
};