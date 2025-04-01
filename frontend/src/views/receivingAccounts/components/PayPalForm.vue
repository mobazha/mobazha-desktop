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
      通过PayPal接收付款，买家可以使用信用卡、借记卡或PayPal余额向您付款。
    </div>
    
    <!-- PayPal邮箱输入 -->
    <div class="paypalEmailContainer">
      <label>PayPal邮箱地址</label>
      <input type="email" v-model="account.email" class="paypalEmailInput" placeholder="例如：your-email@example.com" />
      <p class="emailHint">请输入您的PayPal账户关联的邮箱地址</p>
    </div>
    
    <!-- 启用开关 -->
    <div class="enableSwitchContainer">
      <label>启用此收款方式</label>
      <div class="switchWrapper">
        <input type="checkbox" v-model="account.enabled" id="enablePaypalSwitch" />
        <label for="enablePaypalSwitch" class="toggleSwitch"></label>
      </div>
      <p class="enableHint">启用后，买家可以通过PayPal向您付款</p>
    </div>
  </div>
</template>

<script>
export default {
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
    
    .switchWrapper {
      position: relative;
      width: 60px;
      height: 30px;
      
      input[type="checkbox"] {
        opacity: 0;
        width: 0;
        height: 0;
        
        &:checked + .toggleSwitch {
          background-color: #4CAF50;
          
          &:before {
            transform: translateX(30px);
          }
        }
      }
      
      .toggleSwitch {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 34px;
        
        &:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
      }
    }
    
    .enableHint {
      margin-top: 5px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
  }
}
</style> 