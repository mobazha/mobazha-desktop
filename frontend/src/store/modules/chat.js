import DOMPurify from 'dompurify';
import twemoji from 'twemoji';
import { getEmojiByName } from '../../../backbone/data/emojis';
import chatService from '../../services/chatService';

// 消息处理函数
function processMessage(message) {
  if (typeof message !== 'string') {
    throw new Error('Please provide a message as a string.');
  }

  let processedMessage = message;

  // 处理emoji占位符
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

  // 转换emoji为图片
  processedMessage = twemoji.parse(
    processedMessage,
    (icon) => (`../imgs/emojis/72X72/${icon}.png`),
  );

  return processedMessage;
}

const state = {
  conversations: [], // 聊天会话列表
  currentConversation: null, // 当前会话
  messages: {}, // 消息列表，按peerID分组
  unreadCount: 0, // 总未读消息数
  loading: false,
  error: null,
  typing: {}, // 正在输入状态
  socket: null, // WebSocket连接
};

const mutations = {
  SET_CONVERSATIONS(state, conversations) {
    state.conversations = conversations;
  },
  
  ADD_CONVERSATION(state, conversation) {
    const existingIndex = state.conversations.findIndex(c => c.peerID === conversation.peerID);
    if (existingIndex >= 0) {
      state.conversations.splice(existingIndex, 1);
    }
    state.conversations.unshift(conversation);
  },
  
  UPDATE_CONVERSATION(state, { peerID, updates }) {
    const conversation = state.conversations.find(c => c.peerID === peerID);
    if (conversation) {
      Object.assign(conversation, updates);
    }
  },
  
  SET_CURRENT_CONVERSATION(state, conversation) {
    state.currentConversation = conversation;
  },
  
  SET_MESSAGES(state, { peerID, messages }) {
    state.messages = {
      ...state.messages,
      [peerID]: [...messages]
    };
  },
  
  ADD_MESSAGE(state, { peerID, message }) {
    if (!state.messages[peerID]) {
      state.messages[peerID] = [];
    }
    state.messages[peerID].push(message);
  },
  
  UPDATE_MESSAGE(state, { peerID, messageID, updates }) {
    if (state.messages[peerID]) {
      const message = state.messages[peerID].find(m => m.messageID === messageID);
      if (message) {
        Object.assign(message, updates);
      }
    }
  },
  
  SET_UNREAD_COUNT(state, count) {
    state.unreadCount = count;
  },
  
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  
  SET_ERROR(state, error) {
    state.error = error;
  },
  
  SET_TYPING(state, { peerID, isTyping }) {
    state.typing[peerID] = isTyping;
  },
  
  SET_SOCKET(state, socket) {
    state.socket = socket;
  },
  
  MARK_CONVERSATION_AS_READ(state, peerID) {
    const conversation = state.conversations.find(c => c.peerID === peerID);
    if (conversation) {
      conversation.unread = 0;
    }
    
    // 更新总未读数
    const totalUnread = state.conversations.reduce((total, conv) => total + (conv.unread || 0), 0);
    state.unreadCount = totalUnread;
  }
};

const actions = {
  // 获取聊天会话列表
  async fetchConversations({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await chatService.getConversations();
      const conversations = response.map(conv => ({
        ...conv,
        lastMessage: processMessage(DOMPurify.sanitize(conv.lastMessage || ''))
      }));
      
      commit('SET_CONVERSATIONS', conversations);
      
      // 计算总未读数
      const totalUnread = conversations.reduce((total, conv) => total + (conv.unread || 0), 0);
      commit('SET_UNREAD_COUNT', totalUnread);
      
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to fetch conversations');
      console.error('Failed to fetch conversations:', error);
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // 获取指定会话的消息
  async fetchMessages({ commit }, peerID) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await chatService.getMessages(peerID);
      const messages = response.map(msg => ({
        ...msg,
        processedMessage: processMessage(msg.message || '')
      }));
      
      // 按时间戳升序排序 (旧消息在前)
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      commit('SET_MESSAGES', { peerID, messages });
      
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to fetch messages');
      console.error('Failed to fetch messages:', error);
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // 发送消息
  async sendMessage({ commit, state }, { peerID, message, file = null, orderID = '' }) {
    try {
      let response;
      
      if (file) {
        // 发送文件消息
        response = await chatService.sendMessage(peerID, message || '', orderID, file);
      } else {
        // 发送文本消息
        response = await chatService.sendMessage(peerID, message, orderID);
      }
      
      const newMessage = {
        ...response,
        processedMessage: file ? '' : processMessage(message),
        outgoing: true,
        timestamp: Date.now(),
        file: file || null
      };
      
      commit('ADD_MESSAGE', { peerID, message: newMessage });
      
      // 更新会话的最后消息
      const lastMessageText = file ? `[图片] ${file.filename || 'image'}` : newMessage.processedMessage;
      commit('UPDATE_CONVERSATION', {
        peerID,
        updates: {
          lastMessage: lastMessageText,
          timestamp: newMessage.timestamp,
          unread: 0
        }
      });
      
      // 更新总未读数
      const totalUnread = state.conversations.reduce((total, conv) => total + (conv.unread || 0), 0);
      commit('SET_UNREAD_COUNT', totalUnread);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },
  
  // 标记会话为已读
  async markAsRead({ commit }, peerID) {
    try {
      await chatService.markAsRead(peerID);
      commit('MARK_CONVERSATION_AS_READ', peerID);
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      throw error;
    }
  },
  
  // 设置当前会话
  setCurrentConversation({ commit, dispatch }, conversation) {
    commit('SET_CURRENT_CONVERSATION', conversation);
    
    if (conversation && conversation.peerID) {
      // 获取消息历史
      dispatch('fetchMessages', conversation.peerID);
      
      // 标记为已读
      if (conversation.unread > 0) {
        dispatch('markAsRead', conversation.peerID);
      }
    }
  },
  
  // 处理新消息
  handleNewMessage({ commit, state }, message) {
    if (!message || message.orderID) return; // 跳过订单相关消息
    
    const { peerID } = message;
    const processedMessage = processMessage(message.message);
    
    const newMessage = {
      ...message,
      processedMessage,
      timestamp: message.timestamp || Date.now()
    };
    
    commit('ADD_MESSAGE', { peerID, message: newMessage });
    
    // 更新或添加会话
    const existingConversation = state.conversations.find(c => c.peerID === peerID);
    if (existingConversation) {
      commit('UPDATE_CONVERSATION', {
        peerID,
        updates: {
          lastMessage: processedMessage,
          timestamp: newMessage.timestamp,
          unread: message.outgoing ? 0 : (existingConversation.unread || 0) + 1
        }
      });
    } else {
      commit('ADD_CONVERSATION', {
        peerID,
        lastMessage: processedMessage,
        timestamp: newMessage.timestamp,
        unread: message.outgoing ? 0 : 1
      });
    }
    
    // 更新总未读数
    const totalUnread = state.conversations.reduce((total, conv) => total + (conv.unread || 0), 0);
    commit('SET_UNREAD_COUNT', totalUnread);
  },
  
  // 初始化WebSocket连接
  initSocket({ commit, dispatch }, socket) {
    commit('SET_SOCKET', socket);
    
    if (socket) {
      socket.on('message', (e) => {
        if (e.jsonData && e.jsonData.chatMessage) {
          dispatch('handleNewMessage', e.jsonData.chatMessage);
        }
      });
    }
  }
};

const getters = {
  conversations: state => state.conversations,
  currentConversation: state => state.currentConversation,
  messages: state => peerID => state.messages[peerID] || [],
  unreadCount: state => state.unreadCount,
  loading: state => state.loading,
  error: state => state.error,
  isTyping: state => peerID => state.typing[peerID] || false,
  hasUnreadMessages: state => state.unreadCount > 0
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};