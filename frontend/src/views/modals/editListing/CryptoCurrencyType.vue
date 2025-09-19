<template>
  <div class="cryptoCurrencyType padSmKids padStackAll">
    <div class="flexRow titleWrap">
      <div class="col12">
        <div class="flexRow">
          <div class="flexExpand">
            <label for="editListingTitle">{{ ob.polyT('editListing.title') }}</label>
            <div class="js-cryptoTradingPairContainer">
              <CryptoTradingPairWrap :options="{
                className: `cryptoTradingPairWrap row ${hideTradingPair ? 'invisible' : ''}`,
                tradingPairClass: 'cryptoTradingPairLg rowSm',
                exchangeRateClass: 'clrT2 tx6',
                fromCur: curAccepted,
                toCur: curToSell,
              }" />
            </div>
          </div>
          <ViewListingLinks :createMode="ob.createMode" @viewListing="onClickViewListing" @viewListingOnWeb="onClickViewListingOnWeb" />
        </div>
      </div>
    </div>
    <div class="flexRow gutterH">
      <div class="col6 simpleFlexCol">
        <label for="editListingCryptoContractType" class="required">{{ ob.polyT('editListing.type') }}</label>
        <template v-if="formData.metadata.contractType === 'CRYPTOCURRENCY' && ob.errors['metadata.contractType']">
          <FormError :errors="ob.errors['metadata.contractType']" />
        </template>
        <Select2 id="editListingCryptoContractType" v-model="localContractType" class="clrBr clrP clrSh2 marginTopAuto" :options="{ minimumResultsForSearch: Infinity }" @change="onContractTypeChange">
          <template v-for="(contractType, j) in ob.contractTypes" :key="j">
            <option :value="contractType.code" :selected="contractType.code === localContractType">{{ contractType.name }}</option>
          </template>
        </Select2>
        <div class="clrT2 txSm helper">
          <div v-html="ob.polyT('editListing.cryptoCurrencyType.helperType', { count: `<b> ${ob.polyT('editListing.cryptoCurrencyType.helperTypeCount')}</b>`, })"></div>
        </div>
      </div>
    </div>
    <div class="flexRow gutterH">
      <div class="col6 simpleFlexCol">
        <label for="editListingCoinType" class="required">{{ ob.polyT('editListing.cryptoCurrencyType.coinType') }}</label>
        <FormError v-if="ob.errors['item.cryptoListingCurrencyCode']" :errors="ob.errors['item.cryptoListingCurrencyCode']" />
        <div class="js-cryptoCurrencyTradeContainer marginTopAuto">
          <div class="cryptoCurrencyTradeField">
            <div class="posR">
              <template v-if="isFetching">
                <SpinnerSVG className="center spinnerMd" />
              </template>
              <div v-if="!isFetching">
                <Select2 id="editListingCoinType" v-model="curToSell" :options="getTradeSelect2Opts()" class="clrBr clrP clrSh2" style="width: 100%">
                  <template v-for="(coin, j) in coinTypes" :key="j">
                    <option :value="coin.code" :selected="coin.code === curToSell">{{ coin.name }}</option>
                  </template>
                </Select2>
                <div class="clrT2 txSm helper">{{ ob.polyT('editListing.cryptoCurrencyType.helperCoinType') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col6 simpleFlexCol">
        <label for="editListingCryptoQuantity" class="required">{{ ob.polyT('editListing.cryptoCurrencyType.quantity') }}</label>
        <FormError v-if="ob.errors['item.cryptoQuantity']" :errors="ob.errors['item.cryptoQuantity']" />
        <div class="posR">
          <input type="number" class="clrBr clrP clrSh2" v-model="localCryptoQuantity" id="editListingCryptoQuantity"
            placeholder="0.00" data-var-type="bignumber" @input="onCryptoQuantityChange">
          <div class="cryptoQuantityCoinType clrT2 tx5 js-quantityCoinType">{{ curToSell }}</div>
        </div>
        <div class="clrT2 txSm helper">{{ ob.polyT('editListing.cryptoCurrencyType.helperQuantity') }}</div>
      </div>
    </div>
  </div>
  <div class="flexRow gutterH">
    <div class="col6 simpleFlexCol">
      <label for="editListingCryptoReceive" class="required">{{ ob.polyT('editListing.cryptoCurrencyType.lblReceive') }}</label>
      <div class="posR marginTopAuto">
        <template v-if="ob.errors['metadata.acceptedCurrencies'] && ob.metadata.contractType === 'CRYPTOCURRENCY'">
          <FormError :errors="ob.errors['metadata.acceptedCurrencies']" />
        </template>
        <Select2 id="editListingCryptoReceive" v-model="curAccepted" name="metadata.acceptedCurrencies" class="clrBr clrP clrSh2 marginTopAuto">
          <template v-for="(coin, j) in ob.receiveCurs" :key="j">
            <option :value="coin.code" :selected="coin.code === curAccepted">{{ coin.name }}</option>
          </template>
        </Select2>
        <div class="clrT2 txSm helper">{{ ob.polyT('editListing.cryptoCurrencyType.helperReceive') }}</div>
      </div>
    </div>
    <div class="col6 simpleFlexCol">
      <label for="editListingCryptoPriceModifier" class="required">{{ ob.polyT('editListing.cryptoCurrencyType.priceModifier') }}</label>
      <FormError v-if="ob.errors['item.cryptoListingPriceModifier']" :errors="ob.errors['item.cryptoListingPriceModifier']" />
      <div class="posR marginTopAuto">
        <input type="text" class="clrBr clrP clrSh2" v-model="localPriceModifier"
          id="editListingCryptoPriceModifier"
          :placeholder="ob.polyT('editListing.cryptoCurrencyType.priceModifierPlaceholder')" data-var-type="number" @input="onPriceModifierChange">
        <div class="cryptoPriceModifierPercentSymbol clrT2 tx5">%</div>
      </div>
      <div class="clrT2 txSm helper">{{ ob.polyT('editListing.cryptoCurrencyType.helperPriceModifier') }}</div>
    </div>
  </div>
</template>

<script>
import bigNumber from 'bignumber.js';
import app from '../../../../backbone/app';
import { supportedWalletCurs } from '../../../../backbone/data/walletCurrencies';
import { isJQPromise } from '../../../../backbone/utils/object';

import ViewListingLinks from './ViewListingLinks.vue';


export default {
  components: {
    ViewListingLinks,
  },
  props: ["options", "bb", "modelValue"],
  emits: ['update:modelValue', 'clickViewListing', 'clickViewListingOnWeb'],
  data () {
    return {
      curAccepted: '',
      curToSell: '',
      hideTradingPair: true,

      isFetching: true,
      coinTypes: [],
      receiveCur: undefined,
      
      // 本地变量，避免直接修改父组件数据
      localContractType: '',
      localCryptoQuantity: '',
      localPriceModifier: '',
    };
  },
  created () {
    this.loadData(this.options);
  },
  mounted () {
  },
  watch: {
    curAccepted(val) {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        metadata: {
          ...this.modelValue.metadata,
          acceptedCurrencies: [val]
        }
      });
    },
    curToSell(val) {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        item: {
          ...this.modelValue.item,
          cryptoListingCurrencyCode: val
        }
      });
    },
    modelValue: {
      handler(newVal) {
        // 同步本地变量
        this.localContractType = newVal?.metadata?.contractType || '';
        // 处理cryptoQuantity，确保它是字符串格式用于显示
        const cryptoQuantity = newVal?.item?.cryptoQuantity;
        if (cryptoQuantity instanceof bigNumber) {
          this.localCryptoQuantity = cryptoQuantity.toString();
        } else {
          this.localCryptoQuantity = cryptoQuantity || '';
        }
        this.localPriceModifier = newVal?.item?.cryptoListingPriceModifier || '';
      },
      deep: true
    }
  },
  computed: {
    formData: {
      get() {
        return this.modelValue;
      },
    },
    ob () {
      return {
        ...this.templateHelpers,
        contractTypes: this.model.get('metadata').contractTypesVerbose,
        receiveCurs: this.receiveCurs,
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      };
    }
  },
  methods: {
    loadData (options = {}) {
      if (!this.model) {
        throw new Error('Please provide a Listing model.');
      }

      if (!isJQPromise(options.getCoinTypes)) {
        throw new Error('Please provide getCoinTypes as a jQuery promise.');
      }

      this.baseInit({
        ...options,
      });

      this.receiveCurs = supportedWalletCurs();
      if (this.receiveCur && !this.receiveCurs.includes(this.receiveCur)) {
        // if the model has the receiving currency set to an unsupported cur,
        // we'll manually add that to the list of available options. Upon a
        // a save attempt, the user will be presented with an error prompting them
        // to select a valid currency.
        this.receiveCurs.push(receiveCur);
      }

      this.receiveCurs = this.receiveCurs.map(cur => ({
        code: cur,
        name: app.polyglot.t(`cryptoCurrencies.${cur}`, {
          _: cur,
        }),
      }));

      this.receiveCurs = this.receiveCurs.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });

      // TODO - don't assume BTC, hard-code to the exchange rate reference coin
      this.curAccepted = this.receiveCur || (this.receiveCurs[0] && this.receiveCurs[0].code) || 'BTC';
      this.curToSell = 'BTC';

      // 初始化本地变量
      this.localContractType = this.modelValue?.metadata?.contractType || '';
      // 处理cryptoQuantity，确保它是字符串格式用于显示
      const cryptoQuantity = this.modelValue?.item?.cryptoQuantity;
      if (cryptoQuantity instanceof bigNumber) {
        this.localCryptoQuantity = cryptoQuantity.toString();
      } else {
        this.localCryptoQuantity = cryptoQuantity || '';
      }
      this.localPriceModifier = this.modelValue?.item?.cryptoListingPriceModifier || '';

      // Initially we'll show this as 'invisible' for spacing purposes. A spinner will
      // show until the subsequent getCoinTypes() call returns.
      this.hideTradingPair = true;

      this.isFetching = this.getCoinTypes.state() === 'pending';
      this.getCoinTypes.done(curs => {
        const modelCur = this.model.get('item').get('cryptoListingCurrencyCode');
        const selected = modelCur || curs[0].code;

        const currencies = [...curs];

        if (modelCur && !currencies.find(cur => (cur.code === modelCur))) {
          // The saved coin type is not in the list. Maybe there's no
          // exchange rate available. Maybe it's no longer on CMC. Anyhow,
          // we'll manually add it to the list otherwise the coin type just
          // defaults to the first coin and that's an odd experience to
          // just have your coinType swapped out on you like that.
          currencies.unshift({
            code: modelCur,
            name: app.polyglot.t(`cryptoCurrencies.${modelCur}`, {
              _: modelCur,
            }),
          });
        }

        this.isFetching = false;
        this.coinTypes = currencies;

        this.hideTradingPair = false;
        this.curToSell = selected;
      });
    },

    getTradeSelect2Opts () {
      return {
        minimumResultsForSearch: 5,
        matcher: (params, data) => {
          if (!params.term || params.term.trim() === '') {
            return data;
          }

          const term = params.term.toUpperCase().trim();
          if (data.text.toUpperCase().includes(term) || data.id.includes(term)) {
            return data;
          }

          return null;
        },
      };
    },

    onClickViewListing() {
      this.$emit('clickViewListing');
    },

    onClickViewListingOnWeb() {
      this.$emit('clickViewListingOnWeb');
    },

    onContractTypeChange() {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        metadata: {
          ...this.modelValue.metadata,
          contractType: this.localContractType
        }
      });
    },

    onCryptoQuantityChange() {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        item: {
          ...this.modelValue.item,
          cryptoQuantity: new bigNumber(this.localCryptoQuantity || 0)
        }
      });
    },

    onPriceModifierChange() {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        item: {
          ...this.modelValue.item,
          cryptoListingPriceModifier: this.localPriceModifier
        }
      });
    }
  }
}
</script>
<style lang="scss" scoped></style>
