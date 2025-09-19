import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AIServiceManager } from '../api/ai-services'
import { aiConfigManager } from '../config/ai'

export const useAiChatStore = defineStore('ai-chat', () => {
  // 状态
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)
  const sessionId = ref(null)
  const currentConversation = ref(null)
  
  // AI服务管理器
  const aiServiceManager = ref(null)
  
  // 初始化AI服务
  const initAIService = () => {
    const config = aiConfigManager.getConfig()
    aiServiceManager.value = new AIServiceManager(config)
  }
  
  // 在store创建时初始化AI服务
  initAIService()

  // 计算属性
  const hasMessages = computed(() => messages.value.length > 0)
  const lastMessage = computed(() => messages.value[messages.value.length - 1])
  const isWaitingForResponse = computed(() => loading.value)

  // 方法
  const addMessage = (message) => {
    const newMessage = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...message
    }
    messages.value.push(newMessage)
    return newMessage
  }

  // 处理AI响应的公共方法
  const processAIResponse = async (content) => {
    if (!aiServiceManager.value) {
      throw new Error('AI服务未配置，请在设置中配置API密钥')
    }

    const intentAnalysis = await aiServiceManager.value.analyzeIntent(content, {
      conversationHistory: messages.value.slice(-5), // 提供最近5条对话作为上下文
      userProfile: currentConversation.value
    })
    console.log('AI意图分析:', intentAnalysis)
    
    let response

    // 检查AI是否已经通过工具调用完成了搜索
    if (intentAnalysis.toolResult) {
      // AI已经通过MCP工具完成搜索，直接使用结果
      response = await handleMCPToolResult(content, intentAnalysis)
    } else {
      // 普通对话，使用AI生成的回复
      response = {
        content: intentAnalysis.aiResponse || '我明白了，有什么可以帮助您的吗？',
        suggestions: intentAnalysis.response?.suggestions || [
          '我想买数码产品',
          '推荐热门商品',
          '查看促销活动'
        ],
        products: []
      }
    }
    
    // 添加AI响应
    const aiMessage = addMessage({
      type: 'assistant',
      content: response.content,
      role: 'assistant',
      suggestions: response.suggestions || [],
      products: response.products || [],
      searchResults: response.searchResults || null,
      aiProvider: aiServiceManager.value?.getActiveProvider() || 'local'
    })

    return aiMessage
  }

  // 处理错误的公共方法
  const handleError = (err) => {
    error.value = err.message || '发送消息失败'
    addMessage({
      type: 'error',
      content: '抱歉，我暂时无法回复您的消息。请稍后重试。',
      role: 'assistant'
    })
    throw err
  }

  const sendMessage = async (content) => {
    if (!content.trim()) return

    loading.value = true
    error.value = null

    try {
      // 首先添加用户消息
      const userMessage = addMessage({
        type: 'user',
        content: content,
        role: 'user'
      })

      return await processAIResponse(content)
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  const clearMessages = () => {
    messages.value = []
    error.value = null
    sessionId.value = null
    currentConversation.value = null
  }

  const retryLastMessage = async () => {
    if (messages.value.length > 0) {
      const lastUserMessage = [...messages.value]
        .reverse()
        .find(msg => msg.type === 'user')
      
      if (lastUserMessage) {
        // 移除最后的AI响应（如果有错误）
        const lastAiMessageIndex = messages.value.length - 1
        if (messages.value[lastAiMessageIndex].type === 'error') {
          messages.value.splice(lastAiMessageIndex, 1)
        }
        
        // 使用公共方法处理AI响应，不重复添加用户消息
        loading.value = true
        error.value = null

        try {
          return await processAIResponse(lastUserMessage.content)
        } catch (err) {
          handleError(err)
        } finally {
          loading.value = false
        }
      }
    }
  }

  const updateConversationContext = (context) => {
    currentConversation.value = context
  }

  // 更新AI配置
  const updateAIConfig = (newConfig) => {
    aiConfigManager.updateConfig(newConfig)
    initAIService() // 重新初始化AI服务
  }

  // 获取AI服务状态
  const getAIServiceStatus = () => {
    if (!aiServiceManager.value) return { provider: 'none', available: false }
    
    return {
      provider: aiServiceManager.value.getActiveProvider(),
      available: true,
      config: aiConfigManager.getConfig()
    }
  }

  // 处理MCP工具调用结果
  const handleMCPToolResult = async (userInput, intentAnalysis) => {
    const toolResult = intentAnalysis.toolResult
    
    if (!toolResult.success) {
      return {
        content: '抱歉，搜索商品时出现了问题，请稍后再试。',
        products: [],
        suggestions: ['重新搜索', '查看热门商品', '联系客服']
      }
    }
    
    const data = toolResult.data
    return {
      content: `为您找到了 ${data.total_results} 件相关商品！以下是为您精选的推荐：`,
      products: data.products || [],
      searchResults: {
        totalResults: data.total_results,
        hasMore: data.has_more,
        // 传递原始API响应
        rawApiResponse: data.rawApiResponse
      },
      suggestions: [
        '查看更多商品',
        '调整搜索条件',
        '比较商品特性'
      ]
    }
  }



  return {
    // 状态
    messages,
    loading,
    error,
    sessionId,
    currentConversation,
    
    // 计算属性
    hasMessages,
    lastMessage,
    isWaitingForResponse,
    
    // 方法
    addMessage,
    sendMessage,
    clearMessages,
    retryLastMessage,
    updateConversationContext,
    
    // AI服务相关
    updateAIConfig,
    getAIServiceStatus,
    initAIService
  }
}) 