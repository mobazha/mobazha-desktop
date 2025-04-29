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

// Initialize AppKit
createAppKit({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter, bitcoinAdapter],
  networks,
  projectId,
  themeMode: 'light',
  features: {
    analytics: false, // Optional - defaults to your Cloud configuration
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
  name: 
    'App',
  data() {
    return {
      initialized: false,
      showLoadingModal: false,

      app: app,

      modalName: '',
      modalOptions: {},
      modalBBFunc: undefined,
    };
  },
  created() {
  },
  mounted() {
  },
  watch: {},
  methods: {
  },
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
