<template>
  <div class="contentBox padMd clrP clrBr applyNewAccountView">
    <h2 class="tx3 txB">申请新收款账户</h2>
    
    <div class="paymentMethodGrid">
      <!-- 区块链钱包选项 -->
      <div class="methodCategory">
        <h3 class="categoryTitle">区块链钱包</h3>
        <div class="methodCards">
          <div v-for="chainType in supportedChainTypes" :key="chainType.id" 
               class="methodCard" @click="$emit('apply-account', chainType.id)">
            <div class="methodIcon" :class="chainType.id.toLowerCase()">
              <i :class="getChainIcon(chainType.id)"></i>
            </div>
            <div class="methodName">{{ chainType.id }}</div>
          </div>
        </div>
      </div>
      
      <!-- 其他支付方式选项 -->
      <div class="methodCategory">
        <h3 class="categoryTitle">其他支付方式</h3>
        <div class="methodCards">
          <div v-for="method in supportedPaymentMethods" :key="method.id" 
               class="methodCard" @click="$emit('apply-payment-method', method.id)">
            <div class="methodIcon" :class="method.id.toLowerCase()">
              <i :class="getPaymentMethodIcon(method.id)"></i>
            </div>
            <div class="methodName">{{ method.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    supportedChainTypes: {
      type: Array,
      required: true
    },
    supportedPaymentMethods: {
      type: Array,
      required: true
    }
  },
  methods: {
    getChainIcon(chainType) {
      switch (chainType) {
        case 'ETH':
          return 'ion-social-bitcoin'; // 使用适当的图标
        case 'SOL':
          return 'ion-social-bitcoin'; // 使用适当的图标
        case 'BSC':
          return 'ion-social-bitcoin'; // 使用适当的图标
        case 'Base':
          return 'ion-social-bitcoin'; // 使用适当的图标
        default:
          return 'ion-social-bitcoin';
      }
    },
    
    getPaymentMethodIcon(methodId) {
      switch (methodId) {
        case 'paypal':
          return 'ion-card'; // PayPal图标
        case 'stripe':
          return 'ion-social-usd-outline'; // Stripe图标
        default:
          return 'ion-card';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.applyNewAccountView {
  h2 {
    margin-bottom: 30px;
  }
  
  .paymentMethodGrid {
    margin-top: 20px;
    
    .methodCategory {
      margin-bottom: 30px;
      
      .categoryTitle {
        font-size: 18px;
        margin-bottom: 15px;
        padding-bottom: 5px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      .methodCards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
        
        .methodCard {
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: white;
          
          &:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            border-color: #2196F3;
          }
          
          .methodIcon {
            font-size: 40px;
            margin-bottom: 15px;
            color: #2196F3;
            
            &.ethereum { color: #627EEA; }
            &.solana { color: #9945FF; }
            &.bsc { color: #F3BA2F; }
            &.base { color: #0052FF; }
            &.paypal { color: #003087; }
            &.stripe { color: #635BFF; }
            &.bitcoin { color: #F7931A; }
            
            i {
              display: inline-block;
              width: 60px;
              height: 60px;
              line-height: 60px;
              border-radius: 50%;
              background-color: rgba(33, 150, 243, 0.1);
            }
          }
          
          .methodName {
            font-weight: bold;
            margin-top: 10px;
            font-size: 16px;
          }
        }
      }
    }
  }
}
</style> 