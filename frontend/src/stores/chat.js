import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import DOMPurify from 'dompurify'
import twemoji from 'twemoji'
import { getEmojiByName } from '../../backbone/data/emojis'
import chatService from '../services/chatService'
import { setUnreadChatMsgCount } from '../../backbone/utils/notification'

// 消息处理函数
function processMessage(message) {
  if (typeof message !== 'string') {
    throw new Error('Please provide a message as a string.')
  }

  let processedMessage = message

  // 处理emoji占位符
  const emojiPlaceholderRegEx = new RegExp(':.+?:', 'g')
  const matches = processedMessage.match(emojiPlaceholderRegEx)

  if (matches) {
    matches.forEach((match) => {
      const emoji = getEmojiByName(match)
      if (emoji && emoji.char) {
        processedMessage = processedMessage.replace(match, emoji.char)
      }
    })
  }

  // 清理HTML
  processedMessage = DOMPurify.sanitize(processedMessage)

  // 转换emoji为图片
  processedMessage = twemoji.parse(
    processedMessage,
    (icon) => (`../imgs/emojis/72X72/${icon}.png`),
  )

  return processedMessage
}

export const useChatStore = defineStore('chat', () => {
  // 状态
  const conversations = ref([]) // 聊天会话列表
  const currentConversation = ref(null) // 当前会话
  const messages = ref({}) // 消息列表，按peerID分组
  const unreadCount = ref(0) // 总未读消息数
  const loading = ref(false)
  const error = ref(null)
  const typing = ref({}) // 正在输入状态
  const socket = ref(null) // WebSocket连接

  // 计算属性
  const currentMessages = computed(() => {
    if (!currentConversation.value) return []
    return messages.value[currentConversation.value.peerID] || []
  })

  const hasUnreadMessages = computed(() => unreadCount.value > 0)

  // 方法
  const setConversations = (conversationsList) => {
    conversations.value = conversationsList
  }

  const addConversation = (conversation) => {
    const existingIndex = conversations.value.findIndex(c => c.peerID === conversation.peerID)
    if (existingIndex >= 0) {
      conversations.value.splice(existingIndex, 1)
    }
    conversations.value.unshift(conversation)
  }

  const updateConversation = (peerID, updates) => {
    const conversation = conversations.value.find(c => c.peerID === peerID)
    if (conversation) {
      Object.assign(conversation, updates)
    }
  }

  const setCurrentConversation = (conversation) => {
    currentConversation.value = conversation
  }

  const setMessages = (peerID, messagesList) => {
    messages.value = {
      ...messages.value,
      [peerID]: [...messagesList]
    }
  }

  const addMessage = (peerID, message) => {
    if (!messages.value[peerID]) {
      messages.value[peerID] = []
    }
    messages.value[peerID].push(message)
  }

  const updateMessage = (peerID, messageID, updates) => {
    if (messages.value[peerID]) {
      const message = messages.value[peerID].find(m => m.messageID === messageID)
      if (message) {
        Object.assign(message, updates)
      }
    }
  }

  const setUnreadCount = (count) => {
    unreadCount.value = count
    // 同时更新全局的未读聊天消息数
    setUnreadChatMsgCount(count)
  }

  const setLoading = (loadingState) => {
    loading.value = loadingState
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const setTyping = (peerID, isTyping) => {
    typing.value[peerID] = isTyping
  }

  const setSocket = (socketInstance) => {
    socket.value = socketInstance
  }

  const markConversationAsRead = (peerID) => {
    const conversation = conversations.value.find(c => c.peerID === peerID)
    if (conversation) {
      conversation.unread = 0
    }
    
    // 更新总未读数
    const totalUnread = conversations.value.reduce((total, conv) => total + (conv.unread || 0), 0)
    setUnreadCount(totalUnread)
  }

  // 异步方法
  const fetchConversations = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await chatService.getConversations()
      const processedConversations = response.map(conv => ({
        ...conv,
        lastMessage: processMessage(DOMPurify.sanitize(conv.lastMessage || ''))
      }))
      
      setConversations(processedConversations)
      
      // 计算总未读数
      const totalUnread = processedConversations.reduce((total, conv) => total + (conv.unread || 0), 0)
      setUnreadCount(totalUnread)
      
    } catch (error) {
      setError(error.message || 'Failed to fetch conversations')
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (peerID) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await chatService.getMessages(peerID)
      const processedMessages = response.map(msg => ({
        ...msg,
        processedMessage: processMessage(msg.message || '')
      }))
      
      // 按时间戳升序排序 (旧消息在前)
      processedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      
      setMessages(peerID, processedMessages)
      
    } catch (error) {
      setError(error.message || 'Failed to fetch messages')
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (peerID, message, file = null, orderID = '') => {
    try {
      let response
      
      if (file) {
        // 发送文件消息
        response = await chatService.sendMessage(peerID, message || '', orderID, file)
      } else {
        // 发送文本消息
        response = await chatService.sendMessage(peerID, message, orderID)
      }
      
      const newMessage = {
        ...response,
        processedMessage: file ? '' : processMessage(message),
        outgoing: true,
        timestamp: Date.now(),
        file: file || null
      }
      
      addMessage(peerID, newMessage)
      
      // 更新会话的最后消息
      updateConversation(peerID, {
        lastMessage: file ? '文件消息' : message,
        lastMessageTime: Date.now()
      })
      
      return { success: true, message: newMessage }
    } catch (error) {
      setError(error.message || 'Failed to send message')
      return { success: false, error: error.message }
    }
  }

  const markAsRead = async (peerID) => {
    try {
      await chatService.markAsRead(peerID)
      markConversationAsRead(peerID)
      return { success: true }
    } catch (error) {
      setError(error.message || 'Failed to mark as read')
      return { success: false, error: error.message }
    }
  }

  const setCurrentConversationAndFetch = async (conversation) => {
    setCurrentConversation(conversation)
    
    if (conversation && conversation.peerID) {
      await fetchMessages(conversation.peerID)
      
      // 标记为已读
      if (conversation.unread > 0) {
        await markAsRead(conversation.peerID)
      }
    }
  }

  const handleNewMessage = (message) => {
    // 跳过订单相关消息，这些消息应该在Discussion.vue中处理
    if (!message || message.orderID) return;
    
    const { peerID } = message
    
    // 添加消息到对应会话
    addMessage(peerID, {
      ...message,
      processedMessage: processMessage(message.message || ''),
      timestamp: Date.now()
    })
    
    // 更新会话信息
    const conversation = conversations.value.find(c => c.peerID === peerID)
    if (conversation) {
      updateConversation(peerID, {
        lastMessage: message.message || '新消息',
        lastMessageTime: Date.now(),
        unread: (conversation.unread || 0) + 1
      })
    } else {
      // 创建新会话
      addConversation({
        peerID,
        lastMessage: message.message || '新消息',
        lastMessageTime: Date.now(),
        unread: 1
      })
    }
    
    // 更新总未读数
    const totalUnread = conversations.value.reduce((total, conv) => total + (conv.unread || 0), 0)
    setUnreadCount(totalUnread)
  }

  const initSocket = (socketInstance) => {
    setSocket(socketInstance)
    
    if (socketInstance) {
      // 监听WebSocket消息事件，处理聊天消息
      socketInstance.on('message', (e = {}) => {
        if (e.jsonData && e.jsonData.chatMessage) {
          // 处理聊天消息
          handleNewMessage(e.jsonData.chatMessage)
        }
        
        if (e.jsonData && e.jsonData.messageTyping) {
          // 跳过订单相关的打字状态，这些应该在Discussion.vue中处理
          if (e.jsonData.messageTyping.orderID) return;
          
          // 处理打字状态
          setTyping(e.jsonData.messageTyping.peerID, true)
          
          // 3秒后清除打字状态
          setTimeout(() => {
            setTyping(e.jsonData.messageTyping.peerID, false)
          }, 3000)
        }
      })
    }
  }

  const sendTypingStatus = (peerID, isTyping) => {
    if (socket.value) {
      socket.value.emit('typing', { peerID, isTyping })
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    // 状态
    conversations,
    currentConversation,
    messages,
    unreadCount,
    loading,
    error,
    typing,
    socket,
    
    // 计算属性
    currentMessages,
    hasUnreadMessages,
    
    // 方法
    setConversations,
    addConversation,
    updateConversation,
    setCurrentConversation,
    setMessages,
    addMessage,
    updateMessage,
    setUnreadCount,
    setLoading,
    setError,
    setTyping,
    setSocket,
    markConversationAsRead,
    
    // 异步方法
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    setCurrentConversationAndFetch,
    handleNewMessage,
    initSocket,
    sendTypingStatus,
    clearError
  }
}, {
  persist: {
    key: 'chat',
    storage: localStorage,
    paths: ['conversations', 'unreadCount']
  }
}) 