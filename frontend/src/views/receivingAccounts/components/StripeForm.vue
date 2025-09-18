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
      {{ $t('receivingAccounts.stripeDescription') }}
    </div>
    
    <!-- Stripe账户状态 -->
    <div v-if="account.stripeAccountId" class="stripeAccountStatus">
      <div class="statusInfo">
        <el-tag
          :type="getStatusType(account.status)"
          size="small"
          class="statusTag"
        >
          {{ getStatusText(account.status) }}
        </el-tag>
      </div>
      
      <div class="accountIdContainer">
        <label>{{ $t('receivingAccounts.stripeAccountId') }}</label>
        <div class="accountIdWrapper">
          <input type="text" :value="account.stripeAccountId" readonly class="accountIdInput" />
          <el-button
            type="primary"
            link
            @click="copyAccountId"
            :title="$t('receivingAccounts.copyAccountId')"
          >
            <el-icon><Document /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- Stripe连接按钮 -->
    <div class="stripeConnectContainer">
      <el-button
        v-if="!account.stripeAccountId"
        type="primary"
        @click="$emit('connect-stripe')"
        class="connectStripeBtn"
      >
        <el-icon><Link /></el-icon>
        <span>{{ $t('receivingAccounts.connectStripe') }}</span>
      </el-button>
      <el-button
        v-else-if="account.status !== 'approved'"
        type="warning"
        @click="$emit('reverify-stripe')"
        class="reverifyStripeBtn"
      >
        <el-icon><Refresh /></el-icon>
        <span>{{ $t('receivingAccounts.reverifyStripe') }}</span>
      </el-button>
      <p class="connectHint">
        {{ getConnectHint() }}
      </p>
    </div>
    
    <!-- 启用开关 -->
    <div class="enableSwitchContainer">
      <label>{{ $t('receivingAccounts.enablePaymentMethod') }}</label>
      <ToggleSwitch 
        v-model="account.isActive" 
        id="enableStripeSwitch_unique"
        :disabled="!account.stripeAccountId || account.status !== 'approved'"
      />
      <p class="enableHint">
        {{ getEnableHint() }}
      </p>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import {
  Document,
  Link,
  Refresh
} from '@element-plus/icons-vue'
import ToggleSwitch from './ToggleSwitch.vue'

export default {
  components: {
    ToggleSwitch,
    Document,
    Link,
    Refresh
  },
  props: {
    account: {
      type: Object,
      required: true
    }
  },
  methods: {
    getStatusType(status) {
      switch (status) {
        case 'approved':
          return 'success'
        case 'pending':
          return 'warning'
        default:
          return 'danger'
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 'approved':
          return this.$t('receivingAccounts.verified')
        case 'pending':
          return this.$t('receivingAccounts.verifying')
        default:
          return this.$t('receivingAccounts.unverified')
      }
    },
    
    getConnectHint() {
      if (!this.account.stripeAccountId) {
        return this.$t('receivingAccounts.connectHint')
      } else if (this.account.status !== 'approved') {
        return this.$t('receivingAccounts.verificationHint')
      }
      return this.$t('receivingAccounts.verifiedHint')
    },
    
    getEnableHint() {
      if (!this.account.stripeAccountId) {
        return this.$t('receivingAccounts.enableHintConnect')
      } else if (this.account.status !== 'approved') {
        return this.$t('receivingAccounts.enableHintVerify')
      }
      return this.$t('receivingAccounts.enableHintStripe')
    },
    
    copyAccountId() {
      if (!this.account.stripeAccountId) return
      
      navigator.clipboard.writeText(this.account.stripeAccountId)
        .then(() => {
          ElMessage.success(this.$t('receivingAccounts.accountIdCopied'))
        })
        .catch(err => {
          console.error('复制失败:', err)
          ElMessage.error(this.$t('receivingAccounts.copyFailedManual'))
        })
    }
  }
}
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
  
  .stripeAccountStatus {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
    
    .statusInfo {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      
      .statusTag {
        margin-right: 8px;
      }
    }
    
    .accountIdContainer {
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      .accountIdWrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .accountIdInput {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          font-family: monospace;
          background-color: #f5f7fa;
          color: #606266;
        }
      }
    }
  }
  
  .stripeConnectContainer {
    margin-bottom: 20px;
    
    .connectStripeBtn,
    .reverifyStripeBtn {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .connectHint {
      margin-top: 8px;
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