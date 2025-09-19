<template>
  <div class="modal purchase modalScrollPage" :key="viewKey">
    <BaseModal :modalInfo="{ showCloseButton: false }">
      <template v-slot:component>
        <div ref="popInMessages" class="popInMessageHolder js-popInMessages"></div>

        <div class="topControls gutterHSm flex">
          <template v-if="vendor">
            <div class="contentBox clrP clrSh3 clrBr clrT">
              <div class="padSm gutterHSm overflowAuto margRSm flexVCent">
                <a class="clrBr2 clrSh1 discTn flexNoShrink" :style="ob.getAvatarBgImage(vendor.avatarHashes)"></a>
                <p class="txUnl tx3 clamp">{{ vendor.name }}</p>
                <a class="link flexNoShrink tx6" @click="clickGoToListing">{{
                  origin === 'ShoppingCart' ? ob.polyT('purchase.returnToCart') : ob.polyT('purchase.returnToListing')
                }}</a>
              </div>
            </div>
          </template>
        </div>

        <div :class="`flexRow gutterH mainSection ${ob.phaseClass}`">
          <div class="col9">
            <div class="flexColRow gutterV">
              <template v-for="(listing, idx) in ob.listings" :key="listing.slug">
                <section class="contentBox pad clrP clrBr clrSh3">
                  <div class="js-errors">
                    <FormError v-if="errors['js-errors']" :errors="errors['js-errors']" />
                  </div>
                  <div class="js-items-quantity-errors">
                    <FormError v-if="errors['items-quantity']" :errors="errors['items-quantity']" />
                  </div>
                  <template v-if="!ob.isCrypto && !ob.isRwaToken">
                    <div class="flexVCent gutterH">
                      <div class="thumb" :style="ob.getListingBgImage(listing.item.images[0])"></div>
                      <div class="flexExpand">
                        <div class="flexCol gutterVTn">
                          <div class="width100 noOverflow">
                            <b>{{ listing.item.title }}</b>
                          </div>
                          <template v-for="variant in itemsInfo[idx].variants" :key="variant.name">
                            <div class="width100 noOverflow">
                              <span class="clrT2">{{ variant.name }}: {{ variant.value }}</span>
                            </div>
                          </template>
                        </div>
                      </div>
                      <template v-if="ob.phase === 'checkout' || ob.phase === 'creatingOrder'">
                        <div class="flexNoShrink">
                          <div class="flexVCent gutterH purchaseQuantity">
                            <div class="flexCol">
                              <label class="flexHRight" for="purchaseQuantity">
                                <span class="required txB margR">{{ ob.polyT('purchase.quantity') }}</span>
                              </label>
                            </div>
                            <div class="flexNoShrink">
                              <input
                                class="clrBr clrP"
                                type="number"
                                id="purchaseQuantity"
                                size="3"
                                v-model="formData.itemsData[idx].quantity"
                                @keyup="keyupQuantity(idx)"
                                placeholder="0"
                                data-var-type="bignumber"
                              />
                            </div>
                          </div>
                        </div>
                      </template>
                      <div class="pad flexNoShrink">
                        <b>{{ ob.currencyMod.convertAndFormatCurrency(totalPrice(idx), pricingCurrency(idx), displayCurrency) }}</b>
                      </div>
                    </div>

                    <OptionalFeatureLine :optionalFeatures="itemsInfo[idx].optionalFeatures" :pricingCurrency="pricingCurrency(idx)" :displayCurrency="displayCurrency" />

                    <div class="col6">
                      <template v-if="hasCoupons(listing) && ob.phase === 'checkout'">
                        <div class="rowTn">
                          <label for="couponCode" class="tx5">{{ ob.polyT('purchase.couponCode') }}</label>
                        </div>
                        <div class="flex gutterH row">
                          <input
                            class="btnHeight clrBr clrP"
                            type="text"
                            id="couponCode"
                            @keyup.enter="applyCoupon(idx)"
                            v-model="formData.itemsData[idx].couponCode"
                            :placeholder="ob.polyT('purchase.couponCodePlaceholder')"
                          />
                          <button class="btn clrP clrBr clrSh2 flexNoShrink" @click="applyCoupon(idx)">
                            {{ ob.polyT('purchase.applyCode') }}
                          </button>
                        </div>
                        <div class="js-couponsWrapper">
                          <Coupons
                            ref="coupons"
                            :options="{
                              coupons: listing.coupons,
                              listingPrice: this.prices[idx].price,
                            }"
                            @changeCoupons="changeCoupons(idx, $event)"
                          />
                          <!-- // coupons are inserted here after they are added by the user. -->
                        </div>
                      </template>
                    </div>
                  </template>

                  <template v-else-if="ob.isCrypto">
                    <div class="flexVCent gutterHLg row cryptoTitleWrap">
                      <div ref="cryptoTitle" :class="`js-cryptoTitle ${ob.phase !== 'checkout' && ob.phase !== 'creatingOrder' ? 'flexExpand' : ''}`">
                        <CryptoTradingPairWrap
                          :options="{
                            tradingPairClass: 'cryptoTradingPairXL',
                            exchangeRateClass: 'clrT2 tx6',
                            fromCur: listing.metadata.acceptedCurrencies[0],
                            toCur: listing.item.cryptoListingCurrencyCode,
                          }"
                        />
                      </div>
                    </div>
                  </template>
                  <template v-else-if="ob.isRwaToken">
                    <div class="flexVCent gutterHLg row rwaTitleWrap">
                      <div ref="rwaTitle" :class="`js-rwaTitle ${ob.phase !== 'checkout' && ob.phase !== 'creatingOrder' ? 'flexExpand' : ''}`">
                        <h3>{{ listing.item.title }}</h3>
                      </div>
                      <template v-if="ob.phase === 'checkout' || ob.phase === 'creatingOrder'">
                        <div class="flexExpand">
                          <div class="flexVCent gutterHLg">
                            <label for="rwaAmount" class="clrT txB required">{{ ob.polyT('purchase.rwaAmount') }}</label>
                            <div class="inputSelect">
                              <input
                                type="number"
                                class="clrBr clrP clrSh2"
                                id="rwaAmount"
                                v-model="rwaAmountValue"
                                @change="onChangeRwaAmount"
                                @keyup="keyupQuantity(idx)"
                                :placeholder="`${listing.item.minQuantity || 1} - ${listing.item.maxQuantity || 100}`"
                                :min="listing.item.minQuantity || 1"
                                :max="listing.item.maxQuantity || 100"
                                size="8"
                                data-var-type="bignumber"
                              />
                              <template v-if="displayCurrency !== 'FCC'">
                                <Select2
                                  id="rwaAmountCurrency"
                                  v-model="rwaAmountCurrency"
                                  @change="changeRwaAmountCurrency(idx)"
                                  class="clrBr clrP nestInputRight"
                                >
                                  <option
                                    v-for="cur in getRwaTokenCurrencies()"
                                    :key="cur"
                                    :value="cur"
                                    :selected="cur === rwaAmountCurrency"
                                  >
                                    {{ cur }}
                                  </option>
                                </Select2>
                              </template>
                            </div>
                          </div>
                          <!-- 数量范围提示 -->
                          <div class="quantityRangeHint clrT2 txSm">
                            {{ ob.polyT('purchase.rwaQuantityRange', { 
                              min: listing.item.minQuantity || 1, 
                              max: listing.item.maxQuantity || 100 
                            }) }}
                          </div>
                        </div>
                      </template>
                      <div class="pad flexNoShrink">
                        <b>{{ ob.currencyMod.convertAndFormatCurrency(totalPrice(idx), pricingCurrency(idx), displayCurrency) }}</b>
                      </div>
                    </div>
                  </template>
                </section>
              </template>
            </div>
            <template v-if="ob.phase === 'checkout' || ob.phase === 'creatingOrder'">
              <template v-if="shippingOptions && shippingOptions.length">
                <section class="contentBox padMd clrP clrBr clrSh3 js-shipping">
                  <div class="js-shipping-errors js-items-shipping-errors">
                    <FormError v-if="errors['shipping']" :errors="errors['shipping']" />
                    <FormError v-if="errors['items-shipping']" :errors="errors['items-shipping']" />
                  </div>
                  <Shipping
                    ref="shipping"
                    v-if="shippingOptions.length"
                    :options="{
                      getTotalShippingPrice: totalShippingPriceFunc,
                    }"
                    :bb="
                      function () {
                        return {
                          model: shippingOptions,
                        };
                      }
                    "
                    @shippingOptionSelected="updateShippingOption"
                    @newAddress="clickNewAddress"
                  />
                </section>
              </template>
              <section class="contentBox padMd clrP clrBr clrSh3">
                <h2 class="h4">
                  {{ ob.polyT('purchase.informationTitle') }}
                  <span class="clrT2 txUnb tx5b">{{ ob.polyT('purchase.optional') }}</span>
                </h2>
                <div class="flexRow gutterH row">
                  <div class="col6">
                    <div class="rowTn">
                      <label for="emailAddress" class="tx5">
                        {{ ob.polyT('purchase.emailAddress') }}
                      </label>
                    </div>
                    <div>
                      <input
                        class="btnHeight clrBr clrP js-purchaseField"
                        type="text"
                        id="emailAddress"
                        name="alternateContactInfo"
                        v-model="formData.emailAddress"
                        @blur="blurEmailAddress"
                        :placeholder="ob.polyT('purchase.emailPlaceholder')"
                      />
                    </div>
                    <div>
                      <span class="txSm clrT2">{{ ob.polyT('purchase.emailNote') }}</span>
                    </div>
                  </div>
                </div>
                <hr class="clrBr row" />
                <div class="rowTn">
                  <label for="memo" class="tx5">
                    {{ ob.polyT('purchase.memo') }}
                  </label>
                </div>
                <textarea
                  class="clrBr clrP js-purchaseField"
                  id="memo"
                  @blur="blurMemo"
                  maxlength="5000"
                  rows="6"
                  :placeholder="ob.polyT('purchase.memoPlaceholder')"
                  v-model="formData.itemsData[0].memo"
                ></textarea>
              </section>
            </template>
            <template v-if="ob.phase === 'pendingPayment'">
              <section class="contentBox padMd clrP clrBr clrSh3">
                <div class="flexColRows gutterVSm">
                  <div>
                    <div class="js-paymentCoin-errors">
                      <FormError v-if="errors['paymentCoin']" :errors="errors['paymentCoin']" />
                    </div>
                    <h2 class="h4 flexExpand required">{{ ob.polyT('purchase.paymentMethodTitle') }}</h2>
                    <PaymentMethodSelector
                      ref="paymentMethodSelector"
                      :disabledMsg="ob.polyT('purchase.cryptoCurrencyInvalid')"
                      v-model="paymentCoin"
                      :isRwaTokenPurchase="ob.isRwaToken"
                      :rwaBlockchain="rwaTokenBlockchain"
                      @methodClicked="onMethodClicked"
                    />
                  </div>
                </div>
              </section>
              
              <!-- Receiving Account配置 - 仅在RWA Token购买时显示 -->
              <section v-if="ob.isRwaToken" class="contentBox padMd clrP clrBr clrSh3">
                <div class="flexColRows gutterVSm">
                  <div>
                    <div class="js-items-paymentAddress-errors">
                      <FormError v-if="errors['items-paymentAddress']" :errors="errors['items-paymentAddress']" />
                    </div>
                    <h2 class="h4 flexExpand required">{{ ob.polyT('purchase.rwaReceivingAccount') }}</h2>
                    
                    <ReceivingAccountSelector
                      :blockchain="rwaTokenBlockchain"
                      @account-selected="onReceivingAccountSelected"
                      @navigate-to-accounts="navigateToReceivingAccounts"
                    />
                  </div>
                </div>
              </section>
              <section v-if="paymentCoin === 'stripe'" class="contentBox padMd clrP clrBr clrSh3">
                <div class="stripe-payment-form">
                  <div id="stripe-payment-element"></div>
                  <div class="payment-summary">
                    <h3>{{ $t('purchase.paymentAmount') }}</h3>
                    <p class="amount">{{ formatCurrency(totalAmount) }}</p>
                  </div>
                  <el-button 
                    type="primary" 
                    :loading="processingPayment"
                    @click="handleStripePayment"
                    class="payment-button"
                  >
                    {{ $t('purchase.confirmPaymentButton') }}
                  </el-button>
                </div>
              </section>
              <section class="contentBox padMd clrP clrBr clrSh3">
                <div class="flexColRows gutterVSm">
                  <div class="flexVCentClearMarg">
                    <h2 class="h4 flexExpand required">{{ ob.polyT('purchase.paymentTypeTitle') }}</h2>
                    <template v-if="showModerators">
                      <input type="checkbox" id="purchaseVerifiedOnly" v-model="showVerifiedOnly" />
                      <label class="tx5b" for="purchaseVerifiedOnly">{{ ob.polyT('settings.storeTab.verifiedOnly') }}</label>
                    </template>
                  </div>
                  <template v-if="showModerators">
                    <div class="js-moderated-errors">
                      <FormError v-if="errors['moderated']" :errors="errors['moderated']" />
                    </div>
                    <div ref="moderatorsWrapper" class="js-moderatorsWrapper">
                      <Moderators
                        ref="moderators"
                        :options="{
                          moderatorIDs: moderatorIDs,
                          useCache: false,
                          fetchErrorTitle: ob.polyT('purchase.errors.moderatorsTitle'),
                          fetchErrorMsg: ob.polyT('purchase.errors.moderatorsMsg'),
                          purchase: true,
                          cardState: 'unselected',
                          notSelected: 'unselected',
                          singleSelect: true,
                          radioStyle: true,
                        }"
                        :showVerifiedOnly="showVerifiedOnly"
                        :modCurrency="paymentCoin"
                        @clickShowUnverified="showVerifiedOnly = false"
                        @cardSelect="onCardSelect"
                      />
                    </div>
                    <div>
                      <div class="clrT2 tx6 rowMd">{{ ob.polyT('purchase.moderatorsDisclaimer') }}</div>
                    </div>
                    <hr class="clrBr row" />
                  </template>
                  <DirectPayment class="moderatorsList" :active="!isModerated" @click="handleDirectPurchaseClick" />
                </div>
              </section>
            </template>
            <template v-if="ob.phase === 'creatingOrder'">
              <section class="contentBox padMd clrP clrBr clrSh3">
                <div class="flexColRows gutterVSm">
                  <div class="txCtr">
                    <h2 class="h4">{{ ob.polyT('purchase.submittingOrder') }}</h2>
                    <p class="clrT2">{{ ob.polyT('purchase.pleaseWait') }}</p>
                  </div>
                </div>
              </section>
            </template>
            <template v-if="ob.phase === 'complete'">
              <section class="contentBox padMd clrP clrBr clrSh3 js-complete">
                <Complete
                  :options="{
                    vendor,
                    orderID,
                  }"
                />
              </section>
            </template>
          </div>
          <div class="col3">
            <section class="contentBox pad clrP clrBr clrSh3 sidebar">
              <i class="cornerTR ion-ios-close-empty iconBtn clrP clrBr clrSh3 closeBtn" @click="clickClose"></i>
              <div class="js-actionBtn">
                <ActionBtn
                  ref="actionBtn"
                  :phase="ob.phase"
                  :outdatedHash="outdatedHash"
                  :bb="
                    function () {
                      return {
                        oneListing,
                      };
                    }
                  "
                  @purchase="purchaseListing"
                  @pay="payListing"
                  @close="close"
                  @reloadOutdated="onReloadOutdated"
                />
              </div>
              <div class="rowLg">
                <!-- <div class="js-receipt"></div> -->
                <Receipt
                  v-if="order"
                  :key="orderKey"
                  :options="{
                    prices,
                    coupons: couponObj,
                    showTotalTip: _state.phase === 'checkout',
                    totalShippingPrice: selectedShippingPrice,
                  }"
                  :bb="
                    function () {
                      return {
                        model: order,
                        listing: oneListing,
                      };
                    }
                  "
                />
                <template v-if="showModerators">
                  <hr class="clrBr" />
                  <div class="padSm txSm txCtr clrT2">
                    {{ ob.polyT('purchase.moderatorNote') }}
                  </div>
                </template>
              </div>
              <div ref="feeChangeContainer" class="tx6 js-feeChangeContainer">
                <FeeChange />
              </div>
            </section>
          </div>
        </div>
      </template>
    </BaseModal>
    <Teleport to="#js-vueModal">
      <Settings v-if="showSettings" :options="{ initialTab: 'Addresses' }" @close="closeSettings" />
    </Teleport>
  </div>
</template>

<script>
import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import bigNumber from 'bignumber.js';
import 'velocity-animate';
import { ERROR_DUST_AMOUNT } from '../../../../backbone/constants';
import { removeProp } from '../../../../backbone/utils/object';
import app from '../../../../backbone/app';
import { myPost, myGet } from '../../../api/api.js';
// import {
//   getInventory,
//   events as inventoryEvents,
// } from '../../../utils/inventory';
import { startAjaxEvent, endAjaxEvent } from '../../../../backbone/utils/metrics';
import { toStandardNotation } from '../../../../backbone/utils/number';
import { convertCurrency, decimalToInteger, integerToDecimal, isValidCoinDivisibility, curDefToDecimal, getCoinDivisibility } from '../../../../backbone/utils/currency';
import { capitalize } from '../../../../backbone/utils/string';
import { events as outdatedListingHashesEvents } from '../../../../backbone/utils/outdatedListingHashes';
import Order from '../../../../backbone/models/purchase/Order';
import Item from '../../../../backbone/models/purchase/Item';
import OrderListings from '../../../../backbone/collections/OrderListings';
import { openSimpleMessage } from '../../../../backbone/views/modals/SimpleMessage';
import PopInMessage, { buildRefreshAlertMessage } from '../../../../backbone/views/components/PopInMessage';
import * as casdoor from '../../../utils/casdoor';
import { events } from '../../../../backbone/utils/order';

import ActionBtn from './ActionBtn.vue';
import Complete from './Complete.vue';
import Coupons from './Coupons.vue';
import DirectPayment from './DirectPayment.vue';
import Payment from './Payment.vue';
import Receipt from './Receipt.vue';
import Shipping from './Shipping.vue';

import Settings from '@/views/modals/settings/Settings.vue';

import { ElMessage, ElMessageBox } from 'element-plus';
import PaymentMethodSelector from './PaymentMethodSelector.vue';
import Moderators from '../../../components/global/moderators/Moderators.vue';
import { loadStripe } from '@stripe/stripe-js'
import { useWalletStore } from '@/stores/wallet';
import { tokens, getNetworkTypeByTokenId } from '@/config/token.js';
import { findRwaTokenByCode } from '@/data/rwaTokenMockData.js';
import { rwaMarketplaceService } from '@/services/rwaMarketplaceService.js';
import { getContractAddress, getTokenConfig } from '@/config/rwaMarketplaceConfig.js';
import { ethers } from 'ethers';
import { useAppKitProvider } from '@reown/appkit/vue';
import ReceivingAccountSelector from '@/components/ReceivingAccountSelector.vue';

export default {
  name: 'Purchase',
  components: {
    ActionBtn,
    Complete,
    Coupons,
    Receipt,
    DirectPayment,
    Payment,
    Shipping,
    Settings,
    PaymentMethodSelector,
    Moderators,
    ReceivingAccountSelector,
  },
  props: {
    options: {
      type: Object,
      default: {
        itemsInfo: [],
        vendor: {},
        phase: 'checkout',
      },
    },
    bb: Function,
  },
  setup() {
    const walletStore = useWalletStore();
    return {
      walletStore
    };
  },
  data() {
    return {
      viewKey: 0,
      formData: {
        itemsData: [
          {
            quantity: 0,
            memo: '',
            couponCode: '',
            coupons: [],
          },
        ],
        emailAddress: '',
      },
      paymentCoin: 'USDT',
      _state: {
        phase: 'checkout',
      },
      cart: {},
      vendor: {},
      order: undefined,
      orderKey: 0,
      oneListing: undefined,
      listings: undefined,
      moderators: undefined,
      couponObj: [],
      shippingOptions: undefined,
      cryptoAmountCurrency: '',
      _cryptoQuantity: 0,
      coinName: '',
      moderatorIDs: [],
      showVerifiedOnly: true,
      shipping: {
        selectedAddress: '',
      },
      shippingOptionKey: 0,
      outdatedHash: false,
      orderID: '',
      showModerators: false,
      isModerated: false,
      showSettings: false,
      paymentData: undefined,
      errors: {},
      stripe: null,
      elements: null,
      processingPayment: false,
      switchingNetwork: false,
      _pendingPaymentCoin: null,
      rwaAmountCurrency: 'FCC',
      rwaAmountValue: '1',

      rwaMarketplaceContractAddress: '', // RWA Marketplace合约地址
      isRwaMarketplaceInitialized: false, // RWA Marketplace是否已初始化
    };
  },
  created() {
    this.initEventChain();
    this.loadData(this.options);

    events.on('appkit_network_switched', this.onAppKitNetworkSwitched);
  },
  mounted() {
  },
  unmounted() {
    if (this.orderSubmit) this.orderSubmit.abort();
    if (this.inventoryFetch) this.inventoryFetch.abort();
    clearTimeout(this.quantityKeyUpTimer);

    events.off('appkit_network_switched', this.onAppKitNetworkSwitched);
  },
  computed: {
    isWalletConnected() {
      return this.walletStore.isWalletConnected;
    },
    walletAddress() {
      return this.walletStore.walletAddress;
    },
    currentNetworkType() {
      // 从App.vue获取当前网络类型
      if (!this.walletStore.walletProvider) return null;
      
      // 根据钱包提供者类型判断网络
      if (this.walletStore.networkType === 'ethereum') {
        return 'ethereum';
      } else if (this.walletStore.networkType === 'solana') {
        return 'solana';
      }
      return null;
    },
    rwaTokenBlockchain() {
      if (!this.ob.isRwaToken || !this.oneListing) {
        return '';
      }
      
      // 使用 cryptoListingCurrencyCode 查找 RWA Token
      const cryptoListingCurrencyCode = this.oneListing.get('item').get('cryptoListingCurrencyCode');
      if (!cryptoListingCurrencyCode) {
        return '';
      }
      
      // 通过 findRwaTokenByCode 查找 RWA Token 信息
      const rwaToken = findRwaTokenByCode(cryptoListingCurrencyCode);
      if (!rwaToken) {
        return '';
      }
      
      return rwaToken.blockchain;
    },
    ob() {
      const item = this.order.get('items').at(0);
      let uiQuantity = item ? item.get('quantity') : 0;

      if (this.oneListing?.isCrypto && this._cryptoQuantity !== undefined) {
        uiQuantity = uiQuantity instanceof bigNumber && !uiQuantity.isNaN() ? toStandardNotation(this._cryptoQuantity) : this._cryptoQuantity;
      }

      return {
        ...this.templateHelpers,
        ...this.order.toJSON(),
        ...this._state,
        listings: this.itemsToPurchase.toJSON(),
        itemConstraints: this.order.get('items').at(0).constraints,
        quantity: uiQuantity,
        isCrypto: this.oneListing.isCrypto,
        isRwaToken: this.oneListing.get('metadata').get('contractType') === 'RWA_TOKEN',
        phaseClass: `phase${capitalize(this._state.phase)}`,
      };
    },
    helperMessage() {
      const warning =
        this.phase === 'checkout' || this.phase === 'creatingOrder'
          ? `<b>${ob.polyT('purchase.cryptoAddressHelperWarning')}</b>`
          : `<b>${ob.polyT('purchase.cryptoAddressHelperWarning2')}</b>`;

      return ob.polyT('purchase.cryptoAddressHelper', {
        name: this.vendor.name,
        coinType: this.coinName,
        warning,
      });
    },
    prices() {
      let access = this.orderKey;

      // return an array of price objects that matches the items in the order
      return this.order.get('items').map((item, idx) => {
        const shipping = item.get('shipping');
        const sName = shipping.get('name');
        const sService = shipping.get('service');
        const sOpt = this.shippingOptions.findWhere({ name: sName });
        const sOptService = sOpt ? sOpt.get('services').findWhere({ name: sService }) : '';

        const listing = this.itemsToPurchase.get(item.id);
        const variationOptions = listing.get('item').get('options').toJSON().filter((option) => option.variation && option.variants && option.variants.length).map((option) => option.name);

        const options = item.get('options').toJSON();
        const selections = [];
        options.forEach((option) => {
          if (variationOptions.includes(option.name)) {
            selections.push({ option: option.name, variant: option.value });
          }
        });

        const sku = listing
          .get('item')
          .get('skus')
          .find((v) => _.isEqual(v.get('selections'), selections));

        const optionalFeatures = this.itemsInfo[idx].optionalFeatures || [];
        let oPrice = bigNumber(0);
        optionalFeatures.forEach((feature) => {
            oPrice = oPrice.plus(feature.surcharge);
        });

        return {
          title: listing.get('item').get('title'),
          price: bigNumber(listing.price.amount),
          sPrice: bigNumber(sOptService ? sOptService.get('firstFreight') || 0 : 0),
          vPrice: bigNumber(sku ? sku.get('surcharge') || 0 : 0),
          oPrice,
          quantity: bigNumber(item.get('quantity')),
          currency: listing.price.currencyCode,
        };
      });
    },
    displayCurrency() {
      return app.settings.get('localCurrency');
    },
    totalShippingPriceFunc() {
      return this.getTotalShippingPrice.bind(this);
    },
    selectedShippingPrice() {
      let access1 = this.formData.itemsData[0].quantity;
      let access2 = this.shippingOptionKey;

      const item = this.order.get('items').at(0);

      const shipping = item.get('shipping');
      if (!shipping) {
        return bigNumber(0);
      }

      const sName = shipping.get('name');
      const sService = shipping.get('service');

      return this.getTotalShippingPrice(sName, sService);
    },
    totalAmount() {
      return this.prices.reduce((total, price) => {
        // 计算单个商品的总价：单价 × 数量
        const itemTotal = price.price.plus(price.vPrice).plus(price.sPrice).times(price.quantity);
        return total.plus(itemTotal);
      }, bigNumber(0))
    },

    canSelectPayment() {
      return !this.switchingNetwork;
    },
  },
  methods: {
    curDefToDecimal,

    totalPrice(i) {
      return this.prices[i].price.plus(this.prices[i].vPrice);
    },
    pricingCurrency(i) {
      return this.prices[i].currency;
    },

    getListingCoinDivisibility(listing) {
      let currencyCode;
      try {
        currencyCode = listing.isCrypto ? listing.get('item').cryptoListingCurrencyCode : listing.get('metadata').get('pricingCurrency').code;
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
    },

    getTotalShippingPrice(shippingOptionName, shippingServiceName) {
      const sOpt = this.shippingOptions.findWhere({ name: shippingOptionName });
      const sOptService = sOpt ? sOpt.get('services').findWhere({ name: shippingServiceName }) : '';

      if (!sOpt || !sOptService || sOpt.type === 'LOCAL_PICKUP') {
        return { price: bigNumber(0), currency: undefined };
      }

      const sOption = sOpt.toJSON();
      const sService = sOptService.toJSON();

      let gramsTotal = bigNumber(0);
      this.order.get('items').forEach((item) => {
        const listing = this.itemsToPurchase.get(item.id);
        const itemGrams = listing.get('item').get('grams');

        gramsTotal = gramsTotal.plus(bigNumber(itemGrams).times(bigNumber(item.get('quantity'))));
      });
      if (gramsTotal.eq(bigNumber(0))) {
        return { price: bigNumber(0), currency: sOption.currency };
      }

      const firstFreight = bigNumber(sService.firstFreight);
      let renewalFee = bigNumber(0);
      if (sOption.serviceType === 'FIRST_RENEWAL_FEE') {
        if (gramsTotal.gt(bigNumber(sService.firstWeight))) {
          const unitAmount = gramsTotal.minus(bigNumber(sService.firstWeight)).div(bigNumber(sService.renewalUnitWeight).integerValue(bigNumber.ROUND_CEIL));
          renewalFee = bigNumber(sService.renewalUnitPrice).times(unitAmount);
        }
      }

      return { price: firstFreight.plus(renewalFee).plus(bigNumber(sService.registrationFee)), currency: sOption.currency };
    },

    hasCoupons(listing) {
      return listing && listing?.coupons.length && listing?.metadata.contractType !== 'CRYPTOCURRENCY';
    },

    loadData(options = {}) {
      if (!this.itemsToPurchase || !(this.itemsToPurchase instanceof OrderListings)) {
        throw new Error('Please provide a OrderListings model');
      }

      if (!options.vendor) {
        throw new Error('Please provide a vendor object');
      }

      this.baseInit(options);

      this._state.phase = 'checkout';

      this.oneListing = this.itemsToPurchase.at(0);

      this.shippingOptions = this.oneListing.get('shippingOptions');
      const moderatorIDs = this.oneListing.get('moderators') || [];
      const disallowedIDs = [app.profile.id, this.vendor.peerID];
      this.moderatorIDs = _.without(moderatorIDs, ...disallowedIDs);

      this.showModerators = this.moderatorIDs.length > 0;

      this.couponObj = new Array(this.itemsToPurchase.length).fill([]);

      this.order = new Order(
        {},
        {
          shippable: !!(this.shippingOptions && this.shippingOptions.length),
          moderated: this.moderatorIDs.length && app.verifiedMods.matched(this.moderatorIDs).length,
        }
      );

      /*
         to support multiple items in a purchase in the future, pass in listings in the options,
         and add them to the order as items here.
      */
      this.formData.itemsData = [];
      this.itemsToPurchase.forEach((listing, i) => {
        const item = new Item(
          {
            listingHash: listing.get('hash'),
            quantity: this.itemsInfo[i].quantity ? bigNumber(this.itemsInfo[i].quantity) : bigNumber('1'),
            options: this.itemsInfo[i].variants || [], // Need update to the selected listing variants for each listing
            optionalFeatures: this.itemsInfo[i].optionalFeatures?.map(item => item.name) || [],
          },
          {
            isCrypto: listing.isCrypto,
            // inventory: () =>
            //   (
            //     typeof this.inventory === 'number' ?
            //       this.inventory : 99999999999999999
            //   ),
            getCoinDiv: () => this.getListingCoinDivisibility(listing),
            getCoinType: () => listing.get('metadata').get('coinType'),
          }
        );
        // add the item to the order.
        this.order.get('items').add(item);

        this.formData.itemsData.push({
          quantity: item.get('quantity'),
        });
      });

      this.cryptoAmountCurrency = this.oneListing.get('item').get('cryptoListingCurrencyCode');

      // 初始化RWA Token数量
      if (this.oneListing.get('metadata').get('contractType') === 'RWA_TOKEN') {
        const minQuantity = Number(this.oneListing.get('item').get('minQuantity')) || 1;
        this.rwaAmountValue = minQuantity.toString();
      }

      // If the parent has the inventory, pass it in, otherwise we'll fetch it.
      // -- commenting out for now since inventory is not functioning properly on the server
      // this.inventory = this.options.inventory;
      // if (
      //   this.oneListing.isCrypto &&
      //   typeof this.inventory !== 'number'
      // ) {
      //   this.inventoryFetch = getInventory(
      //     this.oneListing.get('vendorID').peerID,
      //     {
      //       slug: this.oneListing.get('slug'),
      //       coinDivisibility:
      //         this.oneListing.get('metadata')
      //           .get('coinDivisibility'),
      //     }
      //   ).done(e => (this.inventory = e.inventory));
      //   this.listenTo(inventoryEvents, 'inventory-change',
      //     e => (this.inventory = e.inventory));
      // }

      this.listenTo(app.settings, 'change:localCurrency', () => this.showDataChangedMessage());
      this.listenTo(app.localSettings, 'change:bitcoinUnit', () => this.showDataChangedMessage());

      this.hasVerifiedMods = app.verifiedMods.matched(this.moderatorIDs).length > 0;

      this.listenTo(app.verifiedMods, 'update', () => {
        const newHasVerifiedMods = app.verifiedMods.matched(moderatorIDs).length > 0;
        if (newHasVerifiedMods !== this.hasVerifiedMods) {
          this.hasVerifiedMods = newHasVerifiedMods;
          this.showDataChangedMessage();
        }
      });

      this._latestHash = this.oneListing.get('hash');
      this._renderedHash = null;

      this.listenTo(outdatedListingHashesEvents, 'newHash', (e) => {
        this._latestHash = e.oldHash;
        if (e.oldHash === this._renderedHash) this.outdateHash();
      });
    },

    onReloadOutdated() {
      let defaultPrevented = false;

      this.$emit('clickReloadOutdated', {
        preventDefault: () => (defaultPrevented = true),
      });

      setTimeout(() => {
        if (!defaultPrevented) {
          Backbone.history.loadUrl();
        }
      });
    },

    showDataChangedMessage() {
      if (this.dataChangePopIn && !this.dataChangePopIn.isRemoved()) {
        this.dataChangePopIn.$el.velocity('callout.shake', { duration: 500 });
      } else {
        this.dataChangePopIn = this.createChild(PopInMessage, {
          messageText: buildRefreshAlertMessage(app.polyglot.t('purchase.purchaseDataChangedPopin')),
        });

        this.listenTo(this.dataChangePopIn, 'clickRefresh', () => {
          this.viewKey += 1;
        });

        this.listenTo(this.dataChangePopIn, 'clickDismiss', () => {
          this.dataChangePopIn.remove();
          this.dataChangePopIn = null;
        });

        $(this.$refs.popInMessages).append(this.dataChangePopIn.render().el);
      }
    },

    goToListing() {
      app.router.navigate(`${this.vendor.peerID}/store/${this.oneListing.get('slug')}`, { trigger: true });
      this.close();
    },

    clickGoToListing() {
      if (this.origin === 'ShoppingCart') {
        this.close();
        return;
      }
      this.goToListing();
    },

    clickClose() {
      this.$emit('closeBtnPressed');
      this.close();
    },

    handleDirectPurchaseClick() {
      if (!this.isModerated) return;

      if (this.$refs.moderators) {
        this.$refs.moderators.deselectOthers();
        this.isModerated = this.$refs.moderators.selectedIDs.length > 0;
      }
    },

    onCardSelect() {
      this.isModerated = this.$refs.moderators.selectedIDs.length > 0;
    },

    changeCryptoAddress(e) {
      this.order.get('items').at(0).set('paymentAddress', e.target.value);
    },

    setModelQuantity(idx, quantity) {
      let cur = this.cryptoAmountCurrency;

      if (this.oneListing.isCrypto && (typeof cur !== 'string' || !cur)) {
        throw new Error('Please provide the currency code as a valid, non-empty string.');
      }

      this.order.get('items').at(idx).set({ quantity });

      this.orderKey += 1;
    },

    onChangeCryptoAmount(e) {
      this._cryptoQuantity = e.target.value;
    },

    changeCryptoAmountCurrency(idx) {
      this.setModelQuantity(idx, this._cryptoQuantity);
    },

    keyupQuantity(idx) {
      // wait until they stop typing
      if (this.quantityKeyUpTimer) {
        clearTimeout(this.quantityKeyUpTimer);
      }

      this.quantityKeyUpTimer = setTimeout(() => {
        let quantity;
        
        if (this.ob.isRwaToken) {
          // 对于 RWA Token，从 rwaAmountValue 获取数量
          quantity = parseFloat(this.rwaAmountValue) || 0;
          // 验证数量范围
          const listing = this.oneListing;
          const minQuantity = Number(listing.get('item').get('minQuantity')) || 1;
          const maxQuantity = Number(listing.get('item').get('maxQuantity')) || 100;
          
          if (quantity < minQuantity) {
            quantity = minQuantity;
            this.rwaAmountValue = minQuantity.toString();
          } else if (quantity > maxQuantity) {
            quantity = maxQuantity;
            this.rwaAmountValue = maxQuantity.toString();
          }
          // 确保RWA Token的数量使用 bigNumber
          quantity = bigNumber(quantity);
        } else {
          // 对于普通商品，从表单数据获取数量
          quantity = this.formData.itemsData[idx]?.quantity;
          if (quantity != null) {
            quantity = bigNumber(quantity);
          }
        }
        
        if (this.oneListing.isCrypto) this._cryptoQuantity = quantity;
        this.setModelQuantity(idx, quantity);
      }, 150);
    },

    clickNewAddress() {
      this.showSettings = true;
    },

    closeSettings() {
      this.showSettings = false;
    },

    applyCoupon(idx) {
      this.$refs.coupons[idx].addCode(this.formData.itemsData[idx].couponCode).then((result) => {
        // if the result is valid, clear the input field
        if (result.type === 'valid') {
          this.formData.itemsData[idx].couponCode = '';
        }
      });
    },

    blurEmailAddress() {
      this.order.set('alternateContactInfo', this.formData.emailAddress);
    },

    blurMemo() {
      this.order.get('items').at(0).set('memo', this.formData.itemsData[0].memo);
    },

    changeCoupons(idx, $event) {
      const { hashes, codes } = $event;

      // combine the codes and hashes so the receipt can check both.
      // if this is the user's own listing they will have codes instead of hashes
      const hashesAndCodes = hashes.concat(codes);
      const filteredCoupons = this.itemsToPurchase
        .at(idx)
        .get('coupons')
        .filter((coupon) => hashesAndCodes.indexOf(coupon.get('hash') || coupon.get('discountCode')) !== -1);
      this.couponObj[idx] = filteredCoupons.map((coupon) => coupon.toJSON());

      this.order.get('items').at(idx).set('coupons', codes);
    },

    updateShippingOption(selectedOption) {
      // Set the shipping option.
      this.order.get('items').forEach((item) => {
        item.get('shipping').set(selectedOption);
      });

      this.shippingOptionKey += 1;
    },

    outdateHash() {
      this.outdatedHash = true;
    },

    async purchaseListing() {
      // 检查是否需要登录
      if (!import.meta.env.VITE_APP && !casdoor.isLoggedIn()) {
        ElMessageBox.confirm(
          app.polyglot.t('purchase.loginConfirm.body'), 
          app.polyglot.t('purchase.loginConfirm.title'),
          {
            confirmButtonText: app.polyglot.t('purchase.loginConfirm.btnLogin'),
            cancelButtonText: app.polyglot.t('purchase.loginConfirm.btnCancel'),
            type: 'info'
          }
        ).then(() => {
          // 保存当前路径用于登录后跳回
          const currentPath = location.pathname + location.hash;
          const redirect = encodeURIComponent(currentPath);
          window.location.href = casdoor.getSigninUrl() + `&redirect_uri=${redirect}`;
        }).catch(() => {
          // 取消登录,不做任何操作
        });
        return;
      }

      // Clear any old errors.
      this.errors = {};

      // Don't allow a zero or negative price purchase.
      const priceObj = this.prices[0];
      if (priceObj.price.plus(priceObj.vPrice).plus(priceObj.sPrice).lte(0)) {
        this.insertErrors('js-errors', [app.polyglot.t('purchase.errors.zeroPrice')]);
        this.setState({ phase: 'checkout' });
        return;
      }

      // 处理不同的支付方式
      if (this.paymentCoin === 'stripe') {
        // 处理Stripe支付
        this.processStripePayment();
        return;
      } else if (this.paymentCoin === 'paypal') {
        // 处理PayPal支付
        this.processPayPalPayment();
        return;
      }

      // 原有的加密货币支付处理逻辑
      // Set the payment coin.
      let paymentCoin = this.paymentCoin;
      this.order.set({ paymentCoin });

      // Set the shipping address if the listing is shippable.
      if (this.$refs.shipping && this.$refs.shipping.selectedAddress) {
        this.order.addAddress(this.$refs.shipping.selectedAddress);
      }

      // Set the moderator.
      const moderator = (this.$refs.moderators && this.$refs.moderators.selectedIDs?.length > 0 && this.$refs.moderators.selectedIDs[0]) || '';
      this.order.set({ moderator });
      this.order.set({}, { validate: true });

      // Cancel any existing order.
      if (this.orderSubmit) this.orderSubmit.abort();

      this.setState({ phase: 'creatingOrder' });

      startAjaxEvent('Purchase');
      const segmentation = {
        paymentCoin,
        moderated: !!moderator,
      };

      if (!this.order.validationError) {
        if (this.oneListing.isOwnListing) {
          this.setState({ phase: 'checkout' });
          // don't allow a seller to buy their own items
          const errTitle = app.polyglot.t('purchase.errors.ownIDTitle');
          const errMsg = app.polyglot.t('purchase.errors.ownIDMsg');
          openSimpleMessage(errTitle, errMsg);
          endAjaxEvent('Purchase', {
            ...segmentation,
            errors: 'own listing',
          });
        } else {
          const coinDivisibility = this.getListingCoinDivisibility(this.oneListing);
          const cryptoItems = [];

          if (this.oneListing.isCrypto) {
            if (!isValidCoinDivisibility(coinDivisibility)[0]) {
              this.setState({ phase: 'checkout' });
              openSimpleMessage(app.polyglot.t('purchase.errors.genericPurchaseErrTitle'), app.polyglot.t('purchase.errors.invalidCoinDiv'));
              return;
            }

            try {
              const items = this.order.get('items');
              for (let i = 0; i < items.length; i += 2) {
                const item = items.at(i);
                cryptoItems.push({
                  ...item.toJSON(),
                  quantity: decimalToInteger(item.get('quantity'), coinDivisibility),
                });
              }
            } catch (e) {
              this.setState({ phase: 'checkout' });
              openSimpleMessage(app.polyglot.t('purchase.errors.genericPurchaseErrTitle'), app.polyglot.t('purchase.errors.unableToConvertCryptoQuantity'));
              console.error(e);
              return;
            }
          }

          // Strip the 'cid' so it doesn't go to the server. Normally this is
          // done in the sync of the baseModel, but since we're POSTing outside of
          // that, we'll replicate that cleanup here.
          let pricingCoin = this.oneListing.get('metadata').get('pricingCurrency').code
          const postData = removeProp(
            {
              ...this.order.toJSON(),
              pricingCoin,
              items: this.oneListing.isCrypto ? cryptoItems : this.order.get('items').toJSON(),
            },
            'cid'
          );

          myPost(app.getServerUrl('order/purchase'), postData)
            .done((data) => {
              this.setState({ phase: 'pendingPayment' });

              this.paymentData = data;
              this.orderID = data.orderID;

              endAjaxEvent('Purchase');
            })
            .fail((jqXHR) => {
              this.setState({ phase: 'checkout' });
              if (jqXHR.statusText === 'abort') return;
              let errTitle = app.polyglot.t('purchase.errors.orderError');
              let errMsg = (jqXHR.responseJSON && jqXHR.responseJSON.reason) || '';

              if (jqXHR.responseJSON && jqXHR.responseJSON.code === 'ERR_INSUFFICIENT_INVENTORY' && typeof jqXHR.responseJSON.remainingInventory === 'number') {
                this.inventory = jqXHR.responseJSON.remainingInventory / coinDivisibility;
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
        this.setState({ phase: 'checkout' });
        const purchaseErrs = {};
        Object.keys(this.order.validationError).forEach((errKey) => {
          const domKey = errKey.replace(/\[[^\[\]]*\]/g, '').replace('.', '-');
          let container = domKey;
          // if no container exists, use the generic container
          container = container.length ? container : 'js-errors';
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
    },

    async payListing() {
      // 对于RWA Token，使用RWA Marketplace合约
      if (this.ob.isRwaToken) {
        // 检查是否已设置支付地址
        const paymentAddress = this.order.get('items').at(0).get('paymentAddress');
        if (!paymentAddress) {
          this.insertErrors('items-paymentAddress', [app.polyglot.t('purchase.errors.noReceivingAccountSelected')]);
          return;
        }

        // 使用RWA Marketplace处理购买
        await this.processRwaTokenPurchase();
        return;
      }
      
      // 对于其他商品，使用原有的支付流程
      // 根据支付币种选择不同的处理方式
      if (this.paymentCoin === 'ETH') {
        await this.processEthPayment();
      } else if (this.paymentCoin === 'SOL' || this.paymentCoin === 'SOLUSDT') {
        await this.processSolPayment();
      }
    },

    insertErrors(container, errors = []) {
      this.errors[container] = errors;
    },

    render() {
      this._renderedHash = this.oneListing.get('hash');

      return this;
    },

    onMethodClicked(methodId) {
      console.log('onMethodClicked: ', methodId);
      const token = tokens.find(t => t.id === methodId)
      if (token && token.chain) {
        const chain = token.chain;
        if (chain) {
          this.switchingNetwork = true;
          console.log('trigger switchAppKitNetwork: ', chain);
          events.trigger('switchAppKitNetwork', { chain });

          this._pendingPaymentCoin = methodId;
          return;
        }
      }

      this.setPaymentCoin(methodId);
    },

    onAppKitNetworkSwitched({ chain }) {
      console.log('onAppKitNetworkSwitched: ', chain);
      if (this._pendingPaymentCoin) {
        this.setPaymentCoin(this._pendingPaymentCoin);
        this._pendingPaymentCoin = null;
      }
      this.switchingNetwork = false;
    },

    setPaymentCoin(methodId) {
      this.paymentCoin = methodId;
      if (methodId === 'stripe') {
        this.isModerated = false
        if (this.$refs.moderators) {
          this.$refs.moderators.deselectOthers()
        }
        // 初始化Stripe
        this.initializeStripe()
      }
      this.order.set({ paymentCoin: methodId })
    },

    // 添加Stripe支付处理方法
    async initializeStripe() {
      try {
        // 从后端获取Stripe公钥
        const response = await myGet('/v1/stripe/public-key')
        this.stripe = await loadStripe(response.publicKey)
        
        // 获取商户的Stripe账户ID
        const merchantResponse = await myGet('/v1/stripe/account-status');
        if (!merchantResponse.stripeAccountId) {
          throw new Error('商户未完成Stripe账户设置');
        }

        // 创建支付意向
        const paymentIntentResponse = await myPost('/v1/stripe/payment-intent', {
          amount: parseInt(this.totalAmount * 100 * 100), // 转换为分
          currency: 'USD', // 使用人民币
          orderId: this.orderID
        });

        if (!paymentIntentResponse.clientSecret) {
          throw new Error('创建支付意向失败');
        }

        // 创建支付元素
        const elements = this.stripe.elements({
          clientSecret: paymentIntentResponse.clientSecret,
          locale: 'en',
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#409EFF',
            }
          }
        })
        
        // 挂载支付元素
        const paymentElement = elements.create('payment')
        paymentElement.mount('#stripe-payment-element')
        this.elements = elements
      } catch (error) {
        console.error('初始化Stripe失败:', error)
        ElMessage.error('初始化支付失败，请重试')
      }
    },

    async handleStripePayment() {
      if (!this.stripe || !this.elements) {
        ElMessage.error('支付系统未初始化');
        return;
      }

      try {
        this.processingPayment = true;
        
        // 确认支付
        const { error, paymentIntent } = await this.stripe.confirmPayment({
          elements: this.elements,
          confirmParams: {
            return_url: `${window.location.origin}/payment/complete`,
          },
          redirect: 'if_required'
        });

        if (error) {
          throw new Error(error.message);
        }

        if (paymentIntent.status === 'succeeded') {
          // 支付成功，更新订单状态
          await this.updateStripeOrderStatus(paymentIntent);
          this.setState({ phase: 'complete' });
          ElMessage.success(this.$t('purchase.paymentSuccess'));
        }
      } catch (error) {
        console.error('支付处理失败:', error);
        ElMessage.error(error.message || '支付失败，请重试');
      } finally {
        this.processingPayment = false;
      }
    },

    async updateStripeOrderStatus(paymentIntent) {
      try {
        // 构建支付数据
        const paymentData = {
          orderID: this.orderID,
          transactionID: paymentIntent.id,
          coin: 'STRIPE' + paymentIntent.currency.toUpperCase(), // 使用支付货币类型
          amount: paymentIntent.amount,
          // 支付时间
          timestamp: new Date(paymentIntent.created * 1000).toISOString(),
        };

        // 发送到后端
        await myPost('/v1/order/payment', { paymentData });
        
      } catch (error) {
        console.error('更新订单状态失败:', error);
        throw error;
      }
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY'
      }).format(amount)
    },

    async checkWalletConnectionWithPrompt(requiredNetworkType = null) {
      const isConnected = await this.walletStore.checkWalletConnection(requiredNetworkType);
      if (!isConnected) {
        let message = this.$t('purchase.pleaseConnectWallet');
        if (requiredNetworkType) {
          if (this.walletStore.isConnected && this.currentNetworkType !== requiredNetworkType) {
            message = `请切换到${requiredNetworkType}网络，当前网络为${this.currentNetworkType}`;
          } else {
            message = `请连接${requiredNetworkType}钱包`;
          }
        }
        
        const confirmed = await ElMessageBox.confirm(
          message,
          '提示',
          {
            confirmButtonText: '连接钱包',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        if (confirmed) {
          events.trigger('connectWallet');
        }
        return false;
      }
      return true;
    },

    /**
     * 处理支付完成后的操作
     */
    async handlePaymentCompletion(paymentData, transactionResult) {
      paymentData.transactionID = transactionResult;
      paymentData.timestamp = new Date().toISOString();

      try {
        await myPost(app.getServerUrl('order/payment'), { paymentData });
        this.setState({ phase: 'complete' });
      } catch (error) {
        ElMessage({
          message: error?.message || '发送支付信息失败',
          type: 'error',
          duration: 3000
        });
        throw error;
      }
    },

    /**
     * 统一的加密货币支付处理方法
     * @param {string} paymentType - 'solana' 或 'ethereum'
     */
    async processCryptoPayment(paymentType) {
      try {
        // 1. 检查钱包连接和网络类型
        const requiredNetworkType = getNetworkTypeByTokenId(this.paymentCoin);
        const isWalletConnected = await this.checkWalletConnectionWithPrompt(requiredNetworkType);
        if (!isWalletConnected) return;

        // 2. 获取仲裁人
        const moderator = (this.$refs.moderators && this.$refs.moderators.selectedIDs?.length > 0 && this.$refs.moderators.selectedIDs[0]) || null;

        // 3. 处理汇率转换
        let convertedAmount = this.paymentData.amount.amount;
        
        // 如果定价币种和支付币种不同，需要进行汇率转换
        if (this.paymentData.pricingCoin !== this.paymentCoin) {
          try {
            // 获取源币种和目标币种的精度
            const fromDivisibility = getCoinDivisibility(this.paymentData.pricingCoin);
            const toDivisibility = getCoinDivisibility(this.paymentCoin);
        
            // 将最小精度单位转换为标准单位
            const amountInStandardUnit = integerToDecimal(this.paymentData.amount.amount, fromDivisibility).toNumber();
  
            // 使用 currency.js 中的 convertCurrency 方法进行汇率转换
            const convertedAmountInStandardUnit = convertCurrency(
              amountInStandardUnit,
              this.paymentData.pricingCoin,
              this.paymentCoin
            );

            // 转换为最小精度单位
            convertedAmount = decimalToInteger(convertedAmountInStandardUnit, toDivisibility).toNumber();
            
            console.log(`汇率转换: ${amountInStandardUnit} ${this.paymentData.pricingCoin} = ${convertedAmountInStandardUnit} ${this.paymentCoin} (${convertedAmount} 最小单位)`);
          } catch (error) {
            throw new Error(`汇率转换失败: ${error.message}`);
          }
        }

        // 4. 构建请求数据
        const requestData = {
          orderID: this.orderID,
          payerAddress: this.walletAddress,
          moderator: moderator ? moderator : null,
          coinType: this.paymentCoin,
          amount: convertedAmount
        };

        // 5. 获取支付指令
        const response = await myPost(app.getServerUrl('instructions/order/payment'), requestData);
        if (!response || !response.instructions) {
          throw new Error('获取订单支付指令失败');
        }
        if (!response.paymentData) {
          throw new Error('获取订单支付数据失败');
        }

        // 6. 执行交易 - 使用统一事件系统
        return await this.executeTransaction(paymentType, response);

      } catch (error) {
        console.error(`${paymentType}支付处理失败:`, error);
        ElMessage({
          message: error.message || `${paymentType}支付处理失败`,
          type: 'error',
          duration: 3000
        });
        throw error;
      }
    },

    /**
     * 执行交易 - 使用统一事件系统
     */
    async executeTransaction(paymentType, response) {
      // 触发统一的加密货币交易事件
      events.trigger('executeCryptoTransaction', {
        networkType: paymentType,
        orderID: this.orderID,
        transactionData: response.instructions,
        metadata: response.paymentData
      });

      // 等待交易完成
      return new Promise((resolve, reject) => {
        const handleTransactionComplete = (e) => {
          if (e.orderID === this.orderID && e.networkType === paymentType) {
            this.cleanupEventListeners(handleTransactionComplete, handleTransactionError);
            
            this.handlePaymentCompletion(e.metadata, e.result)
              .then(resolve)
              .catch(reject);
          }
        };

        const handleTransactionError = (e) => {
          if (e.orderID === this.orderID && e.networkType === paymentType) {
            this.cleanupEventListeners(handleTransactionComplete, handleTransactionError);
            
            let errorMessage = e.error?.message || '交易失败';
            if (paymentType === 'solana' && errorMessage.includes('Error Number: 3012')) {
              errorMessage = 'Insufficient balance or token not found';
            }
            
            ElMessage({
              message: errorMessage,
              type: 'error',
              duration: 3000
            });
            reject(e.error);
          }
        };

        // 绑定事件监听器
        events.on('cryptoTransactionComplete', handleTransactionComplete);
        events.on('cryptoTransactionError', handleTransactionError);
      });
    },

    /**
     * 清理事件监听器
     */
    cleanupEventListeners(completeHandler, errorHandler) {
      events.off('cryptoTransactionComplete', completeHandler);
      events.off('cryptoTransactionError', errorHandler);
    },

    async processSolPayment() {
      return await this.processCryptoPayment('solana');
    },

    async processEthPayment() {
      return await this.processCryptoPayment('ethereum');
    },

    onChangeRwaAmount() {
      const quantity = parseFloat(this.rwaAmountValue) || 0;
      const listing = this.oneListing;
      
      // 确保 minQuantity 和 maxQuantity 是数字类型
      const minQuantity = Number(listing.get('item').get('minQuantity')) || 1;
      const maxQuantity = Number(listing.get('item').get('maxQuantity')) || 100;
      
      // 验证数量范围
      if (quantity < minQuantity) {
        ElMessage({
          message: `购买数量不能少于 ${minQuantity}`,
          type: 'warning',
          duration: 3000
        });
        this.rwaAmountValue = minQuantity.toString();
        this.setModelQuantity(0, bigNumber(minQuantity));
      } else if (quantity > maxQuantity) {
        ElMessage({
          message: `购买数量不能超过 ${maxQuantity}`,
          type: 'warning',
          duration: 3000
        });
        this.rwaAmountValue = maxQuantity.toString();
        this.setModelQuantity(0, bigNumber(maxQuantity));
      } else if (quantity > 0) {
        // 只有有效数量才更新模型，确保使用 bigNumber
        this.setModelQuantity(0, bigNumber(quantity));
      }
    },

    changeRwaAmountCurrency(idx) {
      this.order.get('items').at(idx).set('rwaAmountCurrency', this.rwaAmountCurrency);
    },

    getRwaTokenCurrencies() {
      // 根据RWA Token的区块链和支付币种返回可用的币种选项
      const listing = this.oneListing;
      if (!listing || !this.ob.isRwaToken) {
        return ['FCC', this.displayCurrency];
      }

      // 使用计算属性获取区块链信息
      const blockchain = this.rwaTokenBlockchain || 'ETH';
      const acceptedCurrencies = listing.get('metadata').get('acceptedCurrencies') || [];
      
      // 构建币种选项：FCC + 显示币种 + 接受的支付币种
      const currencies = ['FCC'];
      
      if (this.displayCurrency !== 'FCC') {
        currencies.push(this.displayCurrency);
      }
      
      // 添加接受的支付币种
      acceptedCurrencies.forEach(currency => {
        if (!currencies.includes(currency)) {
          currencies.push(currency);
        }
      });
      
      return currencies;
    },

    // 新增方法：导航到接收账户管理页面
    navigateToReceivingAccounts() {
      this.showSettings = true;
      this.$nextTick(() => {
        this.$refs.settings.selectTab('Addresses');
      });
    },

    // 新增方法：接收账户改变时触发
    onReceivingAccountSelected(selectedAccount) {
      if (selectedAccount) {
        // 设置选中的接收账户地址
        this.order.get('items').at(0).set('paymentAddress', selectedAccount.address);
        // 清除之前的错误
        this.errors['items-paymentAddress'] = null;
      } else {
        this.order.get('items').at(0).set('paymentAddress', ''); // 清空地址
        // 显示错误信息
        this.insertErrors('items-paymentAddress', [app.polyglot.t('purchase.errors.noReceivingAccountSelected')]);
      }
    },

    // RWA Marketplace相关方法
    async initializeRwaMarketplace() {
      try {
        if (!this.isWalletConnected) {
          throw new Error(this.$t('purchase.pleaseConnectWallet'));
        }

        // 获取合约地址（这里应该从配置或后端获取）
        const contractAddress = await this.getRwaMarketplaceContractAddress();
        
        // 从App.vue获取正确的钱包提供者
        let walletProvider = null;
        if (this.currentNetworkType === 'ethereum') {
          const { walletProvider: ethProvider } = useAppKitProvider('eip155');
          walletProvider = ethProvider;
        } else if (this.currentNetworkType === 'solana') {
          const { walletProvider: solanaProvider } = useAppKitProvider('solana');
          walletProvider = solanaProvider;
        }
        
        if (!walletProvider) {
          throw new Error('无法获取钱包提供者，请确保钱包已连接');
        }
        
        // 初始化RWA Marketplace服务
        await rwaMarketplaceService.initialize(
          walletProvider,
          'ethereum', // 目前只支持以太坊
          contractAddress
        );

        this.rwaMarketplaceContractAddress = contractAddress;
        this.isRwaMarketplaceInitialized = true;
        
        console.log('✅ RWA Marketplace初始化成功');
        return true;
      } catch (error) {
        console.error('❌ RWA Marketplace初始化失败:', error);
        ElMessage.error(error.message || 'RWA Marketplace初始化失败');
        return false;
      }
    },

    async getRwaMarketplaceContractAddress() {
      try {
        // 使用Sepolia测试网合约地址
        const contractAddress = getContractAddress('rwaMarketplace');
        console.log('🔧 使用Sepolia测试网RWA Marketplace合约地址:', contractAddress);
        return contractAddress;
      } catch (error) {
        console.error('获取合约地址失败:', error);
        throw error;
      }
    },

    async processRwaTokenPurchase() {
      try {
        // 检查钱包连接
        if (!this.isWalletConnected) {
          throw new Error(this.$t('purchase.pleaseConnectWallet'));
        }

        // 检查RWA Marketplace是否已初始化
        if (!this.isRwaMarketplaceInitialized) {
          const initialized = await this.initializeRwaMarketplace();
          if (!initialized) {
            throw new Error('RWA Marketplace初始化失败');
          }
        }

        const requestData = {
          orderID: this.orderID,
          coinType: this.paymentCoin,
          isRwaToken: true,
        };

        // 获取支付指令 - 先调用 instructions/order/payment 获取 buyer 和 seller 地址
        const response = await myPost(app.getServerUrl('instructions/order/payment'), requestData);
        if (!response || !response.buyerAddress || !response.vendorAddress) {
          console.log('🔧 获取订单支付指令失败:', response);
          throw new Error('获取订单支付指令失败');
        }

        // 获取订单数据
        const orderData = this.buildRwaTokenOrderData(response);
        
        // 在创建订单前检查用户余额
        try {
          const balanceInfo = await rwaMarketplaceService.getUserTokenBalance(orderData.paymentTokenAddress);
          console.log('🔧 用户余额信息:', balanceInfo);
          
          // 显示余额信息给用户
          ElMessage.info(`当前${balanceInfo.symbol}余额: ${balanceInfo.formattedBalance}`);
        } catch (balanceError) {
          console.warn('无法获取用户余额:', balanceError);
        }
        
        // 使用统一的事件系统执行RWA Token交易
        return await this.executeRwaTokenTransaction(orderData);
        
      } catch (error) {
        console.error('❌ RWA Token购买失败:', error);
        
        // 根据错误类型显示不同的消息
        let errorMessage = error.message || 'RWA Token购买失败';
        
        if (error.message.includes('余额不足') || error.message.includes('transfer amount exceeds balance')) {
          errorMessage = '代币余额不足，请检查您的钱包余额或充值后重试';
        } else if (error.message.includes('授权额度不足')) {
          errorMessage = '代币授权额度不足，请重新授权后重试';
        }
        
        ElMessage.error(errorMessage);
        throw error;
      }
    },

    /**
     * 执行RWA Token交易 - 使用统一事件系统
     */
    async executeRwaTokenTransaction(orderData) {
      // 构建paymentData用于回调
      const paymentData = {
        isRwaToken: true,
        contractAddress: getContractAddress('rwaMarketplace'),
        orderID: this.orderID,
        coin: this.paymentCoin,
        amount: parseInt(orderData.paymentAmount),
        timestamp: new Date().toISOString(),
        method: 1,
        rwaTokenData: {
          rwaTokenAddress: orderData.rwaTokenAddress,
          rwaTokenAmount: orderData.rwaTokenAmount,
          paymentTokenAddress: orderData.paymentTokenAddress,
          paymentAmount: orderData.paymentAmount,
          buyerReceiveAddress: orderData.buyerReceiveAddress
        }
      };

      // 触发RWA Token交易事件
      events.trigger('executeRwaTokenTransaction', {
        orderID: this.orderID,
        transactionData: orderData,
        paymentData
      });

      // 等待交易完成
      return new Promise((resolve, reject) => {
        const handleRwaTransactionComplete = (e) => {
          if (e.orderID === this.orderID) {
            this.cleanupRwaEventListeners(handleRwaTransactionComplete, handleRwaTransactionError);
            
            this.handlePaymentCompletion(e.paymentData, e.result)
              .then(resolve)
              .catch(reject);
          }
        };

        const handleRwaTransactionError = (e) => {
          if (e.orderID === this.orderID) {
            this.cleanupRwaEventListeners(handleRwaTransactionComplete, handleRwaTransactionError);
            
            let errorMessage = e.error?.message || 'RWA Token交易失败';
            
            // 根据错误类型显示不同的消息
            if (errorMessage.includes('余额不足') || errorMessage.includes('transfer amount exceeds balance')) {
              errorMessage = '代币余额不足，请检查您的钱包余额或充值后重试';
            } else if (errorMessage.includes('授权额度不足')) {
              errorMessage = '代币授权额度不足，请重新授权后重试';
            }
            
            ElMessage({
              message: errorMessage,
              type: 'error',
              duration: 3000
            });
            reject(e.error);
          }
        };

        // 绑定RWA Token交易事件监听器
        events.on('rwaTokenTransactionComplete', handleRwaTransactionComplete);
        events.on('rwaTokenTransactionError', handleRwaTransactionError);
      });
    },

    /**
     * 清理RWA Token事件监听器
     */
    cleanupRwaEventListeners(completeHandler, errorHandler) {
      events.off('rwaTokenTransactionComplete', completeHandler);
      events.off('rwaTokenTransactionError', errorHandler);
    },

    buildRwaTokenOrderData(response = null) {
      const listing = this.oneListing;

      // 获取RWA Token地址
      const rwaTokenCode = listing.get('item').get('cryptoListingCurrencyCode');
      const rwaToken = findRwaTokenByCode(rwaTokenCode);
      const rwaTokenAddress = rwaToken?.contractAddress || '0x0000000000000000000000000000000000000000';
      
      // 获取支付代币地址
      const paymentTokenAddress = this.getPaymentTokenAddress();
      
      // 确保支付代币地址有效
      if (!paymentTokenAddress) {
        throw new Error('支付代币地址无效');
      }
      
      // 获取买家接收地址
      const buyerReceiveAddress = this.order.get('items').at(0).get('paymentAddress') || this.walletStore.walletAddress || '';
      
      // 确保买家接收地址有效
      if (!buyerReceiveAddress || buyerReceiveAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('买家接收地址无效');
      }
      
      // 获取RWA Token数量 - 使用BigNumber确保精度
      const rwaTokenAmount = ethers.parseUnits(
        this.rwaAmountValue.toString(),
        18 // RWA Token通常使用18位小数
      );
      
      // 获取支付金额 - 根据支付代币的精度进行转换
      let paymentAmount;
      if (paymentTokenAddress === '0x0000000000000000000000000000000000000000') {
        // ETH支付
        paymentAmount = ethers.parseEther(this.totalAmount.toString());
      } else {
        // ERC20代币支付 - 需要根据代币精度进行转换
        // 这里假设支付代币使用6位小数（如USDT）
        paymentAmount = ethers.parseUnits(this.totalAmount.toString(), 6);
      }

      return {
        orderId: this.orderID,
        buyer: response.buyerAddress,
        seller: response.vendorAddress,
        rwaTokenAddress,
        paymentTokenAddress,
        buyerReceiveAddress,
        rwaTokenAmount: rwaTokenAmount.toString(),
        paymentAmount: paymentAmount.toString()
      };
    },

    getPaymentTokenAddress() {
      // 根据支付币种返回对应的代币地址
      const tokenMap = {
        'ETH': '0x0000000000000000000000000000000000000000', // ETH使用零地址
        'ETHUSDT': getContractAddress('mockUSDT'), // Sepolia测试网USDT
        'ETHUSDC': getContractAddress('mockUSDC'), // 暂未部署
        'ETHDAI': getContractAddress('mockDAI') // 暂未部署
      };
      
      return tokenMap[this.paymentCoin] || '0x0000000000000000000000000000000000000000';
    },
  },
};
</script>
<style lang="scss" scoped>
.purchaseQuantity {
  input[type='number'] {
    width: 100px;
  }
}
.stripe-payment-form {
  padding: 20px;

  .payment-summary {
    margin: 20px 0;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;

    h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #606266;
    }

    .amount {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
      color: #303133;
    }
  }

  .payment-button {
    width: 100%;
    margin-top: 20px;
  }
}

// RWA Token 接收账户选择器样式
.receivingAccountSelector {
  .accountSelection {
    .accountInfo {
      margin-top: 8px;
      padding: 8px 12px;
      background-color: #f0f9ff;
      border-radius: 4px;
      border-left: 3px solid #3b82f6;
    }
  }

  .noAccountWarning {
    padding: 16px;
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    margin-top: 8px;

    .warningMessage {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      color: #92400e;

      i {
        margin-right: 8px;
        font-size: 16px;
      }

      span {
        font-weight: 500;
      }
    }

    .addAccountBtn {
      background-color: #3b82f6;
      border-color: #3b82f6;
      
      &:hover {
        background-color: #2563eb;
        border-color: #2563eb;
      }
    }
  }
}

.selectedAccountInfo {
  padding: 12px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #3b82f6;

  .rwaPaymentAddress {
    margin: 0 0 4px 0;
    font-family: monospace;
    font-size: 14px;
    color: #1e40af;
    word-break: break-all;
  }

  .accountName {
    margin: 0;
    font-size: 12px;
  }
}

.noAccountSelected {
  padding: 12px;
  background-color: #f3f4f6;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  text-align: center;
  color: #6b7280;
}
</style>

