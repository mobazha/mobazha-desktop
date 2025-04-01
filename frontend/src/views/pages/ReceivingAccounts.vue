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
      <div v-if="hasAnyAccount && !editingAccount && !applyingAccount && !showApplyNewAccount" class="accountListView contentBox padMd clrP clrBr">
        <div class="listHeader">
          <h2 class="tx3 txB">收款账户列表</h2>
          <button @click="showApplyNewAccount = true" class="btn addAccountBtn">
            <i class="ion-plus-round"></i>
            添加收款账户
          </button>
        </div>
        
        <!-- 区块链账户 -->
        <div class="accountSection">
          <h3 class="sectionTitle">区块链钱包</h3>
          <div class="accountGrid">
            <div v-for="account in receivingAccounts.filter(a => a.chainType)" 
                 :key="account.address" 
                 class="accountCard" 
                 :class="{ enabled: account.enabled }">
              <div class="accountHeader">
                <div class="accountType">{{ account.chainType }}</div>
                <div class="accountStatus">{{ account.enabled ? '已启用' : '未启用' }}</div>
                  </div>
              <div class="accountAddress">{{ account.address }}</div>
              <div v-if="account._enabledTokens && account._enabledTokens.length > 0" class="accountTokens">
                <span v-for="token in account._enabledTokens" :key="token" class="tokenTag">
                  {{ token }}
                </span>
              </div>
              <div class="accountActions">
                <button @click="editAccount(account)" class="btn editBtn">编辑</button>
                <button v-if="account.enabled" @click="disableAccount(account)" class="btn disableBtn">停用</button>
                <button v-else @click="enableAccount(account)" class="btn enableBtn">启用</button>
                <button @click="deleteAccount(account)" class="btn deleteBtn">删除</button>
              </div>
            </div>
        </div>
      </div>

        <!-- 其他支付方式 -->
        <div class="accountSection">
          <h3 class="sectionTitle">其他支付方式</h3>
          <div class="accountGrid">
            <div v-for="account in receivingAccounts.filter(a => !a.chainType)" 
                 :key="account.name" 
                 class="accountCard" 
                 :class="{ enabled: account.enabled }">
              <div class="accountHeader">
                <div class="accountType">{{ getPaymentMethodName(account.name) }}</div>
                <div class="accountStatus">{{ account.enabled ? '已启用' : '未启用' }}</div>
              </div>
              <div class="accountDetail">{{ account.email || account.accountId || '未设置' }}</div>
              <div class="accountActions">
                <button @click="editAccount(account)" class="btn editBtn">编辑</button>
                <button v-if="account.enabled" @click="disableAccount(account)" class="btn disableBtn">停用</button>
                <button v-else @click="enableAccount(account)" class="btn enableBtn">启用</button>
                <button @click="deleteAccount(account)" class="btn deleteBtn">删除</button>
              </div>
            </div>
          </div>
        </div>
        </div>
        
      <!-- 编辑账户视图 -->
      <div v-if="editingAccount" class="contentBox padMd clrP clrBr">
        <h2 class="tx3 txB">设置 {{ editingAccount.chainType || getPaymentMethodName(editingAccount.name) }} 收款账户</h2>
        
        <!-- 区块链账户设置 -->
        <div v-if="editingAccount.chainType" class="walletSetupContainer">
          <!-- 钱包图标和标题 -->
          <div class="walletHeader">
            <div class="walletIcon">
              <i :class="getChainIcon(editingAccount.chainType)"></i>
            </div>
            <h3 class="walletName">{{ editingAccount.chainType }}</h3>
            </div>
          
          <!-- 钱包说明 -->
          <div class="walletDescription">
            通过{{ editingAccount.chainType }}钱包接收 
            <span v-if="editingAccount.chainType === 'Ethereum'">ETH 和 ERC-20 代币支付。</span>
            <span v-else-if="editingAccount.chainType === 'Solana'">SOL 及相关代币支付。</span>
            <span v-else-if="editingAccount.chainType === 'BSC'">BNB、BUSD等代币支付。</span>
            <span v-else-if="editingAccount.chainType === 'Base'">Base链上的代币支付。</span>
            <span v-else>加密货币支付。</span>
          </div>
          
          <!-- 步骤指引 -->
          <div class="setupSteps">
            <div class="setupStep">
              <div class="stepNumber">1</div>
              <div class="stepContent">
                <h4>准备{{ editingAccount.chainType }}钱包</h4>
                <p>确保您已安装 
                  <span v-if="editingAccount.chainType === 'Ethereum'">MetaMask 或其他支持以太坊的钱包</span>
                  <span v-else-if="editingAccount.chainType === 'Solana'">Phantom 或其他支持Solana的钱包</span>
                  <span v-else-if="editingAccount.chainType === 'BSC'">MetaMask 或其他支持BSC的钱包</span>
                  <span v-else-if="editingAccount.chainType === 'Base'">MetaMask 或其他支持Base的钱包</span>
                  <span v-else>相关钱包</span>
                </p>
        </div>
      </div>

            <div class="setupStep">
              <div class="stepNumber">2</div>
              <div class="stepContent">
                <h4>连接钱包</h4>
                <p>点击下方按钮连接您的钱包，获取收款地址</p>
              </div>
            </div>
        </div>
        
          <!-- 连接钱包按钮 -->
          <div class="connectWalletBtnContainer">
            <button @click="connectWallet(editingAccount.chainType)" class="btn connectWalletBtn" :disabled="isConnecting">
              <i class="ion-link"></i>
              <span>{{ isConnecting ? '连接中...' : '连接钱包' }}</span>
            </button>
          </div>
          
          <!-- 钱包地址输入 -->
          <div v-if="editingAccount.address" class="walletAddressContainer">
            <label>钱包地址</label>
            <input type="text" v-model="editingAccount.address" readonly class="walletAddressInput" />
          </div>
          
          <!-- 代币选择 -->
          <div v-if="editingAccount.chainType === 'Ethereum' || editingAccount.chainType === 'Solana'" class="tokenSelectionContainer">
            <label>接收代币</label>
            <div class="tokenList">
              <div v-for="token in getAvailableTokens(editingAccount.chainType)" :key="token.id" class="tokenItem">
                <input type="checkbox" 
                       :id="token.id" 
                       :value="token.id" 
                       v-model="editingTokens" />
                <label :for="token.id">{{ token.name }}</label>
              </div>
        </div>
      </div>

          <!-- 启用开关 -->
          <div class="enableToggleContainer">
            <input type="checkbox" id="enableAccount" v-model="editingAccount.enabled" />
            <label for="enableAccount">启用此账户</label>
          </div>
        </div>
        
        <!-- PayPal表单 -->
        <div v-if="editingAccount && editingAccount.name === 'paypal'" class="paymentMethodSetupContainer">
          <!-- PayPal 图标和标题 -->
          <div class="paymentMethodHeader">
            <div class="paymentMethodIcon paypalIcon">
              <i class="ion-card"></i>
            </div>
            <h3 class="paymentMethodName">PayPal</h3>
          </div>
          
          <!-- PayPal 说明 -->
          <div class="paymentMethodDescription">
            通过 PayPal 接收付款，支持全球范围内的买家付款。
          </div>
          
          <!-- PayPal 设置 -->
          <div class="paymentMethodSetup">
            <div class="formGroup">
              <label>PayPal 邮箱</label>
              <input type="email" v-model="editingAccount.email" placeholder="输入您的 PayPal 邮箱地址" class="formInput" />
              <p class="formHint">请确保输入正确的 PayPal 账户邮箱，买家将向此账户付款</p>
            </div>
            
            <div class="enableToggleContainer">
              <input type="checkbox" id="enablePaypal" v-model="editingAccount.enabled" />
              <label for="enablePaypal">启用 PayPal 支付</label>
            </div>
          </div>
        </div>
        
        <!-- Stripe表单 -->
        <div v-if="editingAccount && editingAccount.name === 'stripe'" class="paymentMethodSetupContainer">
          <!-- Stripe 图标和标题 -->
          <div class="paymentMethodHeader">
            <div class="paymentMethodIcon stripeIcon">
              <i class="ion-card"></i>
            </div>
            <h3 class="paymentMethodName">Stripe</h3>
          </div>
          
          <!-- Stripe 说明 -->
          <div class="paymentMethodDescription">
            通过 Stripe 接收信用卡付款，支持全球范围内的买家使用信用卡付款。
          </div>
          
          <!-- Stripe 设置 -->
          <div class="paymentMethodSetup">
            <div v-if="!editingAccount.accountId" class="stripeConnectContainer">
              <p class="stripeConnectInfo">您需要连接您的 Stripe 账户以接收付款。如果您还没有 Stripe 账户，将会引导您创建一个。</p>
              <button @click="connectStripe" class="connectStripeBtn">
                <i class="ion-link"></i>
                <span>连接 Stripe 账户</span>
              </button>
            </div>
            
            <div v-else class="stripeAccountInfo">
              <div class="formGroup">
                <label>Stripe 账户 ID</label>
                <input type="text" v-model="editingAccount.accountId" readonly class="formInput" />
                <p class="formHint">您的 Stripe 账户已连接</p>
              </div>
              
              <button @click="connectStripe" class="reconnectStripeBtn">
                <i class="ion-refresh"></i>
                <span>重新连接 Stripe 账户</span>
              </button>
            </div>
            
            <div class="enableToggleContainer">
              <input type="checkbox" id="enableStripe" v-model="editingAccount.enabled" :disabled="!editingAccount.accountId" />
              <label for="enableStripe">启用 Stripe 支付</label>
              <p v-if="!editingAccount.accountId" class="enableHint">请先连接 Stripe 账户</p>
            </div>
          </div>
        </div>
        
        <!-- 底部按钮 -->
        <div class="actionButtons">
          <button v-if="editingAccount.address || editingAccount.email || editingAccount.accountId" 
                  @click="deleteAccount(editingAccount)" 
                  class="btn deleteBtn">
            删除账户
          </button>
          <div class="flexExpand"></div>
          <button @click="backToList" class="btn cancelBtn">取消</button>
          <button @click="saveReceivingAccounts" class="btn saveBtn" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- 成功提示 -->
      <div v-if="saveSuccess" class="successMessage">
        <i class="ion-checkmark-circled"></i>
        <span>保存成功!</span>
      </div>

      <!-- 添加申请新账户的视图 -->
      <div v-if="showApplyNewAccount && !editingAccount && !applyingAccount" class="contentBox padMd clrP clrBr applyNewAccountView">
        <h2 class="tx3 txB">申请新收款账户</h2>
        
        <div class="paymentMethodGrid">
          <!-- 区块链钱包选项 -->
          <div class="methodCategory">
            <h3 class="categoryTitle">区块链钱包</h3>
            <div class="methodCards">
              <div v-for="chainType in supportedChainTypes" :key="chainType.id" 
                   class="methodCard" @click="applyAccount(chainType.id)">
                <div class="methodIcon" :class="chainType.id.toLowerCase()">
                  <i :class="getChainIcon(chainType.id)"></i>
            </div>
                <div class="methodName">{{ chainType.id }}</div>
            </div>
          </div>
          </div>
          
          <!-- 其他支付方式选项 -->
          <div class="methodCategory">
            <h3 class="categoryTitle">其他支付方式</h3>
            <div class="methodCards">
              <div v-for="method in supportedPaymentMethods" :key="method.id" 
                   class="methodCard" @click="applyPaymentMethod(method.id)">
                <div class="methodIcon" :class="method.id.toLowerCase()">
                  <i :class="getPaymentMethodIcon(method.id)"></i>
            </div>
                <div class="methodName">{{ method.name }}</div>
            </div>
          </div>
            </div>
            </div>
          </div>
    </div>
  </div>
</template>

<script>
import { useAppKit, useAppKitAccount, useAppKitState, useAppKitEvents, useDisconnect } from '@reown/appkit/vue';
import PaymentMethodSetup from '../modals/receiving/PaymentMethodSetup.vue';
import app from '../../../backbone/app.js';
import { myGet, myPut } from '../../api/api.js';
import { recordEvent } from '../../../backbone/utils/metrics.js';

export default {
  components: {
    PaymentMethodSetup
  },
  data() {
    return {
      // 初始化状态
      receivingAccounts: [],
      editingAccount: null,
      applyingAccount: null,
      showApplyNewAccount: false,
      isSaving: false,
      saveSuccess: false,
      
      // 支持的链类型
      supportedChainTypes: [
        { id: 'Ethereum' },
        { id: 'BSC' },
        { id: 'Solana' },
        { id: 'Base' }
      ],
      
      // 支持的非区块链支付方式
      supportedPaymentMethods: [
        { id: 'paypal', name: 'PayPal' },
        { id: 'stripe', name: 'Stripe' }
      ],
      
      chainTypeInfo: {
        ethereum: {
          name: '以太坊/ERC-20代币',
          description: '接收ETH和基于以太坊的代币交易',
          icon: 'ion-social-bitcoin',
          iconClass: 'ethereumIcon'
        },
        bsc: {
          name: 'BSC/BEP-20代币',
          description: '接收BNB和币安智能链上的代币交易',
          icon: 'ion-social-bitcoin',
          iconClass: 'bscIcon'
        },
        solana: {
          name: 'Solana',
          description: '接收SOL和SPL代币交易',
          icon: 'ion-social-bitcoin',
          iconClass: 'solanaIcon'
        },
        base: {
          name: 'Base',
          description: '接收Base链上的加密货币交易',
          icon: 'ion-social-bitcoin',
          iconClass: 'baseIcon'
        },
        paypal: {
          name: 'PayPal',
          description: '通过PayPal接收法币支付',
          icon: 'ion-card',
          iconClass: 'paypalIcon'
        },
        stripe: {
          name: 'Stripe',
          description: '通过Stripe接收信用卡支付',
          icon: 'ion-card',
          iconClass: 'stripeIcon'
        }
      },
      templateHelpers: {},
      editingTokens: [],
      isConnecting: false
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
  },
  computed: {
    ob() {
      return {
        ...this.templateHelpers,
      };
    },
    hasAnyAccount() {
      return this.receivingAccounts && this.receivingAccounts.length > 0;
    },
    accountsByChainType() {
      const result = {};
      if (this.receivingAccounts) {
        this.receivingAccounts.forEach(account => {
          if (account.chainType) {
            if (!result[account.chainType]) {
              result[account.chainType] = [];
            }
            result[account.chainType].push(account);
          }
        });
      }
      return result;
    },
    nonBlockchainAccounts() {
      return this.receivingAccounts ? this.receivingAccounts.filter(a => !a.chainType) : [];
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
    
    async fetchReceivingAccounts() {
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
            return account;
          });
        } else {
          console.error('获取收款账户返回格式不正确:', response);
          this.receivingAccounts = [];
        }
      } catch (error) {
        console.error('获取收款账户失败:', error);
        this.receivingAccounts = [];
      }
    },
    
    async saveReceivingAccounts() {
      try {
        this.isSaving = true;
        
        // 处理代币列表
        if (this.editingAccount && this.editingTokens) {
          this.editingAccount.enabledTokens = JSON.stringify(this.editingTokens);
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
        } else {
          console.error('保存收款账户失败:', response);
          alert('保存失败，请重试');
        }
      } catch (error) {
        console.error('保存收款账户失败:', error);
        alert('保存失败，请重试');
      } finally {
        this.isSaving = false;
      }
    },
    
    editAccount(account) {
      this.editingAccount = account;
      
      // 如果是区块链账户，设置编辑的代币列表
      if (account.chainType && account._enabledTokens) {
        this.editingTokens = [...account._enabledTokens];
      }
    },
    
    enableAccount(account) {
      account.enabled = true;
      this.saveReceivingAccounts();
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
      
      this.receivingAccounts.push(newAccount);
      this.editAccount(newAccount);
    },
    
    applyPaymentMethod(method) {
      // 查找是否已存在该支付方式
      const existingAccount = this.nonBlockchainAccounts.find(a => a.name === method);
      
      if (existingAccount) {
        // 如果已存在，编辑它
        this.editAccount(existingAccount);
      } else {
        // 创建新的非区块链支付方式
        const newAccount = {
          name: method,
          email: '',
          accountId: '',
          enabled: false
        };
        
        this.receivingAccounts.push(newAccount);
        this.editAccount(newAccount);
      }
    },
    
    disableAccount(account) {
      account.enabled = false;
      this.saveReceivingAccounts();
    },
    
    getChainIcon(chainType) {
      switch (chainType) {
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
      const method = this.supportedPaymentMethods.find(m => m.id === methodId);
      return method ? method.name : methodId;
    },
    
    async connectStripe() {
      try {
        const response = await myGet(app.getServerUrl('ob/stripe/connect-url'));
        if (response && response.url) {
          window.open(response.url, '_blank');
        }
      } catch (error) {
        console.error('获取Stripe连接URL失败:', error);
        alert('连接Stripe失败，请重试');
      }
    },
    
    copyAddress(address) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(address)
          .then(() => {
            alert('地址已复制到剪贴板');
          })
          .catch((err) => {
            console.error('复制地址失败:', err);
          });
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          document.execCommand('copy');
          alert('地址已复制到剪贴板');
        } catch (err) {
          console.error('复制地址失败:', err);
        }
        
        document.body.removeChild(textArea);
      }
    },
    
    getAvailableTokens(chainType) {
      if (chainType === 'Ethereum') {
        return [
          { id: 'ETH', name: '以太坊 (ETH)' },
          { id: 'USDT', name: 'Tether (USDT)' },
          { id: 'USDC', name: 'USD Coin (USDC)' },
          { id: 'MBZ', name: 'Mobazha (MBZ)' }
        ];
      } else if (chainType === 'Solana') {
        return [
          { id: 'SOL', name: 'Solana (SOL)' },
          { id: 'SOLUSDT', name: 'Solana USDT' },
          { id: 'SOLUSDC', name: 'Solana USDC' },
          { id: 'SOLMBZ', name: 'Solana MBZ' }
        ];
      } else if (chainType === 'BSC') {
        return [
          { id: 'BNB', name: 'Binance Coin (BNB)' },
          { id: 'BUSD', name: 'Binance USD (BUSD)' },
          { id: 'BSCUSDT', name: 'BSC USDT' },
          { id: 'BSCUSDC', name: 'BSC USDC' }
        ];
      } else if (chainType === 'Base') {
        return [
          { id: 'ETH', name: 'Ethereum (ETH)' },
          { id: 'BASEUSDC', name: 'Base USDC' }
        ];
      }
      return [];
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
      if (!confirm(`确定要删除此${account.chainType ? '钱包' : '支付方式'}账户吗？删除后将无法恢复。`)) {
        return;
      }
      
      // 从数组中移除账户
      const index = this.receivingAccounts.findIndex(a => {
        if (account.chainType) {
          return a.chainType === account.chainType && a.address === account.address;
        } else {
          return a.name === account.name;
        }
      });
      
      if (index !== -1) {
        this.receivingAccounts.splice(index, 1);
        
        // 如果正在编辑的是被删除的账户，返回列表视图
        if (this.editingAccount === account) {
          this.editingAccount = null;
          this.editingTokens = [];
        }
        
        // 保存更改
        this.saveReceivingAccounts();
      }
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
  
  .accountListView {
    .listHeader {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      .addAccountBtn {
        display: flex;
        align-items: center;
        background-color: #2196F3;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        
        i {
          margin-right: 8px;
        }
        
        &:hover {
          background-color: darken(#2196F3, 10%);
        }
      }
    }
    
    .accountSection {
      margin-bottom: 30px;
      
      .sectionTitle {
        font-size: 18px;
        margin-bottom: 15px;
        padding-bottom: 5px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      .accountGrid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }
    }
  }
  
  .accountCard {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 16px;
    background-color: white;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    
    &.enabled {
      border-color: #4CAF50;
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
    }
    
    .accountHeader {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      
      .accountType {
        font-weight: bold;
      }
      
      .accountStatus {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
      }
    }
    
    .accountAddress, .accountDetail {
      font-family: monospace;
      background-color: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      word-break: break-all;
      margin-bottom: 10px;
      font-size: 14px;
    }
    
    .accountTokens {
      margin-bottom: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      
      .tokenTag {
        background-color: #e0e0e0;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
    }
    
    .accountActions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      
      .btn {
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        
        &.editBtn {
          background-color: transparent;
          border: 1px solid rgba(0, 0, 0, 0.1);
          
          &:hover {
            background-color: rgba(0, 0, 0, 0.05);
          }
        }
        
        &.disableBtn {
          background-color: #f44336;
    color: white;
          border: none;
          
          &:hover {
            background-color: darken(#f44336, 10%);
          }
        }
        
        &.enableBtn {
          background-color: #4CAF50;
          color: white;
          border: none;
          
          &:hover {
            background-color: darken(#4CAF50, 10%);
          }
        }
        
        &.deleteBtn {
          background-color: transparent;
          color: #f44336;
          border: 1px solid #f44336;
          
          &:hover {
            background-color: rgba(244, 67, 54, 0.1);
          }
        }
      }
    }
  }
  
  .paymentMethodList {
    margin-top: 20px;
    
    .sectionTitle {
      font-size: 16px;
      font-weight: bold;
      margin: 20px 0 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .pmItem {
      display: flex;
      align-items: center;
      padding: 15px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
      
      .pmIcon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        font-size: 20px;
        
        &.bscIcon {
          background-color: #F3BA2F;
          color: white;
        }
        
        &.solanaIcon {
          background-color: #9945FF;
          color: white;
        }
        
        &.baseIcon {
          background-color: #0052FF;
          color: white;
        }
        
        &.paypalIcon {
          background-color: #003087;
          color: white;
        }
        
        &.stripeIcon {
          background-color: #635BFF;
          color: white;
        }
      }
      
      .pmInfo {
        flex-grow: 1;
        
        h4 {
          margin: 0 0 4px;
          font-size: 16px;
        }
        
        p {
          margin: 0;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);
        }
      }
      
      .ion-chevron-right {
        color: rgba(0, 0, 0, 0.3);
        font-size: 20px;
      }
    }
  }
  
  .walletSetupContainer {
    margin-top: 20px;
    
    .walletHeader {
    display: flex;
      align-items: center;
      margin-bottom: 20px;
      
      .walletIcon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        margin-right: 15px;
        
        &.ethereumIcon {
          background-color: #627eea;
          color: white;
        }
        
        &.solanaIcon {
          background-color: #9945ff;
          color: white;
        }
        
        &.bscIcon {
          background-color: #f3ba2f;
          color: white;
        }
        
        &.baseIcon {
          background-color: #0052ff;
          color: white;
        }
      }
      
      .walletName {
        font-size: 24px;
        font-weight: bold;
      }
    }
    
    .walletDescription {
      margin-bottom: 30px;
      font-size: 16px;
      line-height: 1.5;
    }
    
    .setupSteps {
      margin-bottom: 30px;
      
      .setupStep {
        display: flex;
        margin-bottom: 20px;
        
        .stepNumber {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #2196F3;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .stepContent {
          h4 {
            margin: 0 0 5px;
            font-size: 16px;
          }
          
          p {
            margin: 0;
            color: rgba(0, 0, 0, 0.6);
          }
        }
      }
    }
    
    .connectWalletBtnContainer {
      margin-bottom: 20px;
      
      .connectWalletBtn {
        display: flex;
        align-items: center;
        background-color: #2196F3;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        
        i {
          margin-right: 10px;
        }
        
        &:hover {
          background-color: darken(#2196F3, 10%);
        }
        
        &:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
      }
    }
    
    .walletAddressContainer {
      margin-bottom: 20px;
      
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      .walletAddressInput {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: monospace;
        background-color: #f5f5f5;
      }
    }
    
    .tokenSelectionContainer {
      margin-bottom: 20px;
      
      label {
        display: block;
        margin-bottom: 10px;
        font-weight: bold;
      }
      
      .tokenList {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
        
        .tokenItem {
          display: flex;
          align-items: center;
          
          input[type="checkbox"] {
        margin-right: 8px;
          }
        }
      }
    }
    
    .enableToggleContainer {
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      
      input[type="checkbox"] {
        margin-right: 10px;
      }
      
      label {
        font-weight: bold;
      }
    }
  }
  
  .paymentMethodSetupContainer {
    margin-top: 20px;
    
    .paymentMethodHeader {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      
      .paymentMethodIcon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        margin-right: 15px;
        
        &.paypalIcon {
          background-color: #003087;
          color: white;
        }
        
        &.stripeIcon {
          background-color: #635BFF;
          color: white;
        }
      }
      
      .paymentMethodName {
        font-size: 24px;
        font-weight: bold;
      }
    }
    
    .paymentMethodDescription {
      margin-bottom: 30px;
    font-size: 16px;
      line-height: 1.5;
    }
    
    .paymentMethodSetup {
      .formGroup {
        margin-bottom: 20px;
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .formInput {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .formHint {
          margin-top: 5px;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);
        }
      }
      
      .stripeConnectContainer {
        margin-bottom: 20px;
        
        .stripeConnectInfo {
          margin-bottom: 15px;
        }
        
        .connectStripeBtn {
          display: flex;
          align-items: center;
          background-color: #635BFF;
    color: white;
          border: none;
          padding: 10px 20px;
    border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          
          i {
            margin-right: 10px;
          }
          
          &:hover {
            background-color: darken(#635BFF, 10%);
          }
        }
      }
      
      .stripeAccountInfo {
        margin-bottom: 20px;
        
        .reconnectStripeBtn {
    display: flex;
    align-items: center;
          background-color: transparent;
          color: #635BFF;
          border: 1px solid #635BFF;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
    
    i {
      margin-right: 8px;
          }
          
          &:hover {
            background-color: rgba(99, 91, 255, 0.1);
          }
        }
      }
      
      .enableHint {
        margin-top: 5px;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
      }
    }
  }
  
  .actionButtons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 30px;
    
    .deleteBtn {
      padding: 10px 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
      cursor: pointer;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }
    
    .cancelBtn {
      padding: 10px 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
      cursor: pointer;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }
    
    .saveBtn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      background-color: #2196F3;
      color: white;
      cursor: pointer;
      
      &:hover {
        background-color: darken(#2196F3, 10%);
      }
      
      &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
    }
  }
  
  .applyNewAccountView {
    h2 {
      margin-bottom: 30px;
    }
    
    .paymentMethodGrid {
      margin-top: 20px;
      
      .methodCategory {
        margin-bottom: 30px;
        
        .categoryTitle {
      font-size: 18px;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .methodCards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          
          .methodCard {
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            background-color: white;
            
            &:hover {
              transform: translateY(-5px);
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
              border-color: #2196F3;
            }
            
            .methodIcon {
              font-size: 40px;
              margin-bottom: 15px;
              color: #2196F3;
              
              &.ethereum { color: #627EEA; }
              &.solana { color: #9945FF; }
              &.bsc { color: #F3BA2F; }
              &.base { color: #0052FF; }
              &.paypal { color: #003087; }
              &.stripe { color: #635BFF; }
              
              i {
                display: inline-block;
                width: 60px;
                height: 60px;
                line-height: 60px;
                border-radius: 50%;
                background-color: rgba(33, 150, 243, 0.1);
              }
            }
            
            .methodName {
              font-weight: bold;
              margin-top: 10px;
              font-size: 16px;
            }
          }
        }
      }
    }
  }
}
</style> 