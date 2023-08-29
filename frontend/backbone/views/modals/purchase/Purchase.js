/* eslint-disable class-methods-use-this */
import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import bigNumber from 'bignumber.js';
import 'velocity-animate';
import { ERROR_DUST_AMOUNT } from '../../../constants';
import { removeProp } from '../../../utils/object';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { launchSettingsModal } from '../../../utils/modalManager';
// import {
//   getInventory,
//   events as inventoryEvents,
// } from '../../../utils/inventory';
import { startAjaxEvent, endAjaxEvent } from '../../../utils/metrics';
import { toStandardNotation } from '../../../utils/number';
import {
  decimalToInteger,
  isValidCoinDivisibility,
  curDefToDecimal,
  getCoinDivisibility,
} from '../../../utils/currency';
import { capitalize } from '../../../utils/string';
import { events as outdatedListingHashesEvents } from '../../../utils/outdatedListingHashes';
import { isSupportedWalletCur } from '../../../data/walletCurrencies';
import Order from '../../../models/purchase/Order';
import Item from '../../../models/purchase/Item';
import Listing from '../../../models/listing/Listing';
import BaseModal from '../BaseModal';
import { openSimpleMessage } from '../SimpleMessage';
import PopInMessage, { buildRefreshAlertMessage } from '../../components/PopInMessage';
import Moderators from '../../components/moderators/Moderators';
import FeeChange from '../../components/FeeChange';
import CryptoTradingPair from '../../components/CryptoTradingPair';
import CryptoCurSelector from '../../components/CryptoCurSelector';
import Shipping from './Shipping';
import Receipt from './Receipt';
import Coupons from './Coupons';
import ActionBtn from './ActionBtn';
import Payment from './Payment';
import Complete from './Complete';
import DirectPayment from './DirectPayment';

export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.listing || !(options.listing instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    if (!options.vendor) {
      throw new Error('Please provide a vendor object');
    }

    const opts = {
      ...options,
      initialState: {
        phase: 'pay',
        ...options.initialState || {},
      },
    };

    super(opts);
    this.options = opts;
    this.listing = opts.listing;
    this.variants = opts.variants;
    this.vendor = opts.vendor;
    const shippingOptions = this.listing.get('shippingOptions');
    const moderatorIDs = this.listing.get('moderators') || [];
    const disallowedIDs = [app.profile.id, this.listing.get('vendorID').peerID];
    this.moderatorIDs = _.without(moderatorIDs, ...disallowedIDs);

    this.setState({
      showModerators: this.moderatorIDs.length,
      showVerifiedOnly: true,
    }, { renderOnChange: false });

    this.couponObj = [];

    this.order = new Order(
      {},
      {
        shippable: !!(shippingOptions && shippingOptions.length),
        moderated: this.moderatorIDs.length && app.verifiedMods.matched(this.moderatorIDs).length,
      });

    /*
       to support multiple items in a purchase in the future, pass in listings in the options,
       and add them to the order as items here.
    */
    const item = new Item(
      {
        listingHash: this.listing.get('hash'),
        quantity: !this.listing.isCrypto ? bigNumber('1') : undefined,
        options: opts.variants || [],
      },
      {
        isCrypto: this.listing.isCrypto,
        // inventory: () =>
        //   (
        //     typeof this.inventory === 'number' ?
        //       this.inventory : 99999999999999999
        //   ),
        getCoinDiv: () => (this.coinDivisibility),
        getCoinType: () => (
          this.listing
            .get('metadata')
            .get('coinType')
        ),
      }
    );
    // add the item to the order.
    this.order.get('items').add(item);

    this.actionBtn = this.createChild(ActionBtn, {
      listing: this.listing,
    });
    this.listenTo(this.actionBtn, 'purchase', () => this.purchaseListing());
    this.listenTo(this.actionBtn, 'close', () => this.close());
    this.listenTo(this.actionBtn, 'reloadOutdated', () => {
      let defaultPrevented = false;

      this.trigger('clickReloadOutdated', {
        preventDefault: () => (defaultPrevented = true),
      });

      setTimeout(() => {
        if (!defaultPrevented) {
          Backbone.history.loadUrl();
        }
      });
    });

    this.receipt = this.createChild(Receipt, {
      model: this.order,
      listing: this.listing,
      prices: this.prices,
      couponObj: this.couponObj,
      showTotalTip: this.getState().phase === 'pay',
    });

    this.coupons = this.createChild(Coupons, {
      coupons: this.listing.get('coupons'),
      listingPrice: bigNumber(this.listing.price.amount),
    });
    this.listenTo(this.coupons, 'changeCoupons', (hashes, codes) => this.changeCoupons(hashes, codes));

    const currencies = this.listing.get('metadata').get('acceptedCurrencies') || [];
    const locale = app.localSettings.standardizedTranslatedLang() || 'en-US';
    currencies.sort((a, b) => {
      const aName = app.polyglot.t(`cryptoCurrencies.${a}`, { _: a });
      const bName = app.polyglot.t(`cryptoCurrencies.${b}`, { _: b });
      return aName.localeCompare(bName, locale, { sensitivity: 'base' });
    });

    const disabledCurs = currencies.filter((c) => !isSupportedWalletCur(c));
    const activeCurs = currencies.length && this.listing.isCrypto ? [currencies[0]] : [];

    this.cryptoCurSelector = this.createChild(CryptoCurSelector, {
      disabledMsg: app.polyglot.t('purchase.cryptoCurrencyInvalid'),
      initialState: {
        controlType: 'radio',
        currencies,
        disabledCurs,
        sort: false,
        activeCurs,
      },
    });

    this.listenTo(this.cryptoCurSelector, 'currencyClicked', (cOpts) => {
      if (cOpts.active) this.moderators.setState({ showOnlyCur: cOpts.currency });
      this.receipt.paymentCoin = cOpts.active ? cOpts.currency : '';
    });

    this.moderators = this.createChild(Moderators, {
      moderatorIDs: this.moderatorIDs,
      useCache: false,
      fetchErrorTitle: app.polyglot.t('purchase.errors.moderatorsTitle'),
      fetchErrorMsg: app.polyglot.t('purchase.errors.moderatorsMsg'),
      purchase: true,
      cardState: 'unselected',
      notSelected: 'unselected',
      singleSelect: true,
      radioStyle: true,
      initialState: {
        showOnlyCur: currencies[0],
        showVerifiedOnly: true,
      },
    });
    // render the moderators so it can start fetching and adding moderator cards
    this.moderators.render();
    this.moderators.getModeratorsByID();
    this.listenTo(this.moderators, 'noModsShown', () => this.render());
    this.listenTo(this.moderators, 'clickShowUnverified', () => {
      this.setState({ showVerifiedOnly: false });
    });
    this.listenTo(this.moderators, 'cardSelect', () => this.onCardSelect());

    if (this.listing.get('shippingOptions').length) {
      this.shipping = this.createChild(Shipping, {
        model: this.listing,
      });
      this.listenTo(this.shipping, 'shippingOptionSelected', () => this.updateShippingOption());
      // set the initial shipping option
      this.updateShippingOption();
      this.refreshPrices();
    }

    this.complete = this.createChild(Complete, {
      listing: this.listing,
      vendor: this.vendor,
    });

    // If the parent has the inventory, pass it in, otherwise we'll fetch it.
    // -- commenting out for now since inventory is not functioning properly on the server
    // this.inventory = this.options.inventory;
    // if (
    //   this.listing.isCrypto &&
    //   typeof this.inventory !== 'number'
    // ) {
    //   this.inventoryFetch = getInventory(
    //     this.listing.get('vendorID').peerID,
    //     {
    //       slug: this.listing.get('slug'),
    //       coinDivisibility:
    //         this.listing.get('metadata')
    //           .get('coinDivisibility'),
    //     }
    //   ).done(e => (this.inventory = e.inventory));
    //   this.listenTo(inventoryEvents, 'inventory-change',
    //     e => (this.inventory = e.inventory));
    // }

    this.listenTo(app.settings, 'change:localCurrency', () => this.showDataChangedMessage());
    this.listenTo(app.localSettings, 'change:bitcoinUnit', () => this.showDataChangedMessage());
    this.listenTo(this.order.get('items').at(0), 'someChange ', () => this.refreshPrices());
    this.listenTo(this.order.get('items').at(0).get('shipping'), 'change', () => this.refreshPrices());

    this.hasVerifiedMods = app.verifiedMods.matched(this.moderatorIDs).length > 0;

    this.listenTo(app.verifiedMods, 'update', () => {
      const newHasVerifiedMods = app.verifiedMods.matched(moderatorIDs).length > 0;
      if (newHasVerifiedMods !== this.hasVerifiedMods) {
        this.hasVerifiedMods = newHasVerifiedMods;
        this.showDataChangedMessage();
      }
    });

    this._latestHash = this.listing.get('hash');
    this._renderedHash = null;

    this.listenTo(outdatedListingHashesEvents, 'newHash', (e) => {
      this._latestHash = e.oldHash;
      if (e.oldHash === this._renderedHash) this.outdateHash();
    });
  }

  className() {
    return `${super.className()} purchase modalScrollPage`;
  }

  events() {
    return {
      'click .js-goToListing': 'clickGoToListing',
      'click .js-close': 'clickClose',
      'click .js-retryFee': 'clickRetryFee',
      'change #purchaseCryptoAddress': 'changeCryptoAddress',
      'click .js-newAddress': 'clickNewAddress',
      'click .js-applyCoupon': 'applyCoupon',
      'keyup #couponCode': 'onKeyUpCouponCode',
      'blur #emailAddress': 'blurEmailAddress',
      'blur #memo': 'blurMemo',
      'click .js-purchaseVerifiedOnly': 'onClickVerifiedOnly',
      'change #cryptoAmountCurrency': 'changeCryptoAmountCurrency',
      'change #cryptoAmount': 'onChangeCryptoAmount',
      'keyup [name="quantity"]': 'keyupQuantity',
      ...super.events(),
    };
  }

  setState(state = {}, options = {}) {
    const superReturn = super.setState(state, options);

    if (
      this.receipt
      && this.getState().phase !== 'pay'
    ) {
      this.receipt.showTotalTip = false;
    }

    return superReturn;
  }

  get inventory() {
    return this._inventory;
  }

  set inventory(inventory) {
    this._inventory = inventory;
  }

  showDataChangedMessage() {
    if (this.dataChangePopIn && !this.dataChangePopIn.isRemoved()) {
      this.dataChangePopIn.$el.velocity('callout.shake', { duration: 500 });
    } else {
      this.dataChangePopIn = this.createChild(PopInMessage, {
        messageText:
          buildRefreshAlertMessage(app.polyglot.t('purchase.purchaseDataChangedPopin')),
      });

      this.listenTo(this.dataChangePopIn, 'clickRefresh', () => {
        this.render();
        this.moderators.render();
      });

      this.listenTo(this.dataChangePopIn, 'clickDismiss', () => {
        this.dataChangePopIn.remove();
        this.dataChangePopIn = null;
      });

      this.getCachedEl('.js-popInMessages').append(this.dataChangePopIn.render().el);
    }
  }

  goToListing() {
    app.router.navigate(`${this.vendor.peerID}/store/${this.listing.get('slug')}`,
      { trigger: true });
    this.close();
  }

  clickGoToListing() {
    this.goToListing();
  }

  clickClose() {
    this.trigger('closeBtnPressed');
    this.close();
  }

  handleDirectPurchaseClick() {
    if (!this.isModerated) return;

    this.moderators.deselectOthers();
    this.setState({ unverifedSelected: false }, { renderOnChange: false });
    this.render(); // always render even if the state didn't change
  }

  togVerifiedModerators(bool) {
    this.moderators.togVerifiedShown(bool);
    this.setState({ showVerifiedOnly: bool });
  }

  onClickVerifiedOnly(e) {
    this.togVerifiedModerators($(e.target).prop('checked'));
  }

  onCardSelect() {
    const selected = this.moderators.selectedIDs;
    const unverifedSelected = selected.length && !app.verifiedMods.matched(selected).length;
    this.setState({ unverifedSelected }, { renderOnChange: false });
    this.render(); // always render even if the state didn't change
  }

  changeCryptoAddress(e) {
    this.order.get('items')
      .at(0)
      .set('paymentAddress', e.target.value);
  }

  setModelQuantity(quantity, cur = this.cryptoAmountCurrency) {
    if (this.listing.isCrypto && (typeof cur !== 'string' || !cur)) {
      throw new Error('Please provide the currency code as a valid, non-empty string.');
    }

    this.order.get('items')
      .at(0)
      .set({ quantity });
  }

  changeCryptoAmountCurrency(e) {
    this._cryptoAmountCurrency = e.target.value;
    const { quantity } = this.getFormData(
      this.getCachedEl('#cryptoAmount'),
    );
    this.setModelQuantity(quantity);
  }

  keyupQuantity(e) {
    // wait until they stop typing
    if (this.quantityKeyUpTimer) {
      clearTimeout(this.quantityKeyUpTimer);
    }

    this.quantityKeyUpTimer = setTimeout(() => {
      const { quantity } = this.getFormData($(e.target));
      if (this.listing.isCrypto) this._cryptoQuantity = quantity;
      this.setModelQuantity(quantity);
    }, 150);
  }

  clickNewAddress() {
    launchSettingsModal({ initialTab: 'Addresses' });
  }

  applyCoupon() {
    this.coupons
      .addCode(this.$couponField.val())
      .then((result) => {
        // if the result is valid, clear the input field
        if (result.type === 'valid') {
          this.$couponField.val('');
        }
      });
  }

  onKeyUpCouponCode(e) {
    if (e.which === 13) {
      this.applyCoupon();
    }
  }

  blurEmailAddress(e) {
    this.order.set('alternateContactInfo', $(e.target).val());
  }

  blurMemo(e) {
    this.order.get('items').at(0).set('memo', $(e.target).val());
  }

  changeCoupons(hashes, codes) {
    // combine the codes and hashes so the receipt can check both.
    // if this is the user's own listing they will have codes instead of hashes
    const hashesAndCodes = hashes.concat(codes);
    const filteredCoupons = this.listing.get('coupons').filter(
      (coupon) => hashesAndCodes.indexOf(coupon.get('hash') || coupon.get('discountCode')) !== -1,
    );
    this.couponObj = filteredCoupons.map((coupon) => coupon.toJSON());
    this.receipt.coupons = this.couponObj;
    this.order.get('items').at(0).set('coupons', codes);
  }

  updateShippingOption() {
    // Set the shipping option.
    this.order.get('items').at(0).get('shipping')
      .set(this.shipping.selectedOption);
  }

  outdateHash() {
    this.actionBtn.setState({ outdatedHash: true });
  }

  purchaseListing() {
    // Clear any old errors.
    const allErrContainers = this.$('div[class $="-errors"]');
    allErrContainers.each((i, container) => $(container).html(''));

    // Don't allow a zero or negative price purchase.
    const priceObj = this.prices[0];
    if (
      priceObj
        .price
        .plus(priceObj.vPrice)
        .plus(priceObj.sPrice).lte(0)
    ) {
      this.insertErrors(this.getCachedEl('.js-errors'),
        [app.polyglot.t('purchase.errors.zeroPrice')]);
      this.setState({ phase: 'pay' });
      return;
    }

    // Set the payment coin.
    const paymentCoin = this.cryptoCurSelector.getState().activeCurs[0];
    this.order.set({ paymentCoin });

    // Set the shipping address if the listing is shippable.
    if (this.shipping && this.shipping.selectedAddress) {
      this.order.addAddress(this.shipping.selectedAddress);
    }

    // Set the moderator.
    const moderator = this.moderators.selectedIDs[0] || '';
    this.order.set({ moderator });
    this.order.set({}, { validate: true });

    // Cancel any existing order.
    if (this.orderSubmit) this.orderSubmit.abort();

    this.setState({ phase: 'processing' });

    startAjaxEvent('Purchase');
    const segmentation = {
      paymentCoin,
      moderated: !!moderator,
    };

    if (!this.order.validationError) {
      if (this.listing.isOwnListing) {
        this.setState({ phase: 'pay' });
        // don't allow a seller to buy their own items
        const errTitle = app.polyglot.t('purchase.errors.ownIDTitle');
        const errMsg = app.polyglot.t('purchase.errors.ownIDMsg');
        openSimpleMessage(errTitle, errMsg);
        endAjaxEvent('Purchase', {
          ...segmentation,
          errors: 'own listing',
        });
      } else {
        const { coinDivisibility } = this;
        const cryptoItems = [];

        if (this.listing.isCrypto) {
          if (!isValidCoinDivisibility(coinDivisibility)[0]) {
            this.setState({ phase: 'pay' });
            openSimpleMessage(
              app.polyglot.t('purchase.errors.genericPurchaseErrTitle'),
              app.polyglot.t('purchase.errors.invalidCoinDiv')
            );
            return;
          }

          try {
            const items = this.order.get('items');
            for (let i = 0; i < items.length; i += 2) {
              const item = items.at(i);
              cryptoItems.push({
                ...item.toJSON(),
                quantity: decimalToInteger(
                  item.get('quantity'),
                  coinDivisibility,
                ),
              });
            }
          } catch (e) {
            this.setState({ phase: 'pay' });
            openSimpleMessage(
              app.polyglot.t('purchase.errors.genericPurchaseErrTitle'),
              app.polyglot.t('purchase.errors.unableToConvertCryptoQuantity')
            );
            console.error(e);
            return;
          }
        }

        // Strip the 'cid' so it doesn't go to the server. Normally this is
        // done in the sync of the baseModel, but since we're POSTing outside of
        // that, we'll replicate that cleanup here.
        const postData = removeProp(
          {
            ...this.order.toJSON(),
            items: this.listing.isCrypto
              ? cryptoItems : this.order.get('items').toJSON(),
          },
          'cid',
        );

        $.post({
          url: app.getServerUrl('ob/purchase'),
          data: JSON.stringify(postData),
          dataType: 'json',
          contentType: 'application/json',
        })
          .done((data) => {
            this.setState({ phase: 'pending' });
            this.payment = this.createChild(Payment, {
              balanceRemaining: curDefToDecimal(data.amount),
              paymentAddress: data.paymentAddress,
              orderID: data.orderID,
              isModerated: !!this.order.get('moderator'),
              metricsOrigin: 'Purchase',
              paymentCoin,
            });
            this.listenTo(this.payment, 'walletPaymentComplete', ((pmtCompleteData) => this.completePurchase(pmtCompleteData)));
            this.$('.js-pending').append(this.payment.render().el);
            endAjaxEvent('Purchase');
          })
          .fail((jqXHR) => {
            this.setState({ phase: 'pay' });
            if (jqXHR.statusText === 'abort') return;
            let errTitle = app.polyglot.t('purchase.errors.orderError');
            let errMsg = (jqXHR.responseJSON && jqXHR.responseJSON.reason) || '';

            if (jqXHR.responseJSON
              && jqXHR.responseJSON.code === 'ERR_INSUFFICIENT_INVENTORY'
              && typeof jqXHR.responseJSON.remainingInventory === 'number') {
              this.inventory = jqXHR.responseJSON.remainingInventory
                / coinDivisibility;
              errTitle = app.polyglot.t('purchase.errors.insufficientInventoryTitle');
              errMsg = app.polyglot.t('purchase.errors.insufficientInventoryBody', {
                smart_count: this.inventory,
                remainingInventory: new Intl.NumberFormat(app.settings.get('localCurrency'), {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 8,
                }).format(this.inventory),
              });
              if (this.inventoryFetch) this.inventoryFetch.abort();
            } else if (errMsg === ERROR_DUST_AMOUNT) {
              errMsg = app.polyglot.t('purchase.errors.serverErrorBelowDust');
            }

            openSimpleMessage(errTitle, errMsg);
            endAjaxEvent('Purchase', {
              ...segmentation,
              errors: errMsg || 'unknown error',
            });
          });
      }
    } else {
      this.setState({ phase: 'pay' });
      const purchaseErrs = {};
      Object.keys(this.order.validationError).forEach((errKey) => {
        const domKey = errKey.replace(/\[[^\[\]]*\]/g, '').replace('.', '-');
        let container = this.$(`.js-${domKey}-errors`);
        // if no container exists, use the generic container
        container = container.length ? container : this.getCachedEl('.js-errors');
        const err = this.order.validationError[errKey];
        this.insertErrors(container, err);
        purchaseErrs[`UserError-${domKey}`] = err.join(', ');
      });
      endAjaxEvent('Purchase', {
        ...segmentation,
        errors: 'User Error',
        ...purchaseErrs,
      });
    }
  }

  insertErrors(container, errors = []) {
    loadTemplate('formError.html', (t) => {
      container.html(t({
        errors,
      }));
    });
  }

  completePurchase(data) {
    this.complete.orderID = data.orderID;
    this.complete.render();
    this.setState({ phase: 'complete' });
  }

  get prices() {
    // return an array of price objects that matches the items in the order
    return this.order.get('items').map((item) => {
      const shipping = item.get('shipping');
      const sName = shipping.get('name');
      const sService = shipping.get('service');
      const sOpt = this.listing.get('shippingOptions').findWhere({ name: sName });
      const sOptService = sOpt ? sOpt.get('services').findWhere({ name: sService }) : '';

      const options = item.get('options');
      const selections = options.map((option) => ({
        option: option.name,
        variant: option.value,
      }));
      const sku = this.listing.get('item').get('skus').find((v) => _.isEqual(v.get('selections'), selections));

      return {
        price: bigNumber(this.listing.price.amount),
        sPrice: bigNumber(sOptService ? sOptService.get('price') || 0 : 0),
        aPrice: bigNumber(sOptService ? sOptService.get('additionalItemPrice') || 0 : 0),
        vPrice: bigNumber(sku ? sku.get('surcharge') || 0 : 0),
        quantity: bigNumber(item.get('quantity')),
      };
    });
  }

  refreshPrices() {
    this.receipt.updatePrices(this.prices);
  }

  get $couponField() {
    if (!this._$couponField) {
      this._$couponField = this.$('#couponCode');
    }
    return this._$couponField;
  }

  get cryptoAmountCurrency() {
    return this._cryptoAmountCurrency
      || this.listing.get('item')
        .get('cryptoListingCurrencyCode');
  }

  get coinDivisibility() {
    let currencyCode;
    try {
      currencyCode = this.listing.isCrypto ? this.listing.get('item').cryptoListingCurrencyCode : this.listing.get('metadata').get('pricingCurrency').code;
    } catch (e) {
      // pass
    }

    let coinDiv;
    try {
      coinDiv = getCoinDivisibility(currencyCode);
    } catch (e) {
      // pass
    }
    return coinDiv;
  }

  get isModerated() {
    return this.moderators.selectedIDs.length > 0;
  }

  remove() {
    if (this.orderSubmit) this.orderSubmit.abort();
    if (this.inventoryFetch) this.inventoryFetch.abort();
    clearTimeout(this.quantityKeyUpTimer);
    super.remove();
  }

  render() {
    if (this.dataChangePopIn) this.dataChangePopIn.remove();
    const state = this.getState();
    const item = this.order.get('items')
      .at(0);
    const quantity = item.get('quantity');
    const metadata = this.listing.get('metadata');

    let uiQuantity = quantity;

    if (this.listing.isCrypto && this._cryptoQuantity !== undefined) {
      uiQuantity = uiQuantity instanceof bigNumber && !uiQuantity.isNaN()
        ? toStandardNotation(this._cryptoQuantity) : this._cryptoQuantity;
    }

    loadTemplate('modals/purchase/purchase.html', (t) => {
      this.$el.html(t({
        ...this.order.toJSON(),
        ...state,
        listing: this.listing.toJSON(),
        listingPrice: this.listing.price,
        itemConstraints: this.order.get('items')
          .at(0)
          .constraints,
        vendor: this.vendor,
        variants: this.variants,
        prices: this.prices,
        displayCurrency: app.settings.get('localCurrency'),
        quantity: uiQuantity,
        cryptoAmountCurrency: this.cryptoAmountCurrency,
        isCrypto: this.listing.isCrypto,
        phaseClass: `phase${capitalize(state.phase)}`,
        hasCoupons: this.listing.get('coupons').length
          && this.listing.get('metadata').get('contractType') !== 'CRYPTOCURRENCY',
      }));

      super.render();

      this._$couponField = null;

      this.actionBtn.delegateEvents();
      this.actionBtn.setState({ phase: state.phase }, { renderOnChange: false });
      this.$('.js-actionBtn').append(this.actionBtn.render().el);

      this.receipt.delegateEvents();
      this.$('.js-receipt').append(this.receipt.render().el);

      this.coupons.delegateEvents();
      this.$('.js-couponsWrapper').html(this.coupons.render().el);

      this.moderators.delegateEvents();
      this.$('.js-moderatorsWrapper').append(this.moderators.el);

      if (this.directPayment) this.directPayment.remove();
      this.directPayment = this.createChild(DirectPayment, {
        initialState: {
          active: !this.isModerated,
        },
      });
      this.listenTo(this.directPayment, 'click', () => this.handleDirectPurchaseClick());
      this.$('.js-directPaymentWrapper').append(this.directPayment.render().el);

      this.cryptoCurSelector.delegateEvents();
      this.$('.js-cryptoCurSelectorWrapper').append(this.cryptoCurSelector.render().el);

      if (this.shipping) {
        this.shipping.delegateEvents();
        this.$('.js-shippingWrapper').append(this.shipping.render().el);
      }

      // if this is a re-render, and the payment exists, render it
      if (this.payment) {
        this.payment.delegateEvents();
        this.$('.js-pending').append(this.payment.render().el);
      }

      this.complete.delegateEvents();
      this.$('.js-complete').append(this.complete.render().el);

      if (this.feeChange) this.feeChange.remove();
      this.feeChange = this.createChild(FeeChange);
      this.$('.js-feeChangeContainer').html(this.feeChange.render().el);

      if (this.listing.isCrypto) {
        if (this.cryptoTitle) this.cryptoTitle.remove();
        this.cryptoTitle = this.createChild(CryptoTradingPair, {
          initialState: {
            tradingPairClass: 'cryptoTradingPairXL',
            exchangeRateClass: 'clrT2 tx6',
            fromCur: metadata.get('acceptedCurrencies')[0],
            toCur: this.listing.get('item').get('cryptoListingCurrencyCode'),
          },
        });
        this.getCachedEl('.js-cryptoTitle')
          .html(this.cryptoTitle.render().el);

        this.$('#cryptoAmountCurrency').select2({ minimumResultsForSearch: Infinity });
      }
    });

    this._renderedHash = this.listing.get('hash');

    return this;
  }
}