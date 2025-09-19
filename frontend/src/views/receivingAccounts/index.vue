<template>
  <div class="pageReceivingAccounts">
    <!-- 自动显示弹框 -->
    <ReceivingAccountsModal 
      v-if="showModal" 
      @close="closeModal"
    />
    
    <!-- 备用页面内容（当弹框不可用时显示） -->
    <div v-else class="contentContainer">
      <div class="pageHeading">
        <h1>{{ $t('receivingAccounts.title') }}</h1>
        <div class="flexExpand"></div>
        <div class="backLink" v-if="showApplyNewAccount || editingAccount || applyingAccount">
          <a class="btn clrP clrBr btnFlx" @click="backToList">
            <i class="ion-arrow-left-c"></i>
            <span>{{ $t('receivingAccounts.backToList') }}</span>
          </a>
        </div>
      </div>

      <!-- 空状态显示 -->
      <div v-if="!hasAnyAccount && !showApplyNewAccount && !editingAccount && !applyingAccount" class="contentBox padLg clrP clrBr emptyStateContainer">
        <div class="emptyStateIcon">
          <i class="ion-ios-circle-outline"></i>
        </div>
        <h2 class="tx3 txB txC">{{ $t('receivingAccounts.noAccounts') }}</h2>
        <p class="tx5 txC">{{ $t('receivingAccounts.noAccounts') }}</p>
        <div class="flexHCenter rowMd">
          <a class="btn clrP clrBr btnFlx btnLg" @click="showApplyNewAccount = true">
            <i class="ion-plus-round"></i>
            <span>{{ $t('receivingAccounts.addNewAccount') }}</span>
          </a>
        </div>
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
    </div>
  </div>
</template>

<script>
import { myGet, myPut, myPost } from '../../api/api.js';
import { useAppKit, useAppKitAccount, useAppKitState, useAppKitEvents, useDisconnect } from '@reown/appkit/vue';
import app from '../../../backbone/app.js';
import AccountList from './AccountList.vue';
import EditAccount from './EditAccount.vue';
import ApplyNewAccount from './ApplyNewAccount.vue';
import ReceivingAccountsModal from '../modals/ReceivingAccountsModal.vue';
import { ElMessage } from 'element-plus';

export default {
  components: {
    AccountList,
    EditAccount,
    ApplyNewAccount,
    ReceivingAccountsModal
  },
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
      showModal: false, // 控制弹框显示
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
    // 添加伪数据用于测试
    // this.addMockData();
    
    this.fetchReceivingAccounts();
    console.log('appKitEvents: ', this.appKitEvents);

    // 检查是否是Stripe回调
    if (this.$route.name === 'StripeConnectReturn') {
      ElMessage.success(this.$t('receivingAccounts.stripeConnectSuccess'));
    } else if (this.$route.name === 'StripeConnectRefresh') {
      ElMessage.info(this.$t('receivingAccounts.stripeInfoUpdated'));
    }
    
    // 检查路由meta，决定是否显示弹框
    if (this.$route.meta?.showModal) {
      this.showModal = true;
    }
  },
  mounted() {
    // 检查钱包是否已连接，如果已连接则断开
    this.$nextTick(() => {
      this.disconnectWallet();
    });
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
      if (!newValue && oldValue && this.isConnecting) {
        // 模态框关闭但未连接成功
        setTimeout(() => {
          this.isConnecting = false;
        }, 500);
      }
    }
  },
  methods: {
    closeModal() {
      this.showModal = false;
      // 关闭弹框后返回上一页或首页
      if (this.$router.currentRoute.value.name !== 'StripeConnectReturn' && 
          this.$router.currentRoute.value.name !== 'StripeConnectRefresh') {
        this.$router.go(-1);
      }
    },
    
    backToList() {
      this.editingAccount = null;
      this.editingTokens = [];
      this.showApplyNewAccount = false;
      this.applyingAccount = null;
    },
    
    // 添加伪数据用于测试
    addMockData() {
      // 模拟数据
      this.receivingAccounts = [
        // Bitcoin钱包
        {
          name: 'bitcoin',
          chainType: 'BTC',
          address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          enabled: true,
          source: 'Bitcoin Core'
        },
        // Ethereum钱包
        {
          name: 'ethereum',
          chainType: 'ETH',
          address: '0xC473A8d3d6E2C4D95c4A7B9d8E59315931',
          activeTokens: '["USDT","USDC"]',
          _activeTokens: ['USDT', 'USDC'],
          enabled: true,
          lastTransactionTime: '2023-05-15 14:30',
          lastTransactionAmount: '0.5 ETH',
          tokenTransactions: {
            'USDT': { time: '2023-05-10 09:15', amount: '100 USDT' },
            'USDC': { time: '2023-05-12 16:45', amount: '200 USDC' }
          },
          source: 'MetaMask'
        },
        // Stripe账户 - 已验证
        {
          name: 'stripe',
          chainType: 'Stripe',
          stripeAccountId: 'acct_1N2XYZKjGLOD4E8S',
          verificationStatus: 'verified',
          requirements: [],
          isActive: true,
          lastTransactionTime: '2024-03-15 15:30',
          lastTransactionAmount: '¥1,280.00',
          source: 'Stripe Connect'
        },
        // Stripe账户 - 验证中
        {
          name: 'stripe_test',
          chainType: 'Stripe',
          stripeAccountId: 'acct_1N3ABCKjGLOD4E8T',
          verificationStatus: 'pending',
          requirements: [
            'Business license required',
            'Bank account information required',
            'Identity verification required'
          ],
          isActive: false,
          lastTransactionTime: '2024-03-14 10:20',
          lastTransactionAmount: '¥0.00',
          source: 'Stripe Connect'
        },
        // Stripe账户 - 未验证
        {
          name: 'stripe_new',
          chainType: 'Stripe',
          stripeAccountId: 'acct_1N4DEFKjGLOD4E8U',
          verificationStatus: 'unverified',
          requirements: [
            'Account setup required',
            'Basic information required',
            'Identity verification required'
          ],
          isActive: false,
          lastTransactionTime: '2024-03-13 09:15',
          lastTransactionAmount: '¥0.00',
          source: 'Stripe Connect'
        },
        // PayPal账户
        {
          name: 'paypal',
          chainType: 'PayPal',
          email: 'your-business@example.com',
          enabled: true,
          lastTransactionTime: '2023-05-11 10:05',
          lastTransactionAmount: '$120.00'
        }
      ];
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
        // 获取Stripe连接URL
        const response = await myGet('/v1/stripe/connect-url');
        if (!response.url) {
          throw new Error('Failed to get Stripe connection URL');
        }

        // 直接跳转到Stripe入驻页面
        window.location.href = response.url;

      } catch (error) {
        console.error('连接Stripe失败:', error.responseJSON?.error);
        ElMessage.error(this.$t('receivingAccounts.stripeConnectFailed') + ': ' + error.responseJSON?.error);
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
    
    getAvailableTokens(chainType) {
      switch (chainType) {
        case 'Bitcoin':
          return [
            { id: 'BTC', name: 'BTC (比特币)' }
          ];
        case 'Ethereum':
          return [
            { id: 'ETH', name: 'ETH (以太坊)' },
            { id: 'USDT', name: 'USDT (泰达币)' },
            { id: 'USDC', name: 'USDC (USD Coin)' },
            { id: 'DAI', name: 'DAI (Dai)' }
          ];
        case 'Solana':
          return [
            { id: 'SOL', name: 'SOL (Solana)' },
            { id: 'SOLUSDT', name: 'USDT (Solana USDT)' },
            { id: 'SOLUSDC', name: 'USDC (Solana USDC)' }
          ];
        case 'BSC':
          return [
            { id: 'BNB', name: 'BNB (Binance Coin)' },
            { id: 'BUSD', name: 'BUSD (Binance USD)' },
            { id: 'CAKE', name: 'CAKE (PancakeSwap)' }
          ];
        case 'Base':
          return [
            { id: 'ETH', name: 'ETH (Base ETH)' }
          ];
        default:
          return [];
      }
    },
    
    getChainIcon(chainType) {
      switch (chainType) {
        case 'Bitcoin':
          return 'ion-social-bitcoin';
        case 'Ethereum':
          return 'ion-social-bitcoin'; // 使用适当的图标
        case 'Solana':
          return 'ion-social-bitcoin'; // 使用适当的图标
        case 'BSC':
          return 'ion-social-bitcoin'; // 使用适当的图标
        case 'Base':
          return 'ion-social-bitcoin'; // 使用适当的图标
        default:
          return 'ion-social-bitcoin';
      }
    },
    
    getPaymentMethodIcon(methodId) {
      switch (methodId) {
        case 'paypal':
          return 'ion-card'; // PayPal图标
        case 'stripe':
          return 'ion-social-usd-outline'; // Stripe图标
        default:
          return 'ion-card';
      }
    },
    
    getPaymentMethodName(methodId) {
      switch (methodId) {
        case 'paypal':
          return 'PayPal';
        case 'stripe':
          return 'Stripe';
        default:
          return methodId;
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
  }
};
</script>

<style lang="scss" scoped>
.pageReceivingAccounts {
  padding: 20px;
  
  .contentContainer {
    max-width: 1000px;
    margin: 0 auto;
  }

  .pageHeading {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    h1 {
      margin: 0;
      font-size: 24px;
    }
    
    .backLink {
      margin-left: 15px;
    }
  }
  
  .emptyStateContainer {
    text-align: center;
    padding: 60px 20px;
    
    .emptyStateIcon {
      font-size: 60px;
      margin-bottom: 20px;
      color: #ccc;
    }
  }
}

.stripe-account-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.verified {
    background-color: #f0f9eb;
    color: #67c23a;
  }
  
  &.pending {
    background-color: #fdf6ec;
    color: #e6a23c;
  }
  
  &.unverified {
    background-color: #fef0f0;
    color: #f56c6c;
  }
  
  .status-icon {
    margin-right: 4px;
  }
}
</style> 