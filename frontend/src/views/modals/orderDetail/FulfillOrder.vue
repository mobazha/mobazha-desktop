<template>
  <div class="fulfillOrderTab">
    <div class="padLg flexVCent">
      <div class="backToSummaryWrap">
        <a class="clrTEm txU" @click="onClickBackToSummary">{{ ob.polyT(`orderDetail.backToSummary`) }}</a>
      </div>
      <div class="txCtr txB tx3 flexExpand">{{ ob.polyT(`orderDetail.fulfillOrderTab.heading`) }}</div>
    </div>
    <hr class="clrBr rowMd" />
    <form class="padKids padStack pad clrP clrBr js-fulfillForm">
      <template v-if="contractType === 'PHYSICAL_GOOD' && !isLocalPickup">
        <div class="flexRow gutterH">
          <div class="col3">
            <label for="fulfillOrderShippingCarrier" class="required">{{
              ob.polyT(`orderDetail.fulfillOrderTab.shippingCarrierLabel`) }}</label>
          </div>
          <div class="col7">
            <FormError v-if="ob.errors['physicalDelivery.shipper']" :errors="ob.errors['physicalDelivery.shipper']" />
            <input type="text" class="clrBr clrSh2" name="physicalDelivery.shipper" id="fulfillOrderShippingCarrier"
              v-focus
              v-model="formData.physicalDelivery.shipper"
              :placeholder="ob.polyT(`orderDetail.fulfillOrderTab.shippingCarrierPlaceholder`)" />
          </div>
        </div>
        <div class="flexRow gutterH">
          <div class="col3">
            <label for="fulfillOrderTrackingNumber">{{ ob.polyT(`orderDetail.fulfillOrderTab.trackingLabel`) }}</label>
          </div>
          <div class="col7">
            <FormError v-if="ob.errors['physicalDelivery.trackingNumber']"
              :errors="ob.errors['physicalDelivery.trackingNumber']" />
            <input type="text" class="clrBr clrSh2" name="physicalDelivery.trackingNumber" id="fulfillOrderTrackingNumber"
              v-model="formData.physicalDelivery.trackingNumber"
              :placeholder="ob.polyT(`orderDetail.fulfillOrderTab.trackingPlaceholder`)" />
          </div>
        </div>
      </template>

      <template v-else-if="contractType === 'DIGITAL_GOOD'">
        <div class="flexRow gutterH">
          <div class="col3">
            <label for="fulfillOrderFileUrl" class="required">{{ ob.polyT(`orderDetail.fulfillOrderTab.fileUrlLabel`)
            }}</label>
          </div>
          <div class="col7">
            <FormError v-if="ob.errors['digitalDelivery.url']" :errors="ob.errors['digitalDelivery.url']" />
            <input type="text" class="clrBr clrSh2" name="digitalDelivery.url" id="fulfillOrderFileUrl"
              v-focus
              v-model="formData.digitalDelivery.url" :placeholder="ob.polyT(`orderDetail.fulfillOrderTab.fileUrlPlaceholder`)" />
          </div>
        </div>
        <div class="flexRow gutterH">
          <div class="col3">
            <label for="fulfillOrderPassword">{{ ob.polyT(`orderDetail.fulfillOrderTab.passwordLabel`) }}</label>
          </div>
          <div class="col7">
            <FormError v-if="ob.errors['digitalDelivery.password']" :errors="ob.errors['digitalDelivery.password']" />
            <input type="text" class="clrBr clrSh2" name="digitalDelivery.password" id="fulfillOrderPassword"
              v-model="formData.digitalDelivery.password"
              :placeholder="ob.polyT(`orderDetail.fulfillOrderTab.passwordPlaceholder`)" />
          </div>
        </div>
      </template>

      <template v-else-if="contractType === 'CRYPTOCURRENCY'">
        <div class="flexRow gutterH">
          <div class="col3">
            <label for="fulfillOrderTransactionID" class="required">{{
              ob.polyT(`orderDetail.fulfillOrderTab.transactionIDLabel`) }}</label>
          </div>
          <div class="col7">
            <FormError v-if="ob.errors['cryptocurrencyDelivery.transactionID']" :errors="ob.errors['cryptocurrencyDelivery.transactionID']" />
            <input type="text" class="clrBr clrSh2" name="cryptocurrencyDelivery.transactionID"
              v-focus
              id="fulfillOrderTransactionID"
              v-model="formData.cryptocurrencyDelivery.transactionID"
              :placeholder="ob.polyT(`orderDetail.fulfillOrderTab.transactionIDPlaceholder`)"
              :maxlength="ob.constraints.transactionIDLength" />
          </div>
        </div>
      </template>

      <!-- RWA Token发货流程 -->
      <template v-else-if="contractType === 'RWA_TOKEN'">
        <!-- 买家支付信息显示 -->
        <div v-if="orderInfo" class="rwaOrderInfo">
          <h3 class="orderInfoTitle">{{ ob.polyT(`orderDetail.fulfillOrderTab.buyerPaymentInfo`) }}</h3>
          
          <div class="paymentInfoGrid">
            <div class="infoItem">
              <label>{{ ob.polyT(`orderDetail.fulfillOrderTab.paymentAmount`) }}:</label>
              <span class="amount">{{ formatPaymentAmount(orderInfo.paymentAmount, orderInfo.paymentTokenAddress) }}</span>
            </div>
            
            <div class="infoItem">
              <label>{{ ob.polyT(`orderDetail.fulfillOrderTab.paymentToken`) }}:</label>
              <span>{{ getPaymentTokenSymbol(orderInfo.paymentTokenAddress) }}</span>
            </div>
            
            <div class="infoItem">
              <label>{{ ob.polyT(`orderDetail.fulfillOrderTab.buyerAddress`) }}:</label>
              <span class="address">{{ formatAddress(orderInfo.buyer) }}</span>
            </div>
            
            <div class="infoItem">
              <label>{{ ob.polyT(`orderDetail.fulfillOrderTab.transactionHash`) }}:</label>
              <span class="txHash">{{ orderInfo.transactionHash || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- 卖家需要支付的RWA Token信息 -->
        <div v-if="orderInfo" class="rwaTokenInfo">
          <h3 class="orderInfoTitle">{{ ob.polyT(`orderDetail.fulfillOrderTab.sellerRwaTokenInfo`) }}</h3>
          
          <div class="tokenInfoGrid">
            <div class="infoItem">
              <label>{{ ob.polyT(`orderDetail.fulfillOrderTab.rwaTokenAddress`) }}:</label>
              <span class="address">{{ formatAddress(orderInfo.rwaTokenAddress) }}</span>
            </div>
            
            <div class="infoItem">
              <label>{{ ob.polyT(`orderDetail.fulfillOrderTab.rwaTokenAmount`) }}:</label>
              <span class="amount">{{ formatRwaTokenAmount(orderInfo.rwaTokenAmount) }}</span>
            </div>
            
            <div class="infoItem">
              <label>{{ ob.polyT(`orderDetail.fulfillOrderTab.buyerReceiveAddress`) }}:</label>
              <span class="address">{{ formatAddress(orderInfo.buyerReceiveAddress) }}</span>
            </div>
          </div>
        </div>

        <!-- 卖家收款地址选择器 -->
        <div v-if="orderInfo" class="sellerReceiveAddressSection">
          <h3 class="orderInfoTitle">{{ ob.polyT(`orderDetail.fulfillOrderTab.sellerReceiveAddress`) }}</h3>
          
          <ReceivingAccountSelector
            :blockchain="getRwaTokenBlockchain()"
            @account-selected="onSellerReceiveAddressSelected"
            @navigate-to-accounts="navigateToReceivingAccounts"
          />
        </div>

        <!-- 加载状态 -->
        <div v-else class="loadingState">
          <div class="loadingSpinner">
            <i class="ion-load-c"></i>
          </div>
          <p>{{ ob.polyT(`orderDetail.fulfillOrderTab.loadingOrderInfo`) }}</p>
        </div>

        <!-- RWA Token转移状态 -->
        <div class="flexRow gutterH" v-if="rwaTokenRechargeStatus">
          <div class="col12">
            <div class="rwaRechargeStatus" :class="rwaTokenRechargeStatus.status">
              <div class="statusIcon">
                <i v-if="rwaTokenRechargeStatus.status === 'pending'" class="ion-load-c"></i>
                <i v-else-if="rwaTokenRechargeStatus.status === 'success'" class="ion-checkmark-circled"></i>
                <i v-else-if="rwaTokenRechargeStatus.status === 'error'" class="ion-close-circled"></i>
              </div>
              <div class="statusText">
                <div class="statusTitle">{{ rwaTokenRechargeStatus.title }}</div>
                <div class="statusMessage">{{ rwaTokenRechargeStatus.message }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- RWA Token转移按钮 -->
        <div class="flexRow gutterH" v-if="orderInfo && selectedSellerReceiveAddress && (!rwaTokenRechargeStatus || rwaTokenRechargeStatus.status === 'error')">
          <div class="col12">
            <button 
              type="button" 
              class="btn clrBAttGrad clrBrDec1 clrTOnEmph"
              @click="onRwaTokenTransfer"
              :disabled="isRecharging"
            >
              <span v-if="isRecharging">{{ ob.polyT(`orderDetail.fulfillOrderTab.rwaTransferringText`) }}</span>
              <span v-else>{{ ob.polyT(`orderDetail.fulfillOrderTab.rwaTransferText`) }}</span>
            </button>
            <div class="clrT2 txSm helper">{{ ob.polyT(`orderDetail.fulfillOrderTab.rwaTransferHelper`) }}</div>
          </div>
        </div>
        
        <!-- 未选择收款地址的提示 -->
        <div class="flexRow gutterH" v-if="orderInfo && !selectedSellerReceiveAddress">
          <div class="col12">
            <div class="noReceiveAddressWarning">
              <i class="ion-alert-circled"></i>
              <span>{{ ob.polyT(`orderDetail.fulfillOrderTab.pleaseSelectReceiveAddress`) }}</span>
            </div>
          </div>
        </div>
      </template>
      
      <!-- Note字段 - 对于RWA Token订单不显示 -->
      <div v-if="contractType !== 'RWA_TOKEN'" class="flexRow gutterH rowHg">
        <div class="col3">
          <label for="fulfillOrderNote">{{ ob.polyT(`orderDetail.fulfillOrderTab.noteLabel`) }}</label>
        </div>
        <div class="col7">
          <FormError v-if="ob.errors['note']" :errors="ob.errors['note']" />
          <textarea rows="6" name="note" :class="`clrBr clrP clrSh2 ${contractType === 'DIGITAL_GOOD' ? 'rowSm' : ''}`"
            id="fulfillOrderNote" :placeholder="ob.polyT(`orderDetail.fulfillOrderTab.notePlaceholder`)"
            v-model="formData.note"></textarea>
          <template v-if="contractType === 'DIGITAL_GOOD'">
            <div class="clrT2 txSm">{{ ob.polyT(`orderDetail.fulfillOrderTab.noteHelperTextDigital`) }}</div>
          </template>
        </div>
      </div>
    </form>
    <hr class="clrBr" />
    <div class="buttonBar flexHRight flexVCent gutterHLg">
      <a class="js-cancel" :disabled="processing" @click="onClickCancel">{{
        ob.polyT(`orderDetail.fulfillOrderTab.btnCancel`) }}</a>
      <!-- 对于RWA Token订单，不显示Submit按钮 -->
      <ProcessingButton
        v-if="contractType !== 'RWA_TOKEN'"
        :className="`btn clrBAttGrad clrBrDec1 clrTOnEmph js-submit ${processing ? 'processing' : ''}`"
        :btnText="ob.polyT(`orderDetail.fulfillOrderTab.btnSubmit`)" @click="onClickSubmit" />
      <!-- RWA Token转移成功后的完成状态 -->
      <div v-if="contractType === 'RWA_TOKEN' && rwaTokenRechargeStatus && rwaTokenRechargeStatus.status === 'success'" 
           class="fulfillmentComplete">
        <i class="ion-checkmark-circled"></i>
        <span>订单已完成</span>
      </div>
    </div>
  </div>
</template>

<script>
import $ from 'jquery';
import OrderFulfillment from '../../../../backbone/models/order/orderFulfillment/OrderFulfillment';
import {
  fulfillingOrder,
  fulfillOrder,
  events as orderEvents,
} from '../../../../backbone/utils/order';
import { rwaMarketplaceService } from '@/services/rwaMarketplaceService.js';
import { getContractAddress } from '@/config/rwaMarketplaceConfig.js';
import { ethers } from 'ethers';
import { useAppKitProvider } from '@reown/appkit/vue';
import ReceivingAccountSelector from '@/components/ReceivingAccountSelector.vue';

export default {
  props: {
    options: {
      type: Object,
      default: {
        orderID: '',
        contractType: '',
        isLocalPickup: '',
      },
	  },
  },
  data () {
    return {
      _model: undefined,
      _modelKey: 0,

      formData: {
        physicalDelivery: {
          shipper: '',
          trackingNumber: '',
        },
        digitalDelivery: {
          url: '',
          password: '',
        },
        cryptocurrencyDelivery: {
          transactionID: '',
        },
        rwaTokenDelivery: {
          transactionHash: '',
          blockchain: 'ETH',
        },
        note: '',
      },
      processing: false,
      isRecharging: false,
      rwaTokenRechargeStatus: null,
      rwaMarketplaceContractAddress: '', // RWA Marketplace合约地址
      isRwaMarketplaceInitialized: false, // RWA Marketplace是否已初始化
      orderInfo: null, // 订单信息
      selectedSellerReceiveAddress: null,
    };
  },
  created () {
    this.initEventChain();

    this.loadData(this.options);
  },
  mounted () {
    // 如果是RWA Token订单，获取订单信息
    if (this.contractType === 'RWA_TOKEN') {
      this.loadOrderInfo();
    }
  },
  computed: {
    ob () {
      const cryptoDelivery = this.model.get('cryptocurrencyDelivery');

      return {
        ...this.templateHelpers,
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        constraints: cryptoDelivery && cryptoDelivery.constraints || {},
      };
    },

    currentNetworkType() {
      // 从钱包store获取当前网络类型
      // 这里需要根据实际的用户数据来获取
      return 'ethereum'; // 暂时返回ethereum，后续可以从store获取
    },

    model() {
      let access = this._modelKey;

      return this._model;
    }
  },
  methods: {
    loadData (options = {}) {
      if (!options.orderID) {
        throw new Error('Please provide an orderID.');
      }

      if (!options.contractType) {
        throw new Error('Please provide the contract type.');
      }

      if (typeof options.isLocalPickup !== 'boolean') {
        throw new Error('Please provide a boolean indicating whether the item is to ' +
          'be picked up locally.');
      }

      this.baseInit(options);

      this._model = new OrderFulfillment(
        { orderID: this.orderID },
        {
          contractType: this.contractType,
          isLocalPickup: this.isLocalPickup,
        },
      );
      this._model.on('change', () => this._modelKey += 1);

      this.processing = fulfillingOrder(this._model.id);
      this.listenTo(orderEvents, 'fulfillingOrder', this.onFulfillingOrder);
      this.listenTo(orderEvents, 'fulfillOrderComplete, fulfillOrderFail', this.onFulfillOrderAlways);
    },

    onClickBackToSummary () {
      this.$emit('clickBackToSummary');
    },

    onClickCancel () {
      const id = this.model.id;
      this.model.reset();
      // restore the id reset blew away
      this.model.set({ orderID: id });
      this.$emit('clickCancel');
    },

    async onRwaTokenTransfer() {
      this.isRecharging = true;
      this.rwaTokenRechargeStatus = {
        status: 'pending',
        title: '正在转移RWA Token',
        message: '正在调用智能合约转移代币给买家...'
      };

      try {
        // 初始化RWA Marketplace
        await this.initializeRwaMarketplace();
        
        // 获取订单信息
        const orderInfo = await this.getOrderInfo();
        
        // 调用RWA Marketplace发货完成
        const result = await rwaMarketplaceService.shipAndComplete(
          orderInfo.orderId,
          orderInfo.rwaTokenAddress,
          orderInfo.rwaTokenAmount,
          this.selectedSellerReceiveAddress?.address
        );
        
        if (result.success) {
          this.formData.rwaTokenDelivery.transactionHash = result.transactionHash;
          this.rwaTokenRechargeStatus = {
            status: 'success',
            title: '转移成功',
            message: `RWA Token已成功转移给买家，交易哈希: ${result.transactionHash}`
          };
          
          // RWA Token转移成功后，自动完成订单
          await this.autoCompleteOrder();
        } else {
          throw new Error('转移失败');
        }
      } catch (error) {
        console.error('RWA Token转移失败:', error);
        this.rwaTokenRechargeStatus = {
          status: 'error',
          title: '转移失败',
          message: error.message || '转移过程中出现错误'
        };
      } finally {
        this.isRecharging = false;
      }
    },

    async autoCompleteOrder() {
      try {
        this.processing = true;
        
        // 构建发货数据
        const fulfillmentData = {
          orderID: this.orderID,
          rwaTokenDelivery: {
            transactionHash: this.formData.rwaTokenDelivery.transactionHash,
            blockchain: this.formData.rwaTokenDelivery.blockchain
          }
          // RWA Token订单不需要note字段
        };
        
        // 调用后端完成订单
        await this.model.save(fulfillmentData);
        
        // 触发订单完成事件
        this.$emit('fulfillOrderComplete');
        
        console.log('✅ RWA Token订单自动完成成功');
      } catch (error) {
        console.error('❌ 自动完成订单失败:', error);
        // 即使自动完成失败，RWA Token转移已经成功，可以手动完成
        this.rwaTokenRechargeStatus = {
          status: 'success',
          title: '转移成功，但订单完成失败',
          message: `RWA Token已成功转移，但订单状态更新失败。请手动点击提交按钮完成订单。`
        };
      } finally {
        this.processing = false;
      }
    },

    async onRwaTokenRecharge() {
      // 这个方法现在被onRwaTokenTransfer替代
      await this.onRwaTokenTransfer();
    },

    async initializeRwaMarketplace() {
      try {
        // 获取合约地址
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
          'ethereum',
          contractAddress
        );

        this.rwaMarketplaceContractAddress = contractAddress;
        this.isRwaMarketplaceInitialized = true;
        
        console.log('✅ RWA Marketplace初始化成功');
        return true;
      } catch (error) {
        console.error('❌ RWA Marketplace初始化失败:', error);
        throw error;
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

    async loadOrderInfo() {
      try {
        // 显示加载状态
        this.orderInfo = null;
        
        await this.getOrderInfo();
      } catch (error) {
        console.error('加载订单信息失败:', error);
        
        // 显示用户友好的错误消息
        let errorMessage = '加载订单信息失败';
        if (error.message.includes('未初始化')) {
          errorMessage = 'RWA Marketplace服务未初始化，请确保钱包已连接';
        } else if (error.message.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络设置';
        } else if (error.message.includes('合约')) {
          errorMessage = '智能合约调用失败，请稍后重试';
        }
        
        // 可以在这里显示错误消息给用户
        console.warn(errorMessage);
      }
    },

    async getOrderInfo() {
      try {
        // 首先初始化RWA Marketplace服务
        if (!this.isRwaMarketplaceInitialized) {
          await this.initializeRwaMarketplace();
        }
        
        // 从订单数据中获取订单ID
        const orderId = this.model.get('orderID');
        
        // 获取订单信息
        const orderInfo = await rwaMarketplaceService.getOrder(orderId);
        
        // 保存订单信息到组件状态
        this.orderInfo = orderInfo;
        
        return orderInfo;
      } catch (error) {
        console.error('获取订单信息失败:', error);
        throw error;
      }
    },

    formatAddress(address) {
      if (!address) return 'N/A';
      const maxLength = 10;
      if (address.length <= maxLength * 2) {
        return address;
      }
      return `${address.substring(0, maxLength)}...${address.substring(address.length - maxLength)}`;
    },

    formatPaymentAmount(amount, tokenAddress) {
      if (!amount) return 'N/A';
      
      try {
        if (tokenAddress === ethers.ZeroAddress) {
          // ETH支付
          return `${ethers.formatEther(amount)} ETH`;
        } else {
          // ERC20代币支付
          return `${ethers.formatUnits(amount, 6)} ${this.getPaymentTokenSymbol(tokenAddress)}`;
        }
      } catch (error) {
        return amount.toString();
      }
    },

    formatRwaTokenAmount(amount) {
      if (!amount) return 'N/A';
      
      try {
        return ethers.formatUnits(amount, 18);
      } catch (error) {
        return amount.toString();
      }
    },

    getPaymentTokenSymbol(tokenAddress) {
      if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
        return 'ETH';
      }
      
      // 根据代币地址返回符号
      const tokenSymbols = {
        '0xF36BFeE8fd7F1950c0129714Faf6d1e1F94a66AA': 'USDT', // Sepolia测试网USDT
        '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT', // 主网USDT
        '0xA0b86a33E6441b8B4b0B8B4b0B8B4b0B8B4b0B8B': 'USDC', // 主网USDC
        '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',  // 主网DAI
      };
      
      return tokenSymbols[tokenAddress] || 'TOKEN';
    },

    onSellerReceiveAddressSelected(selectedAccount) {
      this.selectedSellerReceiveAddress = selectedAccount;
      console.log('✅ 卖家收款地址已选择:', selectedAccount);
    },

    navigateToReceivingAccounts() {
      // 触发导航到收款账户管理页面的事件
      this.$emit('navigate-to-receiving-accounts');
    },

    onClickSubmit () {
      const formData = {};
      if (this.contractType === 'DIGITAL_GOOD') {
        formData.digitalDelivery = this.formData.digitalDelivery;
      } else if (this.contractType === 'CRYPTOCURRENCY') {
        formData.cryptocurrencyDelivery = this.formData.cryptocurrencyDelivery;
      } else if (this.contractType === 'PHYSICAL_GOOD' && !this.isLocalPickup) {
        formData.physicalDelivery = this.formData.physicalDelivery;
      } else if (this.contractType === 'RWA_TOKEN') {
        // 检查RWA Token转移是否完成
        if (!this.formData.rwaTokenDelivery.transactionHash) {
          this.rwaTokenRechargeStatus = {
            status: 'error',
            title: '发货失败',
            message: '请先完成RWA Token转移'
          };
          return;
        }
        formData.rwaTokenDelivery = this.formData.rwaTokenDelivery;
      }
      formData.note = this.formData.note;

      this.model.set(formData);
      this.model.set({}, { validate: true });

      if (!this.model.validationError) {
        fulfillOrder(this.contractType, this.isLocalPickup, this.model.toJSON());
      }

      const $firstErr = $('.errorList:first');
      if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
    },

    onFulfillingOrder (e) {
      if (e.id === this.model.id) {
        this.processing = true;
      }
    },

    onFulfillOrderAlways (e) {
      if (e.id === this.model.id) {
        this.processing = false;
      }
    },

    getRwaTokenBlockchain() {
      return this.orderInfo?.rwaTokenDelivery?.blockchain || 'ETH';
    },
  }
}
</script>
<style lang="scss" scoped>
.rwaOrderInfo,
.rwaTokenInfo {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;

  .orderInfoTitle {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: bold;
    color: #495057;
  }

  .paymentInfoGrid,
  .tokenInfoGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;

    .infoItem {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;

      &:last-child {
        border-bottom: none;
      }

      label {
        font-weight: 500;
        color: #6c757d;
        margin-right: 10px;
      }

      .amount {
        font-weight: bold;
        color: #28a745;
      }

      .address {
        font-family: monospace;
        font-size: 12px;
        color: #495057;
        word-break: break-all;
      }

      .txHash {
        font-family: monospace;
        font-size: 12px;
        color: #007bff;
        word-break: break-all;
      }
    }
  }
}

.rwaRechargeStatus {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;

  &.pending {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;

    .statusIcon i {
      animation: spin 1s linear infinite;
    }
  }

  &.success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }

  &.error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }

  .statusIcon {
    margin-right: 10px;
    font-size: 20px;
  }

  .statusText {
    flex: 1;

    .statusTitle {
      font-weight: bold;
      margin-bottom: 5px;
    }

    .statusMessage {
      font-size: 14px;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loadingState {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  
  .loadingSpinner {
    font-size: 24px;
    color: #409EFF;
    margin-bottom: 16px;
    
    i {
      animation: spin 1s linear infinite;
    }
  }
  
  p {
    color: #606266;
    margin: 0;
  }
}

.fulfillmentComplete {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #67C23A;
  font-weight: 500;
  
  i {
    font-size: 18px;
  }
}

.noReceiveAddressWarning {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #E6A23C;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 15px;
  border-radius: 6px;
  background-color: #FFFBE6;
  border: 1px solid #FFECB5;

  i {
    font-size: 20px;
  }
}
</style>
