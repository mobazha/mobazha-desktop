<template>
  <!-- <div v-if="showFullNav" -->
  <div
    :class="`pageNav ${!navigable ? 'notNavigable' : ''} ${torIndicatorOn ? 'torIndicatorOn' : ''} ${windowStyle === 'mac' ? 'macStyleWindowControls' : 'winStyleWindowControls'}`"
    @click="onDocClick">
    <header>
      <nav class="bar clrBr clrP navBar">
        <div class="flexVCent">
          <div class="windowControlsHolder" v-show="showFullNav">
            <div class="windowControls">
              <a class="winControl navClose" @click="navCloseClick">
                <i class="ion-ios-close-empty"></i>
              </a>
              <a class="winControl navMin" @click="navMinClick">
                <i class="ion-ios-minus-empty"></i>
              </a>
              <a class="winControl navMax" @click="navMaxClick">
                <i class="ion-ios-plus-empty"></i>
              </a>
            </div>
          </div>
          <div>
            <div class="flexVCent iconPad">
              <a v-if="!showFullNav" class="iconBtn  toolTipNoWrap" @click="navHomeClick" :data-tip="ob.polyT('pageNav.toolTip.home')">
                <i class="ion-home"></i>
              </a>
              <a class="iconBtn  toolTipNoWrap" @click="navBackClick" :data-tip="ob.polyT('pageNav.toolTip.back')">
                <i class="ion-chevron-left"></i>
              </a>
              <a class="iconBtn  toolTipNoWrap" @click="navFwdClick" :data-tip="ob.polyT('pageNav.toolTip.forward')">
                <i class="ion-chevron-right"></i>
              </a>
              <a class="iconBtn  toolTipNoWrap" @click="navReload" :data-tip="ob.polyT('pageNav.toolTip.refresh')" id="Nav_Refresh">
                <i class="ion-refresh"></i>
              </a>
              <a v-if="!showFullNav" class="navBtn toolTipNoWrap " @click="onClickShoppingCartBtn"
                :data-tip="ob.polyT('pageNav.toolTip.shoppingCart')" id="Nav_ShoppingCart0">
                <i class="iconBtn ion-android-cart"></i>
                <div
                  :class="`discTn notifUnreadBadge js-cartItemsCountBadge clrE1 clrTOnEmph clrBr2 clrSh2 ${cartItemsCount > 99 ? 'ellipsisShown' : ''}`"
                  v-show="serverConnected && cartItemsCount">
                  {{ cartItemsCount > 99 ? '…' : cartItemsCount }}
                </div>
              </a>
              <a v-if="!showFullNav" class="iconBtn toolTipNoWrap" @click="navLoginClick" :data-tip="ob.polyT('pageNav.toolTip.login')">
                <i class="ion-log-in"></i>
              </a>
            </div>
          </div>
          <div class="rowDivV clrBrBk"></div>
          <div class="pageNavCenter" v-show="showFullNav">
            <div class="flexVCent gutterHSm">
              <div class="searchWrapper">
                <input type="text" class="js-addressBar flexExpand addressBar clrSh2 clrBr4"
                  ref="addressBar"
                  @keyup.enter="onKeyupAddressBar"
                  v-model.trim="addressBarText"
                  @focusin="onFocusInAddressBar"
                  :placeholder="ob.polyT('addressBarPlaceholder')" />
                <div class="js-addressBarIndicatorsContainer">
                  <AddressBarIndicators ref="addressBarIndicators" />
                </div>
              </div>
              <template v-if="ob.testnet">
                <div id="testnetFlag" class="btn barBtn normalBtn clrP clrBr">
                  <span class="toolTip" :data-tip="ob.polyT('testnetTooltip')">{{ ob.polyT('testnet') }}</span>
                </div>
              </template>
            </div>
          </div>
          <div class="rowDivV clrBrBk"></div>
          <div v-show="showFullNav">
            <div class="flexVCent box margLSm posR">
              <a href="#search" class="toolTipNoWrap js-discover" :data-tip="ob.polyT('pageNav.toolTip.discover')" id="Nav_Discover">
                <img class="discoverBtn navBtn" src="~@/../imgs/obVectorIconSmall2.png" />
              </a>
              <template v-if="showDiscoverCallout">
                <div class="discoverCallout js-discoverCallout arrowBoxTop confirmBox clrP clrSh1 clrBr">
                  <div class="tx3 txB rowSm">{{ ob.polyT('pageNav.discoverCalloutTitle') }}</div>
                  <p>{{ ob.polyT('pageNav.discoverCalloutBody') }}</p>
                </div>
              </template>
              <a class="navBtn toolTipNoWrap" @click="navWalletClick" :data-tip="ob.polyT('pageNav.toolTip.wallet')"
                id="Nav_Wallet">
                <div class="iconBtn navWalletBtn">
                  <WalletIcon />
                </div>
              </a>
              <a class="navBtn toolTipNoWrap" @click.stop="onClickNavNotifBtn"
                :data-tip="ob.polyT('pageNav.toolTip.notifications')" id="Nav_Notifications">
                <i class="iconBtn ion-android-notifications"></i>
                <div
                  :class="`discTn notifUnreadBadge js-notifUnreadBadge clrE1 clrTOnEmph clrBr2 clrSh2 ${unreadNotifCount > 99 ? 'ellipsisShown' : ''}`"
                  v-show="serverConnected && unreadNotifCount">
                  {{ unreadNotifCount > 99 ? '…' : unreadNotifCount }}
                </div>
              </a>
              <a class="navBtn toolTipNoWrap " @click="onClickShoppingCartBtn"
                :data-tip="ob.polyT('pageNav.toolTip.shoppingCart')" id="Nav_ShoppingCart">
                <i class="iconBtn ion-android-cart"></i>
                <div
                  :class="`discTn notifUnreadBadge js-cartItemsCountBadge clrE1 clrTOnEmph clrBr2 clrSh2 ${cartItemsCount > 99 ? 'ellipsisShown' : ''}`"
                  v-show="serverConnected && cartItemsCount">
                  {{ cartItemsCount > 99 ? '…' : cartItemsCount }}
                </div>
              </a>
              <div :class="`js-notifContainer notifContainer foldDown ${notifContainerOpened ? 'open' : ''}`" @click.stop="onClickNotifContainer">
                <Notifications v-if="serverConnected && profileReady && notifContainerOpened" ref="notifications" @notifNavigate="closeNotifications"/>
              </div>
              <a id="AvatarBtn" class="discSm clrBr2 clrSh1 navListBtn toolTipNoWrap" @click.stop="navListBtnClick"
                :style="ob.getAvatarBgImage(avatarHashes || ob.avatarHashes)" :data-tip="ob.polyT('pageNav.toolTip.nav')"></a>
              <nav :class="`navListWrapper foldDown js-navList ${navListOpened ? 'open' : ''}`" @click.stop="onNavListClick">
                <div class="navList clrBr listBox clrP clrSh1">
                  <div class="listGroup clrP clrBr">
                    <a class="listItem js-navListItem" @click="onNavListItemClick" :href="`#${ob.peerID}/home`">
                      <span class="txB tx4 noOverflow">{{ ob.name }}</span>
                    </a>
                  </div>
                  <div v-if="isApp" class="listGroup clrP clrBr">
                    <a class="listItem connectedServerListItem"
                      @mouseenter="onMouseEnterConnectedServerListItem"
                      @mouseleave="onMouseLeaveConnectedServerListItem">
                      <span :class="`noOverflow js-connectedServerName ${serverConnected ? 'txB' : ''}`">{{ serverConnected ? ob.connectedServer.name : ob.polyT('pageNav.notConnectedMenuItem') }}</span>
                      <span><i class="ion-arrow-right-b floR"></i></span>
                    </a>
                  </div>
                  <div v-if="!isApp" class="listGroup clrP clrBr">
                    <a class="listItem js-navListItem" @click="onClickWalletConnect">
                      <span>{{ connectWalletMenuDisplay }}</span><span class="clrT2 TODO">Cltrl + ?</span>
                    </a>
                  </div>
                  <div class="listGroup clrP clrBr">
                    <a class="listItem js-navListItem" @click="onNavListItemClick" :href="`#${ob.peerID}`">
                      <span>{{ ob.polyT('pageNav.myPage') }}</span><span class="clrT2 TODO">Cltrl + ?</span>
                    </a>
                    <a class="listItem js-navListItem TODO" @click="onNavListItemClick"><!--TODO add route for Page Customization-->
                      <span>{{ ob.polyT('pageNav.customizePage') }}</span><span class="clrT2 TODO">Cltrl + ?</span>
                    </a>
                    <a class="listItem js-navListItem" @click="navCreateListingClick">
                      <span>{{ ob.polyT('pageNav.createListing') }}</span><span class="clrT2 TODO">Cltrl + ?</span>
                    </a>
                    <!-- <a class="listItem js-navListItem"
                      @mouseenter="onMouseEnterToolsItem"
                      @mouseleave="onMouseLeaveToolsItem">
                      <span>{{ ob.polyT('pageNav.tools') }}</span>
                      <span><i class="ion-arrow-right-b floR"></i></span>
                    </a> -->
                  </div>
                  <div class="listGroup clrP clrBr">
                    <a href="#transactions/sales" class="listItem js-navListItem" @click="onNavListItemClick">
                      <span>{{ ob.polyT('pageNav.sales') }}</span><span class="clrT2 TODO">Cltrl + ?</span>
                    </a>
                    <a href="#transactions/purchases" class="listItem js-navListItem" @click="onNavListItemClick">
                      <span>{{ ob.polyT('pageNav.purchases') }}</span><span class="clrT2 TODO">Cltrl + ?</span>
                    </a>
                    <a href="#transactions/cases" class="listItem js-navListItem" @click="onNavListItemClick">
                      <span>{{ ob.polyT('pageNav.cases') }}</span><span class="clrT2 TODO">Cltrl + ?</span>
                    </a>
                  </div>
                  <div class="listGroup clrP clrBr">
                    <a class="listItem js-navListItem" @click="navSettingsClick">
                      <span>{{ ob.polyT('pageNav.settings') }}</span><span class="clrT2 TODO">Cltrl + ?</span>
                    </a>
                    <a class="listItem js-navListItem" @click="navHelpClick">
                      <span>{{ ob.polyT('pageNav.help') }}</span><span class="clrT2 TODO">Cltrl + ?</span>
                    </a>
                  </div>
                  <div v-if="!isApp" class="listGroup clrP clrBr">
                    <a class="listItem js-navListItem" @click="navLogoutClick">
                      <span>{{ ob.polyT('pageNav.logout') }}</span><span class="clrT2 TODO">Cltrl + ?</span>
                    </a>
                  </div>
                  <!-- <div class="listGroup clrP clrBr">
                <a class="listItem js-navAboutModal" @click="navAboutClick">
                  <span>{{ ob.polyT( 'about.linkText' ) }}</span>
                </a>
              </div> -->
                </div>
              </nav>
              <nav :class="`connManagementContainer foldDown clrSh1 js-connManagementContainer ${connManagementContainerOpened ? 'open' : ''}`"
                @mouseenter="onMouseEnterConnManagementContainer"
                @mouseleave="onMouseLeaveConnManagementContainer">
                <PageNavServersMenu
                :bb="function() {
                    return {
                      collection: app.serverConfigs,
                    };
                  }" />
              </nav>
              <nav :class="`connManagementContainer foldDown clrSh1 ${toolsContainerOpened ? 'open' : ''}`"
                @mouseenter="onMouseEnterToolsContainer"
                @mouseleave="onMouseLeaveToolsContainer">
                <PageNavToolsMenu @onWooImporterClick="onWooImporterClick" />
              </nav>
            </div>
          </div>
        </div>
      </nav>
    </header>
    <div :class="`navOverlay modal js-navOverlay ${navOverlayOpened ? 'open' :'' }`"></div>
    <Teleport v-if="navigable" to="#js-vueModal">
      <Settings v-show="showSettings" @close="closeSettings" />

      <WooImporter v-show="showWooImporter" @close="closeWooImporter" />

      <EditListing v-if="showEditListing" :bb="() => {
        return {
          model: editListingModel,
        };
      }" @close="closeEditListingModal" />

      <Wallet v-if="showWallet" :bb="() => {
        return {
          walletBalances: app.walletBalances,
        };
      }" @close="closeWallet" />

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

import { useOnboard } from '@web3-onboard/vue';

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

      showWallet: false,
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

    this.onboard = useOnboard();
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

    navWalletClick () {
      recordEvent('NavClick', { target: 'walletOpen' });

      this.showWallet = true;
    },

    navLogoutClick() {
      casdoor.logout();

      casdoor.goToLink('/');
    },

    closeWallet() {
      this.showWallet = false;
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
    }
  }
}
</script>
<style lang="scss" scoped></style>
