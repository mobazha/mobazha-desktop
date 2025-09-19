<template>
  <div class="discussion-tab">
    <!-- 打字指示器 -->
    <div v-if="isTyping" class="typing-indicator">
      <el-alert
        :title="typingIndicatorContent"
        type="info"
        :closable="false"
        show-icon
        class="typing-alert"
      />
    </div>

    <!-- 消息列表区域 -->
    <div class="messages-container">
      <div class="messages-header">
        <div class="avatar-container">
          <div class="avatar" :style="ob.getAvatarBgImage(ob.ownProfile.avatarHashes)"></div>
        </div>
        <div class="header-actions">
          <el-dropdown v-if="model.type === 'sale'" @command="handleDropdownCommand">
            <el-button type="text" class="more-button">
              <i class="el-icon-more"></i>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="addCustomerService">
                  {{ ob.polyT("orderDetail.discussionTab.addCustomerService") }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button 
            type="text" 
            class="image-button"
            @click="onClickAddImage"
            :loading="imageUploadInprogress"
          >
            <i class="el-icon-picture"></i>
          </el-button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div ref="messagesWindow" class="messages-window" @scroll="onScroll">
        <div v-if="loadingMessages" class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>加载消息中...</p>
        </div>
        
        <div v-if="showLoadMessagesError" class="error-container">
          <el-alert
            :title="ob.polyT('orderDetail.discussionTab.loadMessagesError')"
            type="error"
            :closable="false"
            show-icon
          >
            <template #default>
              <el-button type="text" @click="onClickRetryLoadMessage">
                {{ ob.polyT("orderDetail.discussionTab.retryLink") }}
              </el-button>
            </template>
          </el-alert>
        </div>

        <div v-if="!loadingMessages && !showLoadMessagesError" class="messages-list">
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="message-item"
            :class="{ 'message-outgoing': message.outgoing }"
          >
            <div class="message-avatar">
              <div 
                class="avatar" 
                :style="getMessageAvatar(message)"
              ></div>
            </div>
            <div class="message-content">
              <div class="message-header" :style="message.outgoing ? 'color: rgba(255, 255, 255, 0.8)' : ''">
                <span class="message-sender">{{ getMessageSender(message) }}</span>
                <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
              </div>
              <div class="message-body">
                <div v-if="message.message" class="message-text">{{ message.message }}</div>
                <div v-if="message.file" class="message-image">
                  <img 
                    :src="getImageUrl(message.file.hash)" 
                    :alt="message.file.filename"
                    @click="previewImage(message.file)"
                    class="message-img"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息输入区域 -->
    <div class="message-input-container" :class="footerClass">
      <div class="input-header">
        <div class="avatar-container">
          <div class="avatar" :style="ob.getAvatarBgImage(ob.ownProfile.avatarHashes)"></div>
        </div>
        <div class="input-area">
          <el-input
            ref="messageInput"
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            :placeholder="messageInputPlaceholder"
            :maxlength="maxMessageLength"
            show-word-limit
            resize="none"
            @keydown.enter.exact.prevent="onKeyDownMessageInput"
            @input="onInputMessage"
            @blur="onInputBlur"
            class="message-textarea"
          />
          <div v-if="footerClass === 'preventModChat'" class="mod-chat-warning">
            {{ ob.polyT('orderDetail.discussionTab.modCannotChat') }}
          </div>
        </div>
        <div class="input-actions">
          <el-button 
            type="primary" 
            :disabled="sendDisabled || footerClass === 'preventModChat'"
            @click="onClickSend"
            :loading="sending"
            class="send-button"
          >
            {{ ob.polyT('orderDetail.discussionTab.btnSend') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input 
      ref="inputImageUpload" 
      type="file" 
      accept="image/*" 
      @change="onChangeImageUpload" 
      class="hidden-input" 
    />

    <!-- 添加客服对话框 -->
    <el-dialog 
      v-model="csDialogVisible" 
      :title="ob.polyT('orderDetail.discussionTab.addCustomerService')" 
      width="500px"
      class="customer-service-dialog"
    >
      <el-form :model="csForm" :rules="csFormRules" ref="csFormRef">
        <el-form-item label="用户ID" prop="userId" label-width="80px">
          <el-input 
            v-model="csForm.userId" 
            placeholder="请输入客服用户ID"
            autocomplete="off" 
          />
        </el-form-item>
        <el-form-item label="备注" prop="note" label-width="80px">
          <el-input 
            v-model="csForm.note" 
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="csDialogVisible = false">
            {{ ob.polyT('orderDetail.discussionTab.cancel') }}
          </el-button>
          <el-button type="primary" @click="confirmAddCustomerService" :loading="addingCustomerService">
            {{ ob.polyT('orderDetail.discussionTab.confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="imagePreviewVisible" title="图片预览" width="600px" class="image-preview-dialog">
      <div class="image-preview-container">
        <img :src="previewImageUrl" alt="预览图片" class="preview-image" />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import app from '../../../../backbone/app';
import chatService from '../../../services/chatService';
import { capitalize } from '../../../../backbone/utils/string';
import { getSocket } from '../../../../backbone/utils/serverConnect';
import { checkValidParticipantObject } from '../../../utils/utils';
import { truncateImageFilename } from '../../../../backbone/utils/index';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

export default {
  components: {
    Loading
  },
  props: {
    options: {
      type: Object,
      default: {},
    },
    bb: Function,
  },
  data() {
    return {
      messagesPerPage: 20,
      typingExpires: 3000,
      maxMessageLength: 1000,

      messages: [],
      inputMessage: '',
      typingIndicatorContent: '',
      isTyping: false,
      _chatters: undefined,

      showLoadMessagesError: false,
      loadingMessages: false,
      fetching: false,
      fetchedAllMessages: false,
      ignoreScroll: false,
      
      buyer: {
        isTyping: false,
      },
      vendor: {
        isTyping: false,
      },
      moderator: {
        isTyping: false,
      },

      imageUploadInprogress: false,
      sending: false,
      sendDisabled: false,

      csDialogVisible: false,
      csForm: {
        userId: '',
        note: ''
      },
      csFormRules: {
        userId: [
          { required: true, message: '请输入用户ID', trigger: 'blur' }
        ]
      },
      addingCustomerService: false,

      imagePreviewVisible: false,
      previewImageUrl: '',

      lastTypingSentAt: null,
      typingTimeout: null,
      showTypingTimeout: null,
      // 简化的打字指示器控制
      typingIndicatorTimer: null,
    };
  },
  created() {
    this.initEventChain();
    this.loadData(this.options);
  },
  mounted() {
    this.setupSocketListener();
    this.fetchMessages();
  },
  beforeUnmount() {
    this.cleanupSocketListener();
    this.clearTypingTimeouts();
  },
  computed: {
    ob() {
      return {
        ...this.templateHelpers,
        showLoadMessagesError: this.showLoadMessagesError,
        ownProfile: app.profile.toJSON(),
      };
    },

    sendToIds() {
      return this.getChatters()
        .filter((chatter) => {
          let include = true;
          if (chatter.role === 'moderator' && this.model.get('state') !== 'DISPUTED') {
            include = false;
          }
          return include;
        })
        .map((chatter) => chatter.id);
    },

    footerClass() {
      if (this.moderator && this.moderator.id === app.profile.id && this.model.get('state') === 'RESOLVED') {
        return 'preventModChat';
      }
      return '';
    },

    messageInputPlaceholder() {
      if (this.moderator && this.moderator.id === app.profile.id) return;

      if (this.model.get('state') === 'DECIDED' || this.model.get('state') === 'RESOLVED') {
        return app.polyglot.t('orderDetail.discussionTab.enterMessageNoMoreModPlaceholder');
      }
      return app.polyglot.t('chat.conversation.messageInputPlaceholder');
    },
  },
  methods: {
    loadData(options = {}) {
      if (!options.orderID) {
        throw new Error('Please provide an orderID.');
      }

      if (!this.model) {
        throw new Error('Please provide an order / case model.');
      }

      checkValidParticipantObject(options.buyer, 'buyer');
      checkValidParticipantObject(options.vendor, 'vendor');

      if (options.moderator) {
        checkValidParticipantObject(options.moderator, 'moderator');
      }

      this.baseInit(options);

      this.showLoadMessagesError = false;
      this.fetching = false;
      this.fetchedAllMessages = false;
      this.ignoreScroll = false;
      this.buyer = options.buyer;
      this.vendor = options.vendor;
      this.moderator = options.moderator;
      this.buyer.isTyping = false;
      this.vendor.isTyping = false;
      if (this.moderator) this.moderator.isTyping = false;
    },

    setupSocketListener() {
      const socket = getSocket();
      if (socket) {
        socket.on('message', this.onSocketMessage);
      }
    },

    cleanupSocketListener() {
      const socket = getSocket();
      if (socket) {
        socket.off('message', this.onSocketMessage);
      }
    },

    clearTypingTimeouts() {
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
      if (this.showTypingTimeout) {
        clearTimeout(this.showTypingTimeout);
      }
      if (this.typingIndicatorTimer) {
        clearTimeout(this.typingIndicatorTimer);
      }
    },

    async fetchMessages(offsetID, limit = this.messagesPerPage) {
      if (this.fetching) return;
      this.fetching = true;
      this.loadingMessages = true;
      this.showLoadMessagesError = false;
      try {
        const params = {
          limit,
          orderID: this.model.id,
        };
        if (offsetID) params.offsetID = offsetID;
        
        const response = await chatService.getGroupMessages(this.model.id, params);
        
        if (response && (response.success !== false)) {
          const newMessages = response.messages || response || [];
          if (offsetID) {
            this.messages.unshift(...newMessages);
          } else {
            this.messages = newMessages;
            // 反转数组，确保旧消息在前，新消息在后
            this.messages.reverse();
          }
          
          if (newMessages.length < limit) {
            this.fetchedAllMessages = true;
          }
          if (!this.firstSyncComplete) {
            this.firstSyncComplete = true;
            this.$nextTick(() => {
              this.scrollToBottom();
              this.markConvoAsRead();
            });
          }
        } else {
          throw new Error(response?.reason || response?.message || '获取消息失败');
        }
      } catch (error) {
        console.error('获取消息失败:', error);
        this.showLoadMessagesError = true;
        let errorMessage = error?.reason || error?.message || '获取消息失败，请重试';
        ElMessage.error(errorMessage);
      } finally {
        this.fetching = false;
        this.loadingMessages = false;
      }
    },

    async sendMessage(msg, file = null) {
      if (!msg && !file) {
        throw new Error('Please provide a message to send.');
      }
      this.sending = true;
      this.lastTypingSentAt = null;
      
      // 清理打字指示器状态
      if (this.typingIndicatorTimer) {
        clearTimeout(this.typingIndicatorTimer);
        this.typingIndicatorTimer = null;
      }
      
      // 只有当输入框有内容时才发送打字指示
      if (this.inputMessage.trim()) {
        // 延迟2秒发送打字指示，避免频繁触发
        this.typingIndicatorTimer = setTimeout(() => {
          this.sendTypingIndicator();
        }, 2000);
      }
      
      try {
        const response = await chatService.sendGroupMessage(
          this.sendToIds,
          msg || '',
          this.model.id,
          file
        );
        
        if (response && (response.success !== false)) {
          const newMessage = {
            id: response.messageId || response.id || Date.now(),
            peerIDs: this.sendToIds,
            peerID: app.profile.id,
            orderID: this.model.id,
            message: msg || '',
            file: file,
            outgoing: true,
            timestamp: Date.now(),
          };
          this.messages.push(newMessage);
          this.$nextTick(() => {
            this.scrollToBottom();
          });
          return true;
        } else {
          throw new Error(response?.reason || response?.message || '发送失败');
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        let errorMessage = error?.reason || error?.message || '发送消息失败，请重试';
        ElMessage.error(errorMessage);
        return false;
      } finally {
        this.sending = false;
      }
    },

    onInputMessage() {
      this.sendDisabled = !this.inputMessage.trim();
      
      // 清除之前的定时器
      if (this.typingIndicatorTimer) {
        clearTimeout(this.typingIndicatorTimer);
      }
      
      // 只有当输入框有内容时才发送打字指示
      if (this.inputMessage.trim()) {
        // 延迟2秒发送打字指示，避免频繁触发
        this.typingIndicatorTimer = setTimeout(() => {
          this.sendTypingIndicator();
        }, 2000);
      }
    },

    onInputBlur() {
      // 清理打字指示器定时器
      if (this.typingIndicatorTimer) {
        clearTimeout(this.typingIndicatorTimer);
        this.typingIndicatorTimer = null;
      }
    },

    onKeyDownMessageInput(e) {
      if (e.shiftKey || e.which !== 13) return;

      const message = this.inputMessage.trim();
      if (message) this.onClickSend();
      e.preventDefault();
    },

    async onClickSend() {
      const message = this.inputMessage.trim();
      if (!message || this.sending) return;

      const success = await this.sendMessage(message);
      if (success) {
        this.inputMessage = '';
        this.sendDisabled = true;
      }
    },

    onClickAddImage() {
      this.$refs.inputImageUpload.click();
    },

    async onChangeImageUpload(event) {
      const imageFile = event.target.files[0];
      if (!imageFile) return;

      this.imageUploadInprogress = true;
      this.$refs.inputImageUpload.value = '';

      try {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(imageFile);

        fileReader.onload = async () => {
          const toUpload = {
            filename: truncateImageFilename(imageFile.name),
            image: fileReader.result.replace(/^data:image\/(png|jpeg|webp);base64,/, ''),
            type: 'image',
          };

          await this.uploadImage(toUpload);
        };

        fileReader.onerror = (error) => {
          ElMessage.error('读取图片文件失败');
          this.imageUploadInprogress = false;
        };
      } catch (error) {
        ElMessage.error('处理图片文件失败');
        this.imageUploadInprogress = false;
      }
    },

    async uploadImage(file) {
      if (!file) {
        throw new Error('Please provide a image to upload.');
      }
      try {
        const response = await chatService.uploadImage(file);
        if (response && response.length > 0) {
          const fileInChat = { 
            filename: response[0].name, 
            hash: response[0].hash, 
            type: file.type 
          };
          await this.sendMessage('', fileInChat);
        } else {
          throw new Error('上传失败');
        }
      } catch (error) {
        console.error('上传图片失败:', error);
        let errorMessage = error?.reason || error?.message || '上传图片失败，请重试';
        ElMessage.error(errorMessage);
      } finally {
        this.imageUploadInprogress = false;
      }
    },

    onSocketMessage(e) {
      if (e.jsonData.chatMessage && e.jsonData.chatMessage.orderID !== this.model.id) return;
      if (e.jsonData.messageTyping && e.jsonData.messageTyping.orderID !== this.model.id) return;

      if (e.jsonData.chatMessage) {
        // 收到新消息
        const message = {
          ...e.jsonData.chatMessage,
          outgoing: false,
        };

        this.messages.push(message);
        this.markConvoAsRead();

        // 处理打字指示
        const messageSender = this.getChatters().find((chatter) => chatter.id === e.jsonData.chatMessage.peerID);
        if (messageSender) {
          messageSender.isTyping = false;
          const typers = this.getChatters().filter((chatter) => chatter.isTyping);
          if (!typers.length) {
            this.hideTypingIndicator();
          } else {
            this.setTypingIndicator();
          }
        }

        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } else if (e.jsonData.messageTyping) {
        // 对方正在打字
        this.setTyping(e.jsonData.messageTyping.peerID);
      }
    },

    setTyping(id) {
      if (!id) return;

      const parties = ['buyer', 'vendor', 'moderator'];
      let foundTyper = null;

      for (const party of parties) {
        if (this[party] && this[party].id === id) {
          foundTyper = this[party];
          break;
        }
      }

      if (foundTyper) {
        foundTyper.isTyping = true;
        if (foundTyper.typingTimeout) {
          clearTimeout(foundTyper.typingTimeout);
        }
        foundTyper.typingTimeout = setTimeout(
          () => (foundTyper.isTyping = false),
          this.typingExpires
        );
        this.showTypingIndicator();
      }
    },

    showTypingIndicator() {
      if (this.showTypingTimeout) {
        clearTimeout(this.showTypingTimeout);
      }
      this.setTypingIndicator();
      this.isTyping = true;
      this.showTypingTimeout = setTimeout(() => this.hideTypingIndicator(), this.typingExpires);
    },

    hideTypingIndicator() {
      if (this.showTypingTimeout) {
        clearTimeout(this.showTypingTimeout);
      }
      this.isTyping = false;
    },

    setTypingIndicator() {
      this.typingIndicatorContent = this.getTypingIndicatorContent();
    },

    getTypingIndicatorContent() {
        let typingText = '';
        const typers = this.getChatters().filter((chatter) => chatter.isTyping);
        // BUGFIX: Use `typer.party` which is 'buyer'/'vendor' instead of `typer.role` which is 'other'.
        const names = typers.map((typer) =>
            app.polyglot.t(`orderDetail.discussionTab.role${capitalize(typer.party)}`)
        );

        if (names.length === 1) {
            typingText = app.polyglot.t('orderDetail.discussionTab.isTyping', { userRole: names[0] });
        } else if (names.length === 2) {
            typingText = app.polyglot.t('orderDetail.discussionTab.areTyping', {
            userRole1: names[0],
            userRole2: names[1],
            });
        } else if (names.length > 2) {
            // Fallback for more than 2 people typing.
            typingText = app.polyglot.t('orderDetail.discussionTab.multipleTyping', {
            _: 'Multiple people are typing',
            });
        }

        return typingText;
    },

    onScroll(e) {
      if (this.ignoreScroll) {
        this.ignoreScroll = false;
        return;
      }

      if (this.fetching || this.fetchedAllMessages || this.showLoadMessagesError) {
        return;
      }

      // 滚动到顶部时加载更多历史消息
      if (e.target.scrollTop <= 100 && this.messages.length > 0) {
        this.fetchMessages(this.messages[0].id);
      }
    },

    scrollToBottom() {
      const messagesWindow = this.$refs.messagesWindow;
      if (messagesWindow) {
        messagesWindow.scrollTop = messagesWindow.scrollHeight;
      }
    },

    async markConvoAsRead() {
      try {
        await chatService.markGroupAsRead(this.model.id);
        this.$emit('convoMarkedAsRead');
      } catch (error) {
        console.error('标记已读失败:', error);
      }
    },

    getChatters(includeSelf = false) {
      const chatters = [];
      const parties = ['buyer', 'vendor', 'moderator'];
      
      parties.forEach(party => {
        if (this[party]) {
          const role = this[party].id === app.profile.id ? 'you' : 'other';
          chatters.push({
            ...this[party],
            role,
            party, // 'buyer', 'vendor', or 'moderator'
          });
        }
      });

      if (includeSelf) {
        return chatters;
      }

      return chatters.filter(chatter => chatter.role !== 'you');
    },

    getMessageAvatar(message) {
      const chatters = this.getChatters(true);
      const sender = chatters.find(chatter => chatter.id === message.peerID);
      return sender ? this.ob.getAvatarBgImage(sender.avatarHashes) : '';
    },

    getMessageSender(message) {
      const chatters = this.getChatters(true);
      const sender = chatters.find(chatter => chatter.id === message.peerID);
      
      if (sender) {
        if (sender.role === 'you') {
          return app.polyglot.t('orderDetail.discussionTab.you', { _: 'You' });
        }
        // For the other party, show their actual role in the order
        return app.polyglot.t(`orderDetail.discussionTab.role${capitalize(sender.party)}`);
      }
      
      return 'Unknown';
    },

    formatMessageTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString();
    },

    getImageUrl(hash) {
      return app.getServerUrl(`ob/image/${hash}`);
    },

    previewImage(file) {
      this.previewImageUrl = this.getImageUrl(file.hash);
      this.imagePreviewVisible = true;
    },

    handleDropdownCommand(command) {
      if (command === 'addCustomerService') {
        this.onAddCustomerService();
      }
    },

    onAddCustomerService() {
      this.csDialogVisible = true;
    },

    async confirmAddCustomerService() {
      try {
        await this.$refs.csFormRef.validate();
        this.addingCustomerService = true;
        
        const response = await chatService.addCustomerService({
          orderID: this.model.id,
          userId: this.csForm.userId,
          note: this.csForm.note,
        });
        
        if (response && (response.success !== false)) {
          ElMessage.success('客服添加成功');
          this.csDialogVisible = false;
          this.csForm = { userId: '', note: '' };
        } else {
          throw new Error(response?.reason || response?.message || '添加失败');
        }
      } catch (error) {
        console.error('添加客服失败:', error);
        let errorMessage = error?.reason || error?.message || '添加客服失败，请重试';
        ElMessage.error(errorMessage);
      } finally {
        this.addingCustomerService = false;
      }
    },

    onClickRetryLoadMessage() {
      this.fetchMessages();
    },

    async sendTypingIndicator() {
      // 如果距离上次发送不到3秒，则不发送
      if (this.lastTypingSentAt && Date.now() - this.lastTypingSentAt < 3000) {
        return;
      }

      try {
        await chatService.sendGroupTyping(this.sendToIds, this.model.id);
        this.lastTypingSentAt = Date.now();
      } catch (error) {
        console.error('发送打字指示失败:', error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.discussion-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .typing-indicator {
    padding: 8px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;

    .typing-alert {
      margin: 0;
      padding: 8px 12px;
      font-size: 12px;
    }
  }

  .messages-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .messages-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e9ecef;
    background: #f8f9fa;

    .avatar-container {
      flex-shrink: 0;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      border: 2px solid #e2e8f0;
    }

    .header-actions {
      display: flex;
      gap: 8px;

      .more-button,
      .image-button {
        padding: 8px;
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          background: #e2e8f0;
        }
      }
    }
  }

  .messages-window {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #f8f9fa;

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message-item {
      display: flex;
      gap: 12px;
      max-width: 80%;

      &.message-outgoing {
        align-self: flex-end;
        flex-direction: row-reverse;

        .message-content {
          background: linear-gradient(135deg, #409eff 0%, #1e40af 100%);
          color: white;
        }
      }

      .message-avatar {
        flex-shrink: 0;
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        border: 1px solid #e2e8f0;
      }

      .message-content {
        background: white;
        border-radius: 12px;
        padding: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          color: #6b7280;

          .message-sender {
            font-weight: 600;
          }

          .message-time {
            opacity: 0.7;
          }
        }

        .message-body {
          .message-text {
            line-height: 1.5;
            word-wrap: break-word;
          }

          .message-image {
            margin-top: 8px;

            .message-img {
              max-width: 200px;
              max-height: 200px;
              border-radius: 8px;
              cursor: pointer;
              transition: transform 0.3s ease;

              &:hover {
                transform: scale(1.05);
              }
            }
          }
        }
      }
    }
  }

  .message-input-container {
    padding: 16px;
    border-top: 1px solid #e9ecef;
    background: white;

    &.preventModChat {
      opacity: 0.6;
      pointer-events: none;
    }

    .input-header {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .avatar-container {
      flex-shrink: 0;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      border: 2px solid #e2e8f0;
    }

    .input-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .message-textarea {
      :deep(.el-textarea__inner) {
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        padding: 12px 16px;
        font-size: 14px;
        line-height: 1.5;
        resize: none;
        transition: all 0.3s ease;

        &:focus {
          border-color: #409eff;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
        }

        &::placeholder {
          color: #94a3b8;
        }
      }
    }

    .mod-chat-warning {
      font-size: 12px;
      color: #ef4444;
      padding: 4px 8px;
      background: #fef2f2;
      border-radius: 6px;
      border: 1px solid #fecaca;
    }

    .input-actions {
      flex-shrink: 0;
    }

    .send-button {
      border-radius: 8px;
      padding: 8px 20px;
      font-weight: 600;
      transition: all 0.3s ease;

      &:not(:disabled) {
        background: linear-gradient(135deg, #409eff 0%, #1e40af 100%);
        border: none;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
        }
      }

      &:disabled {
        background: #cbd5e1;
        border-color: #cbd5e1;
        cursor: not-allowed;
      }
    }
  }

  .hidden-input {
    display: none;
  }
}

.customer-service-dialog {
  .el-form-item {
    margin-bottom: 20px;
  }
}

.image-preview-dialog {
  .image-preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;

    .preview-image {
      max-width: 100%;
      max-height: 400px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .discussion-tab {
    .messages-header {
      padding: 12px;

      .header-actions {
        gap: 4px;
      }
    }

    .messages-window {
      padding: 12px;

      .message-item {
        max-width: 90%;

        .message-content {
          .message-body {
            .message-image {
              .message-img {
                max-width: 150px;
                max-height: 150px;
              }
            }
          }
        }
      }
    }

    .message-input-container {
      padding: 12px;

      .input-header {
        gap: 8px;
      }
    }
  }
}
</style> 