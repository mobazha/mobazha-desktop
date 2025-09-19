<template>
  <div class="chat-input-container">
    <div class="input-wrapper">
      <el-input
        ref="inputRef"
        v-model="inputValue"
        :placeholder="placeholder || t('smartHome.chatInput.placeholder')"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 4 }"
        resize="none"
        class="message-input"
        :disabled="loading"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      
      <div class="input-actions">
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!canSend"
          size="default"
          circle
          class="send-button"
          @click="handleSend"
        >
          <el-icon v-if="!loading"><Position /></el-icon>
        </el-button>
      </div>
    </div>
    
    <!-- 字符计数器 -->
    <div v-if="showCounter" class="input-counter">
      <span class="counter-text" :class="{ 'over-limit': isOverLimit }">
        {{ inputValue.length }}/{{ maxLength }}
      </span>
    </div>
    
    <!-- 输入提示 -->
    <div v-if="showTips && !inputValue" class="input-tips">
      <div class="tips-content">
        <el-icon><Opportunity /></el-icon>
        <span>{{ $t('smartHome.chatInput.tips') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Position, Opportunity } from '@element-plus/icons-vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  maxLength: {
    type: Number,
    default: 2000
  },
  showCounter: {
    type: Boolean,
    default: false
  },
  showTips: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'send', 'focus', 'blur'])

const inputRef = ref(null)
const inputValue = ref(props.modelValue)
const isFocused = ref(false)

// 计算属性
const canSend = computed(() => {
  return inputValue.value.trim().length > 0 && !props.loading && !isOverLimit.value
})

const isOverLimit = computed(() => {
  return inputValue.value.length > props.maxLength
})

// 方法
const handleKeydown = (event) => {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      // Shift+Enter 换行，默认行为
      return
    } else {
      // Enter 发送消息
      event.preventDefault()
      if (canSend.value) {
        handleSend()
      }
    }
  }
}

const handleSend = () => {
  if (!canSend.value) return
  
  const message = inputValue.value.trim()
  if (message) {
    emit('send', message)
    inputValue.value = ''
    // 发送后重新聚焦输入框
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}

const focus = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 监听器
watch(inputValue, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue
})

// 暴露方法给父组件
defineExpose({
  focus
})
</script>

<style lang="scss" scoped>
.chat-input-container {
  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    background: var(--el-bg-color);
    border: 2px solid var(--el-border-color-light);
    border-radius: 24px;
    padding: 8px 12px;
    transition: all 0.2s ease;
    
    &:focus-within {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
    
    .message-input {
      flex: 1;
      
      :deep(.el-textarea__inner) {
        border: none;
        padding: 8px 0;
        background: transparent;
        resize: none;
        box-shadow: none;
        font-size: 14px;
        line-height: 1.5;
        
        &::placeholder {
          color: var(--el-text-color-placeholder);
          font-size: 14px;
        }
        
        &:focus {
          box-shadow: none;
        }
      }
    }
    
    .input-actions {
      display: flex;
      align-items: center;
      padding-bottom: 2px;
      
      .send-button {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        transition: all 0.2s ease;
        
        &:not(:disabled):hover {
          transform: scale(1.05);
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
  
  .input-counter {
    text-align: right;
    margin-top: 4px;
    
    .counter-text {
      font-size: 11px;
      color: var(--el-text-color-secondary);
      
      &.over-limit {
        color: var(--el-color-danger);
      }
    }
  }
  
  .input-tips {
    margin-top: 8px;
    
    .tips-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      opacity: 0.6;
      transition: opacity 0.2s ease;
      
      &:hover {
        opacity: 1;
      }
    }
  }
}

// 聚焦动画
.chat-input-container {
  .input-wrapper {
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(var(--el-color-primary-rgb), 0.1),
        transparent
      );
      transition: left 0.6s ease;
    }
    
    &:focus-within::before {
      left: 100%;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .chat-input-container {
    .input-wrapper {
      border-radius: 20px;
      padding: 6px 10px;
      
      .message-input :deep(.el-textarea__inner) {
        font-size: 16px; // 防止iOS自动缩放
      }
      
      .send-button {
        width: 32px;
        height: 32px;
      }
    }
  }
}

// 深色主题适配
@media (prefers-color-scheme: dark) {
  .chat-input-container {
    .input-wrapper {
      background: var(--el-bg-color-darker);
      
      &:focus-within {
        box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.3);
      }
    }
  }
}
</style> 