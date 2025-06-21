<template>
  <div class="chat-messages-container">
    <!-- 调试信息 -->
    <div v-if="debug" class="debug-info" style="background: #f0f0f0; padding: 8px; font-size: 12px;">
      <div>当前会话: {{ conversation?.peerID }}</div>
      <div>消息数量: {{ messages.length }}</div>
      <div>最新消息: {{ messages[messages.length - 1]?.message || '无' }}</div>
    </div>
    
    <!-- 消息列表 -->
    <div class="messages-list" ref="messagesList">
      <div v-if="loading" class="loading-messages">
        <div class="loading-spinner">加载中...</div>
      </div>
      
      <div 
        v-for="message in messages" 
        :key="message.messageID || message.timestamp || Math.random()"
        class="message-item"
        :class="{ 
          'outgoing': message.outgoing,
          'incoming': !message.outgoing
        }"
      >
        <div class="message-content">
          <!-- 文本消息 -->
          <div v-if="message.message" class="message-text" v-html="getProcessedMessage(message)"></div>
          
          <!-- 图片消息 -->
          <div v-if="message.image || (message.file && message.file.type === 'image')" class="message-image">
            <el-image 
              :src="getImageUrl(message)" 
              :preview-src-list="[getImageUrl(message)]"
              :preview-teleported="true"
              :initial-index="0"
              fit="cover"
              class="image-content"
              :style="getImageStyle(message)"
              @click="handleImageClick"
            />
          </div>
          
          <!-- 文件消息 -->
          <div v-if="message.file && message.file.type !== 'image'" class="message-file">
            <div class="file-info">
              <el-icon class="file-icon"><Document /></el-icon>
              <div class="file-details">
                <div class="file-name">{{ message.file.filename || message.file.name }}</div>
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
          
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          <div v-if="message.outgoing" class="message-status">
            <el-icon v-if="message.read" class="read-icon"><Check /></el-icon>
            <el-icon v-else class="unread-icon"><Clock /></el-icon>
          </div>
        </div>
      </div>
      
      <div v-if="messages.length === 0 && !loading" class="no-messages">
        <el-empty description="暂无消息" />
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="message-input-area">
      <!-- 图片上传进度提示 -->
      <div v-if="imageUploading" class="upload-progress">
        <span>正在上传图片...</span>
        <el-button type="text" size="small" @click="cancelImageUpload">取消</el-button>
      </div>
      
      <div class="input-toolbar">
        <!-- 图片上传按钮 -->
        <el-button 
          type="text" 
          @click="onClickAddImage"
          :disabled="imageUploading"
          class="toolbar-btn"
          title="发送图片"
        >
          <el-icon><Picture /></el-icon>
        </el-button>
        
        <!-- Emoji按钮 -->
        <el-button 
          type="text" 
          @click="toggleEmojiPicker"
          class="toolbar-btn"
          title="表情"
        >
          <el-icon><Star /></el-icon>
        </el-button>
      </div>
      
      <div class="input-container">
        <el-input
          v-model="messageText"
          type="textarea"
          :rows="3"
          placeholder="输入消息..."
          @keydown.enter.prevent="handleEnterKey"
          resize="none"
          class="message-textarea"
        />
        
        <el-button 
          type="primary" 
          @click="sendMessage"
          :disabled="!messageText.trim()"
          class="send-btn"
        >
          发送
        </el-button>
      </div>
      
      <!-- 隐藏的文件输入 -->
      <input 
        ref="imageInput"
        type="file" 
        accept="image/*" 
        class="hidden-input"
        @change="onImageSelected"
      />
      
      <!-- Emoji选择器 -->
      <div v-if="showEmojiPicker" class="emoji-picker">
        <div class="emoji-grid">
          <span 
            v-for="emoji in commonEmojis" 
            :key="emoji"
            class="emoji-item"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { 
  ElButton, 
  ElIcon, 
  ElInput, 
  ElLoading, 
  ElEmpty,
  ElImage,
  ElMessage
} from 'element-plus';
import { Check, Clock, Star, Picture, Document } from '@element-plus/icons-vue';
import moment from 'moment';
import DOMPurify from 'dompurify';
import twemoji from 'twemoji';
import { getEmojiByName } from '../../../backbone/data/emojis';
import app from '../../../backbone/app';
import { myAjax } from '../../../src/api/api';

export default {
  name: 'ChatMessages',
  components: {
    ElButton,
    ElIcon,
    ElInput,
    ElLoading,
    ElEmpty,
    ElImage,
    Check,
    Clock,
    Star,
    Picture,
    Document
  },
  props: {
    conversation: {
      type: Object,
      required: true
    },
    messages: {
      type: Array,
      default: () => []
    }
  },
  emits: ['send-message'],
  setup(props, { emit }) {
    const store = useStore();
    const messageText = ref('');
    const showEmojiPicker = ref(false);
    const messagesList = ref(null);
    const imageInput = ref(null);
    const imageUploading = ref(false);
    const imageUploads = ref([]);
    
    const loading = computed(() => store.getters['chat/loading']);
    
    // 常用emoji
    const commonEmojis = [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬'
    ];
    
    // 消息处理函数
    const processMessage = (message) => {
      if (typeof message !== 'string') {
        return '';
      }

      let processedMessage = message;

      // 处理emoji占位符
      const emojiPlaceholderRegEx = new RegExp(':.+?:', 'g');
      const matches = processedMessage.match(emojiPlaceholderRegEx);

      if (matches) {
        matches.forEach((match) => {
          const emoji = getEmojiByName(match);
          if (emoji && emoji.char) {
            processedMessage = processedMessage.replace(match, emoji.char);
          }
        });
      }

      // 清理HTML
      processedMessage = DOMPurify.sanitize(processedMessage);

      // 转换emoji为图片
      processedMessage = twemoji.parse(
        processedMessage,
        (icon) => (`../imgs/emojis/72X72/${icon}.png`),
      );

      return processedMessage;
    };
    
    // 获取处理后的消息内容
    const getProcessedMessage = (message) => {
      if (message.processedMessage) {
        return message.processedMessage;
      }
      
      if (message.message) {
        return processMessage(message.message);
      }

      return '';
    };
    
    // 获取图片URL
    const getImageUrl = (message) => {
      if (message.image) {
        return message.image;
      }
      if (message.file && message.file.type === 'image' && message.file.hash) {
        return app.getServerUrl(`ob/image/${message.file.hash}`);
      }
      return '';
    };
    
    // 获取图片样式
    const getImageStyle = (message) => {
      const maxWidth = '200px';
      const maxHeight = '200px';
      return {
        maxWidth,
        maxHeight,
        borderRadius: '8px'
      };
    };
    
    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (!bytes) return '';
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };
    
    // 下载文件
    const downloadFile = (file) => {
      if (file.hash) {
        const link = document.createElement('a');
        link.href = app.getServerUrl(`ob/image/${file.hash}`);
        link.download = file.filename || file.name || 'download';
        link.click();
      }
    };
    
    // 点击添加图片按钮
    const onClickAddImage = () => {
      if (imageInput.value) {
        imageInput.value.click();
      }
    };
    
    // 图片选择处理
    const onImageSelected = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // 清空input值，允许重复选择同一文件
      event.target.value = '';
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        ElMessage.error('请选择图片文件');
        return;
      }
      
      // 检查文件大小 (限制为5MB)
      if (file.size > 5 * 1024 * 1024) {
        ElMessage.error('图片大小不能超过5MB');
        return;
      }
      
      uploadImage(file);
    };
    
    // 上传图片
    const uploadImage = (file) => {
      imageUploading.value = true;
      
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      
      fileReader.onload = () => {
        const toUpload = {
          filename: truncateImageFilename(file.name),
          image: fileReader.result.replace(/^data:image\/(png|jpeg|webp);base64,/, ''),
          type: 'image',
        };
        
        const upload = myAjax({
          url: app.getServerUrl('ob/images'),
          type: 'POST',
          data: JSON.stringify([toUpload]),
          dataType: 'json',
          contentType: 'application/json',
        }).always(() => {
          if (!getInProgressImageUploads().length) {
            imageUploading.value = false;
          }
        }).done((uploadedFiles) => {
          if (!uploadedFiles.length) return;
          
          const fileInChat = {
            filename: uploadedFiles[0].name, 
            hash: uploadedFiles[0].hash, 
            type: toUpload.type
          };
          
          // 发送图片消息
          emit('send-message', '', fileInChat);
        }).fail((jqXhr) => {
          ElMessage.error(
            jqXhr.responseJSON && jqXhr.responseJSON.reason || '图片上传失败'
          );
        });
        
        imageUploads.value.push(upload);
      };
      
      fileReader.onerror = (error) => {
        ElMessage.error('读取图片文件失败');
        imageUploading.value = false;
      };
    };
    
    // 获取正在上传的图片
    const getInProgressImageUploads = () => {
      return imageUploads.value.filter((upload) => upload.state() === 'pending');
    };
    
    // 取消图片上传
    const cancelImageUpload = () => {
      getInProgressImageUploads().forEach((upload) => upload.abort());
      imageUploading.value = false;
    };
    
    // 截断图片文件名
    const truncateImageFilename = (filename) => {
      const maxLength = 50;
      if (filename.length <= maxLength) return filename;
      
      const extension = filename.split('.').pop();
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4) + '...';
      
      return `${truncatedName}.${extension}`;
    };
    
    // 方法
    const sendMessage = async () => {
      if (!messageText.value.trim()) return;
      
      const text = messageText.value.trim();
      messageText.value = '';
      showEmojiPicker.value = false;
      
      emit('send-message', text);
    };
    
    const handleEnterKey = (event) => {
      if (event.shiftKey) {
        // Shift+Enter 换行
        return;
      }
      sendMessage();
    };
    
    const insertEmoji = (emoji) => {
      messageText.value += emoji;
    };
    
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      return moment(timestamp).format('HH:mm');
    };
    
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesList.value) {
          messagesList.value.scrollTop = messagesList.value.scrollHeight;
        }
      });
    };
    
    // 监听消息变化，自动滚动到底部
    watch(() => props.messages.length, (newLength, oldLength) => {
      if (newLength > oldLength) {
        scrollToBottom();
      }
    });
    
    // 监听新消息
    watch(() => props.messages, (newMessages, oldMessages) => {
      if (newMessages.length > oldMessages.length) {
        scrollToBottom();
      }
    }, { deep: true });
    
    // 监听会话变化，自动拉取最新消息
    watch(
      () => props.conversation && props.conversation.peerID,
      (newPeerID, oldPeerID) => {
        if (newPeerID && newPeerID !== oldPeerID) {
          store.dispatch('chat/fetchMessages', newPeerID);
        }
      },
      { immediate: true }
    );
    
    // 组件挂载时
    onMounted(() => {
      if (props.conversation?.peerID) {
        store.dispatch('chat/fetchMessages', props.conversation.peerID);
      }
    });
    
    const toggleEmojiPicker = () => {
      showEmojiPicker.value = !showEmojiPicker.value;
    };
    
    const handleImageClick = () => {
      // 图片点击事件处理
      // Element Plus的el-image组件会自动处理预览功能
      // 这里可以添加额外的点击逻辑，比如记录点击事件等
      console.log('图片被点击，预览功能已激活');
    };
    
    return {
      messageText,
      showEmojiPicker,
      messagesList,
      imageInput,
      imageUploading,
      loading,
      commonEmojis,
      sendMessage,
      handleEnterKey,
      insertEmoji,
      formatTime,
      getProcessedMessage,
      getImageUrl,
      getImageStyle,
      formatFileSize,
      downloadFile,
      onClickAddImage,
      onImageSelected,
      cancelImageUpload,
      toggleEmojiPicker,
      handleImageClick
    };
  }
};
</script>

<style scoped>
.chat-messages-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
}

.debug-info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
  border-bottom: 2px solid #409eff;
  color: #1e40af;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.messages-list::-webkit-scrollbar {
  width: 6px;
}

.messages-list::-webkit-scrollbar-track {
  background: transparent;
}

.messages-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.messages-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.loading-messages {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.loading-spinner {
  color: #64748b;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-spinner::before {
  content: '⏳';
  font-size: 20px;
  animation: spin 1s linear infinite;
}

.message-item {
  display: flex;
  margin-bottom: 12px;
  animation: fadeInUp 0.3s ease-out;
}

.message-item.outgoing {
  justify-content: flex-end;
}

.message-item.incoming {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 16px 20px;
  border-radius: 20px;
  position: relative;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.message-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.outgoing .message-content {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  color: white;
  border-bottom-right-radius: 8px;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.incoming .message-content {
  background: white;
  color: #1e293b;
  border: 1px solid rgba(228, 231, 237, 0.8);
  border-bottom-left-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.message-text {
  word-wrap: break-word;
  line-height: 1.6;
  margin-bottom: 8px;
  font-size: 14px;
}

.message-text :deep(img) {
  border-radius: 8px;
  margin: 4px 0;
}

.message-text :deep(a) {
  color: inherit;
  text-decoration: underline;
  opacity: 0.8;
}

.message-text :deep(a):hover {
  opacity: 1;
}

/* 发送方消息中的表情样式优化 */
.outgoing .message-text {
  color: white;
}

.outgoing .message-text :deep(img) {
  /* 为发送方消息中的emoji图片添加白色边框和阴影 */
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin: 4px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* 发送方消息中的emoji字符样式 */
.outgoing .message-text {
  /* 确保emoji字符在蓝色背景上清晰可见 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
}

/* 接收方消息中的表情样式 */
.incoming .message-text :deep(img) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  margin: 4px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-image {
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.image-content {
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 250px;
  max-height: 250px;
}

.image-content:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  opacity: 0.9;
}

.message-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.message-file:hover {
  background: rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.file-icon {
  font-size: 28px;
  margin-right: 12px;
  color: #64748b;
}

.file-details {
  flex: 1;
}

.file-name {
  font-weight: 600;
  margin-bottom: 4px;
  color: #1e293b;
  font-size: 14px;
}

.file-size {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  text-align: right;
  margin-top: 4px;
  font-weight: 500;
}

.message-status {
  position: absolute;
  bottom: 4px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.message-status .read-icon {
  color: #10b981;
  font-size: 12px;
}

.message-status .unread-icon {
  color: #94a3b8;
  font-size: 12px;
}

.no-messages {
  text-align: center;
  color: #64748b;
  padding: 60px 40px;
  font-style: italic;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  margin: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.message-input-area {
  border-top: 1px solid rgba(228, 231, 237, 0.6);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 20px;
  position: relative;
}

.message-input-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(64, 158, 255, 0.2) 50%, transparent 100%);
}

.upload-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #1e40af;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.upload-progress .el-button {
  color: #1e40af;
  font-weight: 600;
}

.upload-progress .el-button:hover {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
}

.input-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.toolbar-btn {
  padding: 8px 12px;
  color: #64748b;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 16px;
}

.toolbar-btn:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-textarea {
  flex: 1;
}

.message-textarea :deep(.el-textarea__inner) {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px 20px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message-textarea :deep(.el-textarea__inner):focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  transform: translateY(-1px);
}

.message-textarea :deep(.el-textarea__inner)::placeholder {
  color: #94a3b8;
}

.send-btn {
  border-radius: 12px;
  padding: 16px 28px;
  height: 48px;
  font-weight: 600;
  font-size: 14px;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.4);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  background: #cbd5e1;
  box-shadow: none;
  cursor: not-allowed;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 20px;
  right: 20px;
  background: white;
  border: 1px solid rgba(228, 231, 237, 0.8);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  animation: slideInUp 0.3s ease-out;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}

.emoji-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 22px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.emoji-item:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .messages-list {
    padding: 16px;
    gap: 12px;
  }
  
  .message-content {
    max-width: 85%;
    padding: 12px 16px;
  }
  
  .image-content {
    max-width: 200px;
    max-height: 200px;
  }
  
  .message-input-area {
    padding: 16px;
  }
  
  .input-container {
    gap: 8px;
  }
  
  .send-btn {
    padding: 12px 20px;
    height: 44px;
  }
}
</style> 