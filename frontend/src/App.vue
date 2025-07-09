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
        <appkit-button />
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
import {ethersAdapter, solanaWeb3JsAdapter, bitcoinAdapter, networks, projectId } from './config/wallet'
import { useAppKitConnection } from '@reown/appkit-adapter-solana/vue'
import { useAppKit, useAppKitNetwork, useAppKitAccount, useAppKitProvider, useAppKitState, useAppKitEvents, useDisconnect } from '@reown/appkit/vue';
import { SolanaTransactionService } from '@/services/solanaTransaction';
import { events } from '../backbone/utils/order';
import { useWalletStore } from '@/stores/wallet';
import { EthTransactionService } from '@/services/ethTransaction';
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
      transactionService: null,
      ethTransactionService: null
    };
  },
  setup() {
    const { connection } = useAppKitConnection();
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
      connection,
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
    }
  },
  created() {
    this.$nextTick(() => {
      this.initAppKit();
      this.initialized = true;
      this.setupOrderEvents();
      
      // 延迟初始化聊天模块，确保WebSocket连接已建立
      this.$nextTick(() => {
        setTimeout(() => {
          this.initChat();
        }, 1000);
      });
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
      const { walletProvider } = useAppKitProvider('solana');
      
      this.walletStore.updateWalletState({
        isConnected: this.accountData.isConnected,
        address: this.accountData.address,
        connection,
        walletProvider
      });
    },

    checkWalletConnection() {
      return this.walletStore.checkWalletConnection();
    },

    initAppKit() {
      try {
        // 初始化交易服务
        // this.initTransactionService();
        this.initEthTransactionService();
        // 设置交易监听器
        // this.setupTransactionListener();
        this.setupEthTransactionListener();
        // 初始化钱包状态
        this.updateWalletStatus();
      } catch (error) {
        console.error('Failed to initialize AppKit:', error);
      }
    },

    switchNetwork(network) {
      this.networkData.value.switchNetwork(network);
    },

    initTransactionService() {
      const { walletProvider } = useAppKitProvider('solana');
      if (this.connection && walletProvider && this.accountData.address) {
        this.transactionService = new SolanaTransactionService(
          this.connection,
          walletProvider,
          this.accountData.address
        );
      }
    },

    initEthTransactionService() {
      const { walletProvider } = useAppKitProvider('eip155');
      if (walletProvider && this.accountData.address) {
        this.ethTransactionService = new EthTransactionService(
          walletProvider,
          this.accountData.address
        );
      }
    },

    setupTransactionListener() {
      events.on('executeSolanaTransaction', async (data) => {
        if (!this.transactionService) {
          console.error('Transaction service not initialized');
          ElMessage({
            message: 'Please connect your wallet first',
            type: 'warning',
            duration: 3000
          });
          
          // 确保错误事件被正确触发
          setTimeout(() => {
            events.trigger('solanaTransactionError', {
              orderID: data.orderID,
              error: new Error('Please connect your wallet first')
            });
          }, 0);
          return;
        }

        try {
          const signature = await this.transactionService.executeTransaction(data.instructions);
          
          // 确保成功事件被正确触发
          setTimeout(() => {
            console.log('交易完成:', signature);
            events.trigger('solanaTransactionComplete', {
              orderID: data.orderID,
              result: signature,
              metadata: data.metadata
            });
          }, 0);
        } catch (error) {
          console.error('交易执行失败: ', error);
          
          // 确保错误事件被正确触发
          setTimeout(() => {
            events.trigger('solanaTransactionError', {
              orderID: data.orderID,
              error: error
            });
          }, 0);
        }
      });
    },

    setupEthTransactionListener() {
      events.on('executeEthTransaction', async (data) => {
        if (!this.ethTransactionService) {
          console.error('ETH Transaction service not initialized');
          ElMessage({
            message: '请先连接钱包',
            type: 'warning',
            duration: 3000
          });
          
          setTimeout(() => {
            events.trigger('ethTransactionError', {
              orderID: data.orderID,
              error: new Error('请先连接钱包')
            });
          }, 0);
          return;
        }

        try {
          const hash = await this.ethTransactionService.executeTransaction(data.txData);
          
          setTimeout(() => {
            console.log('交易完成:', hash);
            events.trigger('ethTransactionComplete', {
              orderID: data.orderID,
              result: hash,
              metadata: data.metadata
            });
          }, 0);
        } catch (error) {
          console.error('交易执行失败: ', error);
          
          setTimeout(() => {
            events.trigger('ethTransactionError', {
              orderID: data.orderID,
              error: error
            });
          }, 0);
        }
      });
    },

    setupOrderEvents() {
      // 监听钱包连接检查事件
      events.on('checkWalletConnection', async ({ callback }) => {
        try {
          const isConnected = await this.checkWalletConnection();
          callback(isConnected, this.walletAddress);
        } catch (error) {
          console.error('检查钱包连接失败:', error);
          callback(false, null);
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
          // this.initTransactionService();
          this.initEthTransactionService();
        } else {
          this.transactionService = null;
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
          // this.initTransactionService();
          this.initEthTransactionService();
        }
        this.updateWalletStatus();
      }
    }
  },
  beforeDestroy() {
    events.off('executeSolanaTransaction');
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
      padding: 6px 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      border: 1px solid rgba(102, 126, 234, 0.2);
      color: white;
      font-weight: 500;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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
