<template>
  <div class="embedded-stripe-onboarding">
    <div class="onboarding-header">
      <h3>Stripe账户设置</h3>
      <button class="close-btn" @click="$emit('close')">
        <i class="ion-close"></i>
      </button>
    </div>
    
    <div class="onboarding-content">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载Stripe设置...</p>
      </div>
      
      <div v-else-if="stripeAccountId" class="stripe-account-info">
        <div class="account-status">
          <el-tag :type="getStatusType(accountStatus)" size="large">
            {{ getStatusText(accountStatus) }}
          </el-tag>
        </div>
        
        <div class="account-details">
          <div class="detail-item">
            <label>Stripe账户ID</label>
            <div class="account-id-wrapper">
              <input type="text" :value="stripeAccountId" readonly />
              <el-button type="primary" link @click="copyAccountId">
                <el-icon><Document /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="action-buttons">
          <el-button 
            v-if="accountStatus !== 'approved'"
            type="warning" 
            @click="reverifyAccount"
            :loading="isReverifying"
          >
            <el-icon><Refresh /></el-icon>
            重新验证账户
          </el-button>
          
          <el-button type="primary" @click="$emit('complete')">
            完成设置
          </el-button>
        </div>
      </div>
      
      <div v-else class="start-onboarding">
        <div class="stripe-intro">
          <div class="stripe-icon">
            <i class="ion-social-usd-outline"></i>
          </div>
          <h4>连接Stripe账户</h4>
          <p>通过Stripe接收信用卡付款，支持全球多种货币和支付方式。</p>
        </div>
        
        <div class="onboarding-options">
          <div class="option-card" @click="startEmbeddedOnboarding">
            <div class="option-icon">
              <i class="ion-ios-world"></i>
            </div>
            <div class="option-content">
              <h5>嵌入式设置</h5>
              <p>在当前页面完成Stripe账户设置</p>
            </div>
          </div>
          
          <div class="option-card" @click="startExternalOnboarding">
            <div class="option-icon">
              <i class="ion-ios-browsers"></i>
            </div>
            <div class="option-content">
              <h5>外部设置</h5>
              <p>在新窗口中完成Stripe账户设置</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { myGet, myPost } from '../../api/api.js';
import { ElMessage } from 'element-plus';
import { Document, Refresh } from '@element-plus/icons-vue';

export default {
  name: 'EmbeddedStripeOnboarding',
  components: { Document, Refresh },
  emits: ['close', 'complete'],
  data() {
    return {
      isLoading: true,
      isReverifying: false,
      stripeAccountId: null,
      accountStatus: 'pending'
    };
  },
  async created() {
    await this.loadAccountStatus();
  },
  methods: {
    async loadAccountStatus() {
      try {
        this.isLoading = true;
        const response = await myGet('/v1/stripe/account-status');
        this.stripeAccountId = response.stripeAccountId;
        this.accountStatus = response.status || 'pending';
      } catch (error) {
        console.error('加载Stripe账户状态失败:', error);
        ElMessage.error('加载账户状态失败');
      } finally {
        this.isLoading = false;
      }
    },
    
    async startEmbeddedOnboarding() {
      try {
        const response = await myGet('/v1/stripe/embedded-onboarding-url');
        if (!response.url) {
          throw new Error('获取嵌入式onboarding URL失败');
        }
        this.createEmbeddedOnboarding(response.url);
      } catch (error) {
        console.error('启动嵌入式onboarding失败:', error);
        ElMessage.error('启动嵌入式设置失败，请尝试外部设置');
        this.startExternalOnboarding();
      }
    },
    
    createEmbeddedOnboarding(url) {
      const container = document.createElement('div');
      container.className = 'embedded-stripe-container';
      container.innerHTML = `
        <div class="embedded-header">
          <h4>Stripe账户设置</h4>
          <button class="close-embedded" onclick="this.parentElement.parentElement.remove()">
            <i class="ion-close"></i>
          </button>
        </div>
        <iframe src="${url}" frameborder="0" width="100%" height="600px" allow="camera; microphone"></iframe>
      `;
      document.body.appendChild(container);
      window.addEventListener('message', this.handleStripeMessage);
    },
    
    handleStripeMessage(event) {
      if (event.origin !== 'https://connect.stripe.com') return;
      const { type } = event.data;
      if (type === 'stripe-account-updated' || type === 'stripe-account-created') {
        this.loadAccountStatus();
        ElMessage.success('Stripe账户设置完成');
        this.$emit('complete');
      }
    },
    
    async startExternalOnboarding() {
      try {
        const response = await myGet('/v1/stripe/connect-url');
        if (!response.url) {
          throw new Error('获取Stripe连接URL失败');
        }
        const stripeWindow = window.open(response.url, '_blank', 'width=800,height=600');
        const checkWindow = setInterval(() => {
          if (stripeWindow.closed) {
            clearInterval(checkWindow);
            this.loadAccountStatus();
            ElMessage.success('Stripe账户设置完成');
            this.$emit('complete');
          }
        }, 1000);
      } catch (error) {
        console.error('启动外部onboarding失败:', error);
        ElMessage.error('启动Stripe设置失败');
      }
    },
    
    async reverifyAccount() {
      try {
        this.isReverifying = true;
        const response = await myPost('/v1/stripe/reverify-url');
        if (!response.url) {
          throw new Error('获取重新验证URL失败');
        }
        const stripeWindow = window.open(response.url, '_blank', 'width=800,height=600');
        const checkWindow = setInterval(() => {
          if (stripeWindow.closed) {
            clearInterval(checkWindow);
            this.loadAccountStatus();
            ElMessage.success('Stripe账户验证已更新');
          }
        }, 1000);
      } catch (error) {
        console.error('重新验证失败:', error);
        ElMessage.error('重新验证失败，请重试');
      } finally {
        this.isReverifying = false;
      }
    },
    
    copyAccountId() {
      navigator.clipboard.writeText(this.stripeAccountId);
      ElMessage.success('账户ID已复制到剪贴板');
    },
    
    getStatusType(status) {
      switch (status) {
        case 'approved': return 'success';
        case 'pending': return 'warning';
        default: return 'danger';
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 'approved': return '已验证';
        case 'pending': return '验证中';
        default: return '未验证';
      }
    }
  },
  beforeUnmount() {
    window.removeEventListener('message', this.handleStripeMessage);
  }
};
</script>

<style lang="scss" scoped>
.embedded-stripe-onboarding {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .onboarding-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(220, 225, 230, 0.3);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
    }
    
    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(220, 225, 230, 0.3);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(100, 115, 135, 0.2);
        background: rgba(255, 255, 255, 0.95);
        border-color: rgba(102, 126, 234, 0.3);
        
        i {
          color: #667eea;
        }
      }
      
      i {
        font-size: 20px;
        color: #556080;
        transition: color 0.3s ease;
      }
    }
  }
  
  .onboarding-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(102, 126, 234, 0.2);
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }
      
      p {
        color: #556080;
        font-size: 14px;
      }
    }
    
    .stripe-account-info {
      .account-status {
        margin-bottom: 24px;
        text-align: center;
      }
      
      .account-details {
        margin-bottom: 24px;
        
        .detail-item {
          margin-bottom: 16px;
          
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #2d3748;
          }
          
          .account-id-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
            
            input {
              flex: 1;
              padding: 12px;
              border: 1px solid rgba(220, 225, 230, 0.6);
              border-radius: 8px;
              font-family: monospace;
              background: rgba(255, 255, 255, 0.8);
              color: #556080;
            }
          }
        }
      }
      
      .action-buttons {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
    }
    
    .start-onboarding {
      .stripe-intro {
        text-align: center;
        margin-bottom: 32px;
        
        .stripe-icon {
          font-size: 48px;
          color: #635BFF;
          margin-bottom: 16px;
        }
        
        h4 {
          margin: 0 0 12px 0;
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
        }
        
        p {
          margin: 0;
          color: #556080;
          line-height: 1.5;
        }
      }
      
      .onboarding-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        
        .option-card {
          padding: 20px;
          border: 1px solid rgba(220, 225, 230, 0.4);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(100, 115, 135, 0.15);
            border-color: rgba(102, 126, 234, 0.3);
          }
          
          .option-icon {
            font-size: 32px;
            color: #667eea;
            margin-bottom: 12px;
          }
          
          .option-content {
            h5 {
              margin: 0 0 8px 0;
              font-size: 16px;
              font-weight: 600;
              color: #2d3748;
            }
            
            p {
              margin: 0;
              font-size: 14px;
              color: #556080;
              line-height: 1.4;
            }
          }
        }
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.embedded-stripe-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 800px;
  height: 80vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(100, 115, 135, 0.3);
  z-index: 10000;
  overflow: hidden;
  
  .embedded-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(220, 225, 230, 0.3);
    background: rgba(255, 255, 255, 0.9);
    
    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .close-embedded {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(220, 225, 230, 0.3);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.95);
        border-color: rgba(102, 126, 234, 0.3);
        
        i {
          color: #667eea;
        }
      }
      
      i {
        font-size: 16px;
        color: #556080;
        transition: color 0.3s ease;
      }
    }
  }
}

@media (max-width: 768px) {
  .embedded-stripe-onboarding {
    .onboarding-content {
      padding: 16px;
      
      .start-onboarding {
        .onboarding-options {
          grid-template-columns: 1fr;
        }
      }
    }
  }
  
  .embedded-stripe-container {
    width: 95%;
    height: 90vh;
  }
}
</style> 