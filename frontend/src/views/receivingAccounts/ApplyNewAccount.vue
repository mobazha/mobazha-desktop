<template>
  <div class="contentBox padMd clrP clrBr applyNewAccountView">
    <h2 class="tx3 txB">{{ $t('receivingAccounts.applyNewAccount') }}</h2>
    
    <div class="paymentMethodGrid">
      <!-- 区块链钱包选项 -->
      <div class="methodCategory">
        <h3 class="categoryTitle">{{ $t('receivingAccounts.blockchainCategories') }}</h3>
        <div class="methodCards">
          <div v-for="chainType in supportedChainTypes" :key="chainType.id" 
               :class="['methodCard', { disabled: chainType.disabled }]"
               @click="handleChainTypeClick(chainType)">
            <div class="methodIcon" :class="chainType.id.toLowerCase()">
              <CryptoIcon :token="chainType.id" />
            </div>
            <div class="methodInfo">
              <div class="methodName">{{ chainType.name }}</div>
              <div v-if="chainType.comingSoon" class="comingSoonText">{{ $t('purchase.comingSoon') }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 其他支付方式选项 -->
      <div class="methodCategory">
        <h3 class="categoryTitle">{{ $t('receivingAccounts.otherPaymentMethods') }}</h3>
        <div class="methodCards">
          <div v-for="method in supportedPaymentMethods" :key="method.id" 
               :class="['methodCard', { disabled: method.disabled }]"
               @click="handlePaymentMethodClick(method)">
            <div class="methodIcon" :class="method.id.toLowerCase()">
              <CryptoIcon :code="method.id.toUpperCase()" />
            </div>
            <div class="methodInfo">
              <div class="methodName">{{ method.name }}</div>
              <div v-if="method.comingSoon" class="comingSoonText">{{ $t('purchase.comingSoon') }}</div>
            </div>
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
    handleChainTypeClick(chainType) {
      if (!chainType.disabled) {
        this.$emit('apply-account', chainType.id);
      }
    },
    
    handlePaymentMethodClick(method) {
      if (!method.disabled) {
        this.$emit('apply-payment-method', method.id);
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
          
          &.disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background-color: #f5f5f5;
            border-color: #e0e0e0;
            
            &:hover {
              transform: none;
              box-shadow: none;
              border-color: #e0e0e0;
            }
            
            .methodIcon {
              opacity: 0.7;
            }
            
            .methodInfo {
              .methodName {
                color: #999;
              }
            }
          }
          
          .methodIcon {
            margin-bottom: 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            
            .cryptoIcon {
              width: 60px;
              height: 60px;
            }
          }
          
          .methodInfo {
            display: flex;
            flex-direction: column;
            align-items: center;
            
            .methodName {
              font-weight: bold;
              margin-top: 10px;
              font-size: 16px;
            }
            
            .comingSoonText {
              font-size: 12px;
              color: #ff6b6b;
              font-weight: 400;
              margin-top: 4px;
            }
          }
        }
      }
    }
  }
}
</style> 