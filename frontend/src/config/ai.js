/**
 * AI服务配置管理
 */

// 默认配置
const DEFAULT_AI_CONFIG = {
  // 当前使用的AI服务提供商
  activeProvider: null, // 'gemini' | 'openai' | 'claude'
  
  // 各个服务商的配置
  gemini: {
    apiKey: '', // 从环境变量或设置中获取
    model: 'gemini-2.0-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    temperature: 0.7,
    maxTokens: 2048
  },
  
  openai: {
    apiKey: '', // 从环境变量或设置中获取
    model: 'gpt-3.5-turbo',
    baseUrl: 'https://api.openai.com/v1',
    temperature: 0.7,
    maxTokens: 2048
  },
  
  claude: {
    apiKey: '', // 从环境变量或设置中获取
    model: 'claude-3-sonnet-20240229',
    baseUrl: 'https://api.anthropic.com',
    temperature: 0.7,
    maxTokens: 2048
  },
  
  // 功能开关
  features: {
    intentAnalysis: true,      // 意图分析
    productSearch: true,       // 商品搜索
    conversationHistory: true, // 对话历史
    smartSuggestions: true     // 智能建议
  },
  
  // 高级设置
  advanced: {
    maxHistoryLength: 10,      // 最大对话历史长度
    cacheTimeout: 300000,      // 缓存超时时间（5分钟）
    retryAttempts: 2,          // 重试次数
    requestTimeout: 30000      // 请求超时时间（30秒）
  }
}

/**
 * AI配置管理器
 */
export class AIConfigManager {
  constructor() {
    this.config = { ...DEFAULT_AI_CONFIG }
    this.loadConfig()
  }

  /**
   * 从环境变量和本地存储加载配置
   */
  loadConfig() {
    try {
      // 从环境变量加载API密钥
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        this.config.gemini.apiKey = import.meta.env.VITE_GEMINI_API_KEY
      }
      
      if (import.meta.env.VITE_OPENAI_API_KEY) {
        this.config.openai.apiKey = import.meta.env.VITE_OPENAI_API_KEY
      }
      
      if (import.meta.env.VITE_CLAUDE_API_KEY) {
        this.config.claude.apiKey = import.meta.env.VITE_CLAUDE_API_KEY
      }

      // 从本地存储加载用户配置
      const savedConfig = localStorage.getItem('ai-config')
      if (savedConfig) {
        const userConfig = JSON.parse(savedConfig)
        this.config = { ...this.config, ...userConfig }
      }

      // 自动选择可用的AI服务
      this.selectBestProvider()
    } catch (error) {
      console.error('AI配置加载失败:', error)
    }
  }

  /**
   * 保存配置到本地存储
   */
  saveConfig() {
    try {
      // 不保存API密钥到本地存储（安全考虑）
      const configToSave = {
        activeProvider: this.config.activeProvider,
        features: this.config.features,
        advanced: this.config.advanced
      }
      
      localStorage.setItem('ai-config', JSON.stringify(configToSave))
    } catch (error) {
      console.error('AI配置保存失败:', error)
    }
  }

  /**
   * 自动选择最佳的AI服务提供商
   */
  selectBestProvider() {
    if (this.config.gemini.apiKey) {
      this.config.activeProvider = 'gemini'
    } else if (this.config.openai.apiKey) {
      this.config.activeProvider = 'openai'
    } else if (this.config.claude.apiKey) {
      this.config.activeProvider = 'claude'
    } else {
      this.config.activeProvider = 'local'
    }
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return { ...this.config }
  }

  /**
   * 获取当前活跃提供商的配置
   */
  getActiveProviderConfig() {
    const provider = this.config.activeProvider
    return {
      provider,
      config: this.config[provider] || {}
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
  }

  /**
   * 设置API密钥
   */
  setApiKey(provider, apiKey) {
    if (this.config[provider]) {
      this.config[provider].apiKey = apiKey
      this.selectBestProvider()
      this.saveConfig()
    }
  }

  /**
   * 设置活跃的AI提供商
   */
  setActiveProvider(provider) {
    this.config.activeProvider = provider
    this.saveConfig()
  }

  /**
   * 检查提供商是否可用
   */
  isProviderAvailable(provider) {
    return !!(this.config[provider] && this.config[provider].apiKey)
  }

  /**
   * 获取可用的提供商列表
   */
  getAvailableProviders() {
    const allProviders = [
      { value: 'gemini', label: 'Google Gemini', icon: '🤖' },
      { value: 'openai', label: 'OpenAI GPT', icon: '🧠' },
      { value: 'claude', label: 'Anthropic Claude', icon: '🎭' }
    ]
    
    return allProviders
  }

  /**
   * 验证API密钥格式
   */
  validateApiKey(provider, apiKey) {
    if (!apiKey) return false
    
    switch (provider) {
      case 'gemini':
        return apiKey.startsWith('AIza') || apiKey.length > 20
      case 'openai':
        return apiKey.startsWith('sk-') && apiKey.length > 40
      case 'claude':
        return apiKey.startsWith('sk-ant-') || apiKey.length > 30
      default:
        return true
    }
  }

  /**
   * 获取提供商的使用统计
   */
  getUsageStats() {
    try {
      const stats = localStorage.getItem('ai-usage-stats')
      return stats ? JSON.parse(stats) : {}
    } catch {
      return {}
    }
  }

  /**
   * 更新使用统计
   */
  updateUsageStats(provider, tokens = 0) {
    try {
      const stats = this.getUsageStats()
      if (!stats[provider]) {
        stats[provider] = { requests: 0, tokens: 0, lastUsed: null }
      }
      
      stats[provider].requests += 1
      stats[provider].tokens += tokens
      stats[provider].lastUsed = new Date().toISOString()
      
      localStorage.setItem('ai-usage-stats', JSON.stringify(stats))
    } catch (error) {
      console.error('更新使用统计失败:', error)
    }
  }
}

// 全局配置管理器实例
export const aiConfigManager = new AIConfigManager()

// 导出配置相关的工具函数
export const getAIConfig = () => aiConfigManager.getConfig()
export const updateAIConfig = (config) => aiConfigManager.updateConfig(config)
export const setAIProvider = (provider) => aiConfigManager.setActiveProvider(provider)
export const setAIApiKey = (provider, apiKey) => aiConfigManager.setApiKey(provider, apiKey)

export default aiConfigManager 