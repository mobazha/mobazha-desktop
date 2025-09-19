<template>
  <el-dialog
    v-model="visible"
    title="AI 服务配置"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="ai-settings-container">
      <!-- 当前状态 -->
      <div class="current-status">
        <h4>当前状态</h4>
        <div class="status-info">
          <el-tag :type="statusTagType" size="large">
            {{ statusIcon }} {{ statusText }}
          </el-tag>
          <span class="provider-info">{{ providerText }}</span>
        </div>
      </div>

      <el-divider />

      <!-- AI服务选择 -->
      <div class="provider-selection">
        <h4>选择 AI 服务</h4>
        <el-radio-group v-model="selectedProvider" @change="handleProviderChange">
          <div class="provider-options">
            <div 
              v-for="provider in availableProviders" 
              :key="provider.value"
              class="provider-option"
              :class="{ 'selected': selectedProvider === provider.value }"
            >
              <el-radio :label="provider.value" border>
                <div class="provider-content">
                  <span class="provider-icon">{{ provider.icon }}</span>
                  <div class="provider-details">
                    <div class="provider-name">{{ provider.label }}</div>
                    <div class="provider-status">
                      <el-tag 
                        :type="getProviderStatusType(provider.value)" 
                        size="small"
                      >
                        {{ getProviderStatusText(provider.value) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </el-radio>
            </div>
          </div>
        </el-radio-group>
      </div>

      <!-- API密钥配置 -->
      <div class="api-key-section">
        <h4>API 密钥配置</h4>
        <div class="api-key-input">
          <el-input
            v-model="apiKey"
            type="password"
            :placeholder="`请输入 ${getProviderName(selectedProvider)} 的 API 密钥`"
            show-password
            size="large"
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
          <div class="api-key-help">
            <el-link :href="getApiKeyHelpUrl(selectedProvider)" target="_blank" type="primary">
              如何获取API密钥？
            </el-link>
          </div>
        </div>
      </div>

      <!-- 高级设置 -->
      <el-collapse v-model="advancedCollapse" class="advanced-settings">
        <el-collapse-item title="高级设置" name="advanced">
          <div class="advanced-options">
            <div class="option-row">
              <label>温度参数 (创造性)</label>
              <el-slider
                v-model="temperature"
                :min="0"
                :max="1"
                :step="0.1"
                show-input
                :input-size="'small'"
              />
            </div>
            
            <div class="option-row">
              <label>最大回复长度</label>
              <el-input-number
                v-model="maxTokens"
                :min="100"
                :max="4000"
                :step="100"
                size="small"
              />
            </div>

            <div class="option-row">
              <el-checkbox v-model="enableIntentAnalysis">启用智能意图分析</el-checkbox>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <!-- 使用统计 -->
      <div v-if="usageStats && Object.keys(usageStats).length > 0" class="usage-stats">
        <h4>使用统计</h4>
        <div class="stats-grid">
          <div v-for="(stats, provider) in usageStats" :key="provider" class="stat-item">
            <div class="stat-header">{{ getProviderName(provider) }}</div>
            <div class="stat-content">
              <div>请求次数: {{ stats.requests }}</div>
              <div>消耗Token: {{ stats.tokens }}</div>
              <div v-if="stats.lastUsed">最后使用: {{ formatDate(stats.lastUsed) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存配置
        </el-button>
        <el-button @click="testConnection" :loading="testing">
          测试连接
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Key } from '@element-plus/icons-vue'
import { aiConfigManager } from '@/config/ai'
import { useAiChatStore } from '@/stores/ai-chat'

const aiChatStore = useAiChatStore()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'config-updated'])

// 响应式数据
const visible = ref(props.modelValue)
const selectedProvider = ref('local')
const apiKey = ref('')
const temperature = ref(0.7)
const maxTokens = ref(2048)
const enableIntentAnalysis = ref(true)
const advancedCollapse = ref([])
const saving = ref(false)
const testing = ref(false)

// 可用的AI提供商
const availableProviders = ref([
  { value: 'gemini', label: 'Google Gemini', icon: '🤖' },
  { value: 'openai', label: 'OpenAI GPT', icon: '🧠' },
  { value: 'claude', label: 'Anthropic Claude', icon: '🎭' }
])

// 计算属性
const statusInfo = computed(() => {
  const status = aiChatStore.getAIServiceStatus()
  return status
})

const statusTagType = computed(() => {
  if (!statusInfo.value.available) return 'danger'
  return 'success'
})

const statusIcon = computed(() => {
  if (!statusInfo.value.available) return '❌'
  return '✅'
})

const statusText = computed(() => {
  if (!statusInfo.value.available) return '服务不可用'
  return 'AI服务已连接'
})

const providerText = computed(() => {
  return `当前使用: ${getProviderName(statusInfo.value.provider)}`
})

const usageStats = computed(() => {
  return aiConfigManager.getUsageStats()
})

// 方法
const getProviderName = (provider) => {
  const providerMap = {
    gemini: 'Google Gemini',
    openai: 'OpenAI GPT',
    claude: 'Anthropic Claude'
  }
  return providerMap[provider] || provider
}

const getProviderStatusType = (provider) => {
  return aiConfigManager.isProviderAvailable(provider) ? 'success' : 'danger'
}

const getProviderStatusText = (provider) => {
  return aiConfigManager.isProviderAvailable(provider) ? '已配置' : '需要配置'
}

const getApiKeyHelpUrl = (provider) => {
  const urls = {
    gemini: 'https://makersuite.google.com/app/apikey',
    openai: 'https://platform.openai.com/api-keys',
    claude: 'https://console.anthropic.com/account/keys'
  }
  return urls[provider] || '#'
}

const loadCurrentConfig = () => {
  const config = aiConfigManager.getConfig()
  selectedProvider.value = config.activeProvider || 'gemini'
  temperature.value = config.gemini?.temperature || 0.7
  maxTokens.value = config.gemini?.maxTokens || 2048
  enableIntentAnalysis.value = config.features?.intentAnalysis !== false
  
  // 加载对应提供商的API密钥
  if (selectedProvider.value && config[selectedProvider.value]?.apiKey) {
    apiKey.value = '••••••••••••••••' // 不显示真实密钥
  }
}

const handleProviderChange = () => {
  const config = aiConfigManager.getConfig()
  if (config[selectedProvider.value]?.apiKey) {
    apiKey.value = '••••••••••••••••'
  } else {
    apiKey.value = ''
  }
}

const testConnection = async () => {
  if (!apiKey.value || apiKey.value.includes('••••')) {
    ElMessage.warning('请先输入有效的API密钥')
    return
  }

  testing.value = true
  try {
    // 临时创建AI服务管理器进行测试
    const { AIServiceManager } = await import('@/api/ai-services')
    const testConfig = {
      [selectedProvider.value]: {
        apiKey: apiKey.value,
        model: selectedProvider.value === 'gemini' ? 'gemini-pro' : 
               selectedProvider.value === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-sonnet-20240229'
      }
    }
    
    const testManager = new AIServiceManager(testConfig)
    const result = await testManager.chat([
      { role: 'user', content: '你好，这是一个连接测试。' }
    ], { maxTokens: 50 })

    if (result.content) {
      ElMessage.success('AI服务连接成功！')
    } else {
      throw new Error('未收到有效回复')
    }
  } catch (error) {
    console.error('连接测试失败:', error)
    ElMessage.error(`连接测试失败: ${error.message}`)
  } finally {
    testing.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    // 验证API密钥
    if (apiKey.value && !apiKey.value.includes('••••')) {
      if (!aiConfigManager.validateApiKey(selectedProvider.value, apiKey.value)) {
        ElMessage.error('API密钥格式不正确')
        saving.value = false
        return
      }
    }

    // 构建新配置
    const newConfig = {
      activeProvider: selectedProvider.value,
      features: {
        intentAnalysis: enableIntentAnalysis.value
      },
      advanced: {
        maxHistoryLength: 10,
        retryAttempts: 2
      }
    }

    // 如果输入了新的API密钥，则更新
    if (apiKey.value && !apiKey.value.includes('••••')) {
      aiConfigManager.setApiKey(selectedProvider.value, apiKey.value)
    }

    // 更新配置
    aiConfigManager.updateConfig(newConfig)
    aiConfigManager.setActiveProvider(selectedProvider.value)

    // 更新AI聊天store
    aiChatStore.updateAIConfig(newConfig)

    ElMessage.success('配置已保存')
    emit('config-updated')
    handleClose()
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  visible.value = false
  emit('update:modelValue', false)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 监听器
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    loadCurrentConfig()
  }
})

// 生命周期
onMounted(() => {
  loadCurrentConfig()
})
</script>

<style lang="scss" scoped>
.ai-settings-container {
  .current-status {
    margin-bottom: 20px;
    
    h4 {
      margin: 0 0 12px 0;
      color: var(--el-text-color-primary);
    }
    
    .status-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .provider-info {
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
    }
  }
  
  .provider-selection {
    margin-bottom: 20px;
    
    h4 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
    }
    
    .provider-options {
      display: grid;
      gap: 12px;
      
      .provider-option {
        border: 1px solid var(--el-border-color-light);
        border-radius: 8px;
        transition: all 0.2s ease;
        
        &.selected {
          border-color: var(--el-color-primary);
          background: var(--el-color-primary-light-9);
        }
        
        :deep(.el-radio) {
          width: 100%;
          margin: 0;
          
          .el-radio__input {
            display: none;
          }
          
          .el-radio__label {
            width: 100%;
            padding: 16px;
          }
        }
        
        .provider-content {
          display: flex;
          align-items: center;
          gap: 12px;
          
          .provider-icon {
            font-size: 24px;
          }
          
          .provider-details {
            flex: 1;
            
            .provider-name {
              font-weight: 600;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
            }
            
            .provider-status {
              .el-tag {
                font-size: 12px;
              }
            }
          }
        }
      }
    }
  }
  
  .api-key-section {
    margin-bottom: 20px;
    
    h4 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
    }
    
    .api-key-input {
      .api-key-help {
        margin-top: 8px;
        text-align: right;
      }
    }
  }
  
  .advanced-settings {
    margin-bottom: 20px;
    
    .advanced-options {
      .option-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        
        label {
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
        
        .el-slider {
          width: 200px;
        }
      }
    }
  }
  
  .usage-stats {
    h4 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      
      .stat-item {
        background: var(--el-bg-color-page);
        border: 1px solid var(--el-border-color-light);
        border-radius: 8px;
        padding: 16px;
        
        .stat-header {
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 8px;
        }
        
        .stat-content {
          font-size: 13px;
          color: var(--el-text-color-secondary);
          
          div {
            margin-bottom: 4px;
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 