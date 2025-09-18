<template>
  <div class="paypalFormContainer">
    <!-- PayPal图标和标题 -->
    <div class="paypalHeader">
      <div class="paypalIcon">
        <i class="ion-card"></i>
      </div>
      <h3 class="paypalName">PayPal</h3>
    </div>
    
    <!-- PayPal说明 -->
    <div class="paypalDescription">
      {{ $t('receivingAccounts.paypalDescription') }}
    </div>
    
    <!-- PayPal邮箱输入 -->
    <div class="paypalEmailContainer">
      <label>{{ $t('receivingAccounts.paypalEmail') }}</label>
      <input type="email" v-model="account.email" class="paypalEmailInput" :placeholder="$t('receivingAccounts.paypalEmailPlaceholder')" />
      <p class="emailHint">{{ $t('receivingAccounts.paypalEmailHint') }}</p>
    </div>
    
    <!-- 启用开关 -->
    <div class="enableSwitchContainer">
      <label>{{ $t('receivingAccounts.enablePaymentMethod') }}</label>
      <ToggleSwitch 
        v-model="account.isActive" 
        id="enablePaypalSwitch_unique" 
      />
      <p class="enableHint">{{ $t('receivingAccounts.paypalEnableHint') }}</p>
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
.paypalFormContainer {
  .paypalHeader {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    .paypalIcon {
      font-size: 30px;
      margin-right: 15px;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 48, 135, 0.1);
      border-radius: 50%;
      color: #003087;
    }
    
    .paypalName {
      font-size: 20px;
      margin: 0;
    }
  }
  
  .paypalDescription {
    margin-bottom: 30px;
    line-height: 1.5;
    color: rgba(0, 0, 0, 0.7);
  }
  
  .paypalEmailContainer {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .paypalEmailInput {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .emailHint {
      margin-top: 5px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
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