<template>
  <div
    :class="`pageNav ${!navigable ? 'notNavigable' : ''} ${torIndicatorOn ? 'torIndicatorOn' : ''} ${isDesktopApp ? 'desktop-app' : ''}`"
    @click="onDocClick">
    <header>
      <nav class="browser-toolbar">
        <!-- 左侧导航按钮组 -->
        <div class="nav-buttons-left">
          <!-- 桌面端：传统的左侧导航按钮 -->
          <template v-if="isDesktopApp">
            <a class="nav-btn" @click="navBackClick" :data-tip="ob.polyT('pageNav.toolTip.back')">
            <i class="ion-chevron-left"></i>
          </a>
            <a class="nav-btn" @click="navFwdClick" :data-tip="ob.polyT('pageNav.toolTip.forward')">
            <i class="ion-chevron-right"></i>
          </a>
            <a class="nav-btn" @click="navReload" :data-tip="ob.polyT('pageNav.toolTip.refresh')" id="Nav_Refresh">
            <i class="ion-refresh"></i>
            </a>
          </template>
          
          <!-- 非桌面端：只保留Home按钮 -->
          <a v-if="!isDesktopApp" class="nav-btn home-btn" @click="navHomeClick" :data-tip="ob.polyT('pageNav.toolTip.home')">
            <i class="ion-home"></i>
          </a>
        </div>

        <!-- 中间地址栏区域 -->
        <div class="address-bar-container" v-if="isDesktopApp">
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
          <!-- 搜索/发现按钮 -->
          <el-tooltip 
            :content="ob.polyT('pageNav.toolTip.discover')" 
            placement="bottom" 
            :show-arrow="false"
            popper-class="nav-tooltip">
            <a class="nav-btn" @click="navDiscoverClick" id="Nav_Discover">
              <i class="ion-search"></i>
            </a>
          </el-tooltip>
          
          <template v-if="showDiscoverCallout">
            <div class="discover-callout">
              <div class="callout-title">{{ ob.polyT('pageNav.discoverCalloutTitle') }}</div>
              <p>{{ ob.polyT('pageNav.discoverCalloutBody') }}</p>
            </div>
          </template>
          
          <!-- 支付方式按钮 -->
          <el-tooltip 
            :content="ob.polyT('pageNav.toolTip.paymentMethods')" 
            placement="bottom" 
            :show-arrow="false"
            popper-class="nav-tooltip">
            <a class="nav-btn" @click="navPaymentMethodsClick" id="Nav_PaymentMethods">
              <i class="ion-card"></i>
            </a>
          </el-tooltip>
          
          <!-- 通知按钮 -->
          <el-popover 
            placement="bottom-end" 
            :width="420" 
            trigger="click"
            popper-class="notification-popover"
            :show-arrow="false"
            v-model:visible="notifContainerOpened">
            <template #reference>
              <a class="nav-btn" id="Nav_Notifications" 
                 :title="ob.polyT('pageNav.toolTip.notifications')">
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
          
          <!-- 购物车按钮 -->
          <el-tooltip 
            :content="ob.polyT('pageNav.toolTip.shoppingCart')" 
            placement="bottom" 
            :show-arrow="false"
            popper-class="nav-tooltip">
            <a class="nav-btn" @click="onClickShoppingCartBtn" id="Nav_ShoppingCart">
              <i class="ion-android-cart"></i>
              <div class="cart-badge" v-show="serverConnected && cartItemsCount">
                {{ cartItemsCount > 99 ? '…' : cartItemsCount }}
              </div>
            </a>
          </el-tooltip>
          
          <!-- 非桌面端登录按钮 -->
          <el-tooltip 
            v-if="!isDesktopApp && !isLoggedIn()"
            :content="ob.polyT('pageNav.toolTip.login')" 
            placement="bottom" 
            :show-arrow="false"
            popper-class="nav-tooltip">
            <a class="nav-btn login-btn" @click="navLoginClick">
              <i class="ion-log-in"></i>
            </a>
          </el-tooltip>
          
          <!-- Element Plus 用户菜单 - 仅在桌面端或已登录时显示 -->
          <el-dropdown 
            v-if="isDesktopApp || isLoggedIn()"
            trigger="click" 
            placement="bottom-end"
            popper-class="user-menu-popper"
            @command="handleCommand">
            <div 
              id="user-menu-btn" 
              class="user-menu-btn"
              :style="ob.getAvatarBgImage(avatarHashes || ob.avatarHashes)"
              :title="ob.polyT('pageNav.toolTip.nav')">
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
      <ReceivingAccountsModal v-if="showReceivingAccountsModal" @close="closeReceivingAccountsModal" />
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
import ReceivingAccountsModal from './modals/ReceivingAccountsModal.vue';

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
    ReceivingAccountsModal,
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

      showReceivingAccountsModal: false,

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
      recordEvent('NavClick', { target: 'home' });
      // 导航到SmartHome页面
      this.$router.push('/smart-home');
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
          app.router.navigate(`${this.ob.peerID}/store`, { trigger: true });
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

    closeReceivingAccountsModal() {
      this.showReceivingAccountsModal = false;
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

    navDiscoverClick () {
      recordEvent('NavClick', { target: 'discover' });
      // 导航到搜索页面
      this.$router.push('/search');
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

    isLoggedIn() {
      return casdoor.isLoggedIn();
    },

    navLoginClick() {
      window.location.href = casdoor.getSigninUrl();
    },

    navPaymentMethodsClick() {
      recordEvent('NavClick', { target: 'paymentMethodsOpen' });
      this.showReceivingAccountsModal = true;
    },

    navDiscoverClick() {
      recordEvent('NavClick', { target: 'discoverOpen' });
      this.$router.push('/search');
    }
  }
}
</script>

<style lang="scss" scoped>

// 简化的现代化导航栏样式
.pageNav {
  .browser-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
      order: 1;
      
      .nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(220, 225, 230, 0.3);
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
        
        &.home-btn {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.12));
          border-color: rgba(102, 126, 234, 0.3);
          
          i {
            color: #667eea;
          }
          
          &:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.18), rgba(118, 75, 162, 0.18));
            border-color: rgba(102, 126, 234, 0.4);
          }
        }
      }
    }
    
    .address-bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 16px;
      order: 2;
      
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
          backdrop-filter: blur(8px);
          font-size: 14px;
          color: #333;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          
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
        backdrop-filter: blur(8px);
      }
    }
    
    .nav-buttons-right {
      display: flex;
      align-items: center;
      gap: 4px;
      order: 3;
      
      .nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(220, 225, 230, 0.3);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        
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
          backdrop-filter: blur(8px);
        }
        

      }
      
      .user-menu-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        border: 2px solid rgba(220, 225, 230, 0.4);
        backdrop-filter: blur(8px);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        
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
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
          border-color: rgba(102, 126, 234, 0.4);
          
          &::before {
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
    z-index: 999;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    pointer-events: none;
    
    &.open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
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
  
  // 非桌面端特殊样式
  &:not(.desktop-app) {
    .browser-toolbar {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafb 100%);
      border-bottom: 1px solid rgba(220, 225, 230, 0.6);
      backdrop-filter: blur(16px);
      
      .nav-buttons-left {
        .nav-btn.home-btn {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
          border-color: rgba(102, 126, 234, 0.4);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
          
          i {
            color: #667eea;
          }
          
          &:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.25), rgba(118, 75, 162, 0.25));
            border-color: rgba(102, 126, 234, 0.5);
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
          }
        }
      }
      

      .discover-callout {
        right: 80px;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(220, 225, 230, 0.4);
        box-shadow: 0 12px 32px rgba(100, 115, 135, 0.2);
      }
    }
  }
  
  // 响应式样式
  @media (max-width: 1024px) {
    .browser-toolbar {
      padding: 0 12px;
      height: 56px;
      
      .nav-buttons-left,
      .nav-buttons-right {
        gap: 8px;
        
        .nav-btn {
          width: 40px;
          height: 40px;
          
          i {
            font-size: 22px;
          }
        }
      }
      
      .user-menu-btn {
        width: 40px;
        height: 40px;
      }
    }
  }

  @media (max-width: 768px) {
    .browser-toolbar {
      padding: 0 8px;
      height: 52px;
      
      .nav-buttons-left,
      .nav-buttons-right {
        gap: 4px;
        
        .nav-btn {
          width: 36px;
          height: 36px;
          
          i {
            font-size: 20px;
          }
          
          .notification-badge,
          .cart-badge {
            min-width: 16px;
            height: 16px;
            font-size: 10px;
          }
        }
      }
      
      .user-menu-btn {
        width: 36px;
        height: 36px;
      }
    }
  }
}
</style>

<!-- 添加全局样式来确保tooltip正确显示 -->
<style>
/* Element Plus tooltip 样式优化 */
.nav-tooltip {
  z-index: 9999 !important;
  
  .el-tooltip__popper {
    background: rgba(45, 55, 72, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 500;
    color: white;
    max-width: 200px;
    word-wrap: break-word;
    
    &[data-popper-placement^="bottom"] {
      margin-top: 8px;
    }
    
    &[data-popper-placement^="top"] {
      margin-bottom: 8px;
    }
    
    &[data-popper-placement^="left"] {
      margin-right: 8px;
    }
    
    &[data-popper-placement^="right"] {
      margin-left: 8px;
    }
  }
}


/* 响应式tooltip调整 */
@media (max-width: 768px) {
  .nav-tooltip {
    .el-tooltip__popper {
      font-size: 11px;
      padding: 6px 10px;
      max-width: 150px;
    }
  }
}
</style>
