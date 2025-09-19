<template>
  <div class="receiving-accounts-modal" :class="{ 'wallet-connecting': modalHiddenForWallet }">
          <div class="modal-overlay" @click="closeModal"></div>
      <div class="modal-container">
        <div class="modal-header">
        <h2>{{ $t('receivingAccounts.title') }}</h2>
        <button class="close-btn" @click="closeModal">
          <i class="ion-close"></i>
        </button>
      </div>
      
      <div class="modal-content">
        <!-- 空状态显示 -->
        <div v-if="!hasAnyAccount && !showApplyNewAccount && !editingAccount && !applyingAccount" class="empty-state">
          <div class="empty-state-icon">
            <i class="ion-ios-circle-outline"></i>
          </div>
          <h3>{{ $t('receivingAccounts.noAccounts') }}</h3>
          <p>{{ $t('receivingAccounts.noAccounts') }}</p>
          <button class="btn btn-primary" @click="showApplyNewAccount = true">
            <i class="ion-plus-round"></i>
            <span>{{ $t('receivingAccounts.addNewAccount') }}</span>
          </button>
        </div>

        <!-- 账户列表视图 -->
        <AccountList 
          v-if="hasAnyAccount && !editingAccount && !applyingAccount && !showApplyNewAccount"
          :receivingAccounts="receivingAccounts"
          @edit="editAccount"
          @enable="enableAccount"
          @disable="disableAccount"
          @delete="deleteAccount"
          @add-new="showApplyNewAccount = true"
          @connect-stripe="connectStripe"
          @reverify-stripe="reverifyStripe"
        />
        
        <!-- 编辑账户视图 -->
        <EditAccount
          v-if="editingAccount"
          :account="editingAccount"
          :tokens="editingTokens"
          :isConnecting="isConnecting"
          @update:tokens="editingTokens = $event"
          @connect-wallet="connectWallet"
          @connect-stripe="connectStripe"
          @save="saveReceivingAccounts"
          @cancel="backToList"
          @delete="deleteAccount"
        />
        
        <!-- 申请新账户视图 -->
        <ApplyNewAccount
          v-if="showApplyNewAccount && !editingAccount && !applyingAccount"
          :supportedChainTypes="supportedChainTypes"
          :supportedPaymentMethods="supportedPaymentMethods"
          @apply-account="applyAccount"
          @apply-payment-method="applyPaymentMethod"
        />
        
        <!-- Stripe选项视图 -->
        <div v-if="showStripeOptions" class="stripe-options">
          <div class="stripe-options-header">
            <h3>{{ $t('receivingAccounts.stripeOptionsTitle') }}</h3>
            <button class="close-btn" @click="showStripeOptions = false">
              <i class="ion-close"></i>
            </button>
          </div>
          
          <div class="stripe-options-content">
            <div class="option-card" @click="startEmbeddedStripe">
              <div class="option-icon">
                <i class="ion-ios-world"></i>
              </div>
              <div class="option-content">
                <h4>{{ $t('receivingAccounts.embeddedSetup') }}</h4>
                <p>{{ $t('receivingAccounts.embeddedSetupDescription') }}</p>
              </div>
            </div>
            
            <div class="option-card" @click="startExternalStripe">
              <div class="option-icon">
                <i class="ion-ios-browsers"></i>
              </div>
              <div class="option-content">
                <h4>{{ $t('receivingAccounts.externalSetup') }}</h4>
                <p>{{ $t('receivingAccounts.externalSetupDescription') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { myGet, myPut, myPost } from '../../api/api.js';
import { useAppKit, useAppKitAccount, useAppKitState, useAppKitEvents, useDisconnect } from '@reown/appkit/vue';
import app from '../../../backbone/app.js';
import AccountList from '../receivingAccounts/AccountList.vue';
import EditAccount from '../receivingAccounts/EditAccount.vue';
import ApplyNewAccount from '../receivingAccounts/ApplyNewAccount.vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'ReceivingAccountsModal',
  components: {
    AccountList,
    EditAccount,
    ApplyNewAccount
  },
  emits: ['close'],
  data() {
    return {
      receivingAccounts: [],
      showApplyNewAccount: false,
      editingAccount: null,
      applyingAccount: null,
      isSaving: false,
      supportedChainTypes: import.meta.env.VITE_PROD_TEST ? [
        { id: 'BASE', name: 'Base', disabled: false },
        { id: 'BSC', name: 'Binance Smart Chain', disabled: false },
        { id: 'ETH', name: 'Ethereum', disabled: false },
        { id: 'SOL', name: 'Solana', disabled: false }
      ] : [
        { id: 'BASE', name: 'Base', disabled: false },
        { id: 'BSC', name: 'Binance Smart Chain', disabled: false },
      ],
      supportedPaymentMethods: [
        // { id: 'paypal', name: 'PayPal' },
        { id: 'stripe', name: 'Stripe', disabled: true, comingSoon: true }
      ],
      editingTokens: [],
      isConnecting: false,
      transactionData: {
        bitcoin: {
          lastTime: '2023-05-18 08:45',
          lastAmount: '0.025 BTC'
        },
        ethereum: {
          lastTime: '2023-05-15 14:30',
          lastAmount: '0.5 ETH',
          tokens: {
            USDT: { time: '2023-05-10 09:15', amount: '100 USDT' },
            USDC: { time: '2023-05-12 16:45', amount: '200 USDC' }
          }
        },
        solana: {
          lastTime: '2023-05-14 11:20',
          lastAmount: '5 SOL',
          tokens: {
            SOLUSDT: { time: '2023-05-13 13:10', amount: '50 USDT' }
          }
        },
        paypal: {
          lastTime: '2023-05-11 10:05',
          lastAmount: '$120.00'
        },
        stripe: {
          lastTime: '2023-05-09 15:30',
          lastAmount: '€75.50'
        }
      },
      showStripeOptions: false, // 控制Stripe选项显示
      modalHiddenForWallet: false, // 控制弹框是否因钱包连接而隐藏
    };
  },
  setup() {
    // 使用 Reown AppKit 的组合式 API
    const appKit = useAppKit();
    const accountData = useAppKitAccount();
    const appKitState = useAppKitState();
    const appKitEvents = useAppKitEvents();
    const { disconnect } = useDisconnect();
    
    return {
      appKit,
      accountData,
      appKitState,
      appKitEvents,
      disconnect
    };
  },
  created() {
    this.fetchReceivingAccounts();
    console.log('appKitEvents: ', this.appKitEvents);
  },
  mounted() {
    // 检查钱包是否已连接，如果已连接则断开
    this.$nextTick(() => {
      this.disconnectWallet();
    });
    
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeydown);
    
    // 防止页面滚动
    document.body.style.overflow = 'hidden';
  },
  computed: {
    hasAnyAccount() {
      return this.receivingAccounts && this.receivingAccounts.length > 0;
    }
  },
  watch: {
    // 监听钱包连接状态变化
    'accountData.isConnected': function(newValue, oldValue) {
      if (newValue && !oldValue && this.editingAccount) {
        // 钱包连接成功，更新地址
        this.editingAccount.address = this.accountData.address;
        
        // 默认启用一些代币
        if (this.editingAccount.chainType === 'Ethereum' && (!this.editingTokens || this.editingTokens.length === 0)) {
          this.editingTokens = ['ETH', 'USDT', 'USDC'];
        } else if (this.editingAccount.chainType === 'Solana' && (!this.editingTokens || this.editingTokens.length === 0)) {
          this.editingTokens = ['SOL', 'SOLUSDT', 'SOLUSDC'];
        } else if (this.editingAccount.chainType === 'BSC' && (!this.editingTokens || this.editingTokens.length === 0)) {
          this.editingTokens = ['BNB', 'BUSD'];
        } else if (this.editingAccount.chainType === 'Base' && (!this.editingTokens || this.editingTokens.length === 0)) {
          this.editingTokens = ['ETH'];
        }
        
        this.isConnecting = false;
      }
    },
    
    // 监听模态框关闭事件
    'appKitState.open': function(newValue, oldValue) {
      if (newValue && oldValue === false) {
        // Web3钱包连接窗口打开，隐藏我们的弹框
        this.hideModalForWallet();
      } else if (!newValue && oldValue && this.isConnecting) {
        // 模态框关闭但未连接成功
        setTimeout(() => {
          this.isConnecting = false;
        }, 500);
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    
    hideModalForWallet() {
      // 当Web3钱包窗口打开时，临时禁用我们的弹框交互
      this.modalHiddenForWallet = true;
      
      // 监听钱包连接完成，重新启用弹框
      const checkWalletClosed = setInterval(() => {
        if (!this.appKitState.open) {
          clearInterval(checkWalletClosed);
          setTimeout(() => {
            this.modalHiddenForWallet = false;
          }, 500); // 延迟500ms确保钱包窗口完全关闭
        }
      }, 100);
    },
    
    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.closeModal();
      }
    },
    
    backToList() {
      this.editingAccount = null;
      this.editingTokens = [];
      this.showApplyNewAccount = false;
      this.applyingAccount = null;
    },
    
    async fetchReceivingAccounts() {
      try {
        // 在开发环境下，如果已经有mock数据，则直接返回
        if (import.meta.env.DEV && this.receivingAccounts.length > 0) {
          console.log('使用mock数据');
          return;
        }

        const response = await myGet(app.getServerUrl('wallet/receivingaccountlist'));
        
        if (response && response.receivingAccounts && Array.isArray(response.receivingAccounts)) {
          // 处理每个账户的 activeTokens 字段
          this.receivingAccounts = await Promise.all(response.receivingAccounts.map(async account => {
            if (account.activeTokens) {
              try {
                if (Array.isArray(account.activeTokens)) {
                  account._activeTokens = account.activeTokens;
                } else {
                  account._activeTokens = [];
                }
              } catch (e) {
                console.error('解析 activeTokens 失败:', e);
                account._activeTokens = [];
              }
            } else {
              account._activeTokens = [];
            }
            
            // 如果是Stripe账户，检查其状态
            if (account.chainType === 'Stripe') {
              const status = await this.checkStripeAccountStatus();
              account.stripeAccountId = status.stripeAccountId;
              account.isVerified = status.isVerified;
              account.verificationStatus = status.verificationStatus;
              account.requirements = status.requirements;
            }
            
            // 添加交易数据
            this.addTransactionData(account);
            
            return account;
          }));
        } else {
          console.error('获取收款账户返回格式不正确:', response);
        }
      } catch (error) {
        console.error('获取收款账户失败:', error);
        ElMessage.error(this.$t('receivingAccounts.fetchAccountsFailed'));
      }
    },
    
    editAccount(account) {
      // 创建一个深拷贝，避免直接修改原对象
      this.editingAccount = JSON.parse(JSON.stringify(account));
      
      // 设置编辑中的代币
      if (account._activeTokens) {
        this.editingTokens = [...account._activeTokens];
      } else {
        this.editingTokens = [];
      }
      
      this.showApplyNewAccount = false;
    },
    
    enableAccount(account) {
      account.isActive = true;
      this.editingAccount = account;
      this.saveReceivingAccounts();
    },
    
    disableAccount(account) {
      account.isActive = false;
      this.editingAccount = account;
      this.saveReceivingAccounts();
    },
    
    async saveReceivingAccounts() {
      try {
        this.isSaving = true;
        
        // 处理代币列表
        if (this.editingAccount && this.editingTokens) {
          this.editingAccount.activeTokens = this.editingTokens;
          this.editingAccount.inactiveTokens = [];
        }
        
        // 确保区块链账户有地址
        if (this.editingAccount.chainType && !this.editingAccount.address) {
          alert(this.$t('purchase.pleaseConnectWalletForAddress'));
          this.isSaving = false;
          return;
        }
        
        // 验证账户名称
        if (!this.editingAccount.name) {
          alert(this.$t('receivingAccounts.enterAccountName'));
          this.isSaving = false;
          return;
        }
        
        // 准备发送到后端的数据
        const accountData = {
          ...this.editingAccount,
          id: parseInt(this.editingAccount.id) || 0,
          source: this.editingAccount.source
        };
        
        let response;
        if (!this.editingAccount.id) {
          // 添加新账户
          response = await myPost(app.getServerUrl('wallet/receivingaccount'), accountData);
          if (response.success) {
            this.receivingAccounts.push(response.account);
          }
        } else {
          // 更新现有账户
          response = await myPut(app.getServerUrl('wallet/receivingaccount'), accountData);
          if (response.success) {
            const index = this.receivingAccounts.findIndex(a => a.id === this.editingAccount.id);
            if (index !== -1) {
              this.receivingAccounts[index] = response.account;
            }
          }
        }
        
        if (response.success) {
          console.log('收款账户保存成功');
          
          // 重置编辑状态
          this.editingAccount = null;
          this.editingTokens = [];
          this.applyingAccount = null;
          this.showApplyNewAccount = false;
          
          // 重新获取最新数据
          await this.fetchReceivingAccounts();
          
          // 返回列表视图
          this.backToList();
        } else {
          console.error('保存收款账户失败:', response);
        }
      } catch (error) {
        console.error('保存收款账户失败:', error);
      } finally {
        this.isSaving = false;
      }
    },
    
    applyAccount(chainType) {
      // 创建新账户
      const newAccount = {
        name: chainType.toLowerCase(),
        chainType: chainType,
        address: '',
        activeTokens: '[]', // 初始化为空数组的 JSON 字符串
        _activeTokens: [], // 前端使用的内部属性
        isActive: false
      };
      
      // 不要立即添加到列表，而是设置为编辑状态
      this.editingAccount = newAccount;
      this.editingTokens = [];
      this.showApplyNewAccount = false;
    },
    
    applyPaymentMethod(methodId) {
      // 创建新的支付方式账户
      const newAccount = {
        name: methodId,
        isActive: false
      };
      
      if (methodId === 'paypal') {
        newAccount.email = '';
      } else if (methodId === 'stripe') {
        // Stripe账户的id字段应该是数字类型
        newAccount.id = 0; // 新建时使用0
      }
      
      this.editingAccount = newAccount;
      this.showApplyNewAccount = false;
    },
    
    async connectWallet(chainType) {
      this.disconnectWallet();

      try {
        this.isConnecting = true;
        
        let namespace;
        
        switch(chainType) {
          case 'ETH':
            namespace = 'eip155';
            break;
          case 'BSC':
            namespace = 'eip155';
            break;
          case 'SOL':
            namespace = 'solana';
            break;
          case 'Base':
            namespace = 'eip155';
            break;
          default:
            throw new Error(this.$t('receivingAccounts.unsupportedChainType'));
        }
        
        this.appKit.open({ view: 'Connect', namespace});
        
      } catch (error) {
        console.error('连接钱包失败:', error);
        alert(this.$t('receivingAccounts.connectWalletFailed'));
        this.isConnecting = false;
      }
    },
    
    async connectStripe() {
      try {
        // 显示Stripe设置选项
        this.showStripeOptions = true;
      } catch (error) {
        console.error('连接Stripe失败:', error.responseJSON?.error);
        ElMessage.error(this.$t('receivingAccounts.stripeConnectFailed') + ': ' + error.responseJSON?.error);
      }
    },
    
    async startEmbeddedStripe() {
      try {
        // 获取嵌入式onboarding URL
        const response = await myGet('/v1/stripe/embedded-onboarding-url');
        if (!response.url) {
          throw new Error('Failed to get embedded onboarding URL');
        }
        
        // 创建嵌入式iframe
        this.createEmbeddedStripeOnboarding(response.url);
        this.showStripeOptions = false;
        
      } catch (error) {
        console.error('启动嵌入式Stripe失败:', error);
        ElMessage.error(this.$t('receivingAccounts.stripeEmbeddedSetupFailed'));
        this.startExternalStripe();
      }
    },
    
    async startExternalStripe() {
      try {
        // 获取Stripe连接URL
        const response = await myGet('/v1/stripe/connect-url');
        if (!response.url) {
          throw new Error('Failed to get Stripe connection URL');
        }

        // 在新窗口打开Stripe入驻页面
        const stripeWindow = window.open(response.url, '_blank', 'width=800,height=600');
        
        // 监听窗口关闭事件
        const checkWindow = setInterval(() => {
          if (stripeWindow.closed) {
            clearInterval(checkWindow);
            // 重新获取账户信息
            this.fetchReceivingAccounts();
            // 显示成功提示
            ElMessage.success(this.$t('receivingAccounts.stripeSetupComplete'));
          }
        }, 1000);
        
        this.showStripeOptions = false;
        
      } catch (error) {
        console.error('启动外部Stripe失败:', error);
        ElMessage.error(this.$t('receivingAccounts.stripeSetupFailed'));
      }
    },
    
    createEmbeddedStripeOnboarding(url) {
      // 创建嵌入式容器
      const container = document.createElement('div');
      container.className = 'embedded-stripe-container';
      container.innerHTML = `
        <div class="embedded-header">
          <h4>{{ $t('receivingAccounts.stripeAccountSetup') }}</h4>
          <button class="close-embedded" onclick="this.parentElement.parentElement.remove()">
            <i class="ion-close"></i>
          </button>
        </div>
        <iframe 
          src="${url}" 
          frameborder="0" 
          width="100%" 
          height="600px"
          allow="camera; microphone"
        ></iframe>
      `;
      
      // 添加到页面
      document.body.appendChild(container);
      
      // 监听消息事件
      window.addEventListener('message', this.handleStripeMessage);
    },
    
    handleStripeMessage(event) {
      // 处理来自Stripe的消息
      if (event.origin !== 'https://connect.stripe.com') return;
      
      const { type, data } = event.data;
      
      if (type === 'stripe-account-updated' || type === 'stripe-account-created') {
        this.fetchReceivingAccounts();
        ElMessage.success(this.$t('receivingAccounts.stripeSetupComplete'));
      }
    },

    async reverifyStripe(account) {
      try {
        // 获取Stripe重新验证URL
        const response = await myPost('/v1/stripe/reverify-url');
        if (!response.url) {
          throw new Error('Failed to get Stripe reverification URL');
        }

        // 在新窗口打开Stripe验证页面
        const stripeWindow = window.open(response.url, '_blank', 'width=800,height=600');
        
        // 监听窗口关闭事件
        const checkWindow = setInterval(() => {
          if (stripeWindow.closed) {
            clearInterval(checkWindow);
            // 重新获取账户信息
            this.fetchReceivingAccounts();
            // 显示成功提示
            ElMessage.success(this.$t('receivingAccounts.stripeVerificationUpdated'));
          }
        }, 1000);

      } catch (error) {
        console.error('重新验证Stripe账户失败:', error);
        ElMessage.error(this.$t('receivingAccounts.stripeReverifyFailed'));
      }
    },

    // 检查Stripe账户状态
    async checkStripeAccountStatus() {
      try {
        const response = await myGet('/v1/stripe/account-status');
        return {
          isRegistered: !!response.stripeAccountId,
          isVerified: response.isVerified || false,
          stripeAccountId: response.stripeAccountId || null,
          status: response.status || 'pending'
        };
      } catch (error) {
        console.error('检查Stripe账户状态失败:', error);
        return {
          isRegistered: false,
          isVerified: false,
          stripeAccountId: null,
          status: 'pending'
        };
      }
    },
    
    // 添加断开钱包连接的方法
    async disconnectWallet() {
      try {
        if (this.accountData.isConnected) {
          await this.disconnect();
          console.log('钱包已断开连接');
        }
      } catch (error) {
        console.error('断开钱包连接失败:', error);
      }
    },
    
    deleteAccount(account) {
      if (confirm(this.$t('receivingAccounts.deleteAccountConfirm'))) {
        const index = this.receivingAccounts.findIndex(a => 
          (a.address && a.address === account.address) || 
          (a.name && a.name === account.name)
        );
        
        if (index !== -1) {
          this.receivingAccounts.splice(index, 1);
          this.saveReceivingAccounts();
          this.backToList();
        }
      }
    },
    
    // 添加交易数据到账户
    addTransactionData(account) {
      if (account.chainType) {
        const chainData = this.transactionData[account.chainType.toLowerCase()];
        if (chainData) {
          account.lastTransactionTime = chainData.lastTime;
          account.lastTransactionAmount = chainData.lastAmount;
          
          // 添加代币交易数据
          if (chainData.tokens && account._activeTokens) {
            account.tokenTransactions = {};
            account._activeTokens.forEach(token => {
              if (chainData.tokens[token]) {
                account.tokenTransactions[token] = chainData.tokens[token];
              }
            });
          }
        }
      } else if (account.name) {
        const paymentData = this.transactionData[account.name.toLowerCase()];
        if (paymentData) {
          account.lastTransactionTime = paymentData.lastTime;
          account.lastTransactionAmount = paymentData.lastAmount;
        }
      }
      return account;
    }
  },
  beforeUnmount() {
    // 在组件销毁前断开钱包连接
    this.disconnectWallet();
    
    // 移除键盘事件监听
    document.removeEventListener('keydown', this.handleKeydown);
    
    // 恢复页面滚动
    document.body.style.overflow = '';
  }
};
</script>

<style lang="scss" scoped>
  .receiving-accounts-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998; // 降低z-index，让Web3钱包窗口显示在上层
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.wallet-connecting {
    pointer-events: none; // 当钱包连接时禁用交互
    opacity: 0.3; // 降低透明度
  }
  
  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(45, 55, 72, 0.15);
    backdrop-filter: blur(2px);
    z-index: 1;
  }
  
  .modal-container {
    position: relative;
    width: 90%;
    max-width: 1000px;
    max-height: 90vh;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(220, 225, 230, 0.4);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(100, 115, 135, 0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;
    
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(220, 225, 230, 0.3);
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(8px);
      
      h2 {
        margin: 0;
        font-size: 20px;
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
    
    .modal-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
      min-height: 0; // 确保flex子元素能正确收缩
      
      // 确保子组件样式正确显示
      :deep(.contentBox) {
        background: transparent;
        box-shadow: none;
        border-radius: 0;
        padding: 24px;
        margin: 0;
      }
      
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        
        .empty-state-icon {
          font-size: 60px;
          margin-bottom: 20px;
          color: #ccc;
        }
        
        h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
        }
        
        p {
          margin: 0 0 24px 0;
          color: #556080;
          font-size: 14px;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.12));
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 10px;
          color: #667eea;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.18), rgba(118, 75, 162, 0.18));
            border-color: rgba(102, 126, 234, 0.4);
          }
          
          i {
            font-size: 16px;
          }
        }
      }
    }
  }
  
  .stripe-options {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .stripe-options-header {
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
    
    .stripe-options-content {
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      
      .option-card {
        padding: 24px;
        border: 1px solid rgba(220, 225, 230, 0.4);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 16px;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(100, 115, 135, 0.15);
          border-color: rgba(102, 126, 234, 0.3);
        }
        
        .option-icon {
          font-size: 32px;
          color: #667eea;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 50%;
        }
        
        .option-content {
          flex: 1;
          
          h4 {
            margin: 0 0 8px 0;
            font-size: 18px;
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

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 嵌入式Stripe容器样式
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
  z-index: 9999; // 降低z-index，让Web3钱包窗口显示在上层
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

// 响应式适配
@media (max-width: 768px) {
  .receiving-accounts-modal {
    .modal-container {
      width: 95%;
      max-height: 95vh;
      
      .modal-header {
        padding: 16px 20px;
        
        h2 {
          font-size: 18px;
        }
      }
      
      .modal-content {
        padding: 0;
        
        :deep(.contentBox) {
          padding: 16px;
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