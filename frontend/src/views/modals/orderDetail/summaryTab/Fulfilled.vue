<template>
  <div class="fulfilledEvent rowLg">
    <h2 class="tx4 margRTn">{{ ob.polyT('orderDetail.summaryTab.fulfilled.heading') }}</h2>
    <template v-if="ob.timestamp">
      <span class="clrT2 tx5b">{{ ob.moment(ob.timestamp).format('lll') }}</span>
    </template>
    <div class="border clrBr padMd">
      <template v-if="ob.contractType === 'PHYSICAL_GOOD'">
        <div class="flex gutterH clrT">
          <div class="statusIconCol"><span class="clrBr ion-cube"></span></div>
          <div class="flexExpand tx5">
            <template v-if="!ob.isLocalPickup">
              <div class="rowTn txB">{{ ob.polyT('orderDetail.summaryTab.fulfilled.shippedByLabel') }} <span>{{ physicalDelivery.shipper }}</span></div>
              <div class="row">
                <span>{{ ob.polyT('orderDetail.summaryTab.fulfilled.trackingNumberLabel') }}</span> {{ physicalDelivery.trackingNumber || ob.polyT('orderDetail.summaryTab.notApplicable') }}
                <template v-if="physicalDelivery.trackingNumber">
                  <a class="clrTEm" @click="onClickCopyText(physicalDelivery.trackingNumber, $event)" data-status-indicator=".js-trackingCopiedToClipboard">{{
                      ob.polyT('orderDetail.summaryTab.fulfilled.copyLink') }}</a>
                  <a class="hide js-trackingCopiedToClipboard">{{ ob.polyT('copiedToClipboard') }}</a>
                </template>
              </div>
            </template>
            <div class="rowTn txB">{{ ob.noteFromLabel }}</div>
            <div v-html="`${ ob.note ? ob.parseEmojis(ob.note) : ob.polyT('orderDetail.summaryTab.notApplicable') }`"></div>
          </div>
        </div>
      </template>

      <template v-else-if="ob.contractType === 'DIGITAL_GOOD'">
        <div class="flex gutterH clrT">
          <div class="statusIconCol clrT"><span class="clrBr ion-ios-folder"></span></div>
          <div class="flexExpand tx5">
            <div class="rowTn txB">{{ ob.polyT('orderDetail.summaryTab.fulfilled.digitalReadyForDlHeading') }}</div>
            <div class="row">
              {{ ob.polyT('orderDetail.summaryTab.fulfilled.digitalReadyForDlText') }}
            </div>
            <div class="rowTn txB">{{ ob.polyT('orderDetail.summaryTab.fulfilled.urlLabel') }}</div>
            <div :class="`${ob.showPassword ? 'row' : ''}`">
              <a class="clrTEm" :href="digitalDelivery.url" data-open-external>{{ digitalDelivery.url }}</a>
            </div>
            <template v-if="ob.showPassword">
              <div class="rowTn txB">{{ ob.polyT('orderDetail.summaryTab.fulfilled.passwordLabel') }}</div>
              <div class="row">{{ digitalDelivery.password || ob.polyT('orderDetail.summaryTab.notApplicable') }}</div>
            </template>
            <div class="rowTn txB">{{ ob.noteFromLabel }}</div>
            <div v-html="`${ ob.note ? ob.parseEmojis(ob.note) : ob.polyT('orderDetail.summaryTab.notApplicable') }`"></div>
          </div>
        </div>
      </template>

      <template v-else-if="ob.contractType === 'SERVICE'">
        <div class="flex gutterH clrT">
          <div class="statusIconCol clrT"><span class="clrBr ion-ios-body"></span></div>
          <div class="flexExpand tx5">
            <div class="rowTn txB">{{ ob.noteFromLabel }}</div>
            <div v-html="`${ ob.note ? ob.parseEmojis(ob.note) : ob.polyT('orderDetail.summaryTab.notApplicable') }`"></div>
          </div>
        </div>
      </template>

      <template v-else-if="ob.contractType === 'CRYPTOCURRENCY'">
        <div class="flex gutterH clrT">
          <div class="statusIconCol">
            <CryptoIcon :code="ob.coinType" className="clrBr"/>
          </div>
          <div class="flexExpand tx5 posR">
            <div class="rowTn txB">{{ ob.polyT('orderDetail.summaryTab.fulfilled.cryptoSentLabel', {
              coinTypeVerbose:
                coinTypeVerbose,
            }) }}</div>

            <div class="row transactionIdRow">
              <div class="transactionIdLabel">{{ ob.polyT('orderDetail.summaryTab.fulfilled.transactionIDLabel') }}</div>
              <div class="transactionIdContent">
                <span class="transactionIdText">{{ formatTransactionId(ob.transactionID) }}</span>
                <a class="clrTEm copyLink" @click="onClickCopyText(ob.transactionID, $event)" data-status-indicator=".js-transactionIDCopiedToClipboard">{{
                    ob.polyT('orderDetail.summaryTab.fulfilled.copyLink') }}</a>
              </div>
              <a class="hide js-transactionIDCopiedToClipboard">{{ ob.polyT('copiedToClipboard') }}</a>
            </div>
            <div class="rowTn txB">{{ ob.noteFromLabel }}</div>
            <div v-html="`${ ob.note ? ob.parseEmojis(ob.note) : ob.polyT('orderDetail.summaryTab.notApplicable') }`"></div>
          </div>
        </div>
      </template>

      <template v-else-if="ob.contractType === 'RWA_TOKEN'">
        <div class="flex gutterH clrT">
          <div class="statusIconCol">
            <img :src="getRwaTokenIcon()" :alt="getRwaTokenName()" class="rwaTokenIcon" />
          </div>
          <div class="flexExpand tx5 posR">
            <div class="rowTn txB">{{ ob.polyT('orderDetail.summaryTab.fulfilled.cryptoSentLabel', {
              coinTypeVerbose:
                coinTypeVerbose,
            }) }}</div>

            <div class="row transactionIdRow">
              <div class="transactionIdLabel">{{ ob.polyT('orderDetail.summaryTab.fulfilled.transactionIDLabel') }}</div>
              <div class="transactionIdContent">
                <span class="transactionIdText">{{ formatTransactionId(ob.transactionID) }}</span>
                <a class="clrTEm copyLink" @click="onClickCopyText(ob.transactionID, $event)" data-status-indicator=".js-transactionIDCopiedToClipboard">{{
                    ob.polyT('orderDetail.summaryTab.fulfilled.copyLink') }}</a>
              </div>
              <a class="hide js-transactionIDCopiedToClipboard">{{ ob.polyT('copiedToClipboard') }}</a>
            </div>
            <div class="rowTn txB">{{ ob.noteFromLabel }}</div>
            <div v-html="`${ ob.note ? ob.parseEmojis(ob.note) : ob.polyT('orderDetail.summaryTab.notApplicable') }`"></div>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>

<script>
import $ from 'jquery';
import moment from 'moment';
import { ipc } from '../../../../utils/ipcRenderer.js';
import 'velocity-animate';
import app from '../../../../../backbone/app.js';
import { findRwaTokenByCode, getRwaTokenIconPath } from '../../../../data/rwaTokenMockData.js';


export default {
  props: {
    options: {
      type: Object,
      default: {
        contractType: 'PHYSICAL_GOOD',
        isLocalPickup: false,
        showPassword: false,
        noteFromLabel: app.polyglot.t('orderDetail.summaryTab.fulfilled.noteFromVendorLabel'),
        coinType: '',
      },
    },
    bb: Function
  },
  data () {
    return {
      dataObject: {
        cryptocurrencyDelivery: undefined,
        physicalDelivery: undefined,
        digitalDelivery: undefined,
      },
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
      const cd = this.dataObject.cryptocurrencyDelivery;
      const transactionID = cd && cd.transactionID || '';

      return {
        ...this.templateHelpers,
        contractType: 'PHYSICAL_GOOD',
        isLocalPickup: false,
        showPassword: false,
        noteFromLabel: app.polyglot.t('orderDetail.summaryTab.fulfilled.noteFromVendorLabel'),
        coinType: '',
        ...this.options,
        ...this.options.dataObject,
        ...this.dataObject,
        transactionID: transactionID.replace(/["]/g, '[!$quote$!]'),
        encodedTxId: this.revealEscapeChars(transactionID),
        moment,
      };
    },
    physicalDelivery () {
      return this.dataObject.physicalDelivery || {};
    },
    digitalDelivery () {
      return this.dataObject.digitalDelivery || {};
    },
    coinTypeVerbose () {
      const ob = this.ob;
      let coinTypeTranslationKey = `cryptoCurrencies.${ob.coinType}`;
      return ob.polyT(coinTypeTranslationKey) === coinTypeTranslationKey ?
        ob.coinType :
        ob.polyT('orderDetail.summaryTab.fulfilled.coinTypeVerbose', {
          coinName: ob.polyT(coinTypeTranslationKey),
          coinCode: ob.coinType,
        })
    },
    transactionID () {
      const cd = this.dataObject.cryptocurrencyDelivery;
      return cd && cd[0] && cd[0].transactionID || '';
    },
  },
  methods: {
    moment,

    loadData (options = {}) {
      if (!options.dataObject) {
        throw new Error('Please provide a vendorOrderFulfillment data object.');
      }

      this.dataObject = options.dataObject.fulfillments[0];
    },

    onClickCopyText (content, event) {
      const target = event.target;
      ipc.send('controller.system.writeToClipboard', content.replace(/\[!\$quote\$!\]/g, '"'));
      const statusIndicator = target.getAttribute('data-status-indicator');
      if (statusIndicator) {
        $(statusIndicator)
          .velocity('stop')
          .velocity('fadeIn', {
            complete: () => {
              $(statusIndicator)
                .velocity('fadeOut', { delay: 1000 });
            },
          });
      }
    },

    revealEscapeChars (input) {
      const output = input.replace(/[<>&\n"]/g, x => ({
        '<': '&amp;lt;',
        '>': '&amp;gt;',
        '&': '&amp;&',
        '"': '&amp;quot;',
        '\n': '<br />',
      }[x]
      ));

      return output;
    },

    getRwaTokenIcon() {
      // 根据coinType（实际上是token代码）获取对应的图标
      const tokenCode = this.ob.coinType;
      if (tokenCode) {
        return getRwaTokenIconPath(tokenCode);
      }
      // 如果没有找到token代码，使用默认图标
      return '/imgs/rwa-tokens/custom.svg';
    },

    getRwaTokenName() {
      // 根据coinType获取token名称
      const tokenCode = this.ob.coinType;
      if (tokenCode) {
        const token = findRwaTokenByCode(tokenCode);
        return token ? token.name : tokenCode;
      }
      return this.ob.coinType || 'RWA Token';
    },

    formatTransactionId(transactionId) {
      if (!transactionId) return '';
      
      // 移除转义字符
      const cleanTxId = transactionId.replace(/\[!\$quote\$!\]/g, '"');
      
      // 如果长度超过20个字符，截断显示
      if (cleanTxId.length > 20) {
        return `${cleanTxId.slice(0, 10)}...${cleanTxId.slice(-10)}`;
      }
      
      return cleanTxId;
    },
  }
}
</script>
<style lang="scss" scoped>
.rwaTokenIcon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  vertical-align: middle;
}

.transactionIdRow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  .transactionIdLabel {
    font-weight: bold;
    color: #333;
    font-size: 14px;
    white-space: nowrap;
  }

  .transactionIdContent {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .transactionIdText {
      font-family: monospace;
      background: #f8f9fa;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #e9ecef;
      font-size: 13px;
      color: #495057;
      word-break: break-all;
      max-width: 300px;
    }

    .copyLink {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 3px;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s ease;

      &:hover {
        background: #007bff;
        color: white;
      }
    }
  }
}
</style>
