<template>
  <div class="transactions clrS">
    <nav id="pageTabBar" class="barLg clrP clrBr">
      <div class="flexVCent pageTabs">
        <div class="js-miniProfileContainer">
          <MiniProfile
            :bb="function() {
              return {
                model: ownProfile,
              };
            }" />
        </div>
        <div class="flexExpand">
          <div class="flexHRight flexVCent gutterH clrT2">
            <a
              v-for="(tab, i) in ['sales', 'purchases', 'cases']"
              :key="i"
              :class="`btn tab clrBr ${tab == _tab ? 'clrT active' : ''}`"
              @click="onTabClick(tab)"
            >
              {{ ob.polyT(`transactions.${tab}.heading`) }}
              <span class="clrTEmph1 margLSm">{{ tabCount[tab] }}</span>
            </a>
          </div>
        </div>
      </div>
    </nav>

    <section class="flexRow header">
      <div class="pageContent">
        <div class="tabContent">
          <!-- insert the tab subview here -->
          <Tab :key="tabKey"
            :options="tabOptions.options"
            :bb="function() {
              return {
                collection: tabOptions.collection,
              };
            }"
            @clickRow="openOrder" />
        </div>
      </div>
    </section>

    <Teleport to="#js-vueModal">
      <OrderDetail
        v-if="showOrderDetail"
        :options="{
          returnText: ob.polyT(`transactions.${modalType}s.returnToFromOrder`),
        }"
        :bb="function() {
          return {
            model: modalModel,
          };
        }"
        @convoMarkedAsRead="onConvoMarkedAsRead"
        @close="onOrderDetailClose"
      />
    </Teleport>
  </div>
</template>

<script>
import $ from 'jquery';
import app from '../../../backbone/app';
import { abbrNum, deparam } from '../../../backbone/utils';
import { getSocket } from '../../../backbone/utils/serverConnect';
import { recordEvent } from '../../../backbone/utils/metrics';
import Transactions from '../../../backbone/collections/Transactions';
import Order from '../../../backbone/models/order/Order';
import Case from '../../../backbone/models/order/Case';
import OrderDetail from '../modals/orderDetail/OrderDetail.vue';
import Tab from './Tab.vue';
import MiniProfile from '../MiniProfile.vue';

export default {
  components: {
    OrderDetail,
    Tab,
    MiniProfile,
  },
  props: {
    options: {
      type: Object,
      default: {},
    },
  },
  data() {
    return {
      _tab: this.$route.params?.tab || 'purchases',
      tabKey: 0,

      tabCount: {
        sales: 0,
        purchases: 0,
        cases: 0,
      },

      showOrderDetail: false,
      modalModel: {},
      modalType: 'sale',
      willRouteFlagForOrderDetail: false,
    };
  },
  created() {
    this.initEventChain();

    this.loadData();
  },
  mounted() {
    this.render();
  },
  computed: {
    ownProfile() {
      return app.profile;
    },
    salesDefaultFilter() {
      return {
        search: '',
        sortBy: 'UNREAD',
        states: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      };
    },

    purchasesDefaultFilter() {
      return {
        search: '',
        sortBy: 'UNREAD',
        states: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      };
    },

    casesDefaultFilter() {
      return {
        search: '',
        sortBy: 'UNREAD',
        states: [10, 12],
      };
    },

    casesFilterConfig() {
      return [
        {
          id: 'filterDisputeOpen',
          text: app.polyglot.t('transactions.filters.disputeOpen'),
          checked: this.casesDefaultFilter.states.includes(10),
          className: 'filter',
          targetState: [10],
        },
        {
          id: 'filterDisputeClosed',
          text: app.polyglot.t('transactions.filters.disputeClosed'),
          checked: this.casesDefaultFilter.states.includes(12),
          className: 'filter',
          targetState: [12],
        },
      ];
    },

    filterUrlParams() {
      const params = deparam(location.hash.split('?')[1] || '');

      if (params.states) {
        params.states = params.states
          .split('-')
          .map((strIndex) => parseInt(strIndex, 10))
          .filter((state) => !Number.isNaN(state));
      } else {
        delete params.states;
      }

      return params;
    },
    tabOptions() {
      let _tab = this._tab || 'purchases';
      return this[`${_tab}TabOptions`];
    },
    purchasesTabOptions() {
      return {
        collection: this.purchasesCol,
        options: {
          type: 'purchases',
          defaultFilter: {
            ...this.purchasesDefaultFilter,
          },
          initialFilter: {
            ...this.purchasesDefaultFilter,
            ...this.filterUrlParams,
          },
          filterConfig: this.getSalesPurchasesFilterConfig(false),
        }
      };
    },

    salesTabOptions() {
      return {
        collection: this.salesCol,
        options: {
          type: 'sales',
          defaultFilter: {
            ...this.salesDefaultFilter,
          },
          initialFilter: {
            ...this.salesDefaultFilter,
            ...this.filterUrlParams,
          },
          filterConfig: this.getSalesPurchasesFilterConfig(true),
        }
      };
    },

    casesTabOptions() {
      return {
        collection: this.casesCol,
        options: {
          type: 'cases',
          defaultFilter: {
            ...this.casesDefaultFilter,
          },
          initialFilter: {
            ...this.casesDefaultFilter,
            ...this.filterUrlParams,
          },
          filterConfig: this.casesFilterConfig,
        }
      };
    },
  },
  methods: {
    loadData() {
      let tab = this.$route.params.tab;
      if (tab && ['sales', 'cases', 'purchases'].indexOf(tab) === -1) {
        // this.pageNotFound();
        return;
      }

      if (!tab) {
        this.navigate('transactions/sales');
      }

      this._tab = tab || 'sales';

      this.tabViewCache = {};
      this.profileDeferreds = {};
      this.profilePosts = [];

      const params = deparam(location.hash.split('?')[1] || '');
      const { orderID } = params;
      const { caseID } = params;

      this.purchasesCol = new Transactions([], { type: 'purchases' });
      this.syncTabHeadCount(this.purchasesCol, (count) => (this.tabCount.purchases = count));
      // fetch so we get the count for the tabhead
      this.purchasesCol.fetch();

      this.salesCol = new Transactions([], { type: 'sales' });
      this.syncTabHeadCount(this.salesCol, (count) => (this.tabCount.sales = count));
      // fetch so we get the count for the tabhead
      this.salesCol.fetch();

      this.casesCol = new Transactions([], { type: 'cases' });
      this.syncTabHeadCount(this.casesCol, (count) => (this.tabCount.cases = count));
      // fetch so we get the count for the tabhead
      this.casesCol.fetch();

      this.socket = getSocket();

      if (orderID || caseID) {
        // cut off the trailing 's' from the tab
        const type = this._tab.slice(0, this._tab.length - 1);

        this.openOrder(orderID || caseID, type);
      }
    },

    onTabClick(tab) {
      this.selectTab(tab);
      recordEvent('Transactions_TabChange', {
        tab,
      });
    },

    syncTabHeadCount(cl, setCount) {
      if (typeof setCount !== 'function') {
        throw new Error('Please provide a function that returns a jQuery element ' + 'containing the tab head count to update.');
      }

      let count;

      this.listenTo(cl, 'request', (md, xhr) => {
        xhr.done((data) => {
          let updateCount = false;

          if (typeof count === 'number') {
            if (data.queryCount > count) {
              updateCount = true;
            }
          } else {
            updateCount = true;
          }

          if (updateCount) {
            count = data.queryCount;
            setCount.call(this, abbrNum(data.queryCount));
          }
        });
      });
    },

    // remove it from the url on close of the modal
    onOrderDetailClose() {
      this.showOrderDetail = false;
      if (this.willRouteFlagForOrderDetail) {
        return;
      }

      const params = deparam(location.hash.split('?')[1] || '');
      delete params.orderID;
      delete params.caseID;
      app.router.navigate(`${location.hash.split('?')[0]}?${$.param(params)}`);
    },

    onConvoMarkedAsRead(orderID) {
      let collection = this.tabOptions.collection;

      const transaction = collection.get(orderID);
      if (transaction) {
        transaction.set({
          unreadChatMessages: 0,
          read: true,
        });
      }
    },

    markOrderAsRead(orderID) {
      let collection = this.tabOptions.collection;

      const transaction = collection.get(orderID);
      if (transaction) {
          transaction.set('read', true);
        }
    },

    openOrder(id, type = 'sale') {
      this.showOrderDetail = false;

      if (type !== 'case') {
        this.modalModel = new Order({ orderID: id }, { type });
      } else {
        this.modalModel = new Case({ caseID: id });
      }
      this.modalType = type;
      this.showOrderDetail = true;

      this.markOrderAsRead(id);

      let addToRoute = true;
      if (addToRoute) {
        // add the order / case id to the url
        const params = deparam(location.hash.split('?')[1] || '');
        delete params.orderID;
        delete params.caseID;
        params[type === 'case' ? 'caseID' : 'orderID'] = id;
        app.router.navigate(`${location.hash.split('?')[0]}?${$.param(params)}`);
      }

      this.willRouteFlagForOrderDetail = false;
      // Do not alter the url if the user is routing to a new route. The
      // user has already altered the url.
      this.listenTo(app.router, 'will-route', () => {
        this.willRouteFlagForOrderDetail = true;
      });

      // On any changes to the order / case detail model state, we'll update the
      // state in the corresponding model in the respective collection driving
      // the transaction table.
      this.listenTo(this.modalModel, 'change:state', (md, state) => {
        let col = this.purchasesCol;

        if (type === 'sale') {
          col = this.salesCol;
        } else if (type === 'case') {
          col = this.casesCol;
        }

        const collectionMd = col.get(this.modalModel.id);
        if (collectionMd) {
          collectionMd.set('state', state);
        }
      });
    },

    getSalesPurchasesFilterConfig(isSale) {
      const defaulFilterStates = isSale ? this.salesDefaultFilter.states : this.purchasesDefaultFilter.states;

      return [
        {
          id: 'filterUnfunded',
          text: app.polyglot.t('transactions.filters.unfunded'),
          checked: defaulFilterStates.includes(1),
          className: 'filter',
          targetState: [1],
        },
        {
          id: 'filterPending',
          text: app.polyglot.t('transactions.filters.pending'),
          checked: defaulFilterStates.includes(0),
          className: 'filter',
          targetState: [0],
        },
        {
          id: 'filterReady',
          text: app.polyglot.t('transactions.filters.ready'),
          checked: defaulFilterStates.includes(2) || defaulFilterStates.includes(3) || defaulFilterStates.includes(4),
          className: 'filter',
          targetState: [2, 3, 4],
        },
        {
          id: 'filterFulfilled',
          text: app.polyglot.t('transactions.filters.fulfilled'),
          checked: defaulFilterStates.includes(5) || defaulFilterStates.includes(13),
          className: 'filter',
          targetState: [5, 13],
        },
        {
          id: 'filterRefunded',
          text: app.polyglot.t('transactions.filters.refunded'),
          checked: defaulFilterStates.includes(9),
          className: 'filter',
          targetState: [9],
        },
        {
          id: 'filterDisputes',
          text: app.polyglot.t('transactions.filters.disputes'),
          checked: defaulFilterStates.includes(10) || defaulFilterStates.includes(11) || defaulFilterStates.includes(12),
          className: 'filter',
          targetState: [10, 11, 12],
        },
        {
          id: 'filterCompleted',
          text: app.polyglot.t('transactions.filters.completed'),
          checked: defaulFilterStates.includes(6) || defaulFilterStates.includes(7) || defaulFilterStates.includes(8),
          className: 'filter',
          targetState: [6, 7, 8],
        },
        {
          id: 'filterError',
          text: app.polyglot.t('transactions.filters.error'),
          checked: defaulFilterStates.includes(14),
          className: 'filter',
          targetState: [14],
        },
      ];
    },

    selectTab(targ, options = {}) {
      const opts = {
        addTabToHistory: true,
        ...options,
      };

      if (this._tab !== targ) {
        this.tabKey += 1;

        if (opts.addTabToHistory) {
          // add tab to history
          app.router.navigate(`transactions/${targ}`);
        }
        this._tab = targ;
      }
    },

    render() {
      this.selectTab(this._tab, {
        addTabToHistory: false,
      });

      return this;
    },
  },
};
</script>
<style lang="scss" scoped></style>
