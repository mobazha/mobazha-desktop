<template>
  <div class="message-list-container">
    <div class="messages-wrapper" ref="messagesWrapper">
      <div 
        v-for="message in messagesWithListings" 
        :key="message.id"
        class="message-item"
        :class="`message-${message.type}`"
      >
        <!-- 用户消息 -->
        <div v-if="message.type === 'user'" class="user-message">
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
          <div class="message-avatar">
            <el-icon size="20"><User /></el-icon>
          </div>
        </div>
        
        <!-- AI助手消息 -->
        <div v-else-if="message.type === 'assistant'" class="assistant-message">
          <div class="message-avatar">
            <el-icon size="20"><Headset /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessageContent(message.content)"></div>
            
            <!-- 产品推荐卡片 -->
            <div v-if="message.products && message.products.length > 0" class="products-section">
              <div class="products-header">
                <h4>找到 {{ message.products.length }} 件商品</h4>
                <div v-if="message.searchResults && message.searchResults.hasMore" class="more-results-hint">
                  <el-icon size="14"><More /></el-icon>
                  <span>还有更多商品...</span>
                </div>
              </div>
              <div class="products-grid listingsGrid flex">
                <template v-for="model in (message.listingCollection?.models || [])" :key="`${model.get('hash')}_${model.get('slug')}`">
                  <ListingCard
                    v-if="isListingCardModel(model)"
                    :options="cardViewOptions(model)"
                    :bb="function() {
                      return {
                        model,
                      };
                    }"
                  />
                </template>
              </div>
            </div>
            
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <!-- 错误消息 -->
        <div v-else-if="message.type === 'error'" class="error-message">
          <div class="message-avatar">
            <el-icon size="20" color="#f56c6c"><Warning /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-text error-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>
      
      <!-- 加载指示器 -->
      <div v-if="isLoading" class="loading-message">
        <div class="message-avatar">
          <el-icon size="20"><Headset /></el-icon>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import { User, Headset, Warning, More } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ListingCard from '../../../components/global/ListingCard.vue'
import ResultsCol from '../../../../backbone/collections/Results'
import ListingCardModel from '../../../../backbone/models/listing/ListingShort'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const messagesWrapper = ref(null)

// 为每个消息计算listing集合，避免重复计算
const messagesWithListings = computed(() => {
  return props.messages.map(message => {
    if (message.products && message.products.length > 0) {
      return {
        ...message,
        listingCollection: createListingCollection(message)
      }
    }
    return message
  })
})

// 方法
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatMessageContent = (content) => {
  // 将markdown格式转换为HTML
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}


// 使用缓存避免重复创建集合
const listingCollectionsCache = new Map()

// 创建ListingCard集合 - 优先使用原始API响应
const createListingCollection = (message) => {
  // 生成缓存键
  const cacheKey = JSON.stringify({
    hasRawApi: !!message.searchResults?.rawApiResponse,
    productsLength: message.products?.length || 0,
    firstProductId: message.products?.[0]?.id
  })
  
  // 检查缓存
  if (listingCollectionsCache.has(cacheKey)) {
    return listingCollectionsCache.get(cacheKey)
  }
  
  let resultsCol
  
  // 如果有原始API响应，直接使用它
  if (message.searchResults?.rawApiResponse) {
    resultsCol = new ResultsCol()
    resultsCol.add(resultsCol.parse(message.searchResults.rawApiResponse))
  }

  // 缓存结果
  listingCollectionsCache.set(cacheKey, resultsCol)
  
  return resultsCol
}

// 获取ListingCard选项 - 参考Results.vue的cardViewOptions
const cardViewOptions = (model) => {
  const vendor = model.get('vendor') || {}
  const base = vendor.handle ? `@${vendor.handle}` : vendor.peerID
  
  return {
    listingBaseUrl: `${base}/store/`,
    reportsUrl: '',
    searchUrl: '',
    vendor,
    onStore: false,
    viewType: 'grid'
  }
}

// 检查模型类型 - 参考Results.vue的isListingCardModel
const isListingCardModel = (model) => {
  return model instanceof ListingCardModel
}


const scrollToBottom = () => {
  nextTick(() => {
    if (messagesWrapper.value) {
      messagesWrapper.value.scrollTop = messagesWrapper.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动到底部
watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })

watch(() => props.isLoading, () => {
  scrollToBottom()
})
</script>

<style lang="scss" scoped>
.message-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .messages-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    scroll-behavior: smooth;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: var(--el-bg-color-page);
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 3px;
      
      &:hover {
        background: var(--el-border-color-dark);
      }
    }
    
    .message-item {
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    // 用户消息样式
    .user-message {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      
      .message-content {
        max-width: 70%;
        background: var(--el-color-primary);
        color: white;
        border-radius: 16px 16px 4px 16px;
        padding: 12px 16px;
        
        .message-text {
          margin-bottom: 4px;
          line-height: 1.5;
        }
        
        .message-time {
          font-size: 11px;
          opacity: 0.8;
          text-align: right;
        }
      }
      
      .message-avatar {
        width: 32px;
        height: 32px;
        background: var(--el-color-primary-light-3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
      }
    }
    
    // AI助手消息样式
    .assistant-message {
      display: flex;
      justify-content: flex-start;
      gap: 8px;
      
      .message-avatar {
        width: 32px;
        height: 32px;
        background: var(--el-color-success);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
      }
      
      .message-content {
        max-width: 85%;
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-light);
        border-radius: 16px 16px 16px 4px;
        padding: 12px 16px;
        
        .message-text {
          margin-bottom: 8px;
          line-height: 1.6;
          
          :deep(strong) {
            color: var(--el-text-color-primary);
            font-weight: 600;
          }
          
          :deep(code) {
            background: var(--el-bg-color-page);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
          }
        }
        
        .products-section {
          margin: 16px 0;
          
          .products-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            
            h4 {
              margin: 0;
              font-size: 14px;
              font-weight: 600;
              color: var(--el-text-color-primary);
            }
            
            .more-results-hint {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
              color: var(--el-text-color-secondary);
              opacity: 0.8;
            }
          }
          
          h4 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }
        
        .products-grid {
          margin-top: 16px;
          /* 使用ListingCard原有的listingsGrid样式 */
        }
        

        
        .message-time {
          font-size: 11px;
          color: var(--el-text-color-secondary);
          margin-top: 8px;
        }
      }
    }
    
    // 错误消息样式
    .error-message {
      display: flex;
      justify-content: flex-start;
      gap: 8px;
      
      .message-avatar {
        width: 32px;
        height: 32px;
        background: var(--el-color-danger-light-3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .message-content {
        max-width: 70%;
        background: var(--el-color-danger-light-9);
        border: 1px solid var(--el-color-danger-light-7);
        border-radius: 16px 16px 16px 4px;
        padding: 12px 16px;
        
        .error-text {
          color: var(--el-color-danger);
          margin-bottom: 4px;
        }
        
        .message-time {
          font-size: 11px;
          color: var(--el-color-danger-light-3);
        }
      }
    }
    
    // 加载消息样式
    .loading-message {
      display: flex;
      justify-content: flex-start;
      gap: 8px;
      
      .message-avatar {
        width: 32px;
        height: 32px;
        background: var(--el-color-success);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
      }
      
      .message-content {
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          
          span {
            width: 8px;
            height: 8px;
            background: var(--el-color-info);
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
            
            &:nth-child(1) { animation-delay: -0.32s; }
            &:nth-child(2) { animation-delay: -0.16s; }
            &:nth-child(3) { animation-delay: 0s; }
          }
        }
      }
    }
  }
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .message-list-container {
    .messages-wrapper {
      padding: 12px;
      
      .user-message .message-content,
      .assistant-message .message-content {
        max-width: 90%;
      }
      
      .products-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style> 