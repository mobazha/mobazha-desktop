<template>
  <div class="paymentMethodSetup">
    <div class="setupHeader">
      <div :class="`setupIcon ${methodIconClass}`">
        <i :class="methodIcon"></i>
      </div>
      <h4>{{ methodName }}</h4>
    </div>
    
    <!-- 以太坊设置 -->
    <template v-if="method === 'ethereum'">
      <div class="setupDescription">
        通过以太坊钱包接收 ETH 和 ERC-20 代币支付。
      </div>
      
      <div class="setupSteps">
        <div class="setupStep">
          <div class="stepNumber">1</div>
          <div class="stepContent">
            <h5>准备以太坊钱包</h5>
            <p>确保您已安装 MetaMask 或其他支持以太坊的钱包</p>
          </div>
        </div>
        <div class="setupStep">
          <div class="stepNumber">2</div>
          <div class="stepContent">
            <h5>连接钱包</h5>
            <p>点击下方按钮连接您的钱包，获取收款地址</p>
          </div>
        </div>
      </div>
      
      <div class="btnConnect">
        <button class="connectBtn" @click="$emit('connect', method)">
          <i class="ion-link"></i>
          {{ hasAddress ? '更换钱包' : '连接钱包' }}
        </button>
      </div>
      
      <div v-if="address" class="addressDisplay">
        <div class="addressLabel">以太坊收款地址：</div>
        <div class="addressValue">
          <div class="address">{{ address }}</div>
          <div class="copyBtn" @click="$emit('copy', address)">
            <i class="ion-ios-copy-outline"></i>
          </div>
        </div>
      </div>
    </template>
    
    <!-- BSC设置 -->
    <template v-if="method === 'bsc'">
      <div class="setupDescription">
        通过币安智能链钱包接收 BNB 和 BEP-20 代币支付。
      </div>
      
      <div class="setupSteps">
        <div class="setupStep">
          <div class="stepNumber">1</div>
          <div class="stepContent">
            <h5>准备BSC钱包</h5>
            <p>确保您已安装支持BSC的钱包，如MetaMask并已添加BSC网络</p>
          </div>
        </div>
        <div class="setupStep">
          <div class="stepNumber">2</div>
          <div class="stepContent">
            <h5>连接钱包</h5>
            <p>点击下方按钮连接您的钱包，获取收款地址</p>
          </div>
        </div>
      </div>
      
      <div class="btnConnect">
        <button class="connectBtn" @click="$emit('connect', method)">
          <i class="ion-link"></i>
          {{ hasAddress ? '更换钱包' : '连接钱包' }}
        </button>
      </div>
      
      <div v-if="address" class="addressDisplay">
        <div class="addressLabel">BSC收款地址：</div>
        <div class="addressValue">
          <div class="address">{{ address }}</div>
          <div class="copyBtn" @click="$emit('copy', address)">
            <i class="ion-ios-copy-outline"></i>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Solana设置 -->
    <template v-if="method === 'solana'">
      <!-- 类似的 Solana 设置内容 -->
    </template>
    
    <!-- Base设置 -->
    <template v-if="method === 'base'">
      <!-- 类似的 Base 设置内容 -->
    </template>
    
    <!-- PayPal设置 -->
    <template v-if="method === 'paypal'">
      <div class="setupDescription">
        通过PayPal账户接收付款。
      </div>
      
      <div class="setupSteps">
        <div class="setupStep">
          <div class="stepNumber">1</div>
          <div class="stepContent">
            <h5>准备PayPal账户</h5>
            <p>确保您已有一个PayPal商家账户</p>
          </div>
        </div>
        <div class="setupStep">
          <div class="stepNumber">2</div>
          <div class="stepContent">
            <h5>填写PayPal邮箱</h5>
            <p>输入您的PayPal账户关联的邮箱地址</p>
          </div>
        </div>
      </div>
      
      <div class="inputField">
        <label for="paypalEmail">PayPal账号邮箱:</label>
        <input 
          type="email" 
          id="paypalEmail"
          v-model="localEmail"
          placeholder="例如: your_email@example.com"
          @input="updateEmail"
        />
      </div>
    </template>
    
    <!-- Stripe设置 -->
    <template v-if="method === 'stripe'">
      <div class="setupDescription">
        通过Stripe接收信用卡付款。
      </div>
      
      <div class="setupSteps">
        <div class="setupStep">
          <div class="stepNumber">1</div>
          <div class="stepContent">
            <h5>注册Stripe账户</h5>
            <p>如果您还没有Stripe账户，您需要先注册一个</p>
          </div>
        </div>
        <div class="setupStep">
          <div class="stepNumber">2</div>
          <div class="stepContent">
            <h5>连接Stripe账户</h5>
            <p>点击下方按钮授权连接您的Stripe账户</p>
          </div>
        </div>
      </div>
      
      <div class="btnConnect">
        <button class="connectBtn" @click="$emit('connectStripe')">
          <i class="ion-link"></i>
          连接Stripe账户
        </button>
      </div>
      
      <div v-if="accountId" class="addressDisplay">
        <div class="addressLabel">Stripe账户ID:</div>
        <div class="addressValue">
          <div class="address">{{ accountId }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    method: {
      type: String,
      required: true
    },
    address: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    accountId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      localEmail: this.email,
      methodsInfo: {
        ethereum: {
          name: '以太坊/ERC-20代币',
          icon: 'ion-social-bitcoin',
          iconClass: ''
        },
        bsc: {
          name: 'BSC/BEP-20代币',
          icon: 'ion-social-bitcoin',
          iconClass: 'bscIcon'
        },
        solana: {
          name: 'Solana',
          icon: 'ion-social-bitcoin',
          iconClass: 'solanaIcon'
        },
        base: {
          name: 'Base',
          icon: 'ion-social-bitcoin',
          iconClass: 'baseIcon'
        },
        paypal: {
          name: 'PayPal',
          icon: 'ion-card',
          iconClass: 'paypalIcon'
        },
        stripe: {
          name: 'Stripe',
          icon: 'ion-card',
          iconClass: 'stripeIcon'
        }
      }
    };
  },
  computed: {
    methodName() {
      const methodNames = {
        ethereum: '以太坊',
        bsc: '币安智能链',
        solana: 'Solana',
        base: 'Base',
        paypal: 'PayPal',
        stripe: 'Stripe'
      };
      return methodNames[this.method] || this.method;
    },
    methodIcon() {
      const icons = {
        ethereum: 'ion-social-bitcoin',
        bsc: 'ion-social-bitcoin',
        solana: 'ion-social-bitcoin',
        base: 'ion-social-bitcoin',
        paypal: 'ion-card',
        stripe: 'ion-card'
      };
      return icons[this.method] || 'ion-help';
    },
    methodIconClass() {
      const iconClasses = {
        ethereum: '',
        bsc: 'bscIcon',
        solana: 'solanaIcon',
        base: 'baseIcon',
        paypal: 'paypalIcon',
        stripe: 'stripeIcon'
      };
      return iconClasses[this.method] || '';
    },
    hasAddress() {
      return !!this.address;
    }
  },
  methods: {
    updateEmail() {
      this.$emit('updateEmail', this.localEmail);
    }
  },
  watch: {
    address(newVal) {
      console.log(`地址已更新: ${newVal}`);
    }
  }
};
</script>

<style lang="scss" scoped>
.paymentMethodSetup {
  padding: 20px;
  
  .setupHeader {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    .setupIcon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #627eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-right: 16px;
      
      &.bscIcon {
        background-color: #f8bc17;
      }
      
      &.solanaIcon {
        background-color: #9945ff;
      }
      
      &.baseIcon {
        background-color: #0052ff;
      }
      
      &.paypalIcon {
        background-color: #003087;
      }
      
      &.stripeIcon {
        background-color: #6772e5;
      }
    }
  }
  
  .setupDescription {
    margin-bottom: 20px;
    color: rgba(0, 0, 0, 0.7);
  }
  
  .setupSteps {
    margin-bottom: 20px;
    
    .setupStep {
      display: flex;
      margin-bottom: 16px;
      
      .stepNumber {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: #2196F3;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 16px;
        flex-shrink: 0;
      }
    }
  }
  
  .btnConnect {
    margin: 20px 0;
    
    .connectBtn {
      padding: 10px 16px;
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      
      &:hover {
        background-color: darken(#2196F3, 10%);
      }
      
      i {
        margin-right: 8px;
      }
    }
  }
  
  .addressDisplay {
    background-color: rgba(0, 0, 0, 0.03);
    padding: 12px;
    border-radius: 4px;
    
    .addressLabel {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
    }
    
    .addressValue {
      display: flex;
      align-items: center;
      
      .address {
        flex: 1;
        word-break: break-all;
        font-family: monospace;
      }
      
      .copyBtn {
        margin-left: 8px;
        cursor: pointer;
        color: #2196F3;
      }
    }
  }
  
  .inputField {
    margin: 20px 0;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    input {
      width: 100%;
      padding: 10px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      font-size: 14px;
    }
  }
}
</style> 