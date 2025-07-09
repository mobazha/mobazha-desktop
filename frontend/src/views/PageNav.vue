<template>
  <div
    :class="`pageNav ${!navigable ? 'notNavigable' : ''} ${torIndicatorOn ? 'torIndicatorOn' : ''}`"
    @click="onDocClick">
    <header>
      <nav class="browser-toolbar">
        <!-- 左侧导航按钮组 -->
        <div class="nav-buttons-left">
          <a v-if="!showFullNav" class="nav-btn" @click="navHomeClick" :data-tip="ob.polyT('pageNav.toolTip.home')">
            <i class="ion-home"></i>
          </a>
          <a v-if="isDesktopApp" class="nav-btn" @click="navBackClick" :data-tip="ob.polyT('pageNav.toolTip.back')">
            <i class="ion-chevron-left"></i>
          </a>
          <a v-if="isDesktopApp" class="nav-btn" @click="navFwdClick" :data-tip="ob.polyT('pageNav.toolTip.forward')">
            <i class="ion-chevron-right"></i>
          </a>
          <a v-if="isDesktopApp" class="nav-btn" @click="navReload" :data-tip="ob.polyT('pageNav.toolTip.refresh')" id="Nav_Refresh">
            <i class="ion-refresh"></i>
          </a>
        </div>

        <!-- 中间地址栏区域 -->
        <div class="address-bar-container" v-show="showFullNav">
          <div class="address-bar-wrapper">
            <input type="text" class="address-bar"
              ref="addressBar"
              @keyup.enter="onKeyupAddressBar"
              v-model.trim="addressBarText"
              @focusin="onFocusInAddressBar"
              :placeholder="ob.polyT('addressBarPlaceholder')" />
            <div class="address-bar-indicators">
              <AddressBarIndicators ref="addressBarIndicators" />
            </div>
          </div>
          <template v-if="ob.testnet">
            <div class="testnet-badge">
              <span class="toolTip" :data-tip="ob.polyT('testnetTooltip')">{{ ob.polyT('testnet') }}</span>
            </div>
          </template>
        </div>

        <!-- 右侧功能按钮组 -->
        <div class="nav-buttons-right">
          <a href="#search" class="nav-btn" :data-tip="ob.polyT('pageNav.toolTip.discover')" id="Nav_Discover">
            <img class="discover-icon" src="~@/../imgs/obVectorIconSmall2.png" />
          </a>
          <template v-if="showDiscoverCallout">
            <div class="discover-callout">
              <div class="callout-title">{{ ob.polyT('pageNav.discoverCalloutTitle') }}</div>
              <p>{{ ob.polyT('pageNav.discoverCalloutBody') }}</p>
            </div>
          </template>
          
          <a class="nav-btn" @click="navPaymentMethodsClick" :data-tip="ob.polyT('pageNav.toolTip.paymentMethods')" id="Nav_PaymentMethods">
            <i class="ion-card"></i>
          </a>
          
          <el-popover 
            placement="bottom-end" 
            :width="420" 
            trigger="click"
            popper-class="notification-popover"
            :show-arrow="false"
            v-model:visible="notifContainerOpened">
            <template #reference>
              <a class="nav-btn" :data-tip="ob.polyT('pageNav.toolTip.notifications')" id="Nav_Notifications">
                <i class="ion-android-notifications"></i>
                <div class="notification-badge" v-show="serverConnected && unreadNotifCount">
                  {{ unreadNotifCount > 99 ? '…' : unreadNotifCount }}
                </div>
              </a>
            </template>
            <template #default>
              <div class="notification-popover-content">
                <Notifications v-if="serverConnected && profileReady" ref="notifications" @notifNavigate="closeNotifications"/>
              </div>
            </template>
          </el-popover>
          
          <a class="nav-btn" @click="onClickShoppingCartBtn" :data-tip="ob.polyT('pageNav.toolTip.shoppingCart')" id="Nav_ShoppingCart">
            <i class="ion-android-cart"></i>
            <div class="cart-badge" v-show="serverConnected && cartItemsCount">
              {{ cartItemsCount > 99 ? '…' : cartItemsCount }}
            </div>
          </a>
          
          <a v-if="!showFullNav" class="nav-btn" @click="onClickShoppingCartBtn" :data-tip="ob.polyT('pageNav.toolTip.shoppingCart')" id="Nav_ShoppingCart0">
            <i class="ion-android-cart"></i>
            <div class="cart-badge" v-show="serverConnected && cartItemsCount">
              {{ cartItemsCount > 99 ? '…' : cartItemsCount }}
            </div>
          </a>
          
          <a v-if="!showFullNav" class="nav-btn" @click="navLoginClick" :data-tip="ob.polyT('pageNav.toolTip.login')">
            <i class="ion-log-in"></i>
          </a>
          
          <!-- Element Plus 用户菜单 -->
          <el-dropdown 
            trigger="click" 
            placement="bottom-end"
            popper-class="user-menu-popper"
            @command="handleCommand">
            <div 
              id="user-menu-btn" 
              class="user-menu-btn"
              :style="ob.getAvatarBgImage(avatarHashes || ob.avatarHashes)" 
              :data-tip="ob.polyT('pageNav.toolTip.nav')">
            </div>
            <template #dropdown>
              <el-dropdown-menu class="user-dropdown-menu">
                <!-- 用户信息头部 -->
                <div class="user-info-header">
                  <div class="user-name">{{ ob.name }}</div>
                  <div class="user-id">{{ ob.peerID ? ob.peerID.slice(0, 8) + '...' : '' }}</div>
                </div>
                
                <el-dropdown-item divided command="profile">
                  <i class="ion-person"></i>
                  {{ ob.polyT('pageNav.myPage') }}
                </el-dropdown-item>
                
                <el-dropdown-item command="create-listing">
                  <i class="ion-plus"></i>
                  {{ ob.polyT('pageNav.createListing') }}
                </el-dropdown-item>
                
                <el-dropdown-item divided command="sales">
                  <i class="ion-bag"></i>
                  {{ ob.polyT('pageNav.sales') }}
                </el-dropdown-item>
                
                <el-dropdown-item command="purchases">
                  <i class="ion-card"></i>
                  {{ ob.polyT('pageNav.purchases') }}
                </el-dropdown-item>
                
                <el-dropdown-item command="cases">
                  <i class="ion-briefcase"></i>
                  {{ ob.polyT('pageNav.cases') }}
                </el-dropdown-item>
                
                <el-dropdown-item v-if="!isApp" divided command="wallet">
                  <i class="ion-social-bitcoin"></i>
                  {{ connectWalletMenuDisplay }}
                </el-dropdown-item>
                
                <el-dropdown-item v-if="isApp" divided command="server">
                  <i class="ion-network"></i>
                  <span :class="`server-name ${serverConnected ? 'connected' : ''}`">
                    {{ serverConnected ? ob.connectedServer.name : ob.polyT('pageNav.notConnectedMenuItem') }}
                  </span>
                </el-dropdown-item>
                
                <el-dropdown-item divided command="settings">
                  <i class="ion-gear-a"></i>
                  {{ ob.polyT('pageNav.settings') }}
                </el-dropdown-item>
                
                <el-dropdown-item command="help">
                  <i class="ion-help"></i>
                  {{ ob.polyT('pageNav.help') }}
                </el-dropdown-item>
                
                <el-dropdown-item v-if="!isApp" divided command="logout">
                  <i class="ion-log-out"></i>
                  {{ ob.polyT('pageNav.logout') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>



        <!-- 服务器管理容器 -->
        <nav :class="`server-menu-dropdown ${connManagementContainerOpened ? 'open' : ''}`"
          @mouseenter="onMouseEnterConnManagementContainer"
          @mouseleave="onMouseLeaveConnManagementContainer">
          <PageNavServersMenu
          :bb="function() {
              return {
                collection: app.serverConfigs,
              };
            }" />
        </nav>

        <!-- 工具菜单容器 -->
        <nav :class="`tools-menu-dropdown ${toolsContainerOpened ? 'open' : ''}`"
          @mouseenter="onMouseEnterToolsContainer"
          @mouseleave="onMouseLeaveToolsContainer">
          <PageNavToolsMenu @onWooImporterClick="onWooImporterClick" />
        </nav>
      </nav>
    </header>
    
    <div :class="`nav-overlay ${navOverlayOpened ? 'open' :'' }`" @click="onDocClick"></div>
    
    <Teleport v-if="navigable" to="#js-vueModal">
      <Settings v-show="showSettings" @close="closeSettings" />
      <WooImporter v-show="showWooImporter" @close="closeWooImporter" />
      <EditListing v-if="showEditListing" :bb="() => {
        return {
          model: editListingModel,
        };
      }" @close="closeEditListingModal" />
      <ShoppingCart v-if="showShoppingCart" @close="closeShoppingCart" />
    </Teleport>
  </div>
</template>

<script>
import * as isIPFS from 'is-ipfs';
import Backbone from 'backbone';
import process from 'process';
import { myGet } from '../api/api.js';
import { ipc } from '../utils/ipcRenderer.js';
import { events as serverConnectEvents, getCurrentConnection } from '../../backbone/utils/serverConnect.js';
import { setUnreadNotifCount, launchNativeNotification } from '../../backbone/utils/notification.js';
import { recordEvent } from '../../backbone/utils/metrics.js';
import app from '../../backbone/app.js';
import * as casdoor from '../utils/casdoor';
import { launchAboutModal, } from '../../backbone/utils/modalManager.js';
import Listing from '../../backbone/models/listing/Listing.js';
import { getNotifDisplayData } from '../../backbone/collections/Notifications.js';

import PageNavServersMenu from './PageNavServersMenu.vue';
import PageNavToolsMenu from './PageNavToolsMenu.vue';
import AddressBarIndicators from './AddressBarIndicators.vue';
import Notifications from './notifications/Notifications.vue';
import Wallet from '@/views/modals/wallet/Wallet.vue';
import Settings from '@/views/modals/settings/Settings.vue';
import EditListing from '@/views/modals/editListing/EditListing.vue';
import WooImporter from '@/views/modals/WooImporter.vue';
import ShoppingCart from './ShoppingCart.vue';

export default {
  components: {
    PageNavServersMenu,
    PageNavToolsMenu,
    AddressBarIndicators,
    Notifications,
    Wallet,
    Settings,
    EditListing,
    WooImporter,
    ShoppingCart,
  },
  props: {
    options: {
      type: Object,
      default: {},
    },
    bb: Function,
  },
  data () {
    return {
      isApp: import.meta.env.VITE_APP,

      navigable: false,
      torIndicatorOn: false,

      windowStyle: 'win',
      app,

      toggleKey: 0,

      unreadNotifCount: 0,
      cartItemsCount: 0,

      serverConnected: false,
      profileReady: false,

      avatarHashes: '',
      navOverlayOpened: false,
      connManagementContainerOpened: false,
      toolsContainerOpened: false,
      notifContainerOpened: false,

      addressBarText: '',

      showDiscoverCallout: false,

      showSettings: false,

      showWooImporter: false,

      showEditListing: false,
      editListingModel: {},

      showShoppingCart: false,

      onboard: {},
    };
  },
  created () {
    this.initEventChain();

    this.loadData(this.options);
  },
  watch: {
    unreadNotifCount() {
      setUnreadNotifCount(this.unreadNotifCount);
    },
    $route(to) {
      if (to.name === 'Search') {
        this.onRouteSearch();
      }
    },
    notifContainerOpened(newVal) {
      if (!newVal) {
        // 当通知面板关闭时，执行清理逻辑
        this.handleNotificationClose();
      }
    }
  },
  mounted () {
  },
  unmounted() {
  },
  computed: {
    ob () {
      let access = this.toggleKey;

      let connectedServer = getCurrentConnection();

      if (connectedServer && connectedServer.status !== 'disconnected') {
        connectedServer = connectedServer.server.toJSON();
      } else {
        connectedServer = null;
      }

      if (connectedServer) {
        this.showDiscoverCallout = !connectedServer.dismissedDiscoverCallout;
      }

      return {
        ...this.templateHelpers,
        connectedServer,
        testnet: app.serverConfig.testnet,
        ...((app.profile && app.profile.toJSON()) || {}),
      };
    },

    connectWalletMenuDisplay() {
      if (!this.onboard) return;

      return this.onboard.connectingWallet
        ? this.ob.polyT('pageNav.walletConnecting')
        : this.onboard.connectedWallet ? this.ob.polyT('pageNav.disconnectWallet') : this.ob.polyT('pageNav.connectWallet');
    },

    showFullNav() {
      if (!import.meta.env.VITE_APP && !casdoor.isLoggedIn()) {
        return false;
      }
      return true;
    },

    isDesktopApp() {
      return import.meta.env.VITE_APP;
    }
  },
  methods: {
    loadData (options) {
      const opts = {
        events: {
          'click .js-notificationListItem a[href]': 'onClickNotificationLink',
        },
        navigable: false,
        ...options,
      };

      this.baseInit(opts);

      this.listenTo(app.localSettings, 'change:windowControlStyle', (_, style) => this.windowStyle = style);
      this.windowStyle = app.localSettings.get('windowControlStyle');

      this.listenTo(serverConnectEvents, 'connected', (e) => {
        this.serverConnected = true;
        this.toggleKey += 1;

        this.fetchUnreadNotifCount().done((data) => {
          this.unreadNotifCount = (this.unreadNotifCount || 0) + data.unread;
        });
        this.fetchCartItemsCount().done((count) => {
          this.cartItemsCount = count;
        });
        this.listenTo(e.socket, 'message', this.onSocketMessage);
      });

      this.listenTo(serverConnectEvents, 'disconnected', (e) => {
        this.serverConnected = false;
        this.toggleKey += 1;

        this.torIndicatorOn = false;
        this.stopListening(e.socket, 'message', this.onSocketMessage);
      });
    },

    onSocketMessage (e) {
      const notif = e.jsonData.notification;
      if (notif) {
        if (notif.type === 'unfollow') return;
        this.unreadNotifCount = (this.unreadNotifCount || 0) + 1;
        setUnreadNotifCount(this.unreadNotifCount);

        const notifDisplayData = getNotifDisplayData(notif, { native: true });
        const nativeNotifData = {
          silent: true,
          onclick: () => {
            ipc.send('controller.mainwindow.doMainWindowAction', 'restore');

            if (notifDisplayData.route) {
              location.hash = notifDisplayData.route;
            }
          },
        };

        if (notif.thumbnail) {
          nativeNotifData.icon = app.getServerUrl(`ob/image/${notif.thumbnail.small}`);
        }

        launchNativeNotification(notifDisplayData.text, nativeNotifData);
      }

      const shoppingCart = e.jsonData.shoppingCart;
      if (shoppingCart) {
        this.cartItemsCount = shoppingCart.itemsCount;
      }
    },

    navHomeClick () {
      app.router.navigate(`/`, { trigger: true });
    },

    navBackClick () {
      recordEvent('NavClick', { target: 'back' });
      window.history.back();
    },

    navFwdClick () {
      recordEvent('NavClick', { target: 'forward' });
      window.history.forward();
    },

    navReload () {
      app.loadingModal.open();

      // Introducing some fake latency to ensure the loading modal has a chance
      // to appear. Otherwise, views that render quickly (e.g. have cached data)
      // load so fast it may look like pressing the refresh button did nothing.
      setTimeout(() => {
        Backbone.history.loadUrl();
      }, 200);
    },

    fetchUnreadNotifCount () {
      // We'll send a bogus filter because all we want is the count - we don't
      // want to weight the returned payload down with any notifications. Those
      // will be lazy loaded in when the notif menu is opened.
      return myGet(app.getServerUrl('ob/notifications?filter=blah-blah'));
    },

    fetchCartItemsCount () {
      return myGet(app.getServerUrl('ob/carts/itemsCount'));
    },

    setAppProfile () {
      // when this view is created, the app.profile doesn't exist
      this.listenTo(app.profile.get('avatarHashes'), 'change', this.updateAvatar);
      
      this.profileReady = true;
      this.toggleKey += 1;
    },

    updateAvatar () {
      this.avatarHashes = app.profile.get('avatarHashes').toJSON();
    },

    navCloseClick () {
      recordEvent('NavClick', { target: 'close' });
      if (process.platform !== 'darwin') {
        ipc.send('controller.mainwindow.doMainWindowAction', 'close');
      } else {
        ipc.send('controller.mainwindow.doMainWindowAction', 'hide');
      }
    },

    navMinClick () {
      recordEvent('NavClick', { target: 'minimize' });

      ipc.send('controller.mainwindow.doMainWindowAction', 'minimize');
    },

    navMaxClick () {
      ipc.send('controller.mainwindow.doMainWindowAction', 'minimize');
      ipc.send('controller.mainwindow.doMainWindowAction', 'setFullScreen');
    },

    onRouteSearch () {
      const connectedServer = getCurrentConnection();

      if (connectedServer && connectedServer.server) {
        connectedServer.server.save({ dismissedDiscoverCallout: true });

        this.showDiscoverCallout = false;
      }
    },

    onMouseEnterConnectedServerListItem () {
      this.overConnectedServerListItem = true;
      this.connManagementContainerOpened = true;
    },

    onMouseLeaveConnectedServerListItem () {
      this.overConnectedServerListItem = false;

      setTimeout(() => {
        if (!this.overConnManagementContainer) {
          this.connManagementContainerOpened = false;
        }
      }, 100);
    },

    onMouseEnterConnManagementContainer () {
      this.overConnManagementContainer = true;
    },

    onMouseLeaveConnManagementContainer () {
      this.overConnManagementContainer = false;

      setTimeout(() => {
        if (!this.overConnectedServerListItem) {
          this.connManagementContainerOpened = false;
        }
      }, 100);
    },

    onMouseEnterToolsItem() {
      this.overToolsItem = true;
      this.toolsContainerOpened = true;
    },

    onMouseLeaveToolsItem() {
      this.overToolsItem = false;

      setTimeout(() => {
        if (!this.overToolsContainer) {
          this.toolsContainerOpened = false;
        }
      }, 100);
    },

    onMouseEnterToolsContainer () {
      this.overToolsContainer = true;
    },

    onMouseLeaveToolsContainer () {
      this.overToolsContainer = false;

      setTimeout(() => {
        if (!this.overToolsItem) {
          this.toolsContainerOpened = false;
        }
      }, 100);
    },

    onWooImporterClick() {
      this.showWooImporter = true;
    },

    closeWooImporter() {
      this.showWooImporter = false;
    },

    onClickWalletConnect() {
      setTimeout(() => {
        this.closeNavMenu();
      });

      const { provider, label } = this.onboard.connectedWallet || {}
      if (provider && label) {
        this.onboard.disconnectWallet({ label })
      } else {
        this.onboard.connectWallet()
      }
    },

    onNavListItemClick () {
      // Set timeout allows the new page to show before the overlay is removed. Otherwise,
      // there's a flicker frmo the old page to the new page.
      setTimeout(() => {
        this.closeNavMenu();
      });
    },

    // 处理Element Plus下拉菜单命令
    handleCommand(command) {
      console.log('Menu command:', command);
      
      switch (command) {
        case 'profile':
          this.onNavListItemClick();
          app.router.navigate(`${this.ob.peerID}/home`, { trigger: true });
          break;
        case 'create-listing':
          this.navCreateListingClick();
          break;
        case 'sales':
          this.onNavListItemClick();
          app.router.navigate('transactions/sales', { trigger: true });
          break;
        case 'purchases':
          this.onNavListItemClick();
          app.router.navigate('transactions/purchases', { trigger: true });
          break;
        case 'cases':
          this.onNavListItemClick();
          app.router.navigate('transactions/cases', { trigger: true });
          break;
        case 'wallet':
          this.onClickWalletConnect();
          break;
        case 'server':
          // 处理服务器连接
          this.onMouseEnterConnectedServerListItem();
          break;
        case 'settings':
          this.navSettingsClick();
          break;
        case 'help':
          this.navHelpClick();
          break;
        case 'logout':
          this.navLogoutClick();
          break;
        default:
          console.log('Unknown command:', command);
      }
    },

    closeNavMenu () {
      this.navOverlayOpened = false;

      this.connManagementContainerOpened = false;
    },

    onClickNavNotifBtn () {
      this.connManagementContainerOpened = false;
      recordEvent('NavClick', { target: 'notificationsOpen' });
    },

    closeNotifications (options) {
      this.notifContainerOpened = false;
    },

    handleNotificationClose() {
      if (this.$refs.notifications) {
        const count = this.unreadNotifCount;
        if (this.unreadNotifCount) {
          const markAsRead = this.$refs.notifications.markNotifsAsRead();
          if (markAsRead) {
            this.unreadNotifCount = 0;
            markAsRead.fail(() => {
              this.unreadNotifCount = (this.unreadNotifCount || 0) + count;
            });
          }
        }

        this.$refs.notifications.reset();
      }
    },

    onClickNotificationLink () {
      this.closeNotifications();
    },

    onClickShoppingCartBtn () {
      this.showShoppingCart = true;
    },

    closeShoppingCart() {
      this.showShoppingCart = false;
    },

    onDocClick () {
      this.closeNavMenu();
    },

    onFocusInAddressBar () {
      this.$refs.addressBar.select();
    },

    onKeyupAddressBar () {
      const text = this.addressBarText;

      const firstTerm = text.startsWith('ob://')
        ? text.slice(5)
          .split(' ')[0]
          .split('/')[0]
        : text.split(' ')[0]
          .split('/')[0];

      if (isIPFS.multihash(firstTerm)) {
        recordEvent('AddressBar_Input', { entry: 'multihash' });
        app.router.navigate(text.split(' ')[0], { trigger: true });
      } else if (firstTerm.charAt(0) === '@' && firstTerm.length > 1) {
        // a handle
        recordEvent('AddressBar_Input', { entry: 'handle' });
        app.router.navigate(text.split(' ')[0], { trigger: true });
      } else if (text.startsWith('ob://')) {
        // trying to show a specific page
        recordEvent('AddressBar_Input', { entry: 'ob://' });
        app.router.navigate(text.split(' ')[0], { trigger: true });
      } else {
        // searching term
        recordEvent('AddressBar_Input', { entry: 'searchTerm' });
        app.router.navigate(`search?q=${encodeURIComponent(text)}`, { trigger: true });
      }
    },

    setAddressBar (text = '') {
      this.addressBarText = text;

      if (this.$refs.addressBarIndicators) this.$refs.addressBarIndicators.updateVisibility(text);
    },

    navSettingsClick () {
      setTimeout(() => {
        this.closeNavMenu();
      });

      // This is recorded as two events that belong to different metrics we're comparing.
      recordEvent('NavMenu_Click', { target: 'settings' });
      recordEvent('Settings_Open', { origin: 'navMenu' });

      this.showSettings = true;
    },

    closeSettings() {
      this.showSettings = false;
    },

    navHelpClick () {
      setTimeout(() => {
        this.closeNavMenu();
      });

      recordEvent('NavMenu_Click', { target: 'help' });
      launchAboutModal({ initialTab: 'Help' });
      this.closeNavMenu();
    },

    navAboutClick () {
      recordEvent('NavMenu_Click', { target: 'about' });
      launchAboutModal({ initialTab: 'Story' });
      this.closeNavMenu();
    },

    navLogoutClick() {
      casdoor.logout();

      casdoor.goToLink('/');
    },

    navCreateListingClick () {
      setTimeout(() => {
        this.closeNavMenu();
      });

      // This is recorded as two events that belong to different metrics we're comparing.
      recordEvent('NavMenu_Click', { target: 'newListing' });
      recordEvent('Listing_New', { origin: 'navMenu' });
      this.editListingModel = new Listing({}, { guid: app.profile.id });

      this.showEditListing = true;
    },
    closeEditListingModal() {
      this.showEditListing = false;
    },

    navLoginClick() {
      window.location.href = casdoor.getSigninUrl();
    },

    navPaymentMethodsClick() {
      recordEvent('NavClick', { target: 'paymentMethodsOpen' });
      this.$router.push('/receiving-accounts');
    },
  }
}
</script>
<style lang="scss" scoped>
.pageNav {
  position: relative;
  
  .browser-toolbar {
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 8px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafb 100%);
    gap: 8px;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(220, 225, 230, 0.4);
    
    .nav-buttons-left {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        
        &::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        &:hover {
          transform: translateY(-1px);
          
          &::before {
            opacity: 1;
          }
          
          i {
            color: #667eea;
          }
        }
        
        &:active {
          transform: translateY(0);
        }
        
        i {
          font-size: 20px !important;
          color: #556080;
          transition: color 0.3s ease;
          position: relative;
          z-index: 1;
        }
      }
    }
    
    .address-bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 16px;
      
      .address-bar-wrapper {
        flex: 1;
        position: relative;
        
        .address-bar {
          width: 100%;
          height: 36px;
          padding: 0 16px;
          border: 1px solid rgba(220, 225, 230, 0.6);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          color: #333;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(8px);
          
          &:focus {
            outline: none;
            border-color: #667eea;
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            transform: translateY(-1px);
          }
          
          &::placeholder {
            color: #8892a6;
          }
        }
        
        .address-bar-indicators {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
      
      .testnet-badge {
        padding: 4px 10px;
        background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
        border: 1px solid rgba(253, 203, 110, 0.4);
        border-radius: 6px;
        font-size: 12px;
        color: #8b6914;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(253, 203, 110, 0.2);
      }
    }
    
    .nav-buttons-right {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        
        &::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        &:hover {
          transform: translateY(-1px);
          
          &::before {
            opacity: 1;
          }
          
          i {
            color: #667eea;
          }
        }
        
        &:active {
          transform: translateY(0);
        }
        
        i {
          font-size: 20px !important;
          color: #556080;
          transition: color 0.3s ease;
          position: relative;
          z-index: 1;
        }
        
        .discover-icon {
          width: 20px;
          height: 20px;
        }
        
        .notification-badge,
        .cart-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
          color: white;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          box-sizing: border-box;
          box-shadow: 0 2px 4px rgba(238, 90, 82, 0.3);
          border: 2px solid white;
        }
      }
      
      .user-menu-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        border: 2px solid rgba(102, 126, 234, 0.3);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 1002; // 确保头像在最顶层
        
        &::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }
        
        // 添加头像清晰度遮罩
        &::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          
          &::before {
            opacity: 1;
          }
          
          &::after {
            opacity: 1;
          }
        }
        
        &:active {
          transform: translateY(0);
        }
      }
    }
    
    .discover-callout {
      position: absolute;
      top: 50px;
      right: 200px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(220, 225, 230, 0.6);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(100, 115, 135, 0.15);
      backdrop-filter: blur(16px);
      z-index: 1000;
      min-width: 200px;
      
      .callout-title {
        font-weight: 600;
        margin-bottom: 8px;
        color: #2d3748;
      }
      
      p {
        margin: 0;
        color: #556080;
        font-size: 14px;
        line-height: 1.5;
      }
    }
    

    
    .server-menu-dropdown,
    .tools-menu-dropdown {
      position: absolute;
      top: 48px;
      right: 280px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(220, 225, 230, 0.6);
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(100, 115, 135, 0.15);
      backdrop-filter: blur(16px);
      z-index: 999;
      min-width: 200px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
    }
  }
  
  .nav-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(45, 55, 72, 0.15);
    backdrop-filter: blur(2px);
    z-index: 999; // 提高overlay的层级，但仍低于菜单
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    pointer-events: none; // 隐藏时不接收点击
    
    &.open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto; // 显示时接收点击
    }
  }
  
  &.notNavigable {
    .nav-btn,
    .address-bar,
    .user-menu-btn {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
  }
}
</style>

<!-- Element Plus 下拉菜单自定义样式 -->
<style lang="scss">
// Element Plus Dropdown 自定义样式
.user-menu-popper {
  .el-dropdown-menu {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(220, 225, 230, 0.6);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(100, 115, 135, 0.15);
    padding: 8px 0;
    min-width: 280px;
    
    .user-info-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(220, 225, 230, 0.4);
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border-radius: 12px 12px 0 0;
      margin: -8px -0px 8px -0px;
      
      .user-name {
        font-weight: 600;
        color: #2d3748;
        font-size: 16px;
        margin-bottom: 4px;
      }
      
      .user-id {
        font-size: 12px;
        color: #8892a6;
        font-family: monospace;
      }
    }
    
    .el-dropdown-menu__item {
      padding: 12px 20px;
      color: #556080;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 12px;
      
      i {
        font-size: 16px;
        width: 16px;
        color: #8892a6;
        transition: color 0.3s ease;
      }
      
      .server-name {
        &.connected {
          color: #10b981;
          font-weight: 600;
        }
      }
      
      &:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
        color: #667eea;
        transform: translateX(4px);
        
        i {
          color: #667eea;
        }
      }
      
      &:focus {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
        color: #667eea;
      }
      
      // 分割线样式
      &.is-divided {
        border-top: 1px solid rgba(220, 225, 230, 0.3);
        margin-top: 4px;
        padding-top: 16px;
      }
    }
  }
}

// Element Plus 通知Popover自定义样式
.notification-popover {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(220, 225, 230, 0.6) !important;
  border-radius: 12px !important;
  box-shadow: 0 12px 40px rgba(100, 115, 135, 0.15) !important;
  padding: 0 !important;
  max-height: 520px; // 设置最大高度边界
  // 移除 overflow: hidden，让内部组件处理滚动
  transform-origin: top right; // 从右上角展开
  animation: popoverFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  .el-popover__content {
    padding: 0 !important;
    border-radius: 12px;
    // 移除 overflow: hidden，让内容自然滚动
    
    .notification-popover-content {
      max-height: 520px;
      // 移除 overflow: hidden，让 NotificationsList 处理滚动
      
      // 添加淡入动画
      animation: contentSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both;
    }
  }
}

// 添加动画效果
@keyframes popoverFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes contentSlideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 深色主题适配
@media (prefers-color-scheme: dark) {
  .notification-popover {
    background: rgba(45, 55, 72, 0.95) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3) !important;
  }
}

// 移动端优化
@media (max-width: 768px) {
  .notification-popover {
    max-height: 450px;
    border-radius: 8px !important;
    
    .el-popover__content {
      border-radius: 8px;
      
      .notification-popover-content {
        max-height: 450px;
      }
    }
  }
}
</style>
