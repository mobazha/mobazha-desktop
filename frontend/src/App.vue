<template>
  <div :class="['app-container', { 'desktop-app': isDesktopApp, 'web-app': !isDesktopApp }]">
    <!-- 浏览器风格的标题栏 - 只在桌面应用时显示 -->
    <div v-if="isDesktopApp" class="browser-titlebar">
      <div class="window-controls">
        <div class="window-control close" @click="handleWindowClose"></div>
        <div class="window-control minimize" @click="handleWindowMinimize"></div>
        <div class="window-control maximize" @click="handleWindowMaximize"></div>
      </div>
      <div class="titlebar-title">Mobazha</div>
    </div>

    <!-- 浏览器风格的导航栏 -->
    <div class="browser-navbar">
      <section class="nav-container">
        <PageNav ref="pageNav" />
      </section>
      <div class="wallet-section">
        <div class="wallet-button-wrapper">
          <appkit-button />
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <section id="contentFrame" class="content-frame">
      <div id="pageContainer">
        <router-view v-if="initialized" :key="$route.params[$route.meta.watchParam]" />
      </div>
    </section>
    
    <section id="statusBar" class="status-bar"></section>
    
    <!-- Vue聊天组件 -->
    <ChatContainer />
    
    <div id="chatCloseBtn" class="chatCloseBtn js-chatClose ion-ios-close-empty iconBtn clrP clrBr4 clrT2"></div>
    <div id="chatContainer"></div>
    <div id="chatConvoContainer" class="clrP clrBr3"></div>

    <div id="js-vueModal"></div>

    <LoadingModal v-if="initialized" v-show="showLoadingModal" />
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';
import app from '../backbone/app';
import Settings from '@/views/modals/settings/Settings.vue';
import EditListing from '@/views/modals/editListing/EditListing.vue';
import ModeratorDetails from '@/views/modals/ModeratorDetails.vue'

import Wallet from '@/views/modals/wallet/Wallet.vue';
import ShoppingCart from '@/views/ShoppingCart.vue';
import Purchase from '@/views/modals/purchase/Purchase.vue';
import LoadingModal from '@/views/modals/Loading.vue';
import PageNav from '@/views/PageNav.vue';
import ChatContainer from '@/components/chat/ChatContainer.vue';

import { createAppKit } from '@reown/appkit/vue';
import {ethersAdapter, solanaWeb3JsAdapter, bitcoinAdapter, networks, NETWORKS, projectId } from './config/wallet'
import { useAppKitConnection } from '@reown/appkit-adapter-solana/vue'
import { useAppKit, useAppKitNetwork, useAppKitAccount, useAppKitProvider, useAppKitState, useAppKitEvents, useDisconnect } from '@reown/appkit/vue';
import { events } from '../backbone/utils/order';
import { useWalletStore } from '@/stores/wallet';
import { UnifiedTransactionService } from '@/services/unifiedTransactionService';
import { useChatStore } from '@/stores/chat';
import { getSocket } from '../backbone/utils/serverConnect';

// Initialize AppKit
createAppKit({
  adapters: [ethersAdapter, solanaWeb3JsAdapter],
  networks,
  projectId,
  themeMode: 'light',
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    swaps: false,
    onramp: false,
    email: false,
    socials: false
  },
  metadata: {
    name: 'Mobazha',
    description: 'Mobazha',
    url: 'https://mobazha.org',
    icons: ['https://avatars.githubusercontent.com/u/179229932?s=200&v=4']
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

export default {
  components: {
    Settings,
    EditListing,
    ModeratorDetails,
    Wallet,
    ShoppingCart,
    Purchase,
    LoadingModal,
    PageNav,
    ChatContainer,
  },
  name: 'App',
  data() {
    return {
      initialized: false,
      showLoadingModal: false,
      app: app,
      modalName: '',
      modalOptions: {},
      modalBBFunc: undefined,
      unifiedTransactionService: new UnifiedTransactionService()
    };
  },
  watch: {
    'app.initialized': {
      handler(newVal) {
        if (newVal) {
          this.initialized = true;
        }
      },
      immediate: true
    }
  },
  setup() {
    const appKit = useAppKit();
    const networkData = useAppKitNetwork();
    const accountData = useAppKitAccount();
    const appKitState = useAppKitState();
    const appKitEvents = useAppKitEvents();
    const { disconnect } = useDisconnect();

    // 使用 Pinia store
    const walletStore = useWalletStore();
    const chatStore = useChatStore();
    
    return {
      appKit,
      networkData,
      accountData,
      appKitState,
      appKitEvents,
      disconnect,
      walletStore,
      chatStore
    };
  },
  computed: {
    isWalletConnected() {
      return this.walletStore.isWalletConnected;
    },
    walletAddress() {
      return this.walletStore.walletAddress;
    },
    isDesktopApp() {
      return import.meta.env.VITE_APP === 'true';
    },
    // 计算当前网络类型
    currentNetworkType() {
      if (!this.networkData?.caipNetworkId) return null;
      
      const caipNetworkId = this.networkData.caipNetworkId;
      if (caipNetworkId.startsWith('eip155:')) {
        return 'ethereum';
      } else if (caipNetworkId.startsWith('solana:')) {
        return 'solana';
      } else if (caipNetworkId.startsWith('bip122:')) {
        return 'bitcoin';
      }
      return null;
    }
  },
  created() {
    this.$nextTick(() => {
      this.initAppKit();
      this.setupOrderEvents();
      
      // 延迟初始化聊天模块，确保WebSocket连接已建立
      this.$nextTick(() => {
        setTimeout(() => {
          this.initChat();
        }, 1000);
      });
      // 监听切链事件
      events.on('switchAppKitNetwork', this.handleSwitchAppKitNetwork);
      
      // Fallback: if Backbone app doesn't initialize within 10 seconds, initialize anyway
      setTimeout(() => {
        if (!this.initialized) {
          console.warn('Backbone app initialization timeout, initializing Vue app anyway');
          this.initialized = true;
        }
      }, 10000);
    });
  },
  methods: {
    // 窗口控制按钮事件
    handleWindowClose() {
      if (process.platform !== 'darwin') {
        // 在非macOS系统上关闭窗口
        if (window.electronAPI) {
          window.electronAPI.closeWindow();
        }
      } else {
        // 在macOS系统上隐藏窗口
        if (window.electronAPI) {
          window.electronAPI.hideWindow();
        }
      }
    },

    handleWindowMinimize() {
      if (window.electronAPI) {
        window.electronAPI.minimizeWindow();
      }
    },

    handleWindowMaximize() {
      if (window.electronAPI) {
        window.electronAPI.maximizeWindow();
      }
    },

    // 初始化聊天模块
    initChat() {
      try {
        // 获取WebSocket连接
        const socket = getSocket();
        if (socket) {
          // 初始化聊天store的WebSocket连接
          this.chatStore.initSocket(socket);
          
          // 获取聊天会话列表
          this.chatStore.fetchConversations();
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    },

    updateWalletStatus() {
      const { connection } = useAppKitConnection();
      
      // 根据网络类型获取对应的provider
      let walletProvider = null;
      if (this.currentNetworkType === 'solana') {
        const { walletProvider: solanaProvider } = useAppKitProvider('solana');
        walletProvider = solanaProvider;
      } else if (this.currentNetworkType === 'ethereum') {
        const { walletProvider: ethProvider } = useAppKitProvider('eip155');
        walletProvider = ethProvider;
      }
      
      this.walletStore.updateWalletState({
        isConnected: this.accountData.isConnected,
        address: this.accountData.address,
        connection,
        walletProvider,
        networkType: this.currentNetworkType
      });
    },

    checkWalletConnection(requiredNetworkType = null) {
      return this.walletStore.checkWalletConnection(requiredNetworkType);
    },

    initAppKit() {
      try {
        // 初始化交易服务（根据网络类型）
        this.initTransactionService();
        // 设置交易监听器
        this.setupTransactionListeners();
        // 初始化钱包状态
        this.updateWalletStatus();
      } catch (error) {
        console.error('Failed to initialize AppKit:', error);
      }
    },

    handleSwitchAppKitNetwork({ chain }) {
      const network = NETWORKS[chain && chain.toUpperCase()];
      if (network && this.networkData) {
        const result = this.networkData.switchNetwork(network);
        if (result && typeof result.then === 'function') {
          result.then(() => {
            events.trigger('appkit_network_switched', { chain });
          });
        } else {
          events.trigger('appkit_network_switched', { chain });
        }
      }
    },

    // 统一的交易服务初始化方法
    initTransactionService() {
      if (!this.accountData.address || !this.currentNetworkType) {
        console.log('无法初始化交易服务：钱包地址或网络类型未获取');
        return;
      }

      try {
        const { connection } = useAppKitConnection();

        // 根据网络类型获取对应的provider
        let walletProvider = null;
        if (this.currentNetworkType === 'solana') {
          const { walletProvider: solanaProvider } = useAppKitProvider('solana');
          walletProvider = solanaProvider;
        } else if (this.currentNetworkType === 'ethereum') {
          const { walletProvider: ethProvider } = useAppKitProvider('eip155');
          walletProvider = ethProvider;
        }

        // 使用统一交易服务初始化
        console.log('currentNetworkType', this.currentNetworkType);
        console.log('connection', connection);
        console.log('walletProvider', walletProvider);
        console.log('accountData.address', this.accountData.address);
        const success = this.unifiedTransactionService.initialize(
          this.currentNetworkType,
          connection,
          walletProvider,
          this.accountData.address
        );

        if (success) {
          console.log(`✅ ${this.currentNetworkType}交易服务已通过统一服务初始化`);
        } else {
          console.warn('❌ 统一交易服务初始化失败');
        }
      } catch (error) {
        console.error('初始化统一交易服务失败:', error);
      }
    },

    // 统一的交易监听器设置方法
    setupTransactionListeners() {
      // 统一的加密货币交易监听器
      events.on('executeCryptoTransaction', async (data) => {
        const { networkType, orderID, transactionData, metadata } = data;
        
        console.log(`📨 收到${networkType}交易执行请求, orderID: ${orderID}`);
        console.log('当前统一服务状态:', this.unifiedTransactionService.getStatus());
        
        if (!this.unifiedTransactionService.isServiceReady(networkType)) {
          const networkNames = {
            'solana': 'Solana',
            'ethereum': '以太坊'
          };
          
          console.error(`${networkNames[networkType]} transaction service not initialized`);
          ElMessage({
            message: `请先连接${networkNames[networkType]}钱包`,
            type: 'warning',
            duration: 3000
          });
          
          setTimeout(() => {
            events.trigger('cryptoTransactionError', {
              orderID,
              networkType,
              error: new Error(`请先连接${networkNames[networkType]}钱包`)
            });
          }, 0);
          return;
        }

        try {
          const result = await this.unifiedTransactionService.executeTransaction(networkType, transactionData);
          
          setTimeout(() => {
            console.log(`🎉 ${networkType}交易完成:`, result);
            events.trigger('cryptoTransactionComplete', {
              orderID,
              networkType,
              result,
              metadata
            });
          }, 0);
        } catch (error) {
          console.error(`❌ ${networkType}交易执行失败:`, error);
          
          setTimeout(() => {
            events.trigger('cryptoTransactionError', {
              orderID,
              networkType,
              error: error
            });
          }, 0);
        }
      });

      // RWA Token交易监听器
      events.on('executeRwaTokenTransaction', async (data) => {
        const { orderID, transactionData, paymentData } = data;
        
        console.log(`📨 收到RWA Token交易执行请求, orderID: ${orderID}`);
        
        try {
          // 检查钱包连接
          if (!this.accountData.isConnected) {
            throw new Error(this.$t('purchase.pleaseConnectWallet'));
          }

          // 检查RWA Marketplace服务是否可用
          if (!window.rwaMarketplaceService) {
            // 尝试从模块导入RWA Marketplace服务
            const { rwaMarketplaceService } = await import('@/services/rwaMarketplaceService.js');
            window.rwaMarketplaceService = rwaMarketplaceService;
          }

          if (!window.rwaMarketplaceService) {
            throw new Error('RWA Marketplace服务未初始化');
          }

          // 执行RWA Token交易
          const result = await window.rwaMarketplaceService.createOrderAndPay(transactionData);
          
          console.log(`🎉 RWA Token交易完成:`, result);
          
          // 使用result中的orderId作为交易结果
          const transactionResult = result.transactionHash;
          
          setTimeout(() => {
            events.trigger('rwaTokenTransactionComplete', {
              orderID,
              result: transactionResult,
              paymentData
            });
          }, 0);
        } catch (error) {
          console.error(`❌ RWA Token交易执行失败:`, error);
          
          setTimeout(() => {
            events.trigger('rwaTokenTransactionError', {
              orderID,
              error: error
            });
          }, 0);
        }
      });
    },

    setupOrderEvents() {
      // 监听钱包连接检查事件
      events.on('checkWalletConnection', async ({ callback, requiredNetworkType }) => {
        try {
          const isConnected = await this.checkWalletConnection(requiredNetworkType);
          callback(isConnected, this.walletAddress, this.currentNetworkType);
        } catch (error) {
          console.error('检查钱包连接失败:', error);
          callback(false, null, null);
        }
      });

      // 监听显示钱包连接提示事件
      events.on('showWalletConnectMessage', ({ message, type }) => {
        ElMessage({
          message,
          type: type || 'warning',
          duration: 3000
        });
      });
    }
  },
  watch: {
    'accountData.isConnected': {
      handler(newValue) {
        console.log('钱包连接状态变化:', newValue);
        if (newValue) {
          console.log('钱包已连接，地址：', this.accountData.address);
          console.log('当前网络类型:', this.currentNetworkType);
          this.initTransactionService();
        } else {
          // 断开连接时清空所有交易服务
          this.unifiedTransactionService.cleanup();
          console.log('钱包已断开连接');
        }
        this.updateWalletStatus();
      },
      immediate: true
    },

    'accountData.address': {
      handler(newValue, oldValue) {
        if (newValue && newValue !== oldValue && this.accountData.isConnected) {
          console.log('钱包地址变化:', newValue);
          this.initTransactionService();
        }
        this.updateWalletStatus();
      }
    },
    
    // 监听网络变化
    'networkData.caipNetworkId': {
      handler(newValue, oldValue) {
        if (newValue && newValue !== oldValue) {
          console.log('网络发生变化:', oldValue, '->', newValue);
          console.log('新的网络类型:', this.currentNetworkType);

          this.unifiedTransactionService.cleanup();
          
          // 如果钱包已连接，重新初始化对应网络的交易服务
          if (this.accountData.isConnected && this.accountData.address) {
            this.initTransactionService();
          }
          
          this.updateWalletStatus();

          // 自动弹出连接钱包弹窗
          if (!this.walletStore.isWalletConnected && this.appKit) {
            this.appKit.open({ view: 'Connect' });
          }
        }
      }
    }
  },
  beforeDestroy() {
    events.off('switchAppKitNetwork', this.handleSwitchAppKitNetwork);
    events.off('executeCryptoTransaction');
    events.off('checkWalletConnection');
    events.off('showWalletConnectMessage');
  }
};
</script>
<style lang="less">
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  
  // 浏览器风格的标题栏
  .browser-titlebar {
    height: 32px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid #e0e0e0;
    -webkit-app-region: drag;
    
    .window-controls {
      display: flex;
      gap: 8px;
      margin-right: 16px;
      -webkit-app-region: no-drag;
      
      .window-control {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        cursor: pointer;
        
        &.close {
          background: #ff5f56;
          border: 1px solid #e0443e;
          
          &:hover {
            background: #ff3b30;
          }
        }
        
        &.minimize {
          background: #ffbd2e;
          border: 1px solid #dea123;
          
          &:hover {
            background: #ffaa00;
          }
        }
        
        &.maximize {
          background: #27ca3f;
          border: 1px solid #1aad29;
          
          &:hover {
            background: #00ca4e;
          }
        }
      }
    }
    
    .titlebar-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      -webkit-app-region: no-drag;
    }
  }
  
  // Web3风格的导航栏
  .browser-navbar {
    height: 48px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafb 100%);
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid rgba(220, 225, 230, 0.6);
    box-shadow: 0 2px 8px rgba(100, 115, 135, 0.08);
    backdrop-filter: blur(8px);
    
    .nav-container {
      flex: 1;
      margin-right: 16px;
    }
    
    .wallet-section {
      display: flex;
      align-items: center;
      
      .wallet-button-wrapper {
        // 简化钱包按钮样式
        :deep(w3m-button),
        :deep(appkit-button) {
          --w3m-accent: #667eea;
          --w3m-border-radius-master: 8px;
          
          button {
            height: 32px;
            padding: 0 12px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(220, 225, 230, 0.4);
            border-radius: 8px;
            color: #556080;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            
            &:hover {
              background: rgba(255, 255, 255, 0.95);
              border-color: rgba(102, 126, 234, 0.3);
              color: #667eea;
            }
          }
        }
      }
    }
  }
  
  // 主要内容区域
  .content-frame {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(102, 126, 234, 0.3) 50%, transparent 100%);
      z-index: 1;
    }
    
    #pageContainer {
      flex: 1;
      overflow-y: auto;
      padding: 0;
      background: linear-gradient(180deg, #fafbfc 0%, #f4f6f8 100%);
      position: relative;
      
      // 添加微妙的网格背景增强科技感
      &::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.02) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(118, 75, 162, 0.02) 0%, transparent 50%);
        pointer-events: none;
        z-index: 0;
      }
    }
  }
  
  // 状态栏
  .status-bar {
    height: 22px;
    background: #f5f5f5;
    border-top: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-size: 12px;
    color: #666;
  }
  
  // 响应式调整
  @media (max-width: 768px) {
    .browser-titlebar {
      .window-controls {
        gap: 6px;
        
        .window-control {
          width: 10px;
          height: 10px;
        }
      }
      
      .titlebar-title {
        font-size: 13px;
      }
    }
    
    .browser-navbar {
      padding: 0 8px;
      
      .nav-container {
        margin-right: 8px;
      }
      
      .wallet-section {
        padding: 2px 8px;
        border-radius: 6px;
      }
    }
    
    .content-frame {
      #pageContainer {
        padding: 0;
      }
    }
  }
  
  @media (max-width: 480px) {
    .browser-titlebar {
      height: 28px;
      padding: 0 12px;
      
      .titlebar-title {
        font-size: 12px;
      }
    }
    
    .browser-navbar {
      height: 44px;
      padding: 0 4px;
    }
  }
}
</style>
