<template>
  <span class="quantityDisplay">
    <span v-if="typeof ob.amount === 'number'" :class="`content ${ob.contentClass}`">
      <template v-if="ob.coinType">
        <span>{{ formattedAmount }}</span>
        <CryptoIcon :code="ob.coinType" />
      </template>
      <template v-else>{{ formattedAmount }}</template>
    </span>
    <template v-else-if="ob.isFetching">
      <SpinnerSVG :className="ob.spinnerClass" />
    </template>
    <template v-else-if="ob.fetchFailed">
      <div :class="`content ${ob.contentFailedClass}`">
        <div :class="`arrowBoxTipWrap ${ob.tipClass}`">
          <div class="flexVCent gutterHSm">
            <i class="clrT2">Unknown</i>
            <i class="ion-help-circled"></i>
          </div>

          <div class="arrowBoxCenteredTop clrBr clrP">{{ message }}</div>
        </div>
      </div>
    </template>
  </span>
</template>

<script>
import app from '../../../backbone/app';
import loadTemplate from '../../../backbone/utils/loadTemplate';
import { getInventory, isFetching, events as inventoryEvents } from '../../../backbone/utils/inventory';

export default {
  props: {
    options: {
      type: Object,
      default: {},
    },
  },
  data() {
    return {
      _state: {
        isFetching: false,
        fetchFailed: false,
        fetchError: '',
        coinType: '',
        coinDivisibility: 100000000,
        contentClass: 'txB flexVCent gutterHSm',
        contentFailedClass: '',
        spinnerClass: 'spinnerSm',
        tipClass: 'clrT tx5 txCtr',
        localCur: app.settings.get('localCurrency'),
      }
    };
  },
  created() {
    this.initEventChain();

    this.loadData(this.options);
  },
  mounted() {
  },
  computed: {
    ob() {
      return {
        ...this.templateHelpers,
        ...this._state,
      };
    },
    formattedAmount() {
      let formattedAmount = new Intl.NumberFormat(ob.localCur, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      }).format(ob.amount);

      return formattedAmount;
    },
    message() {
      const retryLink = `<a class="js-retry">${ob.polyT('inventoryDisplay.retryLink')}</a>`;
      let message = ob.polyT('inventoryDisplay.fetchError', {
        retryLink,
      });

      if (ob.fetchError) {
        message = ob.polyT('inventoryDisplay.fetchErrorWithMsg', {
          msg: ob.fetchError,
        });
        message += `<br /> <br /><div class="txCtr">${retryLink}</div>`;
      }
      return message;
    },
  },
  methods: {
    loadData(options = {}) {
      if (typeof options.peerID !== 'string' || !options.peerID) {
        throw new Error('Please provide a peerID.');
      }

      if (typeof options.slug !== 'string' || !options.slug) {
        throw new Error('Please provide a slug.');
      }

      const opts = {
        ...options,
        initialState: {
          isFetching: isFetching(options.peerID, { slug: options.slug }),
          fetchFailed: false,
          fetchError: '',
          coinType: '',
          coinDivisibility: 100000000,
          contentClass: 'txB flexVCent gutterHSm',
          contentFailedClass: '',
          spinnerClass: 'spinnerSm',
          tipClass: 'clrT tx5 txCtr',
          localCur: app.settings.get('localCurrency'),
          // amount: undefined, // will be set on a 'inventory-change' or
          // can be provided as a number
          ...options.initialState,
        },
      };

      this.baseInit(opts);

      this.listenTo(inventoryEvents, 'inventory-fetching', (e) => {
        if (e.peerID !== options.peerID || (e.slug && e.slug !== options.slug)) return;
        this.setState({
          isFetching: true,
          fetchFailed: false,
          fetchError: '',
        });
      });

      this.listenTo(inventoryEvents, 'inventory-fetch-fail', (e) => {
        if (e.peerID !== options.peerID || (e.slug && e.slug !== options.slug)) return;
        this.setState({
          isFetching: false,
          fetchFailed: true,
          fetchError: (e.xhr && e.xhr.responseJSON && e.xhr.responseJSON.reason) || '',
        });
      });

      this.listenTo(inventoryEvents, 'inventory-fetch-success', (e) => {
        if (e.peerID !== options.peerID || (e.slug && e.slug !== options.slug)) return;
        this.setState({ isFetching: false });
      });

      this.listenTo(inventoryEvents, 'inventory-change', (e) => {
        if (e.peerID !== options.peerID || e.slug !== options.slug) return;
        this.setState({ amount: e.inventory });
      });
    },
    onClickRetry() {
      this.inventoryFetch = getInventory(this.options.peerID, {
        slug: this.options.slug,
        coinDivisibility: this.getState().coinDivisibility,
      });
    },

    remove() {
      if (this.inventoryFetch) this.inventoryFetch.abort();
      return super.remove();
    },
  },
};
</script>
<style lang="scss" scoped></style>
