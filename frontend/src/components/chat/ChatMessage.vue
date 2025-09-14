<template>
    <div 
      class="message-item"
      :class="{ 
        'outgoing': message.outgoing,
        'incoming': !message.outgoing
      }"
    >
      <div class="message-content">
        <div class="message-bubble">
          <div class="message-text" v-html="message.processedMessage"></div>
          
          <!-- 图片消息 -->
          <div v-if="message.image" class="message-image">
            <el-image 
              :src="message.image" 
              :preview-src-list="[message.image]"
              fit="cover"
              class="image-content"
            />
          </div>
          
          <!-- 文件消息 -->
          <div v-if="message.file" class="message-file">
            <div class="file-info">
              <el-icon class="file-icon"><Document /></el-icon>
              <div class="file-details">
                <div class="file-name">{{ message.file.name }}</div>
                <div class="file-size">{{ formatFileSize(message.file.size) }}</div>
              </div>
            </div>
            <el-button 
              type="primary" 
              size="small" 
              @click="downloadFile(message.file)"
            >
              {{ $t('chat.messages.downloadFile') }}
            </el-button>
          </div>
        </div>
        
        <div class="message-meta">
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          
          <div v-if="message.outgoing" class="message-status">
            <el-icon v-if="message.read" class="read-icon" :title="$t('chat.status.read')">
              <Check />
            </el-icon>
            <el-icon v-else class="unread-icon" :title="$t('chat.status.unread')">
              <Clock />
            </el-icon>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
import { ElImage, ElButton, ElIcon } from 'element-plus';
import { Document, Check, Clock } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment';
  
  export default {
    name: 'ChatMessage',
    components: {
      ElImage,
      ElButton,
      ElIcon,
      Document,
      Check,
      Clock
    },
    props: {
      message: {
        type: Object,
        required: true
      }
    },
    setup(props) {
      const { t } = useI18n();
      
      const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return moment(timestamp).format('HH:mm');
      };
      
      const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
      };
      
      const downloadFile = (file) => {
        if (file.url) {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };
      
      return {
        t,
        formatTime,
        formatFileSize,
        downloadFile
      };
    }
  };
  </script>
  
  <style lang="scss" scoped>
@use "sass:color";
@use '@/assets/scss/variables' as *;

.message-item {
  margin-bottom: 16px;
  animation: fadeInUp 0.3s ease-out;
  
  .message-content {
    max-width: 70%;
    position: relative;
    
    .message-bubble {
      border-radius: 18px;
      padding: 12px 16px;
      word-wrap: break-word;
      line-height: 1.4;
      box-shadow: 0 2px 12px rgba($text, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba($text, 0.12);
      }
      
      .message-text {
        :deep(img) {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
        
        :deep(a) {
          color: inherit;
          text-decoration: underline;
          
          &:hover {
            opacity: 0.8;
          }
        }
      }
      
      .message-image {
        margin-top: 8px;
        
        .image-content {
          max-width: 200px;
          max-height: 200px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          
          &:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
        }
      }
      
      .message-file {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        border: 1px solid color.adjust($border, $alpha: -0.6);
        border-radius: 8px;
        margin-top: 8px;
        background: $overlayP;
        backdrop-filter: blur(8px);
        transition: all 0.3s ease;
        
        &:hover {
          background: color.adjust($overlayP, $alpha: +0.1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba($text, 0.1);
        }
        
        .file-info {
          display: flex;
          align-items: center;
          flex: 1;
          margin-right: 12px;
          
          .file-icon {
            font-size: 24px;
            color: $text3;
            margin-right: 8px;
          }
          
          .file-details {
            .file-name {
              font-weight: 500;
              margin-bottom: 2px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              color: $text;
            }
            
            .file-size {
              font-size: 12px;
              color: $text3;
            }
          }
        }
      }
    }
    
    .message-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
      padding: 0 4px;
      
      .message-time {
        font-size: 11px;
        color: $text4;
        opacity: 0.7;
        font-weight: 500;
      }
      
      .message-status {
        .read-icon {
          color: color.adjust($alert, $hue: +120deg);
          font-size: 12px;
        }
        
        .unread-icon {
          color: $text4;
          font-size: 12px;
        }
      }
    }
  }
  
  &.outgoing {
    display: flex;
    justify-content: flex-end;
    
    .message-content {
      .message-bubble {
        background: $emphasisGradient;
        color: $textOnEmph;
        border-bottom-right-radius: 8px;
        box-shadow: 0 4px 16px rgba($emphasis1, 0.3);
      }
    }
  }
  
  &.incoming {
    display: flex;
    justify-content: flex-start;
    
    .message-content {
      .message-bubble {
        background: $overlayP;
        backdrop-filter: blur(8px);
        color: $text;
        border: 1px solid color.adjust($border, $alpha: -0.6);
        border-bottom-left-radius: 8px;
      }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-item {
    .message-content {
      max-width: 85%;
      
      .message-bubble {
        padding: 10px 14px;
      }
      
      .message-image .image-content {
        max-width: 150px;
        max-height: 150px;
      }
    }
  }
}
</style>