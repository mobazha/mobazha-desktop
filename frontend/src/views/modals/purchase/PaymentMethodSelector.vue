<template>
  <div class="paymentMethodSelector">
    <!-- 区块链选择标签 -->
    <div class="chainTabs">
      <div 
        v-for="chain in chains" 
        :key="chain.id" 
        :class="['chainTab', { active: activeChain === chain.id }]"
        @click="activeChain = chain.id"
      >
        <div class="chainIcon" :class="chain.id.toLowerCase()">
          <i :class="chain.icon"></i>
        </div>
        <span>{{ chain.name }}</span>
        <span class="tokenCount">({{ chain.count }})</span>
      </div>
    </div>
    
    <!-- 代币卡片列表 -->
    <div class="tokenCardList">
      <div class="tokenCards">
        <div 
          v-for="(token, index) in visibleTokens" 
          :key="token.id" 
          :class="['tokenCard', { selected: selectedToken === token.id, disabled: token.disabled }]"
          @click="handleTokenClick(token.id)"
        >
          <div v-if="selectedToken === token.id" class="checkmark">
            <i class="ion-checkmark-round"></i>
          </div>
          <div class="tokenIcon" :class="token.id.toLowerCase()">
            <i :class="token.icon || 'ion-social-bitcoin'"></i>
          </div>
          <div class="tokenInfo">
            <span class="tokenName">{{ token.name }}</span>
            <span v-if="token.type" class="tokenType">({{ token.type }})</span>
          </div>
        </div>
        
        <!-- 更多按钮 -->
        <div 
          v-if="showMoreButton" 
          class="moreButton"
          @click="showAllTokens = !showAllTokens"
        >
          <div class="moreIcon">
            <i :class="showAllTokens ? 'ion-chevron-up' : 'ion-chevron-down'"></i>
          </div>
          <span class="moreText">{{ showAllTokens ? '收起' : '更多' }}</span>
        </div>
      </div>
      
      <div v-if="filteredTokens.length === 0" class="noTokens">
        该链上暂无可用代币
      </div>
    </div>
    
    <!-- 其他支付方式 -->
    <div class="otherPaymentMethods">
      <h3 class="sectionTitle">其他支付方式</h3>
      <div class="fiatCards">
        <div 
          v-for="method in fiatMethods" 
          :key="method.id" 
          :class="['fiatCard', { selected: selectedToken === method.id, disabled: method.disabled }]"
          @click="handleFiatMethodClick(method.id)"
        >
          <div v-if="selectedToken === method.id" class="checkmark">
            <i class="ion-checkmark-round"></i>
          </div>
          <div class="methodIcon" :class="method.id.toLowerCase()">
            <i :class="method.icon"></i>
          </div>
          <span class="methodName">{{ method.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  props: {
    currencies: {
      type: Array,
      default: () => []
    },
    disabledMsg: {
      type: String,
      default: ''
    },
    modelValue: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      activeChain: 'all',
      selectedToken: this.modelValue,
      showAllTokens: false,
      maxVisibleTokens: 12, // 每行4个，最多显示3行
      chains: [
        { id: 'all', name: '全部', icon: 'ion-android-list', count: 0 },
        { id: 'bitcoin', name: 'Bitcoin', icon: 'ion-social-bitcoin', count: 0 },
        { id: 'ethereum', name: '以太坊', icon: 'ion-social-bitcoin', count: 0 },
        { id: 'solana', name: 'Solana', icon: 'ion-social-bitcoin', count: 0 },
        { id: 'bsc', name: 'BSC', icon: 'ion-social-bitcoin', count: 0 },
        { id: 'base', name: 'Base', icon: 'ion-social-bitcoin', count: 0 },
        { id: 'polygon', name: 'Polygon', icon: 'ion-social-bitcoin', count: 0 },
        { id: 'privacy', name: '隐私币', icon: 'ion-ios-locked', count: 0 }
      ],
      tokens: [
        // Bitcoin
        { id: 'BTC', name: 'BTC', chain: 'bitcoin', icon: 'ion-social-bitcoin', disabled: false },
        
        // 以太坊代币
        { id: 'ETH', name: 'ETH', chain: 'ethereum', icon: 'ion-social-bitcoin', disabled: false },
        { id: 'USDT', name: 'USDT', chain: 'ethereum', type: 'ERC20', icon: 'ion-social-usd', disabled: false },
        { id: 'USDC', name: 'USDC', chain: 'ethereum', type: 'ERC20', icon: 'ion-social-usd', disabled: false },
        { id: 'DAI', name: 'DAI', chain: 'ethereum', type: 'ERC20', icon: 'ion-social-usd', disabled: false },
        
        // Solana代币
        { id: 'SOL', name: 'SOL', chain: 'solana', icon: 'ion-social-bitcoin', disabled: false },
        { id: 'SOLUSDT', name: 'USDT', chain: 'solana', type: 'SPL', icon: 'ion-social-usd', disabled: false },
        { id: 'SOLUSDC', name: 'USDC', chain: 'solana', type: 'SPL', icon: 'ion-social-usd', disabled: false },
        
        // BSC代币
        { id: 'BNB', name: 'BNB', chain: 'bsc', icon: 'ion-social-bitcoin', disabled: false },
        { id: 'BUSD', name: 'BUSD', chain: 'bsc', type: 'BEP20', icon: 'ion-social-usd', disabled: false },
        { id: 'BSCUSDT', name: 'USDT', chain: 'bsc', type: 'BEP20', icon: 'ion-social-usd', disabled: false },
        
        // Base代币
        { id: 'BASEETH', name: 'ETH', chain: 'base', icon: 'ion-social-bitcoin', disabled: false },
        { id: 'BASEUSDC', name: 'USDC', chain: 'base', type: 'Base', icon: 'ion-social-usd', disabled: false },
        
        // Polygon代币
        { id: 'MATIC', name: 'MATIC', chain: 'polygon', icon: 'ion-social-bitcoin', disabled: false },
        { id: 'POLYUSDT', name: 'USDT', chain: 'polygon', type: 'Polygon', icon: 'ion-social-usd', disabled: false },
        { id: 'POLYUSDC', name: 'USDC', chain: 'polygon', type: 'Polygon', icon: 'ion-social-usd', disabled: false },
        
        // 隐私币
        { id: 'XMR', name: 'XMR', chain: 'privacy', icon: 'ion-social-bitcoin', disabled: false },
        { id: 'ZEC', name: 'ZEC', chain: 'privacy', icon: 'ion-social-bitcoin', disabled: false }
      ],
      fiatMethods: [
        { 
          id: 'stripe', 
          name: 'Stripe', 
          icon: 'ion-card',
          disabled: false
        },
        { 
          id: 'paypal', 
          name: 'PayPal', 
          icon: 'ion-social-usd',
          disabled: false
        }
      ]
    };
  },
  computed: {
    filteredTokens() {
      if (this.activeChain === 'all') {
        return this.tokens;
      }
      return this.tokens.filter(token => token.chain === this.activeChain);
    },
    visibleTokens() {
      if (this.showAllTokens) {
        return this.filteredTokens;
      }
      return this.filteredTokens.slice(0, this.maxVisibleTokens);
    },
    showMoreButton() {
      return this.filteredTokens.length > this.maxVisibleTokens;
    },
    chainCounts() {
      const counts = {};
      this.chains.forEach(chain => {
        if (chain.id === 'all') {
          counts[chain.id] = this.tokens.length;
        } else {
          counts[chain.id] = this.tokens.filter(token => token.chain === chain.id).length;
        }
      });
      return counts;
    }
  },
  watch: {
    modelValue(newVal) {
      this.selectedToken = newVal;
      
      // 如果选择了代币，自动切换到对应的链标签
      const selectedTokenData = this.tokens.find(t => t.id === newVal);
      if (selectedTokenData) {
        this.activeChain = selectedTokenData.chain;
      }
    },
    chainCounts: {
      immediate: true,
      handler(counts) {
        this.chains.forEach(chain => {
          chain.count = counts[chain.id] || 0;
        });
      }
    },
    activeChain() {
      // 切换链时重置展开状态
      this.showAllTokens = false;
    }
  },
  methods: {
    handleTokenClick(tokenId) {
      const token = this.tokens.find(t => t.id === tokenId);
      if (token && !token.disabled) {
        this.selectedToken = tokenId;
        this.$emit('update:modelValue', tokenId);
        this.$emit('tokenClicked', tokenId);
      }
    },
    handleFiatMethodClick(methodId) {
      const method = this.fiatMethods.find(m => m.id === methodId);
      if (method && !method.disabled) {
        this.selectedToken = methodId;
        this.$emit('update:modelValue', methodId);
        this.$emit('methodClicked', methodId);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.paymentMethodSelector {
  width: 100%;
  
  .chainTabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 15px;
    
    .chainTab {
      padding: 6px 10px;
      border-radius: 16px;
      background-color: #f5f5f5;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: #e0e0e0;
      }
      
      &.active {
        background-color: #2196F3;
        color: white;
      }
      
      .chainIcon {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        
        &.bitcoin {
          background-color: #f7931a;
          color: white;
        }
        
        &.ethereum {
          background-color: #627eea;
          color: white;
        }
        
        &.solana {
          background-color: #14f195;
          color: #9945ff;
        }
        
        &.bsc {
          background-color: #f3ba2f;
          color: black;
        }
        
        &.base {
          background-color: #0052ff;
          color: white;
        }
        
        &.polygon {
          background-color: #8247e5;
          color: white;
        }
        
        &.privacy {
          background-color: #ff6b6b;
          color: white;
        }
      }
      
      .tokenCount {
        color: inherit;
        opacity: 0.7;
        font-size: 0.8em;
      }
    }
  }
  
  .tokenCardList, .otherPaymentMethods {
    margin-bottom: 15px;
    
    .sectionTitle {
      margin-bottom: 10px;
      font-weight: 500;
      color: #555;
      font-size: 0.9em;
    }
    
    .noTokens {
      padding: 10px;
      text-align: center;
      color: #999;
      background-color: #f9f9f9;
      border-radius: 6px;
      font-size: 0.9em;
    }
  }
  
  .tokenCards, .fiatCards {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .tokenCard, .fiatCard, .moreButton {
      position: relative;
      min-width: 100px;
      height: 40px;
      border-radius: 6px;
      background-color: #f9f9f9;
      border: 1px solid #e0e0e0;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 0 10px;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      
      &.selected {
        border-color: #2196F3;
        background-color: #e3f2fd;
      }
      
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        
        &:hover {
          transform: none;
          box-shadow: none;
        }
      }
      
      .checkmark {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #2196F3;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
      }
      
      .tokenIcon, .methodIcon, .moreIcon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
        font-size: 14px;
        flex-shrink: 0;
        
        &.btc {
          background-color: #f7931a;
          color: white;
        }
        
        &.eth, &.baseeth {
          background-color: #627eea;
          color: white;
        }
        
        &.usdt, &.solusdt, &.bscusdt, &.polyusdt {
          background-color: #26a17b;
          color: white;
        }
        
        &.usdc, &.solusdc, &.baseusdc, &.polyusdc {
          background-color: #2775ca;
          color: white;
        }
        
        &.dai {
          background-color: #f5ac37;
          color: white;
        }
        
        &.sol {
          background-color: #14f195;
          color: #9945ff;
        }
        
        &.bnb {
          background-color: #f3ba2f;
          color: black;
        }
        
        &.busd {
          background-color: #f0b90b;
          color: white;
        }
        
        &.matic {
          background-color: #8247e5;
          color: white;
        }
        
        &.xmr {
          background-color: #ff6b00;
          color: white;
        }
        
        &.zec {
          background-color: #ecb244;
          color: black;
        }
        
        &.stripe {
          background-color: #6772e5;
          color: white;
        }
        
        &.paypal {
          background-color: #0070ba;
          color: white;
        }
      }
      
      .moreIcon {
        background-color: #e0e0e0;
      }
      
      .tokenInfo {
        display: flex;
        align-items: center;
        
        .tokenName, .methodName, .moreText {
          font-weight: 500;
          font-size: 0.9em;
        }
        
        .tokenType {
          font-size: 0.8em;
          color: #777;
          margin-left: 4px;
        }
      }
      
      .methodName, .moreText {
        font-weight: 500;
        font-size: 0.9em;
      }
    }
    
    .moreButton {
      justify-content: center;
      background-color: #f0f0f0;
      padding: 0 12px;
      
      .moreIcon {
        margin-right: 4px;
      }
    }
  }
}
</style> 