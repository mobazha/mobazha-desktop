<template>
  <div class="stripeFormContainer">
    <!-- Stripe图标和标题 -->
    <div class="stripeHeader">
      <div class="stripeIcon">
        <i class="ion-social-usd-outline"></i>
      </div>
      <h3 class="stripeName">Stripe</h3>
    </div>
    
    <!-- Stripe说明 -->
    <div class="stripeDescription">
      通过Stripe接收信用卡付款，支持全球多种货币和支付方式。
    </div>
    
    <!-- Stripe连接按钮 -->
    <div class="stripeConnectContainer">
      <button @click="$emit('connect-stripe')" class="btn connectStripeBtn">
        <i class="ion-link"></i>
        <span>连接Stripe账户</span>
      </button>
      <p class="connectHint">点击按钮连接您的Stripe账户，或创建新账户</p>
    </div>
    
    <!-- Stripe账户信息 -->
    <div v-if="account.accountId" class="stripeAccountInfo">
      <div class="accountIdContainer">
        <label>Stripe账户ID</label>
        <input type="text" v-model="account.accountId" readonly class="accountIdInput" />
      </div>
      
      <button @click="$emit('connect-stripe')" class="btn reconnectStripeBtn">
        <i class="ion-refresh"></i>
        <span>重新连接Stripe</span>
      </button>
    </div>
    
    <!-- 启用开关 -->
    <div class="enableSwitchContainer">
      <label>启用此收款方式</label>
      <ToggleSwitch 
        v-model="account.enabled" 
        id="enableStripeSwitch_unique" 
      />
      <p class="enableHint">启用后，买家可以通过Stripe向您付款</p>
    </div>
  </div>
</template>

<script>
import ToggleSwitch from './ToggleSwitch.vue';

export default {
  components: {
    ToggleSwitch
  },
  props: {
    account: {
      type: Object,
      required: true
    }
  }
};
</script>

<style lang="scss" scoped>
.stripeFormContainer {
  .stripeHeader {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    .stripeIcon {
      font-size: 30px;
      margin-right: 15px;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(99, 91, 255, 0.1);
      border-radius: 50%;
      color: #635BFF;
    }
    
    .stripeName {
      font-size: 20px;
      margin: 0;
    }
  }
  
  .stripeDescription {
    margin-bottom: 30px;
    line-height: 1.5;
    color: rgba(0, 0, 0, 0.7);
  }
  
  .stripeConnectContainer {
    margin-bottom: 20px;
    
    .connectStripeBtn {
      display: flex;
      align-items: center;
      background-color: #635BFF;
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
        background-color: darken(#635BFF, 10%);
      }
    }
    
    .connectHint {
      margin-top: 5px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
  }
  
  .stripeAccountInfo {
    margin-bottom: 20px;
    
    .accountIdContainer {
      margin-bottom: 15px;
      
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      .accountIdInput {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: monospace;
        background-color: #f5f5f5;
      }
    }
    
    .reconnectStripeBtn {
      display: flex;
      align-items: center;
      background-color: transparent;
      color: #635BFF;
      border: 1px solid #635BFF;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      
      i {
        margin-right: 8px;
      }
      
      &:hover {
        background-color: rgba(99, 91, 255, 0.1);
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