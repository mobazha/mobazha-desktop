<template>
  <div class="walletSetupContainer">
    <!-- 钱包图标和标题 -->
    <div class="walletHeader">
      <div class="walletIcon">
        <i :class="getChainIcon(account.chainType)"></i>
      </div>
      <h3 class="walletName">{{ account.chainType }}</h3>
    </div>
    
    <!-- 钱包说明 -->
    <div class="walletDescription">
      通过{{ account.chainType }}钱包接收 
      <span v-if="account.chainType === 'BTC'">BTC 支付。</span>
      <span v-if="account.chainType === 'ETH'">ETH 和 ERC-20 代币支付。</span>
      <span v-else-if="account.chainType === 'SOL'">SOL 及相关代币支付。</span>
      <span v-else-if="account.chainType === 'BSC'">BNB、BUSD等代币支付。</span>
      <span v-else-if="account.chainType === 'Base'">Base链上的代币支付。</span>
      <span v-else>加密货币支付。</span>
    </div>
    
    <!-- 步骤指引 -->
    <div class="setupSteps">
      <div class="setupStep">
        <div class="stepNumber">1</div>
        <div class="stepContent">
          <h4>准备{{ account.chainType }}钱包</h4>
          <p>确保您已安装 
            <span v-if="account.chainType === 'BTC'">Bitcoin Core 或其他比特币钱包</span>
            <span v-if="account.chainType === 'ETH'">MetaMask 或其他支持以太坊的钱包</span>
            <span v-else-if="account.chainType === 'SOL'">Phantom 或其他支持Solana的钱包</span>
            <span v-else-if="account.chainType === 'BSC'">MetaMask 或其他支持BSC的钱包</span>
            <span v-else-if="account.chainType === 'Base'">MetaMask 或其他支持Base的钱包</span>
            <span v-else>相关钱包</span>
          </p>
        </div>
      </div>

      <div class="setupStep">
        <div class="stepNumber">2</div>
        <div class="stepContent">
          <h4>连接钱包</h4>
          <p>点击下方按钮连接您的钱包，获取收款地址</p>
        </div>
      </div>
    </div>
    
    <!-- 连接钱包按钮 -->
    <div class="connectWalletBtnContainer">
      <button @click="$emit('connect-wallet', account.chainType)" class="btn connectWalletBtn" :disabled="isConnecting">
        <i class="ion-link"></i>
        <span>{{ isConnecting ? '连接中...' : '连接钱包' }}</span>
      </button>
    </div>
    
    <!-- 钱包地址输入 -->
    <div v-if="account.address" class="walletAddressContainer">
      <label>钱包地址</label>
      <input type="text" v-model="account.address" readonly class="walletAddressInput" @click="copyAddress" />
      <p class="addressHint">这是您的{{ account.chainType }}钱包地址，买家将向此地址付款</p>
    </div>
    
    <!-- 代币选择 -->
    <div v-if="account.chainType === 'ETH' || account.chainType === 'SOL' || account.chainType === 'BSC' || account.chainType === 'Base'" class="tokenSelectionContainer">
      <label>接收代币</label>
      <div class="tokenList">
        <div v-for="token in getAvailableTokens(account.chainType)" :key="token.id" class="tokenItem">
          <input type="checkbox" 
                 :id="token.id" 
                 :value="token.id" 
                 v-model="localTokens" 
                 @change="updateTokens" />
          <label :for="token.id">{{ token.token }}</label>
        </div>
      </div>
    </div>
    
    <!-- 启用开关 -->
    <div class="enableSwitchContainer">
      <label>启用此收款方式</label>
      <ToggleSwitch v-model="account.isActive" :id="'enableSwitch_' + account.chainType" />
      <p class="enableHint">启用后，买家可以通过此方式向您付款</p>
    </div>
  </div>
</template>

<script>
import ToggleSwitch from './ToggleSwitch.vue';
import { getTokensByChain } from '@/config/token.js';

export default {
  components: {
    ToggleSwitch
  },
  props: {
    account: {
      type: Object,
      required: true
    },
    tokens: {
      type: Array,
      default: () => []
    },
    isConnecting: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      localTokens: []
    };
  },
  watch: {
    tokens: {
      handler(newTokens) {
        this.localTokens = [...newTokens];
      },
      immediate: true
    },
    'account.activeTokens': {
      handler(newTokens) {
        if (Array.isArray(newTokens)) {
          this.localTokens = [...newTokens];
        }
      },
      immediate: true
    }
  },
  methods: {
    updateTokens() {
      this.$emit('update:tokens', this.localTokens);
    },
    
    copyAddress() {
      if (this.account.address) {
        navigator.clipboard.writeText(this.account.address)
          .then(() => {
            alert('地址已复制到剪贴板');
          })
          .catch(err => {
            console.error('复制失败:', err);
          });
      }
    },
    
    getChainIcon(chainType) {
      switch (chainType) {
        case 'BTC':
          return 'ion-social-bitcoin';
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
    
    getAvailableTokens(chainType) {
      // 使用配置文件中的代币数据
      return getTokensByChain(chainType);
    }
  }
};
</script>

<style lang="scss" scoped>
.walletSetupContainer {
  .walletHeader {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    .walletIcon {
      font-size: 30px;
      margin-right: 15px;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 50%;
    }
    
    .walletName {
      font-size: 20px;
      margin: 0;
    }
  }
  
  .walletDescription {
    margin-bottom: 30px;
    line-height: 1.5;
    color: rgba(0, 0, 0, 0.7);
  }
  
  .setupSteps {
    margin-bottom: 30px;
    
    .setupStep {
      display: flex;
      margin-bottom: 20px;
      
      .stepNumber {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: #2196F3;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        flex-shrink: 0;
      }
      
      .stepContent {
        h4 {
          margin: 0 0 5px 0;
        }
        
        p {
          margin: 0;
          color: rgba(0, 0, 0, 0.7);
        }
      }
    }
  }
  
  .connectWalletBtnContainer {
    margin-bottom: 20px;
    
    .connectWalletBtn {
      display: flex;
      align-items: center;
      background-color: #2196F3;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      
      i {
        margin-right: 10px;
      }
      
      &:hover {
        background-color: darken(#2196F3, 10%);
      }
      
      &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
    }
  }
  
  .walletAddressContainer {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .walletAddressInput {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      background-color: #f5f5f5;
    }
    
    .addressHint {
      margin-top: 5px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
  }
  
  .tokenSelectionContainer {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 10px;
      font-weight: bold;
    }
    
    .tokenList {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
      
      .tokenItem {
        display: flex;
        align-items: center;
        
        input[type="checkbox"] {
          margin-right: 8px;
        }
      }
    }
  }
  
  .enableSwitchContainer {
    margin-top: 30px;
    
    label {
      display: block;
      margin-bottom: 10px;
      font-weight: bold;
    }
    
    .enableHint {
      margin-top: 5px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
  }
}
</style> 