<template>
  <div class="smart-home-container">
    <!-- Simple Header -->
    <header class="smart-home-header">
      <div class="header-content">
        <h1 class="app-title">
          <img src="~@/../imgs/obVectorIconSmall2.png" alt="Mobazha" class="title-icon" />
          {{ $t('smartHome.title') }}
        </h1>
        <div class="header-actions">
          <LanguageSwitcher />
          <el-button 
            text 
            type="info" 
            @click="showAISettings = true" 
            class="ai-settings-btn"
          >
            <el-icon><Setting /></el-icon>
            AI设置
          </el-button>
          <el-button 
            v-if="aiChatStore.hasMessages" 
            text 
            type="primary" 
            @click="clearChat" 
            class="clear-chat-btn"
          >
            {{ $t('smartHome.newChat') }}
          </el-button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="smart-home-main">
      <div class="chat-container">
        <!-- Welcome Interface -->
        <div v-if="!aiChatStore.hasMessages" class="welcome-section">
          <div class="welcome-content">
            <div class="welcome-hero">
              <h2 class="welcome-title">{{ $t('smartHome.welcome.title') }}</h2>
              <p class="welcome-subtitle">
                {{ $t('smartHome.welcome.subtitle') }}
              </p>
            </div>
            
            <!-- Simplified Suggestion Buttons -->
            <div class="simple-suggestions">
              <el-button 
                v-for="(key, index) in suggestionKeys" 
                :key="key"
                type="default"
                size="default"
                @click="handlePromptClick($t(`smartHome.suggestions.${key}`))"
                class="suggestion-btn"
              >
                {{ $t(`smartHome.suggestions.${key}`) }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- Chat Messages Area -->
        <div v-else class="messages-section">
          <MessageList 
            :messages="aiChatStore.messages" 
          />
        </div>

        <!-- Input Area -->
        <div class="input-section" :class="{ 'welcome-mode': !aiChatStore.hasMessages }">
          <ChatInput 
            v-model="currentInput"
            :loading="aiChatStore.isWaitingForResponse"
            :placeholder="inputPlaceholder"
            @send="handleSendMessage"
          />
          
          <!-- Quick Suggestions (show after conversation starts) -->
          <div v-if="aiChatStore.hasMessages && currentSuggestions.length > 0" class="quick-suggestions">
            <el-tag 
              v-for="suggestion in currentSuggestions.slice(0, 3)" 
              :key="suggestion"
              type="info"
              effect="plain"
              size="small"
              class="suggestion-tag"
              @click="handleSuggestionClick(suggestion)"
            >
              {{ suggestion }}
            </el-tag>
          </div>
        </div>
      </div>
    </main>

    <!-- Simplified Footer Tagline -->
    <footer class="smart-home-footer">
      <div class="footer-content">
        <span class="footer-tagline">
          ✨ {{ $t('smartHome.footer.tagline') }}
        </span>
      </div>
    </footer>

    <!-- AI设置对话框 -->
    <AISettings 
      v-model="showAISettings" 
      @config-updated="handleAIConfigUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Delete, Setting } from '@element-plus/icons-vue'

import { useAiChatStore } from '@/stores/ai-chat'

import MessageList from './components/MessageList.vue'
import ChatInput from './components/ChatInput.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import AISettings from './components/AISettings.vue'

const router = useRouter()
const aiChatStore = useAiChatStore()
const { t } = useI18n()

// Reactive data
const currentInput = ref('')
const showAISettings = ref(false)

// Suggestion keys for i18n
const suggestionKeys = ['smartphone', 'laptop', 'home', 'fitness']

// Computed properties
const inputPlaceholder = computed(() => {
  return aiChatStore.hasMessages 
    ? t('smartHome.welcome.continuePlaceholder')
    : t('smartHome.welcome.placeholder')
})

const currentSuggestions = computed(() => {
  const lastMessage = aiChatStore.lastMessage
  return lastMessage?.suggestions || []
})

// Methods
const handleSendMessage = async (message) => {
  if (!message.trim()) return
  
  try {
    await aiChatStore.sendMessage(message)
    currentInput.value = ''
  } catch (error) {
    console.error(t('smartHome.errors.sendMessage'), error)
  }
}

const handlePromptClick = (promptText) => {
  handleSendMessage(promptText)
}

const handleSuggestionClick = (suggestion) => {
  currentInput.value = suggestion
  handleSendMessage(suggestion)
}

const clearChat = () => {
  aiChatStore.clearMessages()
  currentInput.value = ''
}

const handleAIConfigUpdated = () => {
  console.log('AI配置已更新')
  // 可以在这里添加其他逻辑，比如显示提示信息
}

// Lifecycle
onMounted(() => {
  // If user is logged in, can preload some personalized information
//   if (userStore.isAuthenticated) {
//     // Here you can load user's purchase history, preferences, etc.
//   }
})
</script>

<style lang="scss" scoped>
.smart-home-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #fafbfc 0%, #f4f6f8 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  
  .smart-home-header {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(220, 225, 230, 0.4);
    padding: 16px 24px;
    
    .header-content {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      
      .app-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        display: flex;
        align-items: center;
        gap: 8px;
        
        .title-icon {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }
      }
      
      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .clear-chat-btn {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(100, 115, 135, 0.15);
        }
      }
    }
  }
  
  .smart-home-main {
    flex: 1;
    padding: 32px 24px 20px;
    display: flex;
    justify-content: center;
    min-height: 0;
    padding-bottom: 102px; /* 为footer和status-bar留出空间 (80px + 22px) */
    
    .chat-container {
      width: 100%;
      max-width: 800px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 0;
      
      .welcome-section {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 0;
        overflow-y: auto;
        padding: 40px 0;
        
        .welcome-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          
          .welcome-hero {
            margin-bottom: 48px;
            
            .welcome-title {
              margin: 0 0 16px 0;
              font-size: 32px;
              font-weight: 600;
              color: var(--el-text-color-primary);
            }
            
            .welcome-subtitle {
              margin: 0;
              font-size: 16px;
              color: var(--el-text-color-secondary);
              line-height: 1.5;
            }
          }
          
          .simple-suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
            
            .suggestion-btn {
              background: rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(220, 225, 230, 0.4);
              border-radius: 20px;
              padding: 8px 16px;
              font-size: 14px;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              
              &:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(100, 115, 135, 0.15);
                background: rgba(255, 255, 255, 0.95);
                border-color: rgba(64, 158, 255, 0.3);
              }
            }
          }
        }
      }
      
      .messages-section {
        flex: 1;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        border-radius: 12px 12px 0 0;
        border: 1px solid rgba(220, 225, 230, 0.4);
        overflow: hidden;
      }
      
      .input-section {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(220, 225, 230, 0.4);
        border-radius: 0 0 12px 12px;
        border-top: none;
        padding: 16px;
        
        &.welcome-mode {
          margin-top: 32px;
          border-radius: 12px;
          border-top: 1px solid rgba(220, 225, 230, 0.4);
        }
        
        .quick-suggestions {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          
          .suggestion-tag {
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(220, 225, 230, 0.4);
            
            &:hover {
              transform: translateY(-1px);
              background: rgba(64, 158, 255, 0.1);
              border-color: rgba(64, 158, 255, 0.3);
              box-shadow: 0 2px 8px rgba(100, 115, 135, 0.1);
            }
          }
        }
      }
    }
  }
  
  .smart-home-footer {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border-top: 1px solid rgba(220, 225, 230, 0.4);
    padding: 12px 24px;
    text-align: center;
    position: fixed;
    bottom: 22px; /* 位于status-bar之上 */
    left: 0;
    right: 0;
    z-index: 10;
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      
      .footer-tagline {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        opacity: 0.8;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .smart-home-container {
    .smart-home-header {
      padding: 12px 16px;
      
      .header-content {
        .app-title {
          font-size: 18px;
          
          .title-icon {
            width: 18px;
            height: 18px;
          }
        }
        
        .header-actions {
          gap: 8px;
        }
      }
    }
    
    .smart-home-main {
      padding: 24px 16px 16px;
      padding-bottom: 92px; /* 移动端为footer和status-bar留出空间 (70px + 22px) */
      
      .chat-container {
        .welcome-section {
          padding: 20px 0;
          
          .welcome-content {
            .welcome-hero {
              margin-bottom: 32px;
              
              .welcome-title {
                font-size: 24px;
              }
              
              .welcome-subtitle {
                font-size: 14px;
              }
            }
            
            .simple-suggestions {
              flex-direction: column;
              align-items: center;
              gap: 8px;
              
              .suggestion-btn {
                width: 100%;
                max-width: 280px;
                padding: 10px 16px;
              }
            }
          }
        }
      }
    }
    
    .smart-home-footer {
      padding: 8px 16px;
      
      .footer-tagline {
        font-size: 11px;
      }
    }
  }
}
</style> 