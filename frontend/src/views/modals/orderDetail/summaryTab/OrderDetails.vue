<template>
  <div class="orderDetails">

    <h2 class="tx4 margRTn">{{ ob.polyT('orderDetail.summaryTab.orderDetails.heading') }}</h2>
    <span class="clrT2 tx5b">{{ ob.moment(ob.order.timestamp).format('lll') }}</span>
    <div class="border clrBr padMd">
      <template v-for="(listing, idx) in listings">
        <div class="flex gutterH clrT">
          <a :href="`#${`${listing.vendorID.peerID}/store/${listing.slug}`}`" class="listingThumbCol flexNoShrink" :style="ob.getAvatarBgImage(listing.item.images[0])"></a>
          <div class="flexExpand tx5">
            <div class="flexRow gutterH row">
              <div class="flexExpand col4">
                <a :href="`#${`${listing.vendorID.peerID}/store/${listing.slug}`}`" :class="`txB clrT inlineBlock ${ob.description || isCrypto ? 'rowTn' : ''}`" v-html="listing.item.title"></a>
                <div v-if="ob.sku">{{ ob.polyT('orderDetail.summaryTab.orderDetails.skuLabel') }}: {{ ob.sku }}</div>
                <div v-if="order.items[idx].options && order.items[idx].options.length">{{ order.items[idx].options.map(option => `${option.name}:&nbsp;${option.value}`).join(',&nbsp;') }}</div>
                <template v-if="isCrypto">
                  <div class="rowTn">
                    <span class="txB">{{ ob.polyT('orderDetail.summaryTab.orderDetails.quantityHeading') }}:</span>
                    {{ ob.currencyMod.convertAndFormatCurrency(order.items[idx].quantity, coinType) }}
                    <a class=" clrTEm" v-if="order.items[idx].quantity" @click="onClickCopyCryptoQuantity(order.items[idx].quantity)"> {{ ob.polyT('orderDetail.summaryTab.orderDetails.copyLink') }}</a>
                  </div>
                  <div class="clrT2 hide orderDetailsCopiedToClipboard js-cryptoQuantityCopiedToClipboard">{{ ob.polyT('copiedToClipboard') }}</div>
                </template>
                <OptionalFeatureLine :optionalFeatures="getItemOptionalFeatures(idx)" :pricingCurrency="listing.price?.currencyCode" :displayCurrency="ob.displayCurrency" />
              </div>

              <div class="col4">
                <div class="txB">{{ ob.polyT('orderDetail.summaryTab.orderDetails.couponHeading') }}</div>
                <div v-if="order.items[idx].couponCodes && order.items[idx].couponCodes.length">{{ order.items[idx].couponCodes.join(', ') }}</div>
                <div v-else>{{ ob.polyT('orderDetail.summaryTab.notApplicable') }}</div>
              </div>
              <div v-if="!isCrypto" class="col4">
                <div class="txB rowTn">{{ ob.polyT('orderDetail.summaryTab.orderDetails.quantityHeading') }}</div>
                <div>{{ order.items[idx].quantity }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div>
        <div class="flexExpand tx5">

          <hr class="clrBr" />
          <div class="flexRow gutterH">
            <div class="col4">
              <div :class="`gutterVTn ${isCrypto ? 'row' : ''}`">
                <div class="txB">{{ ob.polyT('orderDetail.summaryTab.orderDetails.shipToHeading') }}</div>
                <template v-if="ob.order.shipping && ob.order.shipping.country !== 'NA'">
                  <div>{{ ob.order.shipping.shipTo }}</div>
                  <div v-if="ob.order.shipping.address">{{ ob.order.shipping.address }}</div>
                  <div v-if="addressLine3">{{ addressLine3 }}</div>
                  <div>{{ addressLine4 }}</div>
                  <div class="gutterH">
                    <a class=" clrTEm" @click="onClickCopyAddress(clipboardAddress)">{{ ob.polyT('orderDetail.summaryTab.orderDetails.copyLink') }}</a>
                    <a class="clrTEm" :href="mapUrl">{{ ob.polyT('orderDetail.summaryTab.orderDetails.viewOnMap') }}</a>
                  </div>
                  <div class="addressNotes gutterVTn" v-if="ob.order.shipping.addressNotes">
                    <div>
                      <b>{{ ob.polyT('orderDetail.summaryTab.orderDetails.addressNotes') }}</b>
                    </div>
                    <div>
                      {{ ob.order.shipping.addressNotes }}
                    </div>
                  </div>
                </template>

                <template v-else>
                  {{ ob.polyT('orderDetail.summaryTab.notApplicable') }}
                </template>
                <span ref="orderDetailsCopiedToClipboard" class="clrT2 hide orderDetailsCopiedToClipboard js-orderDetailsCopiedToClipboard">{{ ob.polyT('copiedToClipboard') }}</span>
              </div>
              <div v-if="isCrypto" class="gutterVTn">
                <div class="txB cryptoAddress">
                  <CryptoIcon :code="ob.listing.metadata.pricingCurrency.code" />
                  {{ ob.polyT('orderDetail.summaryTab.orderDetails.paymentAddressHeading', {
                    coinType: coinTypeName === `cryptoCurrencies.${coinType}` ? coinType : ob.polyT(`cryptoCurrencies.${coinType}`),
                    icon: ob.crypto.cryptoIcon({ code: ob.listing.metadata.pricingCurrency.code, }),
                  }) }}
                </div>
                <div class="flex gutterHSm">
                  <div class="clamp2 cryptoPaymentAddress">{{ item.paymentAddress }}</div>
                  <div>
                    <a class=" clrTEm" @click="onClickCopyCryptoAddress(item.paymentAddress)">{{ ob.polyT('orderDetail.summaryTab.orderDetails.copyLink') }}</a>
                  </div>
                </div>
                <span class="clrT2 hide orderDetailsCopiedToClipboard js-cryptoAddressCopiedToClipboard">{{ ob.polyT('copiedToClipboard') }}</span>
              </div>
            </div>
            <div class="col8">
              <div class="row">
                
                <div class="flexRow gutterH row">
                  <div class="col6">
                    <div class="txB rowTn">{{ ob.polyT('orderDetail.summaryTab.orderDetails.moderatorHeading') }}</div>
                    <ModFragment v-if="ob.isModerated && modProfile"
                      :modInfo="modInfo.options"
                      :bb="function() {
                        return {
                          model: modInfo.model,
                        };
                      }" />
                    <template v-else> {{ ob.polyT('orderDetail.summaryTab.notApplicable') }}</template>
                  </div>
                  <div class="col6">
                    <div class="txB rowTn">{{ ob.polyT('orderDetail.summaryTab.orderDetails.totalHeading') }}</div>
                    <div v-html="ob.currencyMod.pairedCurrency( order.payment.amount, order.payment.coin, app.settings.get('localCurrency') )">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <hr class="clrBr" />
          <div class="flexRow gutterH">
            <div class="col6">
              <div class="gutterVTn">
                <div class="txB">{{ ob.polyT('orderDetail.summaryTab.orderDetails.shippingOption') }}</div>
                <div>{{ item.shippingOption && item.shippingOption.name ? item.shippingOption.name : ob.polyT('orderDetail.summaryTab.notApplicable') }}</div>
              </div>
            </div>
            <div class="col6">
              <div class="gutterVTn">
                <div class="txB">{{ ob.polyT('orderDetail.summaryTab.orderDetails.shippingService') }}</div>
                <div>{{ item.shippingOption && item.shippingOption.service ? item.shippingOption.service : ob.polyT('orderDetail.summaryTab.notApplicable') }}</div>
              </div>
            </div>
          </div>
          <hr class="clrBr" />
          <div class="flexRow gutterH">
            <div class="col6">
              <div class="gutterVTn">
                <div class="txB">{{ ob.polyT('orderDetail.summaryTab.orderDetails.memo') }}</div>
                <div class="memo" v-html="item.memo ? ob.parseEmojis(item.memo) : ob.polyT('orderDetail.summaryTab.notApplicable')"></div>
              </div>
            </div>
            <div class="col6">
              <div>
                <div class="gutterVTn">
                  <div class="txB">{{ ob.polyT('orderDetail.summaryTab.orderDetails.alternateContact') }}</div>
                  <div>{{ ob.order.alternateContactInfo ? ob.order.alternateContactInfo : ob.polyT('orderDetail.summaryTab.notApplicable') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import _ from 'underscore';
import $ from 'jquery';
import moment from 'moment';
import app from '../../../../../backbone/app';
import { getCountryByDataName } from '../../../../../backbone/data/countries';
import { ipc } from '../../../../utils/ipcRenderer.js';
import 'velocity-animate';
import ModFragment from '../ModFragment.vue';
import { checkValidParticipantObject } from '../../../../utils/utils';

export default {
  components: {
    ModFragment,
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
      app: app,
      description: '',

      oneListing: undefined,
      listings: undefined,

      modProfile: undefined,
    };
  },
  created () {
    this.initEventChain();

    this.loadData(this.options);
  },
  mounted () {
  },
  computed: {
    ob () {
      return {
        ...this.templateHelpers,
        listing: this.oneListing,
        order: this.order,
        getCountryByDataName,
        displayCurrency: app.settings.get('localCurrency'),
        moment,
        isModerated: this.isModerated,
        sku: this.sku,
        locale: app && app.localSettings && app.localSettings.standardizedTranslatedLang()
          || 'en-US',
      };
    },
    isCrypto () {
      return this.oneListing.metadata.contractType === 'CRYPTOCURRENCY';
    },

    coinType () {
      return this.oneListing.metadata.pricingCurrency.code;
    },

    item () {
      // For now we're only supporting one item per order, so we'll hard-code a reference to the
      // first item.
      return this.order.items[0];
    },

    title () {
      const ob = this.ob;

      let title = this.oneListing.item.title;

      if (this.isCrypto) {
        title = ob.crypto.tradingPair({
          className: 'cryptoTradingPairSm',
          fromCur: this.oneListing.metadata.acceptedCurrencies[0],
          toCur: coinType,
        });
      }
      return title;
    },

    isShippingValid () {
      if (!$.isEmptyObject(this.order.shipping) && this.order.shipping.country !== 'NA') {
        return true;
      }
      return false;
    },

    addressLine3 () {
      if (!this.isShippingValid) {
        return '';
      }

      let order = this.order;

      let addressLine3 = `${order.shipping.city ? `${order.shipping.city}${order.shipping.state ? ',' : ''}` : ''}${order.shipping.state ? ` ${order.shipping.state}` : ''}`;
      if (order.shipping.postalCode) addressLine3 += `${addressLine3 ? ' ' : ''}${order.shipping.postalCode}`;

      return addressLine3;
    },

    addressLine4 () {
      if (!this.isShippingValid) {
        return '';
      }

      return getCountryByDataName(this.order.shipping.country).translatedName;
    },

    mapUrl () {
      if (!this.isShippingValid) {
        return '';
      }
      let order = this.order;

      let addressParts = [];

      if (order.shipping.address) addressParts.push(order.shipping.address);
      if (order.shipping.city) addressParts.push(order.shipping.city);
      if (order.shipping.postalCode) addressParts.push(order.shipping.postalCode);
      if (order.shipping.country) addressParts.push(order.shipping.country);

      addressParts
        .map(addressPart => {
          return addressPart.replace('/r', '')
            .replace('/n', '')
            .replace(/\s/g, '+');
        });

      let queryString = encodeURIComponent(addressParts.join(','));

      return `https://www.google.com/maps/place/${queryString}`;
    },

    clipboardAddress () {
      let order = this.order;

      let clipboardAddress = [order.shipping.shipTo];
      if (order.shipping.address) clipboardAddress.push(order.shipping.address);
      if (addressLine3) clipboardAddress.push(addressLine3);
      if (addressLine4) clipboardAddress.push(addressLine4);
      clipboardAddress = clipboardAddress.join('\n');

      return clipboardAddress;
    },

    isModerated () {
      return !!this.model.get('orderOpen').payment.moderator;
    },

    /**
     * If the product purchased has a sku, it will be returned, otherwise an empty string
     * will be returned.
     */
    sku () {
      let orderOptions;
      let options;
      let skus;
      const listing = this.oneListing;

      try {
        orderOptions = this.order.items[0].options;
        options = listing.item.options;
        skus = listing.item.skus;
      } catch (e) {
        return '';
      }

      if (orderOptions && orderOptions.length && orderOptions.length === options.length) {
        // variants are present
        const indexes = [];

        orderOptions.forEach(orderOpt => {
          const matchingOpt = options.find(opt => opt.name === orderOpt.name);

          if (matchingOpt && matchingOpt.variants && matchingOpt.variants.length) {
            const matchingVariant =
              matchingOpt.variants.find(variant => variant.name === orderOpt.value);
            if (matchingVariant) indexes.push(matchingOpt.variants.indexOf(matchingVariant));
          }
        });

        if (Array.isArray(skus)) {
          const selections = indexes.map((val, idx) => ({
            option: orderOptions[idx].name,
            variant: orderOptions[idx].value,
          }));

          const matchingSku = skus.find((sku) => _.isEqual(sku.selections, selections));
          return matchingSku && matchingSku.productID || '';
        }
      } else {
        // no variants
        return listing.item.productID || '';
      }

      return '';
    },

    modInfo () {
      return {
        options: {
          peerID: this.options.moderator.id,
        },
        model: this.modProfile,
      };
    }
  },
  methods: {
    moment,

    loadData (options = {}) {
      this.baseInit(options);

      if (!this.model) {
        throw new Error('Please provide a Contract model.');
      }

      if (this.isModerated) {
        checkValidParticipantObject(options.moderator, 'moderator');

        options.moderator.getProfile()
          .done((modProfile) => {
            this.modProfile = modProfile;
          });
      }

      this.listings = this.model.get('orderOpen').listings.map(item => item.listing);
      this.oneListing = this.listings[0];

      this.order = this.model.get('orderOpen');
    },

    getItemOptionalFeatures(idx) {
      if (!this.listings) return [];
      const item = this.order.items[idx];

      const optionalFeatures = [];
      if (item.optionalFeatures) {
        item.optionalFeatures.forEach((featureName) => {
          const match = this.listings[idx].item.optionalFeatures?.find((v) => v.name === featureName);
          if (match) {
            optionalFeatures.push(match);
          }
        });
      }
      return optionalFeatures;
    },

    getCopiedToClipboardEl () {
      return $(this.$refs.orderDetailsCopiedToClipboard);
    },

    onClickCopyAddress (address) {
      ipc.send('controller.system.writeToClipboard', address);
      this.getCopiedToClipboardEl()
        .velocity('stop')
        .velocity('fadeIn', {
          complete: () => {
            this.getCopiedToClipboardEl()
              .velocity('fadeOut', { delay: 1000 });
          },
        });
    },

    onClickCopyCryptoAddress (address) {
      ipc.send('controller.system.writeToClipboard', address);
      $('.js-cryptoAddressCopiedToClipboard')
        .velocity('stop')
        .velocity('fadeIn', {
          complete: () => {
            $('.js-cryptoAddressCopiedToClipboard')
              .velocity('fadeOut', { delay: 1000 });
          },
        });
    },

    onClickCopyCryptoQuantity (quantity) {
      ipc.send('controller.system.writeToClipboard', quantity);
      $('.js-cryptoQuantityCopiedToClipboard')
        .velocity('stop')
        .velocity('fadeIn', {
          complete: () => {
            $('.js-cryptoQuantityCopiedToClipboard')
              .velocity('fadeOut', { delay: 1000 });
          },
        });
    },
  }
}
</script>
<style lang="scss" scoped></style>
