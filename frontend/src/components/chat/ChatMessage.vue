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
              下载
            </el-button>
          </div>
        </div>
        
        <div class="message-meta">
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          
          <div v-if="message.outgoing" class="message-status">
            <el-icon v-if="message.read" class="read-icon" title="已读">
              <Check />
            </el-icon>
            <el-icon v-else class="unread-icon" title="未读">
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
        formatTime,
        formatFileSize,
        downloadFile
      };
    }
  };
  </script>
  
  <style lang="less" scoped>
  .message-item {
    margin-bottom: 16px;
    
    .message-content {
      max-width: 70%;
      position: relative;
      
      .message-bubble {
        border-radius: 18px;
        padding: 12px 16px;
        word-wrap: break-word;
        line-height: 1.4;
        
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
          }
        }
        
        .message-file {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          margin-top: 8px;
          
          .file-info {
            display: flex;
            align-items: center;
            flex: 1;
            margin-right: 12px;
            
            .file-icon {
              font-size: 24px;
              color: #909399;
              margin-right: 8px;
            }
            
            .file-details {
              .file-name {
                font-weight: 500;
                margin-bottom: 2px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
              
              .file-size {
                font-size: 12px;
                color: #c0c4cc;
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
          font-size: 12px;
          color: #c0c4cc;
        }
        
        .message-status {
          .read-icon {
            color: #67c23a;
            font-size: 12px;
          }
          
          .unread-icon {
            color: #c0c4cc;
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
          background-color: #409eff;
          color: white;
        }
      }
    }
    
    &.incoming {
      display: flex;
      justify-content: flex-start;
      
      .message-content {
        .message-bubble {
          background-color: #f4f4f5;
          color: #303133;
        }
      }
    }
  }
  </style>