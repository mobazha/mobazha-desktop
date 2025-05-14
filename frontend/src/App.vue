<template>
  <div class="app-container">
    <div class="app-header">
      <section id="pageNavContainer">
        <PageNav ref="pageNav" />
      </section>
      <div class="reown-wallet-section">
        <appkit-button />
      </div>
    </div>
    <section id="contentFrame" class="clrBr">
      <div id="pageContainer">
        <router-view v-if="initialized" :key="$route.params[$route.meta.watchParam]" />
      </div>
    </section>
    <section id="statusBar"></section>
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

import { createAppKit } from '@reown/appkit/vue';
import {wagmiAdapter, solanaWeb3JsAdapter, bitcoinAdapter, networks, projectId } from './config/wallet'
import { useAppKitConnection } from '@reown/appkit-adapter-solana/vue'
import { useAppKit, useAppKitAccount, useAppKitProvider, useAppKitState, useAppKitEvents, useDisconnect } from '@reown/appkit/vue';
import { SolanaTransactionService } from '@/services/solanaTransaction';
import { events } from '../backbone/utils/order';
import { mapActions, mapGetters } from 'vuex';

// Initialize AppKit
createAppKit({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter, bitcoinAdapter],
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
      transactionService: null
    };
  },
  setup() {
    const { connection } = useAppKitConnection();
    const appKit = useAppKit();
    const accountData = useAppKitAccount();
    const appKitState = useAppKitState();
    const appKitEvents = useAppKitEvents();
    const { disconnect } = useDisconnect();
    
    return {
      connection,
      appKit,
      accountData,
      appKitState,
      appKitEvents,
      disconnect
    };
  },
  computed: {
    ...mapGetters('wallet', [
      'isWalletConnected',
      'walletAddress'
    ]),
  },
  created() {
    this.$nextTick(() => {
      this.initAppKit();
      this.initialized = true;
      this.setupOrderEvents();
    });
  },
  methods: {
    ...mapActions('wallet', [
      'updateWalletState',
      'checkWalletConnection'
    ]),
    
    initAppKit() {
      try {
        // 初始化交易服务
        this.initTransactionService();
        // 设置交易监听器
        this.setupTransactionListener();
        // 初始化钱包状态
        this.updateWalletStatus();
      } catch (error) {
        console.error('Failed to initialize AppKit:', error);
      }
    },

    updateWalletStatus() {
      const { connection } = useAppKitConnection();
      const { walletProvider } = useAppKitProvider('solana');
      
      this.updateWalletState({
        isConnected: this.accountData.isConnected,
        address: this.accountData.address,
        connection,
        walletProvider
      });
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
          this.initTransactionService();
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
          this.initTransactionService();
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
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    // height: 64px; // 固定导航栏高度
    padding: 0 20px;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    #pageNavContainer {
      flex: 1;
    }

    .reown-wallet-section {
      margin-left: 20px;
      padding: 8px;
      background: transparent; // 移除背景色
      border-radius: 8px;
      display: flex;
      align-items: center;
    }
  }
}
</style>
