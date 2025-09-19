import { mcpToolExecutor, generateMCPSystemPrompt, parseToolCall } from './mcp-tools'

/**
 * AI服务配置
 */
export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  CLAUDE: 'claude'
}

/**
 * AI服务基础类
 */
class AIServiceBase {
  constructor(config = {}) {
    this.config = config
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.model = config.model
  }

  async chat(messages, options = {}) {
    throw new Error('chat method must be implemented')
  }

  async analyzeIntent(userInput, context = {}) {
    throw new Error('analyzeIntent method must be implemented')
  }
}

/**
 * Google Gemini AI服务
 */
class GeminiAIService extends AIServiceBase {
  constructor(config = {}) {
    super(config)
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
    this.model = config.model || 'gemini-pro'
  }

  async chat(messages, options = {}) {
    try {
      const requestBody = {
        contents: this.formatMessagesForGemini(messages),
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxTokens || 2048,
        }
      }

      // 如果启用工具调用，添加工具定义
      if (options.enableTools !== false) {
        requestBody.tools = [{
          function_declarations: this.getGeminiFunctionDeclarations()
        }]
      }

      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      const candidate = data.candidates[0]
      
      // 检查是否有函数调用
      if (candidate?.content?.parts?.[0]?.functionCall) {
        return await this.handleFunctionCall(candidate.content.parts[0].functionCall, data.usageMetadata)
      }

      return {
        content: candidate?.content?.parts[0]?.text || '',
        usage: data.usageMetadata
      }
    } catch (error) {
      console.error('Gemini AI服务调用失败:', error)
      throw error
    }
  }

  async analyzeIntent(userInput, context = {}) {
    const systemPrompt = generateMCPSystemPrompt()
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ]

    try {
      const response = await this.chat(messages, { 
        temperature: 0.3,
        enableTools: true 
      })

      // 如果AI调用了工具，说明识别到了购物意图
      if (response.toolCall) {
        return {
          intent: {
            type: 'shopping',
            confidence: 0.9,
            isProductQuery: true
          },
          extraction: {
            keywords: [response.toolCall.parameters.query],
            category: response.toolCall.parameters.category || 'all'
          },
          searchParams: response.toolCall.parameters,
          response: {
            shouldSearch: false, // 已经通过工具调用完成搜索
            suggestions: [],
            tone: 'helpful'
          },
          toolResult: response.toolCall.result
        }
      }

      // 如果没有工具调用，说明是一般对话
      return {
        intent: {
          type: 'general',
          confidence: 0.8,
          isProductQuery: false
        },
        response: {
          shouldSearch: false,
          suggestions: [],
          tone: 'helpful'
        },
        aiResponse: response.content
      }
    } catch (error) {
      console.error('意图分析失败:', error)
      throw error
    }
  }

  formatMessagesForGemini(messages) {
    const formattedMessages = []
    
    messages.forEach(msg => {
      if (msg.role === 'system') {
        // 将system消息转换为user消息
        formattedMessages.push({
          role: 'user',
          parts: [{ text: msg.content }]
        })
        // 添加一个简短的model确认回复
        formattedMessages.push({
          role: 'model',
          parts: [{ text: '我明白了，我会按照这些指导来帮助用户。' }]
        })
      } else {
        formattedMessages.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })
      }
    })
    
    return formattedMessages
  }

  // 获取Gemini格式的函数声明
  getGeminiFunctionDeclarations() {
    const tools = mcpToolExecutor.getToolDefinitions()
    
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }))
  }

  // 处理函数调用
  async handleFunctionCall(functionCall, usage) {
    try {
      const { name: toolName, args: parameters } = functionCall
      console.log('Gemini函数调用:', toolName, parameters)
      
      // 执行工具
      const toolResult = await mcpToolExecutor.executeTool(toolName, parameters)
      
      return {
        content: this.formatToolResult(toolResult),
        toolCall: {
          name: toolName,
          parameters,
          result: toolResult
        },
        usage
      }
    } catch (error) {
      console.error('函数调用执行失败:', error)
      return {
        content: `工具调用失败: ${error.message}`,
        usage
      }
    }
  }

  // 格式化工具结果为自然语言
  formatToolResult(toolResult) {
    if (!toolResult.success) {
      return `抱歉，${toolResult.message}：${toolResult.error}`
    }

    const { data } = toolResult
    
    if (data.products && data.products.length > 0) {
      return `我为您找到了 ${data.total_results} 件相关商品！以下是为您精选的推荐：

${data.products.slice(0, 3).map((product, index) => 
  `${index + 1}. **${product.name}** - ${product.price}`
).join('\n')}

您可以点击商品卡片查看详细信息，或者告诉我您的具体需求，我可以为您提供更精准的推荐！`
    }

    return toolResult.message || '操作完成'
  }


}

/**
 * OpenAI服务
 */
class OpenAIService extends AIServiceBase {
  constructor(config = {}) {
    super(config)
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
    this.model = config.model || 'gpt-3.5-turbo'
  }

  async chat(messages, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage
      }
    } catch (error) {
      console.error('OpenAI服务调用失败:', error)
      throw error
    }
  }

  async analyzeIntent(userInput, context = {}) {
    const geminiService = new GeminiAIService(this.config)
    return geminiService.analyzeIntent(userInput, context)
  }
}



/**
 * AI服务工厂
 */
export class AIServiceFactory {
  static services = new Map()

  static registerService(provider, serviceClass) {
    this.services.set(provider, serviceClass)
  }

  static createService(provider, config = {}) {
    const ServiceClass = this.services.get(provider)
    if (!ServiceClass) {
      throw new Error(`Unsupported AI provider: ${provider}`)
    }
    return new ServiceClass(config)
  }

  static getAvailableProviders() {
    return Array.from(this.services.keys())
  }
}

// 注册服务
AIServiceFactory.registerService(AI_PROVIDERS.GEMINI, GeminiAIService)
AIServiceFactory.registerService(AI_PROVIDERS.OPENAI, OpenAIService)

/**
 * AI服务管理器
 */
export class AIServiceManager {
  constructor(config = {}) {
    this.config = config
    this.activeService = null
    this.initialize()
  }

  initialize() {
    // 按优先级选择AI服务
    if (this.config.gemini?.apiKey) {
      this.activeService = AIServiceFactory.createService(AI_PROVIDERS.GEMINI, this.config.gemini)
    } else if (this.config.openai?.apiKey) {
      this.activeService = AIServiceFactory.createService(AI_PROVIDERS.OPENAI, this.config.openai)
    } else if (this.config.claude?.apiKey) {
      this.activeService = AIServiceFactory.createService(AI_PROVIDERS.CLAUDE, this.config.claude)
    } else {
      throw new Error('未配置任何AI服务，请在设置中配置API密钥')
    }
  }

  async analyzeIntent(userInput, context = {}) {
    if (!this.activeService) {
      throw new Error('AI服务未初始化，请配置API密钥')
    }

    try {
      const result = await this.activeService.analyzeIntent(userInput, context)
      console.log('AI意图分析结果:', result)
      return result
    } catch (error) {
      console.error('AI意图分析失败:', error)
      throw new Error(`AI服务调用失败: ${error.message}`)
    }
  }

  async chat(messages, options = {}) {
    if (!this.activeService) {
      throw new Error('AI服务未初始化，请配置API密钥')
    }

    try {
      return await this.activeService.chat(messages, options)
    } catch (error) {
      console.error('AI对话生成失败:', error)
      throw new Error(`AI服务调用失败: ${error.message}`)
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.initialize()
  }

  getActiveProvider() {
    if (!this.activeService) return null
    if (this.activeService instanceof GeminiAIService) return AI_PROVIDERS.GEMINI
    if (this.activeService instanceof OpenAIService) return AI_PROVIDERS.OPENAI
    return AI_PROVIDERS.CLAUDE
  }

  isAvailable() {
    return this.activeService !== null
  }
}

export default AIServiceManager 