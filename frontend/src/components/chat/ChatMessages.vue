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
        <div class="loading-spinner">{{ $t('chat.loading') }}</div>
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
        <!-- 消息头像 -->
        <div class="message-avatar">
          <div 
            class="avatar-disc" 
            :style="getMessageAvatarStyle(message.outgoing ? getCurrentUserProfile() : conversation)"
            :title="message.outgoing ? $t('chat.messages.me') : (conversation.profile?.name || conversation.peerID)"
          >
            <span v-if="!getMessageAvatarUrl(message.outgoing ? getCurrentUserProfile() : conversation)" class="avatar-initials">
              {{ message.outgoing ? $t('chat.messages.me') : getMessageInitials(conversation.peerID) }}
            </span>
          </div>
        </div>
        
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
              {{ $t('chat.messages.downloadFile') }}
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
        <el-empty :description="$t('chat.messages.noMessages')" />
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="message-input-area">
      <!-- 图片上传进度提示 -->
      <div v-if="imageUploading" class="upload-progress">
        <span>{{ $t('chat.messages.uploadingImage') }}</span>
        <el-button type="text" size="small" @click="cancelImageUpload">{{ $t('chat.messages.cancelUpload') }}</el-button>
      </div>
      
      <div class="input-toolbar">
        <!-- 图片上传按钮 -->
        <el-button 
          type="text" 
          @click="onClickAddImage"
          :disabled="imageUploading"
          class="toolbar-btn"
          :title="$t('chat.messages.sendImage')"
        >
          <el-icon><Picture /></el-icon>
        </el-button>
        
        <!-- Emoji按钮 -->
        <el-button 
          type="text" 
          @click="toggleEmojiPicker"
          class="toolbar-btn"
          :title="$t('chat.messages.emoji')"
        >
          <el-icon><Star /></el-icon>
        </el-button>
      </div>
      
      <div class="input-container">
        <el-input
          v-model="messageText"
          type="textarea"
          :rows="3"
          :placeholder="$t('chat.messages.inputPlaceholder')"
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
          {{ $t('chat.messages.sendButton') }}
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
import { useI18n } from 'vue-i18n';
import { useChatStore } from '@/stores/chat';
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
import { getAvatarBgImage } from '../../../backbone/utils/responsive';
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
    },
    debug: {
      type: Boolean,
      default: false
    }
  },
  emits: ['send-message'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const chatStore = useChatStore();
    const messageText = ref('');
    const showEmojiPicker = ref(false);
    const messagesList = ref(null);
    const imageInput = ref(null);
    const imageUploading = ref(false);
    const imageUploads = ref([]);
    
    const loading = computed(() => chatStore.loading);
    
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
        ElMessage.error(t('chat.errors.invalidFileType'));
        return;
      }
      
      // 检查文件大小 (限制为5MB)
      if (file.size > 5 * 1024 * 1024) {
        ElMessage.error(t('chat.errors.imageSizeExceeded'));
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
            jqXhr.responseJSON && jqXhr.responseJSON.reason || t('chat.errors.imageUploadFailed')
          );
        });
        
        imageUploads.value.push(upload);
      };
      
      fileReader.onerror = (error) => {
        ElMessage.error(t('chat.errors.fileReadFailed'));
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
    watch(() => props.conversation, (newConversation, oldConversation) => {
      if (newConversation && newConversation.peerID !== oldConversation?.peerID) {
        chatStore.fetchMessages(newConversation.peerID);
        }
    });
    
    // 组件挂载时
    onMounted(() => {
      if (props.conversation && props.conversation.peerID) {
        chatStore.fetchMessages(props.conversation.peerID);
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
    
    // 获取消息头像URL
    const getMessageAvatarUrl = (conversation) => {
      if (conversation.profile && conversation.profile.avatarHashes) {
        return getAvatarBgImage(conversation.profile.avatarHashes, {}, true);
      }
      return null;
    };
    
    // 获取消息头像样式
    const getMessageAvatarStyle = (conversation) => {
      if (conversation.profile && conversation.profile.avatarHashes) {
        return getAvatarBgImage(conversation.profile.avatarHashes);
      }
      return '';
    };
    
    // 获取消息头像首字母
    const getMessageInitials = (peerID) => {
      return peerID.substring(0, 2).toUpperCase();
    };
    
    // 获取当前用户profile
    const getCurrentUserProfile = () => {
      return {
        profile: {
          avatarHashes: app.profile.get('avatarHashes').toJSON(),
          name: app.profile.get('name'),
          handle: app.profile.get('handle')
        }
      };
    };
    
    return {
      t,
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
      handleImageClick,
      getMessageAvatarUrl,
      getMessageAvatarStyle,
      getMessageInitials,
      getCurrentUserProfile
    };
  }
};
</script>

<style lang="scss" scoped>
@use "sass:color";
@use '@/assets/scss/variables' as *;

.chat-messages-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, $primary 0%, color.adjust($primary, $lightness: -3%) 100%);
  position: relative;
}

.debug-info {
  background: color.adjust($emphasis1, $lightness: +35%, $saturation: -20%) !important;
  border-bottom: 2px solid $emphasis1;
  color: color.adjust($emphasis1, $lightness: -25%);
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px color.adjust($emphasis1, $alpha: -0.9);
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 20px 20px 16px; /* 右侧padding减少，确保消息靠右 */
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
  background: color.adjust($text3, $alpha: -0.7);
  border-radius: 3px;
}

.messages-list::-webkit-scrollbar-thumb:hover {
  background: color.adjust($text3, $alpha: -0.5);
}

.loading-messages {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.loading-spinner {
  color: $text3;
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
  align-items: flex-end;
  margin-bottom: 16px;
  animation: fadeInUp 0.3s ease-out;
  gap: 12px;
}

.message-item:last-child {
  margin-bottom: 8px;
}

.message-item.outgoing {
  justify-content: flex-end;
  flex-direction: row-reverse; /* 发送消息头像在右侧 */
  margin-left: auto; /* 确保整个消息项靠右 */
}

.message-item.outgoing .message-content {
  max-width: calc(75% - 48px); /* 增加最大宽度，减去头像宽度和间距 */
  margin-right: 0; /* 确保消息完全靠右 */
}

.message-item.incoming {
  justify-content: flex-start;
  margin-right: auto; /* 确保整个消息项靠左 */
}

.message-item.incoming .message-content {
  max-width: calc(75% - 48px); /* 增加最大宽度，减去头像宽度和间距 */
}

/* 消息头像样式 */
.message-avatar {
  flex-shrink: 0;
  margin-bottom: 2px;
}

.message-avatar .avatar-disc {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 2px solid rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-avatar .avatar-disc:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: rgba(64, 158, 255, 0.3);
}

.message-avatar .avatar-disc .avatar-initials {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}

.message-content {
  max-width: 70%;
  padding: 14px 18px;
  border-radius: 18px;
  position: relative;
  box-shadow: 0 2px 8px rgba($text, 0.06);
  transition: all 0.3s ease;
  flex: 1;
  min-width: 0;
}

.message-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba($text, 0.12);
}

.outgoing .message-content {
  background: $emphasisGradient;
  color: $textOnEmph;
  border-bottom-right-radius: 6px;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  border-bottom-left-radius: 18px;
  box-shadow: 0 3px 12px rgba($emphasis1, 0.25);
}

.incoming .message-content {
  background: $overlayP;
  backdrop-filter: blur(8px);
  color: $text;
  border: 1px solid transparentize($border, 0.6);
  border-bottom-left-radius: 6px;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  border-bottom-right-radius: 18px;
  box-shadow: 0 3px 12px rgba($text, 0.06);
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
  color: $text3;
}

.file-details {
  flex: 1;
}

.file-name {
  font-weight: 600;
  margin-bottom: 4px;
  color: $text;
  font-size: 14px;
}

.file-size {
  font-size: 12px;
  color: $text3;
  font-weight: 500;
}

.message-time {
  font-size: 11px;
  opacity: 0.8;
  text-align: right;
  margin-top: 6px;
  font-weight: 500;
  color: $text4;
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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(100, 115, 135, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
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
  box-shadow: 0 8px 24px rgba(100, 115, 135, 0.2);
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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(220, 225, 230, 0.4);
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
  
  .message-item {
    gap: 8px;
  }
  
  .message-avatar .avatar-disc {
    width: 32px;
    height: 32px;
  }
  
  .message-avatar .avatar-disc .avatar-initials {
    font-size: 11px;
  }
  
  .message-item.outgoing .message-content {
    max-width: calc(90% - 40px); /* 增加移动端最大宽度，减去头像宽度和间距 */
  }
  
  .message-item.incoming .message-content {
    max-width: calc(90% - 40px); /* 增加移动端最大宽度，减去头像宽度和间距 */
  }
  
  .message-content {
    padding: 12px 16px;
  }
  
  .image-content {
    max-width: 200px;
    max-height: 200px;
  }
  
  .message-input-area {
    padding: 16px;
  }
  
  .input-toolbar {
    gap: 8px;
  }
  
  .toolbar-btn {
    padding: 6px 10px;
    font-size: 14px;
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