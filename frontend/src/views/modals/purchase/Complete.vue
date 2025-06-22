<template>
  <div class="complete">
    <div class="flexColRows gutterV">
      <div class="flexRow pad rowMd txCtr">
        <div class="col2"></div>
        <div class="col8">
          <div class="flexHCent row">
            <div class="discLg border clrE1 clrBrDec1">
              <i class="ion-checkmark clrTOnEmph"></i>
            </div>
          </div>
          <h4>{{ ob.polyT('purchase.completeSection.paymentSent') }}</h4>
          <p v-html='ob.polyT("purchase.completeSection.progressMessage", {
              link: `<a href="#transactions/purchases?orderID=${orderID}">${ob.polyT("purchase.completeSection.purchases")}</a>`
            })'></p>
          <p class="tx5b clrT2">
            {{ ob.polyT('purchase.completeSection.estimatedProcessing', { time: ob.processingTime }) }}
          </p>
        </div>
        <div class="col2"></div>
      </div>
      <div class="contentBox clrP clrBr padMd socialBtns">
        <h5>{{ ob.polyT('purchase.completeSection.share.title') }}</h5>
        <p v-html="shareBody"></p>
        <div class="flexRow flexKidsExpand gutterH">
          <a class="btn btnThin clrP clrBr" :href="`https://twitter.com/intent/tweet/?text=${ob.polyT('purchase.completeSection.share.shareMsg')}&url=${shareURL}&hashtags=TradeFree,bitcoin&related=mobazha`">
            <span class="flexInline gutterHSm">
              <i class="ion-social-twitter twitterColor"></i><span>{{ ob.polyT('purchase.completeSection.share.postToTwitter') }}</span>
            </span>
          </a>
          <a class="btn btnThin clrP clrBr" :href="`https://www.facebook.com/sharer/sharer.php?u=${shareURL}`">
            <span class="flexInline gutterHSm">
              <i class="ion-social-facebook facebookColor"></i><span>{{ ob.polyT('purchase.completeSection.share.postToFacebook') }}</span>
            </span>
          </a>
          <a class="btn btnThin clrP clrBr" :href="`https://pinterest.com/pin/create/button/?url=${shareURL}`">
            <span class="flexInline gutterHSm">
              <i class="ion-social-pinterest pinterestColor"></i><span>{{ ob.polyT('purchase.completeSection.share.postToPinterest') }}</span>
            </span>
          </a>
          <a class="btn btnThin clrP clrBr" :href="`https://www.tumblr.com/share/link?url=${shareURL}&name=Mobazha`">
            <span class="flexInline gutterHSm">
              <i class="ion-social-tumblr tumblrColor"></i><span>{{ ob.polyT('purchase.completeSection.share.postToTumblr') }}</span>
            </span>
          </a>
        </div>
      </div>
      <h5>{{ ob.polyT('purchase.completeSection.vendorMessage') }}</h5>
      
      <!-- 使用Element UI重构消息输入区域 -->
      <div class="message-input-container">
        <div class="message-input-header">
          <div class="avatar-container">
            <div class="avatar" :style="ob.getAvatarBgImage(ob.ownProfile.avatarHashes)"></div>
          </div>
          <div class="input-area">
            <el-input
              v-model="messageInput"
              type="textarea"
              :rows="4"
              :placeholder="ob.polyT('purchase.completeSection.vendorMessagePlaceholder')"
              :maxlength="maxMessageLength"
              show-word-limit
              resize="none"
              @keydown.enter.exact.prevent="sendMessageInput"
              class="message-textarea"
            />
            <div class="input-footer">
              <span class="character-count">
                {{ messageInput.length }}/{{ maxMessageLength }}
              </span>
              <el-button 
                type="primary" 
                :disabled="!messageInput.trim() || sending"
                @click="sendMessageInput"
                :loading="sending"
                class="send-button"
              >
                {{ ob.polyT('purchase.completeSection.send') }}
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 消息发送状态提示 -->
        <div v-if="messageSentShow" class="message-sent-notification">
          <el-alert
            :title="ob.polyT('purchase.completeSection.vendorMessageSent', {
              name: ob.vendorName,
              orderLink: ob.polyT('purchase.completeSection.vendorMessageLink')
            })"
            type="success"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import app from '../../../../backbone/app';
import chatService from '../../../services/chatService';
import { ElMessage } from 'element-plus';

export default {
  props: {
    options: {
      type: Object,
      default: {},
    },
  },
  data() {
    return {
      shareURL: 'https://mobazha.org',
      messageInput: '',
      sending: false,
      messageSentShow: false,
      maxMessageLength: 1000, // 设置合理的消息长度限制
    };
  },
  created() {
    this.initEventChain();
    this.loadData(this.options);
  },
  computed: {
    ob() {
      return {
        ...this.templateHelpers,
        displayCurrency: app.settings.get('localCurrency'),
        processingTime: app.polyglot.t('purchase.completeSection.noData'),
        ownProfile: app.profile.toJSON(),
        orderID: this.orderID,
        vendorName: this.vendor.name,
      };
    },
    vendorPeerID() {
      return this.vendor.peerID;
    },
    shareBody() {
      const ob = this.ob;
      return ob.polyT('purchase.completeSection.share.body', { 
        link: "<a class='clrTEm' href='https://mobazha.org'>https://mobazha.org</a>" 
      });
    }
  },
  methods: {
    loadData(options = {}) {
      if (!options.vendor) {
        throw new Error('Please provide a vendor object');
      }

      this.baseInit(options);
    },

    async sendMessage(msg) {
      if (!msg) throw new Error('Please provide a message to send.');
      this.sending = true;
      try {
        const response = await chatService.sendMessage(
          this.vendorPeerID, 
          msg, 
          this.orderID
        );
        
        if (response && (response.success !== false)) {
          this.messageSentShow = true;
          ElMessage.success('消息发送成功');
          setTimeout(() => { this.messageSentShow = false; }, 3000);
          return true;
        } else {
          throw new Error(response?.reason || response?.message || '发送失败');
        }
      } catch (error) {
        let errorMessage = error?.reason || error?.message || '发送消息失败，请重试';
        ElMessage.error(errorMessage);
        return false;
      } finally {
        this.sending = false;
      }
    },

    async sendMessageInput() {
      const message = this.messageInput.trim();
      if (!message || this.sending) return;

      const success = await this.sendMessage(message);
      if (success) {
        this.messageInput = '';
      }
    },
  }
};
</script>

<style lang="scss" scoped>
.complete {
  .message-input-container {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
  }

  .message-input-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .avatar-container {
    flex-shrink: 0;
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 2px solid #e2e8f0;
  }

  .input-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
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

  .input-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .character-count {
    font-size: 12px;
    color: #94a3b8;
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

  .message-sent-notification {
    margin-top: 16px;
  }

  // 响应式设计
  @media (max-width: 768px) {
    .message-input-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .avatar-container {
      margin-bottom: 12px;
    }

    .input-footer {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .send-button {
      width: 100%;
    }
  }
}
</style>
