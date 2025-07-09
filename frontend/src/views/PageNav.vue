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
          
          <a class="nav-btn" @click.stop="onClickNavNotifBtn" :data-tip="ob.polyT('pageNav.toolTip.notifications')" id="Nav_Notifications">
            <i class="ion-android-notifications"></i>
            <div class="notification-badge" v-show="serverConnected && unreadNotifCount">
              {{ unreadNotifCount > 99 ? '…' : unreadNotifCount }}
            </div>
          </a>
          
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
          
          <!-- 用户菜单 -->
          <a id="user-menu-btn" class="user-menu-btn" @click.stop="navListBtnClick"
            :style="ob.getAvatarBgImage(avatarHashes || ob.avatarHashes)" :data-tip="ob.polyT('pageNav.toolTip.nav')"></a>
        </div>

        <!-- 通知下拉菜单 -->
        <div :class="`notification-dropdown ${notifContainerOpened ? 'open' : ''}`" @click.stop="onClickNotifContainer">
          <Notifications v-if="serverConnected && profileReady && notifContainerOpened" ref="notifications" @notifNavigate="closeNotifications"/>
        </div>

        <!-- 用户菜单下拉 -->
        <nav :class="`user-menu-dropdown ${navListOpened ? 'open' : ''}`" @click.stop="onNavListClick">
          <div class="user-menu-content">
            <div class="user-info">
              <a class="user-profile-link" @click="onNavListItemClick" :href="`#${ob.peerID}/home`">
                <span class="user-name">{{ ob.name }}</span>
              </a>
            </div>
            <div v-if="isApp" class="menu-section">
              <a class="menu-item server-item"
                @mouseenter="onMouseEnterConnectedServerListItem"
                @mouseleave="onMouseLeaveConnectedServerListItem">
                <span :class="`server-name ${serverConnected ? 'connected' : ''}`">{{ serverConnected ? ob.connectedServer.name : ob.polyT('pageNav.notConnectedMenuItem') }}</span>
                <span><i class="ion-arrow-right-b"></i></span>
              </a>
            </div>
            <div v-if="!isApp" class="menu-section">
              <a class="menu-item" @click="onClickWalletConnect">
                <span>{{ connectWalletMenuDisplay }}</span>
              </a>
            </div>
            <div class="menu-section">
              <a class="menu-item" @click="onNavListItemClick" :href="`#${ob.peerID}`">
                <span>{{ ob.polyT('pageNav.myPage') }}</span>
              </a>
              <a class="menu-item" @click="navCreateListingClick">
                <span>{{ ob.polyT('pageNav.createListing') }}</span>
              </a>
            </div>
            <div class="menu-section">
              <a href="#transactions/sales" class="menu-item" @click="onNavListItemClick">
                <span>{{ ob.polyT('pageNav.sales') }}</span>
              </a>
              <a href="#transactions/purchases" class="menu-item" @click="onNavListItemClick">
                <span>{{ ob.polyT('pageNav.purchases') }}</span>
              </a>
              <a href="#transactions/cases" class="menu-item" @click="onNavListItemClick">
                <span>{{ ob.polyT('pageNav.cases') }}</span>
              </a>
            </div>
            <div class="menu-section">
              <a class="menu-item" @click="navSettingsClick">
                <span>{{ ob.polyT('pageNav.settings') }}</span>
              </a>
              <a class="menu-item" @click="navHelpClick">
                <span>{{ ob.polyT('pageNav.help') }}</span>
              </a>
            </div>
            <div v-if="!isApp" class="menu-section">
              <a class="menu-item" @click="navLogoutClick">
                <span>{{ ob.polyT('pageNav.logout') }}</span>
              </a>
            </div>
          </div>
        </nav>

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
      navListOpened: false,
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

      let access = this.navListOpened;

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

    navListBtnClick (e) {
      this.closeNotifications({
        closeOverlay: false,
        closeNavList: false,
      });
      this.toggleNavMenu();
    },

    toggleNavMenu () {
      const isOpen = this.navListOpened;
      this.navListOpened = !isOpen;
      this.navOverlayOpened = !isOpen;

      if (!isOpen) {
        this.connManagementContainerOpened = false;
        recordEvent('NavClick', { target: 'navMenuOpen' });
      }
    },

    closeNavMenu () {
      this.navListOpened = false;
      this.navOverlayOpened = false;

      this.connManagementContainerOpened = false;
    },

    onNavListClick (e) {
    },

    onClickNavNotifBtn () {
      this.navListOpened = false;
      this.connManagementContainerOpened = false;
      this.toggleNotifications();
    },

    toggleNotifications () {
      if (this.notifContainerOpened) {
        this.closeNotifications();
        this.navOverlayOpened = false;
      } else {
        this.navOverlayOpened = true;
        recordEvent('NavClick', { target: 'notificationsOpen' });

        this.notifContainerOpened = true;
      }
    },

    onClickNotifContainer () {
    },

    closeNotifications (options) {
      const opts = {
        closeOverlay: true,
        closeNavList: true,
        ...options,
      };

      if (!this.notifContainerOpened) return;
      if (opts.closeNavList) this.navListOpened = false;
      this.notifContainerOpened = false;
      if (opts.closeOverlay) this.navOverlayOpened = false;

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
      this.closeNotifications();
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
    background: #ffffff;
    gap: 8px;
    
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
        border-radius: 6px;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: rgba(0, 0, 0, 0.05);
          text-decoration: none;
        }
        
        &:active {
          background: rgba(0, 0, 0, 0.1);
        }
        
        i {
          font-size: 20px !important;
          color: #666;
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
          border: 1px solid #e0e0e0;
          border-radius: 18px;
          background: #f8f9fa;
          font-size: 14px;
          color: #333;
          transition: all 0.2s ease;
          
          &:focus {
            outline: none;
            border-color: #007bff;
            background: #ffffff;
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
          }
          
          &::placeholder {
            color: #999;
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
        padding: 4px 8px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        font-size: 12px;
        color: #856404;
        font-weight: 500;
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
        border-radius: 6px;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        
        &:hover {
          background: rgba(0, 0, 0, 0.05);
          text-decoration: none;
        }
        
        &:active {
          background: rgba(0, 0, 0, 0.1);
        }
        
        i {
          font-size: 20px !important;
          color: #666;
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
          background: #ff4757;
          color: white;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          box-sizing: border-box;
        }
      }
      
      .user-menu-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        border: 2px solid #e0e0e0;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
        }
      }
    }
    
    .discover-callout {
      position: absolute;
      top: 50px;
      right: 200px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      min-width: 200px;
      
      .callout-title {
        font-weight: 600;
        margin-bottom: 8px;
        color: #333;
      }
      
      p {
        margin: 0;
        color: #666;
        font-size: 14px;
        line-height: 1.4;
      }
    }
    
    .notification-dropdown {
      position: absolute;
      top: 48px;
      right: 100px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      width: 420px;
      max-height: 400px;
      overflow-y: auto;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      
      &.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
    }
    
    .user-menu-dropdown {
      position: absolute;
      top: 48px;
      right: 0;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      min-width: 280px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      
      &.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      
      .user-menu-content {
        padding: 8px 0;
        
        .user-info {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          
          .user-profile-link {
            display: block;
            text-decoration: none;
            
            .user-name {
              font-weight: 600;
              color: #333;
              font-size: 16px;
            }
          }
        }
        
        .menu-section {
          border-bottom: 1px solid #f0f0f0;
          
          &:last-child {
            border-bottom: none;
          }
          
          .menu-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            color: #333;
            text-decoration: none;
            transition: background 0.2s ease;
            font-size: 14px;
            
            &:hover {
              background: #f8f9fa;
              text-decoration: none;
            }
            
            &.server-item {
              position: relative;
              
              .server-name {
                &.connected {
                  font-weight: 600;
                  color: #28a745;
                }
              }
            }
            
            i {
              color: #999;
              font-size: 16px;
            }
          }
        }
      }
    }
    
    .server-menu-dropdown,
    .tools-menu-dropdown {
      position: absolute;
      top: 48px;
      right: 280px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 999;
      min-width: 200px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      
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
    background: rgba(0, 0, 0, 0.1);
    z-index: 998;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    
    &.open {
      opacity: 1;
      visibility: visible;
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
