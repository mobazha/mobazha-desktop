<template>
  <div class="payments">
    <template v-for="(payment, index) in reversedPayments">
      <Payment ref="payments" :options="paymentOptions(payment, (reversedPayments.length - 1) - index)"
        :bb="() => {
          return {
            model: payment,
          }
        }"
        @cancelClick="onCancelClick"
        @acceptClick="onAcceptClick"
        @confirmedRejectClick="onRejectClick"
      />
    </template>

    <!-- 收款账户选择器弹窗 -->
    <div v-if="showAccountSelectModal" class="modal-overlay">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ $t('receivingAccountSelector.placeholder') }}</h3>
          <button class="close-btn" @click="closeReceivingAccountModal">
            <i class="ion-close"></i>
          </button>
        </div>
        <div class="modal-content">
          <ReceivingAccountSelector
            ref="receivingAccountSelector"
            :blockchain="selectedOrderBlockchain"
            @account-selected="onReceivingAccountSelected"
            @navigate-to-accounts="navigateToReceivingAccounts"
          />
          
          <!-- 确认按钮 -->
          <div class="modal-actions">
            <button 
              class="btn btn-secondary" 
              @click="closeReceivingAccountModal"
            >
              取消
            </button>
            <button 
              class="btn btn-primary" 
              :disabled="!selectedReceivingAccount"
              @click="confirmReceivingAccountSelection"
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 收款账户管理弹窗 -->
    <ReceivingAccountsModal v-if="showAccountsModal"  @close="closeAccountsModal" />
  </div>
</template>
  
<script>
import app from '../../../../../backbone/app.js';
import bigNumber from 'bignumber.js';
import {
  acceptingOrder,
  acceptOrder,
  rejectingOrder,
  rejectOrder,
  cancelingOrder,
  cancelOrder,
  events as orderEvents,
} from '../../../../../backbone/utils/order.js';
import { isValidCoinDivisibility } from '../../../../../backbone/utils/currency';
import { getCurrencyByCode as getWalletCurByCode } from '../../../../../backbone/data/walletCurrencies.js';
import { checkValidParticipantObject } from '../../../../utils/utils';
import ReceivingAccountSelector from '../../../../components/ReceivingAccountSelector.vue';
import { getTokenById } from '../../../../config/token.js';
import ReceivingAccountsModal from '../../ReceivingAccountsModal.vue';

import Payment from './Payment.vue';

export default {
  components: {
    Payment,
    ReceivingAccountSelector,
    ReceivingAccountsModal,
  },
  props: {
    options: {
      type: Object,
      default: {},
    },
  },
  data () {
    return {
      collectionKey: 0,

      vendorName: '',

      _options: {},

      // 收款账户选择器相关状态
      showAccountSelectModal: false,
      selectedOrderBlockchain: 'ETH',
      selectedReceivingAccount: null,
      pendingOrderAction: null, // 存储待处理的订单操作

      showAccountsModal: false,
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
        options: {
          isCrypto: false,
          ...this.options,
        }
      };
    },
    paymentCoinData() {
      let paymentCoinData = {};
      try {
        paymentCoinData = getWalletCurByCode(this.options.paymentCoin);
      } catch (e) {
        // pass
      }
      return paymentCoinData ? paymentCoinData : {};
    },
    paidSoFar() {
      let access = this.collectionKey;

      let paidResult = [];
      this.collection.models.forEach((payment, index) => {
        let paidSoFar = this.collection.models
          .slice(0, index + 1)
          .reduce((total, model) => total.plus(model.get('value')), bigNumber('0'));

        if (isValidCoinDivisibility[0]) {
          // round based on divisibility
          paidSoFar = paidSoFar.dp(this.paymentCoinData.coinDivisibility);
        }
        paidResult.push(paidSoFar);
      });

      return paidResult;
    },
    reversedPayments() {
      let access = this.collectionKey;

      return this.collection.models.slice().reverse();
    }
  },
  methods: {
    loadData (options) {
      const opts = {
        isCrypto: false,
        ...options,
      };

      if (!options.orderID) {
        throw new Error('Please provide the order id.');
      }

      if (!options.collection) {
        throw new Error('Please provide a transactions collection.');
      }

      if (!(options.orderPrice instanceof bigNumber)) {
        throw new Error('Please provide the price of the order as a BigNumber '
          + 'instance.');
      }

      if (typeof options.isOrderCancelable !== 'function') {
        throw new Error('Please provide a function that returns whether this order can be canceled '
          + 'by the current user.');
      }

      if (typeof options.isOrderConfirmable !== 'function') {
        throw new Error('Please provide a function that returns whether this order can be '
          + 'confirmed by the current user.');
      }

      checkValidParticipantObject(options.vendor, 'vendor');

      this.baseInit(opts);
      this.__options = opts;

      options.vendor.getProfile()
        .done((profile) => {
          this.vendorName = profile.get('name') || '';

          this.collectionKey += 1;
        });

      this.listenTo(this.collection, 'update', () => this.collectionKey += 1);

      this.listenTo(orderEvents, 'cancelingOrder', this.onCancelingOrder);
      this.listenTo(orderEvents, 'cancelOrderComplete cancelOrderFail', this.onCancelOrderAlways);
      this.listenTo(orderEvents, 'cancelOrderComplete', this.onAcceptOrderComplete);
      this.listenTo(orderEvents, 'acceptingOrder', this.onAcceptingOrder);
      this.listenTo(orderEvents, 'acceptOrderComplete acceptOrderFail', this.onAcceptOrderAlways);
      this.listenTo(orderEvents, 'acceptOrderComplete', this.onAcceptOrderComplete);
      this.listenTo(orderEvents, 'rejectingOrder', this.onRejectingOrder);
      this.listenTo(orderEvents, 'rejectOrderComplete rejectOrderFail', this.onRejectOrderAlways);
      this.listenTo(orderEvents, 'rejectOrderComplete', this.onRejectOrderComplete);
    },

    setLastPaymentState(state) {
      if (this.$refs.payments && this.$refs.payments.length > 0) {
        this.$refs.payments[0].setState(state);
      }
    },

    onCancelClick() {
      cancelOrder(this.orderID, this.paymentCoin);
    },

    onCancelingOrder(e) {
      if (e.id === this.orderID) {
        this.setLastPaymentState({ cancelInProgress: true });
      }
    },

    onCancelOrderAlways(e) {
      if (e.id === this.orderID) {
        this.setLastPaymentState({ cancelInProgress: false });
      }
    },

    onCancelOrderComplete(e) {
      if (e.id === this.orderID) {
        this.setLastPaymentState({ showCancelButton: false });
      }
    },

    onAcceptClick() {
      // 如果paymentCoin为空，直接调用acceptOrder
      if (!this.paymentCoin) {
        acceptOrder(this.orderID, this.selectedReceivingAccount?.address, this.paymentCoin);
        return;
      }
      
      // 如果需要选择收款账户，则显示选择器
      if (this.needsReceivingAccountSelection(this.paymentCoin)) {
        this.pendingOrderAction = { action: 'accept', orderID: this.orderID, paymentCoin: this.paymentCoin };
        this.selectedOrderBlockchain = this.getBlockchainFromPaymentCoin(this.paymentCoin);
        this.showAccountSelectModal = true;
      } else {
        acceptOrder(this.orderID, this.selectedReceivingAccount?.address, this.paymentCoin);
      }
    },

    onAcceptingOrder(e) {
      if (e.id === this.orderID) {
        this.setLastPaymentState({ acceptInProgress: true });
      }
    },

    onAcceptOrderAlways(e) {
      if (e.id === this.orderID) {
        this.setLastPaymentState({ acceptInProgress: false });
      }
    },

    onAcceptOrderComplete(e) {
      if (e.id === this.orderID) {
        this.setLastPaymentState({ showAcceptButton: false });
      }
    },

    onRejectClick() {
      rejectOrder(this.orderID, this.paymentCoin);
    },

    onRejectingOrder(e) {
      if (e.id === this.orderID) {
        this.setLastPaymentState({ rejectInProgress: true });
      }
    },

    onRejectOrderAlways(e) {
      if (e.id === this.orderID) {
        this.setLastPaymentState({ rejectInProgress: false });
      }
    },

    onRejectOrderComplete(e) {
      if (e.id === this.orderID) {
        this.setLastPaymentState({ showRejectButton: false });
      }
    },

    isMostRecentPayment(index) {
      return index === this.collection.length - 1;
    },

    blockChainTxUrl(paymentId) {
      let blockChainTxUrl = '';

      try {
        blockChainTxUrl = this.paymentCoinData.getBlockChainTxUrl(
          paymentId,
          app.serverConfig.testnet,
        );
      } catch (e) {
        // pass
      }

      return blockChainTxUrl;
    },

    paymentOptions(payment, index) {
      return {
        initialState: {
          paymentNumber: index + 1,
          amountShort: this.options.orderPrice.minus(this.paidSoFar[index]),
          showAcceptRejectButtons: this.isMostRecentPayment(index) && this.options.isOrderConfirmable(),
          showCancelButton: this.isMostRecentPayment(index) && this.options.isOrderCancelable(),
          cancelInProgress: cancelingOrder(this.orderID),
          acceptInProgress: acceptingOrder(this.orderID),
          rejectInProgress: rejectingOrder(this.orderID),
          isCrypto: this._options.isCrypto,
          blockChainTxUrl: this.blockChainTxUrl(payment.id),
          paymentCoin: this.paymentCoinData.code,
          paymentCoinDivis: this.paymentCoinData.coinDivisibility,

          payee: this.vendorName,
        },
      };
    },

    // 判断是否需要选择收款账户
    needsReceivingAccountSelection(paymentCoin) {
      if (!paymentCoin) return false;
      if (typeof paymentCoin === 'string' && paymentCoin.toLowerCase() === 'stripe') return false;
      const token = getTokenById(paymentCoin);
      return !!token;
    },

    // 根据支付币种获取区块链类型
    getBlockchainFromPaymentCoin(paymentCoin) {
      if (!paymentCoin) return 'ETH';
      const token = getTokenById(paymentCoin);
      return (token && token.chain) ? token.chain : 'ETH';
    },

    // 收款账户选择器事件处理
    onReceivingAccountSelected(account) {
      this.selectedReceivingAccount = account;
    },

    // 关闭收款账户选择器弹窗
    closeReceivingAccountModal() {
      this.showAccountSelectModal = false;
      this.pendingOrderAction = null;
    },

    // 导航到收款账户管理页面
    navigateToReceivingAccounts() {
      // 关闭当前选择器弹窗，打开收款账户管理弹窗
      this.showAccountSelectModal = false;
      this.showAccountsModal = true;
    },
    
    // 关闭收款账户管理弹窗
    closeAccountsModal() {
      this.showAccountsModal = false;
      // 重新获取收款账户列表
      this.refreshReceivingAccounts();
    },
    
    // 刷新收款账户列表（当用户添加新账户后）
    refreshReceivingAccounts() {
      // 通过ref直接调用ReceivingAccountSelector的刷新方法
      this.$nextTick(() => {
        if (this.$refs.receivingAccountSelector) {
          this.$refs.receivingAccountSelector.refreshAccounts();
        }
      });
    },

    // 确认收款账户选择
    confirmReceivingAccountSelection() {
      if (this.selectedReceivingAccount && this.pendingOrderAction) {
        const { action, orderID, paymentCoin } = this.pendingOrderAction;
        if (action === 'accept') {
          acceptOrder(orderID, this.selectedReceivingAccount.address, paymentCoin);
        }
        this.closeReceivingAccountModal();
      } else {
        console.log('Payments.vue - Cannot execute: missing selectedReceivingAccount or pendingOrderAction');
      }
    },
  }
}
</script>
<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    
    &:hover {
      color: #333;
    }
  }
}

.modal-content {
  padding: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
</style>
