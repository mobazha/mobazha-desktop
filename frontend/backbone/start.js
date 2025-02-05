import $ from 'jquery';
import Backbone from 'backbone';
import './lib/select2.js';
import 'trumbowyg';
import moment from 'moment';

import { ipc } from '../src/utils/ipcRenderer.js';
import './lib/whenAll.jquery';
import app from './app';
import { serverVersionRequired } from '../package.json';
import { getCurrencyByCode } from './data/currencies';
import { init as initWalletCurs } from './data/walletCurrencies';
import ServerConfig from './models/ServerConfig';
import serverConnect, {
  events as serverConnectEvents,
  getSocket,
  getCurrentConnection,
} from './utils/serverConnect';
import { myGet, myPost } from '../src/api/api';

import ObRouter from './router';
import { getChatContainer, getBody } from './utils/selectors';
import { addFeedback } from './utils/feedback';
import { addMetrics, showMetricsModal, isNewerVersion } from './utils/metrics';
import { showUpdateStatus, updateReady } from './utils/autoUpdate';
import { handleLinks } from './utils/dom';
import { persist as persistOutdatedListingHashes } from './utils/outdatedListingHashes';
import { printLog } from './utils/log.js';
import Chat from './views/chat/Chat';
import ChatHeads from './collections/ChatHeads';
import LoadingModal from './views/modals/Loading';
import StartupConnectMessaging from './views/StartupConnectMessaging';
import { openSimpleMessage } from './views/modals/SimpleMessage';
import Dialog from './views/modals/Dialog';
import StatusBar from './views/StatusBar';

import Profile from './models/profile/Profile';
import Settings from './models/settings/Settings';
import WalletBalances from './collections/wallet/Balances';
import Followers from './collections/Followers';
import { fetchExchangeRates } from './utils/currency';
import './utils/exchangeRateSyncer';
import { launchDebugLogModal, launchSettingsModal } from './utils/modalManager';
import listingDeleteHandler from './startup/listingDelete';
import { fixLinuxZoomIssue, handleServerShutdownRequests } from './startup';
import ConnectionManagement from './views/modals/connectionManagement/ConnectionManagement';
import Onboarding from './views/modals/onboarding/Onboarding';
import SearchProvidersCol from './collections/search/SearchProviders';
import defaultSearchProviders from './data/defaultSearchProviders';
import VerifiedMods from './collections/VerifiedMods';
import VerifiedModsError from './views/modals/VerifiedModsFetchError';

import MyChatSDK from '../src/TUIKit/myChatSDK';

import * as casdoor from '../src/utils/casdoor';

fixLinuxZoomIssue();
handleServerShutdownRequests();

$(document).ready(() => {
  $.noConflict();
  
  if ($.trumbowyg) {
    $.trumbowyg.svgPath = '../node_modules/trumbowyg/dist/ui/icons.svg';
  }
});

app.localSettings.on('change:language', (localSettings, lang) => {
  moment.locale(lang);

  const restartLangChangeDialog = new Dialog({
    title: app.polyglot.t('langChangeRestartTitle'),
    message: app.polyglot.t('langChangeRestartMessage'),
    buttons: [{
      text: app.polyglot.t('restartLater'),
      fragment: 'restartLater',
    }, {
      text: app.polyglot.t('restartNow'),
      fragment: 'restartNow',
    }],
  }).on('click-restartNow', () => location.reload())
    .on('click-restartLater', () => restartLangChangeDialog.close())
    .render()
    .open();
});

// window.addEventListener('contextmenu', (e) => {
//   e.preventDefault();
//   ipc.send('contextmenu-click');
// }, false);


// MyChatSDK.emit(window.TUIKit.TIM.EVENT.SDK_READY, {});

app.pageNav = window.vueApp.$refs.pageNav;

let externalRoute = ipc.sendSync('controller.system.getGlobal', 'externalRoute');

app.router = new ObRouter();

// Clear the external route flag as soon as it's used so it's not re-used
// on app refreshes.
app.router.on('route', () => { externalRoute = null; });

// create our status bar view
app.statusBar = new StatusBar();
$('#statusBar').html(app.statusBar.render().el);

const startupConnectMessaging = new StartupConnectMessaging();

// Create loading modal, which is a shared instance used throughout the app
app.loadingModal = new LoadingModal({
  dismissOnOverlayClick: false,
  dismissOnEscPress: false,
  showCloseButton: false,
  removeOnRoute: false,
}).render().open(startupConnectMessaging);

handleLinks(document);

// add the feedback mechanism
// addFeedback();

app.verifiedMods = new VerifiedMods();

const fetchStartupData1Deferred = $.Deferred();
let configFetch;
let walletCurDefFetch;

function fetchStartupData1() {
  configFetch = !configFetch || configFetch.state() === 'rejected'
    ? myGet(app.getServerUrl('ob/config')) : configFetch;
  walletCurDefFetch = !walletCurDefFetch || walletCurDefFetch.state() === 'rejected'
    ? myGet(app.getServerUrl('wallet/currencies')) : walletCurDefFetch;

  const fetches = [
    configFetch,
    walletCurDefFetch,
  ];

  $.whenAll(fetches.slice())
    .done((...args) => {
      fetchStartupData1Deferred.resolve({
        serverConfig: args[0][0],
        walletCurDef: args[1][0],
      });
    })
    .fail(() => {
      const curConn = getCurrentConnection();

      if (!curConn || curConn.status !== 'connected') {
        // the connection management modal should be up with relevant info
        console.error('The tier 1 startup data fetches failed. Looks like the connection to the '
          + 'server was lost.');
        return;
      }

      const failed = fetches.filter((xhr) => xhr.state() === 'rejected');

      if (failed.length) {
        const firstFailedXhr = failed[0];
        let title = '';
        const message = (firstFailedXhr.responseJSON && firstFailedXhr.responseJSON.reason)
          || firstFailedXhr.status || '';
        const btnText = app.polyglot.t('startUp.dialogs.btnManageConnections');
        const btnFrag = 'manageConnections';

        if (configFetch.state() === 'rejected') {
          title = app.polyglot.t('startUp.dialogs.retryConfig.title');
        } else {
          title = app.polyglot.t('startUp.dialogs.unableToGetWalletCurDef.title');
        }

        const retryFetchStartupData1Dialog = new Dialog({
          title,
          message,
          buttons: [
            {
              text: app.polyglot.t('startUp.dialogs.btnRetry'),
              fragment: 'retry',
            },
            {
              text: btnText,
              fragment: btnFrag,
            },
          ],
          dismissOnOverlayClick: false,
          dismissOnEscPress: false,
          showCloseButton: false,
        }).on('click-retry', () => {
          retryFetchStartupData1Dialog.close();

          // slight of hand to ensure the loading modal has a chance to at
          // least briefly show before another potential failure
          setTimeout(() => fetchStartupData1(), 300);
        }).on('click-manageConnections', () => app.connectionManagmentModal.open())
          .render()
          .open();
      }
    });

  return fetchStartupData1Deferred.promise();
}

const onboardingNeededDeferred = $.Deferred();
let profileFetch;
let settingsFetch;
let onboardProfile = false;
let onboardSettings = false;
let profileFailed;
let settingsFailed;

function isOnboardingNeeded() {
  profileFetch = !profileFetch || profileFailed
    ? app.profile.fetch() : profileFetch;
  settingsFetch = !settingsFetch || settingsFailed
    ? app.settings.fetch() : settingsFetch;

  const fetches = [profileFetch, settingsFetch];

  $.whenAll(fetches.slice())
    .progress((...args) => {
      const state = args[1];

      if (state !== 'success') {
        const jqXhr = args[0];

        if (jqXhr === profileFetch || jqXhr === profileFetch.xhr) {
          if (jqXhr.status === 404) {
            onboardProfile = true;
            profileFailed = false;
          } else {
            profileFailed = true;
          }
        } else if (jqXhr === settingsFetch || jqXhr === settingsFetch.xhr) {
          if (jqXhr.status === 404) {
            onboardSettings = true;
            settingsFailed = false;
          } else {
            settingsFailed = true;
          }
        }
      }
    })
    .done(() => {
      onboardingNeededDeferred.resolve(false);
    })
    .fail(() => {
      const jqXhr = fetches.find(
        (fetch) => fetch.state() === 'rejected',
      );

      if (profileFailed || settingsFailed) {
        const retryOnboardingModelsDialog = new Dialog({
          title: app.polyglot.t('startUp.dialogs.retryOnboardingFetch.title'),
          message: (jqXhr.responseJSON && jqXhr.responseJSON.reason) || '',
          buttons: [
            {
              text: app.polyglot.t('startUp.dialogs.btnRetry'),
              fragment: 'retry',
            },
            {
              text: app.polyglot.t('startUp.dialogs.btnManageConnections'),
              fragment: 'manageConnections',
            },
          ],
          dismissOnOverlayClick: false,
          dismissOnEscPress: false,
          showCloseButton: false,
        }).on('click-retry', () => {
          retryOnboardingModelsDialog.close();

          // slight of hand to ensure the loading modal has a chance to at
          // least briefly show before another potential failure
          setTimeout(() => {
            isOnboardingNeeded();
          }, 300);
        }).on('click-manageConnections', () => app.connectionManagmentModal.open())
          .render()
          .open();
      } else if (onboardProfile || onboardSettings) {
        onboardingNeededDeferred.resolve(true);
      }
    });

  return onboardingNeededDeferred.promise();
}

const onboardDeferred = $.Deferred();

function onboard() {
  const onboarding = new Onboarding()
    .render()
    .open();

  onboarding.on('onboarding-complete', () => {
    location.hash = `${app.profile.id}`;
    onboardDeferred.resolve();
    onboarding.remove();
  });

  return onboardDeferred.promise();
}

let verifiedModsErrorDialog;

function fetchVerifiedMods() {
  return app.verifiedMods.fetch()
    .done(() => {
      if (verifiedModsErrorDialog) verifiedModsErrorDialog.close();
    })
    .fail((jqXhr) => {
      const state = {
        fetching: false,
        reason: (jqXhr && jqXhr.responseJSON && jqXhr.responseJSON.reason) || jqXhr.status,
      };
      if (verifiedModsErrorDialog) {
        verifiedModsErrorDialog
          .setState(state)
          .open();
      } else {
        verifiedModsErrorDialog = new VerifiedModsError({ initialState: state });
        verifiedModsErrorDialog.on('modal-will-remove', () => {
          verifiedModsErrorDialog = null;
        });
        verifiedModsErrorDialog.on('retry', () => {
          verifiedModsErrorDialog.setState({ fetching: true });
          fetchVerifiedMods();
        });
        verifiedModsErrorDialog.render().open();
      }
    });
}

const fetchStartupData2Deferred = $.Deferred();
let ownFollowingFetch;
let exchangeRatesFetch;
let walletBalancesFetch;
let searchProvidersFetch;

function fetchStartupData2() {
  ownFollowingFetch = !ownFollowingFetch || ownFollowingFetch.state() === 'rejected'
    ? app.ownFollowing.fetch() : ownFollowingFetch;
  exchangeRatesFetch = !exchangeRatesFetch || exchangeRatesFetch.state() === 'rejected'
    ? fetchExchangeRates() : exchangeRatesFetch;
  walletBalancesFetch = !walletBalancesFetch || walletBalancesFetch.state() === 'rejected'
    ? app.walletBalances.fetch() : walletBalancesFetch;
  searchProvidersFetch = !searchProvidersFetch || searchProvidersFetch.state() === 'rejected'
    ? app.searchProviders.fetch() : searchProvidersFetch;

  const fetches = [
    ownFollowingFetch,
    exchangeRatesFetch,
    walletBalancesFetch,
    searchProvidersFetch,
  ];

  $.whenAll(fetches.slice())
    .done(() => {
      fetchStartupData2Deferred.resolve();
    })
    .fail(() => {
      const curConn = getCurrentConnection();

      if (!curConn || curConn.status !== 'connected') {
        // the connection management modal should be up with relevant info
        console.error('The tier 2 startup data fetches failed. Looks like the connection to the '
          + 'server was lost.');
        return;
      }

      // Find any that failed aside from the exchangeRateFetch. We don't care if the
      // exchange rate fetch failed, because the exchangeRateSyncer will display a
      // status message about it and the app will gracefully handle not having exchange
      // rates.
      const failed = fetches.filter(
        (xhr) => xhr.state() === 'rejected' && xhr !== exchangeRatesFetch,
      );

      if (failed.length) {
        const firstFailedXhr = failed[0];
        let title = '';
        const message = (firstFailedXhr.responseJSON && firstFailedXhr.responseJSON.reason)
          || firstFailedXhr.status || '';
        let btnText = app.polyglot.t('startUp.dialogs.btnManageConnections');
        let btnFrag = 'manageConnections';

        if (ownFollowingFetch.state() === 'rejected') {
          title = app.polyglot.t('startUp.dialogs.unableToGetFollowData.title');
        } else if (walletBalancesFetch.state() === 'rejected') {
          title = app.polyglot.t('startUp.dialogs.unableToGetWalletBalance.title');
        } else {
          title = app.polyglot.t('startUp.dialogs.unableToGetSearchProviders.title');
          btnText = app.polyglot.t('startUp.dialogs.unableToGetSearchProviders.btnClose');
          btnFrag = 'continue';
        }

        const retryFetchStartupData2Dialog = new Dialog({
          title,
          message,
          buttons: [
            {
              text: app.polyglot.t('startUp.dialogs.btnRetry'),
              fragment: 'retry',
            },
            {
              text: btnText,
              fragment: btnFrag,
            },
          ],
          dismissOnOverlayClick: false,
          dismissOnEscPress: false,
          showCloseButton: false,
        }).on('click-retry', () => {
          retryFetchStartupData2Dialog.close();

          // slight of hand to ensure the loading modal has a chance to at
          // least briefly show before another potential failure
          setTimeout(() => fetchStartupData2(), 300);
        }).on('click-manageConnections', () => app.connectionManagmentModal.open())
          .on('click-continue', () => {
            retryFetchStartupData2Dialog.close();
            fetchStartupData2Deferred.resolve();
          })
          .render()
          .open();
      } else {
        fetchStartupData2Deferred.resolve();
      }
    });

  return fetchStartupData2Deferred.promise();
}

const onboardIfNeededDeferred = $.Deferred();

function onboardIfNeeded() {
  isOnboardingNeeded().done((onboardingNeeded) => {
    if (onboardingNeeded) {
      // let's go onboard
      onboard().done(() => onboardIfNeededDeferred.resolve());
    } else {
      onboardIfNeededDeferred.resolve();
    }
  });

  return onboardIfNeededDeferred.promise();
}

let ensureValidSettingsCurDeferred;

function ensureValidSettingsCurrency() {
  if (!ensureValidSettingsCurDeferred) {
    ensureValidSettingsCurDeferred = $.Deferred();
  } else {
    return ensureValidSettingsCurDeferred.promise();
  }

  const settingsCur = app.settings.get('localCurrency');
  const dialogTitle = app.polyglot.t('setValidCurDialog.title');
  const settingsLink = '<button class="btnAsLink js-setCurSettings clrTEm">'
      + `${app.polyglot.t('setValidCurDialog.settingsLink')}`
      + '</button>';
  const dialogBody = (currency) => (
    app.polyglot.t('setValidCurDialog.body', {
      currency,
      settingsLink,
    })
  );

  if (!getCurrencyByCode(settingsCur)) {
    const setValidCurDialog = openSimpleMessage(
      dialogTitle,
      dialogBody(settingsCur),

      {
        dismissOnEscPress: false,
        showCloseButton: false,
      },
    );

    let settingsModal;

    const bindSetCurSettingsHandler = () => {
      setValidCurDialog.$('.js-setCurSettings')
        .on('click', () => {
          settingsModal = launchSettingsModal({ initialTab: 'General' });
        });
    };

    bindSetCurSettingsHandler();

    const onCurChange = (md, cur) => {
      if (getCurrencyByCode(cur)) {
        settingsModal.close();
        setValidCurDialog.close();
        ensureValidSettingsCurDeferred.resolve();
      } else {
        setValidCurDialog.open(dialogTitle, dialogBody(cur));
        bindSetCurSettingsHandler();
        settingsModal.close();
      }
    };

    app.settings.on('change:localCurrency', onCurChange);
  } else {
    ensureValidSettingsCurDeferred.resolve();
  }

  return ensureValidSettingsCurDeferred.promise();
}

const isBundledApp = ipc.sendSync('controller.system.getGlobal', 'isBundledApp');

// let's start our flow - do we need onboarding?,
// fetching app-wide models...
function start() {
  // This is the server config as returned by ob/config. It has nothing to do with
  // app.serverConfigs which is a collection of server configuration data related
  // to connecting with a server. The latter is stored in local storage.
  // TODO - instead of these elaborate comments explaining the distinction, perhaps rename
  // serverConfigs to serverConnectionConfigs?
  fetchStartupData1().done((data) => {
    app.serverConfig = data.serverConfig || {};
    app.profile = new Profile({ peerID: data.serverConfig.peerID });

    app.settings = new Settings();
    initWalletCurs(app.serverConfig.wallets, data.walletCurDef);
    app.walletCurDef = data.walletCurDef;

    app.ownFollowing = new Followers([], {
      type: 'following',
      peerID: app.profile.id,
    });

    app.walletBalances = new WalletBalances();
    app.searchProviders = new SearchProvidersCol();

    onboardIfNeeded().done(() => {
      fetchStartupData2().done(() => {
        ensureValidSettingsCurrency().done(() => {
          window.vueApp.initialized = true;

          const curConn = getCurrentConnection();
          if (curConn && curConn.status !== 'disconnected') {
            app.pageNav.torIndicatorOn = app.serverConfig.tor && curConn.server.get('useTor');
          }

          app.pageNav.navigable = true;
          app.pageNav.setAppProfile();
          app.loadingModal.close();

          // add the default search providers
          app.searchProviders.add(defaultSearchProviders, { at: 0 });

          if (externalRoute) {
            // handle opening the app from an an external ob link
            location.hash = `#${externalRoute}`;

            printLog({content: `root page with externalRoute: ${externalRoute}`})
          } else if (location.pathname === '/' || !location.hash || location.hash === '#/home') {
            if (!import.meta.env.VITE_APP) {
              // If we're not in the app, we'll redirect to the search page.
              location.hash = '#/search';
              printLog({content: 'root page redirecting to search'})
            } else {
              // If for some reason the route to start on is empty, we'll change it to be
              // the user's profile.
              const href = location.href.replace(/(javascript:|#).*$/, '');
              location.replace(`${href}#${app.profile.id}`);

              printLog({content: `root page with home path: ${href}#${app.profile.id}`})
            }
          } else if (curConn.server
            && curConn.server.id !== localStorage.serverIdAtLastStart) {
            // When switching servers, we'll land on the user page of the new node
            location.hash = `#${app.profile.id}`;

            printLog({content: `root page with profile id: ${href}#${app.profile.id}`})
          }

          localStorage.serverIdAtLastStart = curConn && curConn.server && curConn.server.id;

          // Metrics should only be run on bundled apps.
          if (isBundledApp) {
            const metricsOn = app.localSettings.get('shareMetrics');

            if (metricsOn === undefined || metricsOn && isNewerVersion()) {
              showMetricsModal({
                showCloseButton: false,
                dismissOnEscPress: false,
                showUndecided: true,
              })
                .on('close', () => Backbone.history.start());
            } else {
              if (metricsOn) addMetrics();
              Backbone.history.start();
            }
          } else {
            Backbone.history.start();
          }

          // load chat
          const chatConvos = new ChatHeads();

          chatConvos.once('request', (cl, xhr) => {
            xhr.always(() => app.chat.attach(getChatContainer()));
          });

          app.chat = new Chat({
            collection: chatConvos,
            $scrollContainer: getChatContainer(),
          });

          chatConvos.fetch();
          $('#chatCloseBtn').on('click', () => (app.chat.close()));

          getChatContainer()
            .on('mouseenter', () => getBody().addClass('chatHover'))
            .on('mouseleave', () => getBody().removeClass('chatHover'));

          fetchVerifiedMods();
          setInterval(() => fetchVerifiedMods(), 1000 * 60 * 60);

          // have our walletBalances collection update from the walletUpdate socket event
          const serverSocket = getSocket();

          if (serverSocket) {
            serverSocket.on('message', (e = {}) => {
              if (e.jsonData.walletUpdate) {
                app.walletBalances.set(e.jsonData.walletUpdate, { remove: false, parse: true });
              }
            });
          }

          // Make sure the client is running on a compatible version of the server.
          if (app.settings.prettyServerVer !== serverVersionRequired) {
            const cLink = `<a href="https://github.com/Mobazha/mobazha/releases">${app.polyglot.t('serverVersionWarning.clientLink')}</a>`;
            const sLink = `<a href="https://github.com/Mobazha/mobazha/releases">${app.polyglot.t('serverVersionWarning.serverLink')}</a>`;
            const message = app.polyglot.t('serverVersionWarning.message', {
              serverVersion: app.settings.prettyServerVer,
              expectedVersion: serverVersionRequired,
            });
            const body = `<p>${message}</p><p>${cLink}</p><p>${sLink}</p>`;
            openSimpleMessage(app.polyglot.t('serverVersionWarning.title'), body).$el.css('z-index', '9999999');
          }
        });
      });
    });
  });
}

function connectToServer(server = app.serverConfigs.activeServer) {
  let connectAttempt = null;

  startupConnectMessaging
    .setState({
      msg: app.polyglot.t('startUp.connectMessaging.connectAttemptMsg', {
        serverName: server.get('name'),
        cancelLink: '<a class="js-cancel">'
          + `${app.polyglot.t('startUp.connectMessaging.cancelLink')}</a>`,
      }),
    }).on('clickCancel', () => {
      connectAttempt.cancel();
      app.connectionManagmentModal.open();
      app.loadingModal.close();
    });

  connectAttempt = serverConnect(server)
    .done(() => start())
    .fail(() => {
      app.connectionManagmentModal.open();
      app.loadingModal.close();
      serverConnectEvents.once('connected', () => {
        startupConnectMessaging.setState({ msg: '' });
        app.loadingModal.open(startupConnectMessaging);
        start();
      });
    });
}

// Handle a server connection event.
let connectedAtLeastOnce = false;

serverConnectEvents.on('connected', () => {
  app.connectionManagmentModal.setModalOptions({
    dismissOnEscPress: true,
    showCloseButton: true,
  });

  if (connectedAtLeastOnce) {
    location.reload();
  } else {
    connectedAtLeastOnce = true;
    app.connectionManagmentModal.close();
    if (app.chat) app.chat.show();
  }
});

// Handle a lost connection.
serverConnectEvents.on('disconnected', () => {
  app.connectionManagmentModal.setModalOptions({
    dismissOnOverlayClick: false,
    dismissOnEscPress: false,
    showCloseButton: false,
  });

  if (app.chat) {
    app.chat.close();
    app.chat.hide();
  }

  app.pageNav.navigable = false;
  app.connectionManagmentModal.open();
});

// If we have a connection, close the Connection Management modal on a
// will-route event.
const onWillRouteCloseConnModal = () => {
  app.connectionManagmentModal.close();
}

serverConnectEvents.on('connected', () => {
  window.vueApp.$router.beforeEach((to, from, next) => {
    onWillRouteCloseConnModal();
    next();
  });
});

serverConnectEvents.on('disconnected', () => {
  const router = window.vueApp.$router;
  if (router) {
    router.beforeHooks = router.beforeHooks.filter(hook => 
      hook.toString().indexOf('onWillRouteCloseConnModal') === -1
    );
  }
});

const sendMainActiveServer = (activeServer) => {
  ipc.send('controller.mainwindow.setActiveServer', {
    ...activeServer.toJSON(),
    httpUrl: activeServer.httpUrl,
    socketUrl: activeServer.socketUrl,
    authenticate: activeServer.needsAuthentication(),
  });
};

// Alert the main process if we are changing the active server.
app.serverConfigs.on('activeServerChange', (activeServer) => sendMainActiveServer(activeServer));

function doLogin() {
  window.location.href = casdoor.getSigninUrl();
}

if (location.pathname === '/callback') {
  casdoor.signin().then((res) => {
    if (res.status === 'ok') {
      casdoor.setToken(res.data);
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect_uri');
      window.location.href = redirect ? decodeURIComponent(redirect) : '/#/search';
    } else {
      console.log(`Login failed: ${res.msg}`);
      window.location.href = '/#/search';
    }
  });
} else {
  const initApp = () => {
    // Let's create our Connection Management modal so that it's
    // available to show when needed.
    app.connectionManagmentModal = new ConnectionManagement({
      removeOnRoute: false,
      dismissOnOverlayClick: false,
      dismissOnEscPress: false,
      showCloseButton: false,
    }).render();

    // get the saved server configurations
    app.serverConfigs.fetch().done(() => {
      app.serverConfigs.migrate();

      // Web version
      if (!import.meta.env.VITE_APP) {
        if (!casdoor.isLoggedIn()) {
          const devMode = import.meta.env.DEV;
          const serverConfig = new ServerConfig({
            name: 'GatewayServer',
            id: 'gateway',
            serverIp: devMode ? 'localhost' : 'store.mobazha.org',
            SSL: !devMode,
            port: devMode ? 8080 : 443,
            webVersion: true,
            gateway: true,
            authenticate: false,
          });
          serverConfig.save();
          app.serverConfigs.reset();
          app.serverConfigs.add(serverConfig);
    
          connectToServer(serverConfig);
        } else {
          // Use API to get the socket port.
          myGet('/api/serverInfo').done((serverInfo) => {
            const devMode = import.meta.env.DEV;
            const serverConfig = new ServerConfig({
              name: 'HostingServer',
              id: 'backend',
              serverIp: devMode ? 'localhost' : 'store.mobazha.org',
              SSL: !devMode,
              port: devMode ? 8080 : 443,
              webVersion: true,
              gateway: false,
              authenticate: false,
            });
            serverConfig.save();
            app.serverConfigs.reset();
            app.serverConfigs.add(serverConfig);
      
            connectToServer(serverConfig);
          }).fail(() => {
            doLogin();
          })
        }
      } else if (!app.serverConfigs.length) {
        // no saved server configurations
        if (isBundledApp) {
          // for a bundled app, we'll create a
          // "default" one and try to connect
          const serverConfig = new ServerConfig({
            builtIn: true,
            name: app.polyglot.t('connectionManagement.builtInServerName'),
          });

          serverConfig.save({}, {
            success: (md) => {
              setTimeout(() => {
                app.serverConfigs.activeServer = app.serverConfigs.add(md);
                connectToServer();
              });
            },
          });

          if (serverConfig.validationError) {
            console.error('There was an error creating the builtIn server config:');
            console.dir(serverConfig.validationError);
          }
        } else {
          app.connectionManagmentModal.open();
          serverConnectEvents.once('connected', () => {
            app.loadingModal.open();
            start();
          });
        }
      } else {
        let { activeServer } = app.serverConfigs;

        if (activeServer) {
          sendMainActiveServer(activeServer);
        } else {
          app.serverConfigs.activeServer = app.serverConfigs.at(0);
          activeServer = app.serverConfigs.at(0);
        }

        if (activeServer.get('builtIn') && !isBundledApp) {
          // Your active server is the locally bundled server, but you're
          // not running the bundled app. You have bad data!
          activeServer.set('builtIn', false);
        }

        connectToServer();
      }
    });
  };

  // 检查是否需要登录
  if (!import.meta.env.VITE_APP && !casdoor.isLoggedIn()) {
    const currentPath = location.pathname + location.hash;
    if (currentPath === '/' || currentPath === '/#/' || currentPath === '/#/search') {
      initApp();
    } else {
      // 其他页面需要登录
      const redirect = encodeURIComponent(currentPath);
      window.location.href = casdoor.getSigninUrl() + `&redirect_uri=${redirect}`;
    }
  } else {
    initApp();
  }
}

// Clear localServer events on browser refresh.
$(window).on('beforeunload', () => {
  const localServer = ipc.sendSync('controller.system.getGlobal', 'localServer');

  if (localServer) {
    // Since on a refresh any browser variables go away,
    // we need to unbind our handlers from the localServer instance.
    // Otherwise, since that instance lives in the main process
    // and continues to live beyond a refresg, the app would crash
    // when a localServer event is triggered for any of those handlers.
    localServer.off();

    // Let the main process know we've just blown away all the handlers,
    // since some of them may be main process callbacks that the main
    // process may want to revive.
    ipc.send('renderer-cleared-local-server-events');
  }
});

// Handle 'show debug log' requests from the main process.
ipc.on('show-server-log', (event, serverLog) => {
  app.serverLog = serverLog;
  launchDebugLogModal();
});

const autoUpdateStatus = {
  error: -1,
  available: 1,
  noAvailable: 2,
  downloading: 3,
  downloaded: 4,
  checking: 5,
}

ipc.on('app.updater', (e, infoInput) => {
  const info = JSON.parse(infoInput);
  switch (info?.status) {
    case autoUpdateStatus.checking:
      showUpdateStatus(app.polyglot.t('update.checking'));
      break;
    case autoUpdateStatus.available:
      showUpdateStatus(app.polyglot.t('update.available'));
      break;
    case autoUpdateStatus.noAvailable:
      showUpdateStatus(app.polyglot.t('update.notAvailable'));
      break;
    case autoUpdateStatus.downloading:
      showUpdateStatus(info.text);
      break;
    case autoUpdateStatus.downloaded:
      updateReady(info);
      break;
    case autoUpdateStatus.error:
      showUpdateStatus(app.polyglot.t('update.error', { error: infoInput }), 'warning');
      break;
    
    default:
      break;
  }
})

// Allow main.js to send messages to the console
ipc.on('consoleMsg', (e, msg) => console.log(msg));

// manage publishing sockets
let publishingStatusMsg;
let publishingStatusMsgRemoveTimer;
let retryPublishTimeout;

function setPublishingStatus(msg) {
  if (!msg && typeof msg !== 'object') {
    throw new Error('Please provide a msg as an object.');
  }

  msg.duration = 99999999999999;
  clearTimeout(retryPublishTimeout);

  if (!publishingStatusMsg) {
    publishingStatusMsg = app.statusBar.pushMessage({
      ...msg,
    });
    publishingStatusMsg.on('clickRetry', () => {
      setPublishingStatus({
        msg: app.polyglot.t('publish.statusPublishing'),
        type: 'message',
      });

      // some fake latency so if the rety fails immediately, the UI has a chance
      // to update
      clearTimeout(retryPublishTimeout);
      retryPublishTimeout = setTimeout(() => {
        myPost(app.getServerUrl('ob/publish'))
          .fail((jqXhr) => {
            setPublishingStatus({
              msg: app.polyglot.t('publish.statusPublishFailed', {
                retryLink: `<a class="js-retry">${app.polyglot.t('publish.retryLink')}</a>`,
              }),
              type: 'warning',
            });

            const failReason = jqXhr.responseJSON && jqXhr.responseJSON.reason || '';
            openSimpleMessage(
              app.polyglot.t('publish.failedRetryTitle'),
              failReason,
            );
          });
      }, 500);
    });
  } else {
    clearTimeout(publishingStatusMsgRemoveTimer);
    publishingStatusMsg.update(msg);
  }

  return publishingStatusMsg;
}

serverConnectEvents.on('connected', (connectedEvent) => {
  connectedEvent.socket.on('message', (e) => {
    if (e.jsonData) {
      if (e.jsonData.status === 'publishing') {
        setPublishingStatus({
          msg: app.polyglot.t('publish.statusPublishing'),
          type: 'message',
        });

        // If a physical listing is added or removed, the profile stats(for example stats.physicalListingCount)
        // would be changed. It would affect whether shippingOption in Setting can be deleted or not if the last.
        app.profile.fetch();
      } else if (e.jsonData.status === 'error publishing') {
        setPublishingStatus({
          msg: app.polyglot.t('publish.statusPublishFailed', {
            retryLink: `<a class="js-retry">${app.polyglot.t('publish.retryLink')}</a>`,
          }),
          type: 'warning',
        });
      } else if (e.jsonData.status === 'publish complete') {
        setPublishingStatus({
          msg: app.polyglot.t('publish.statusPublishComplete'),
          type: 'message',
        });

        publishingStatusMsgRemoveTimer = setTimeout(() => {
          publishingStatusMsg.remove();
          publishingStatusMsg = null;
        }, 3000);
      }
    }
  });
});

ipc.on('close-attempt', (e) => {
  persistOutdatedListingHashes();

  // If on the bundled app, do not let the app shutdown until server shuts down.
  const localServer = ipc.sendSync('controller.system.getGlobal', 'localServer');

  if (localServer && localServer.isRunning) {
    localServer.once('exit', () => e.sender.send('controller.mainwindow.confirmClose'));
    localServer.stop();
  }

  if (localServer && localServer.isStopping) {
    app.pageNav.navigable = false;
    openSimpleMessage(
      app.polyglot.t('localServerShutdownDialog.title'),
      app.polyglot.t('localServerShutdownDialog.body'),
      {
        showCloseButton: false,
        dismissOnEscPress: false,
      },
    ).$el.css('z-index', '9999999'); // always on tippity-top
  } else {
    e.sender.send('close-confirmed');
  }
});

// initialize our listing delete handler
listingDeleteHandler();

if (isBundledApp) {
  console.log(
    `%c${app.polyglot.t('consoleWarning.heading')}`,
    'color: red; font-weight: bold; font-size: 50px;',
  );
  console.log(`%c${app.polyglot.t('consoleWarning.line1')}`, 'color: red;');
  console.log(`%c${app.polyglot.t('consoleWarning.line2')}`, 'color: blue;');
}
