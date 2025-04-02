<template>
  <div class="pageReceivingAccounts">
    <div class="contentContainer">
      <div class="pageHeading">
        <h1>收款账户管理</h1>
        <div class="flexExpand"></div>
        <div class="backLink" v-if="showApplyNewAccount || editingAccount || applyingAccount">
          <a class="btn clrP clrBr btnFlx" @click="backToList">
            <i class="ion-arrow-left-c"></i>
            <span>返回列表</span>
          </a>
        </div>
      </div>

      <!-- 空状态显示 -->
      <div v-if="!hasAnyAccount && !showApplyNewAccount && !editingAccount && !applyingAccount" class="contentBox padLg clrP clrBr emptyStateContainer">
        <div class="emptyStateIcon">
          <i class="ion-ios-circle-outline"></i>
        </div>
        <h2 class="tx3 txB txC">暂无任何收款账户</h2>
        <p class="tx5 txC">收款账户开通后，您即可从电商平台进行收款。</p>
        <div class="flexHCenter rowMd">
          <a class="btn clrP clrBr btnFlx btnLg" @click="showApplyNewAccount = true">
            <i class="ion-plus-round"></i>
            <span>申请收款账户</span>
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
import { myGet, myPut } from '../../api/api.js';
import { useAppKit, useAppKitAccount, useAppKitState, useAppKitEvents, useDisconnect } from '@reown/appkit/vue';
import app from '../../../backbone/app.js';
import AccountList from './AccountList.vue';
import EditAccount from './EditAccount.vue';
import ApplyNewAccount from './ApplyNewAccount.vue';

export default {
  components: {
    AccountList,
    EditAccount,
    ApplyNewAccount
  },
  data() {
    return {
      receivingAccounts: [],
      showApplyNewAccount: false,
      editingAccount: null,
      applyingAccount: null,
      isSaving: false,
      supportedChainTypes: [
        { id: 'Bitcoin', name: '比特币' },
        { id: 'Ethereum', name: '以太坊' },
        { id: 'Solana', name: 'Solana' },
        { id: 'BSC', name: '币安智能链' },
        { id: 'Base', name: 'Base' }
      ],
      supportedPaymentMethods: [
        { id: 'paypal', name: 'PayPal' },
        { id: 'stripe', name: 'Stripe' }
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
    this.addMockData();
    
    this.fetchReceivingAccounts();
    console.log('appKitEvents: ', this.appKitEvents);
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
          chainType: 'Bitcoin',
          address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          enabled: true,
          walletType: 'Bitcoin Core'
        },
        // Ethereum钱包
        {
          name: 'ethereum',
          chainType: 'Ethereum',
          address: '0xC473A8d3d6E2C4D95c4A7B9d8E59315931',
          enabledTokens: '["USDT","USDC"]',
          _enabledTokens: ['USDT', 'USDC'],
          enabled: true,
          lastTransactionTime: '2023-05-15 14:30',
          lastTransactionAmount: '0.5 ETH',
          tokenTransactions: {
            'USDT': { time: '2023-05-10 09:15', amount: '100 USDT' },
            'USDC': { time: '2023-05-12 16:45', amount: '200 USDC' }
          },
          walletType: 'MetaMask'
        },
        {
          name: 'solana',
          chainType: 'Solana',
          address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5TNPN1',
          enabledTokens: '["SOLUSDT"]',
          _enabledTokens: ['SOLUSDT'],
          enabled: true,
          lastTransactionTime: '2023-05-14 11:20',
          lastTransactionAmount: '5 SOL',
          tokenTransactions: {
            'SOLUSDT': { time: '2023-05-13 13:10', amount: '50 USDT' }
          }
        },
        {
          name: 'bsc',
          chainType: 'BSC',
          address: '0x7F367cC41522cE07553e823bf3be79A889DEbe1B',
          enabledTokens: '["BUSD","CAKE"]',
          _enabledTokens: ['BUSD', 'CAKE'],
          enabled: false,
          lastTransactionTime: '2023-04-20 08:45',
          lastTransactionAmount: '2.3 BNB',
          tokenTransactions: {
            'BUSD': { time: '2023-04-18 15:30', amount: '500 BUSD' },
            'CAKE': { time: '2023-04-15 12:20', amount: '25 CAKE' }
          }
        },
        {
          name: 'paypal',
          email: 'your-business@example.com',
          enabled: true,
          lastTransactionTime: '2023-05-11 10:05',
          lastTransactionAmount: '$120.00'
        },
        {
          name: 'stripe',
          accountId: 'acct_1N2XYZKjGLOD4E8S',
          enabled: false,
          lastTransactionTime: '2023-05-09 15:30',
          lastTransactionAmount: '€75.50'
        }
      ];
    },
    
    async fetchReceivingAccounts() {
      return;
      try {
        const response = await myGet(app.getServerUrl('wallet/receiving-accounts'));
        
        if (response && response.receivingAccounts && Array.isArray(response.receivingAccounts)) {
          // 处理每个账户的enabledTokens字段
          this.receivingAccounts = response.receivingAccounts.map(account => {
            if (account.enabledTokens) {
              try {
                account._enabledTokens = JSON.parse(account.enabledTokens);
              } catch (e) {
                account._enabledTokens = [];
              }
            } else {
              account._enabledTokens = [];
            }
            
            // 添加交易数据
            this.addTransactionData(account);
            
            return account;
          });
        } else {
          console.error('获取收款账户返回格式不正确:', response);
          // 如果API返回错误，保留伪数据用于展示
          // this.receivingAccounts = [];
        }
      } catch (error) {
        console.error('获取收款账户失败:', error);
        // 如果API请求失败，保留伪数据用于展示
        // this.receivingAccounts = [];
      }
    },
    
    editAccount(account) {
      // 创建一个深拷贝，避免直接修改原对象
      this.editingAccount = JSON.parse(JSON.stringify(account));
      
      // 设置编辑中的代币
      if (account._enabledTokens) {
        this.editingTokens = [...account._enabledTokens];
      } else {
        this.editingTokens = [];
      }
      
      this.showApplyNewAccount = false;
    },
    
    enableAccount(account) {
      account.enabled = true;
      this.saveReceivingAccounts();
    },
    
    disableAccount(account) {
      account.enabled = false;
      this.saveReceivingAccounts();
    },
    
    async saveReceivingAccounts() {
      try {
        this.isSaving = true;
        
        // 处理代币列表
        if (this.editingAccount && this.editingTokens) {
          this.editingAccount.enabledTokens = JSON.stringify(this.editingTokens);
        }
        
        // 确保区块链账户有地址
        if (this.editingAccount.chainType && !this.editingAccount.address) {
          alert('请先连接钱包获取地址');
          this.isSaving = false;
          return;
        }
        
        // 查找是否已存在相同账户
        const existingIndex = this.receivingAccounts.findIndex(a => 
          (this.editingAccount.address && a.address === this.editingAccount.address) || 
          (this.editingAccount.name && a.name === this.editingAccount.name)
        );
        
        // 如果是新账户，添加到列表中
        if (existingIndex === -1) {
          this.receivingAccounts.push(this.editingAccount);
        } else {
          // 如果是编辑现有账户，更新它
          this.receivingAccounts[existingIndex] = this.editingAccount;
        }
        
        const response = await myPut(app.getServerUrl('wallet/receiving-accounts'), {
          receivingAccounts: this.receivingAccounts
        });
        
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
        enabledTokens: '[]', // 初始化为空数组的 JSON 字符串
        _enabledTokens: [], // 前端使用的内部属性
        enabled: false
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
        enabled: false
      };
      
      if (methodId === 'paypal') {
        newAccount.email = '';
      } else if (methodId === 'stripe') {
        newAccount.accountId = '';
      }
      
      this.receivingAccounts.push(newAccount);
      this.editAccount(newAccount);
    },
    
    async connectWallet(chainType) {
      this.disconnectWallet();

      try {
        this.isConnecting = true;
        
        let namespace;
        
        switch(chainType) {
          case 'Ethereum':
            namespace = 'eip155';
            break;
          case 'BSC':
            namespace = 'eip155';
            break;
          case 'Solana':
            namespace = 'solana';
            break;
          case 'Base':
            namespace = 'eip155';
            break;
          default:
            throw new Error('不支持的链类型');
        }
        
        this.appKit.open({ view: 'Connect', namespace});
        
      } catch (error) {
        console.error('连接钱包失败:', error);
        alert('连接钱包失败，请重试');
        this.isConnecting = false;
      }
    },
    
    async connectStripe() {
      // 这里实现连接Stripe的逻辑
      alert('Stripe连接功能尚未实现');
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
      if (confirm('确定要删除此收款账户吗？')) {
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
          if (chainData.tokens && account._enabledTokens) {
            account.tokenTransactions = {};
            account._enabledTokens.forEach(token => {
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
</style> 