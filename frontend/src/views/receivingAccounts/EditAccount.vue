<template>
  <div class="contentBox padMd clrP clrBr">
    <h2 class="tx3 txB">{{ $t('receivingAccounts.setupAccount', { chainType: account.chainType || getPaymentMethodName(account.name) }) }}</h2>
    
    <!-- 账户名称输入 -->
    <div class="formGroup">
      <label class="formLabel">{{ $t('receivingAccounts.accountName') }}</label>
      <input 
        type="text" 
        v-model="account.name" 
        class="formInput"
        :placeholder="$t('receivingAccounts.enterAccountName')"
        :disabled="!!account.id"
      />
      <div class="formHint" v-if="account.id">{{ $t('receivingAccounts.accountNameCannotChange') }}</div>
    </div>
    
    <!-- 区块链账户设置 -->
    <BlockchainWalletForm 
      v-if="account.chainType && account.chainType !== 'PayPal' && account.chainType !== 'Stripe'"
      :account="account"
      :tokens="tokens"
      :isConnecting="isConnecting"
      @update:tokens="$emit('update:tokens', $event)"
      @connect-wallet="$emit('connect-wallet', account.chainType)"
    />
    
    <!-- PayPal表单 -->
    <PayPalForm
      v-if="account && account.name === 'paypal'"
      :account="account"
    />
    
    <!-- Stripe表单 -->
    <StripeForm
      v-if="account && account.name === 'stripe'"
      :account="account"
      @connect-stripe="$emit('connect-stripe')"
    />
    
    <!-- 底部按钮 -->
    <div class="actionButtons">
      <button v-if="account.id" 
              @click="$emit('delete', account)" 
              class="btn deleteBtn">
        {{ $t('receivingAccounts.deleteAccount') }}
      </button>
      <div class="flexExpand"></div>
      <button @click="$emit('cancel')" class="btn cancelBtn">{{ $t('receivingAccounts.cancel') }}</button>
      <button @click="$emit('save')" class="btn saveBtn" :disabled="isSaving">
        {{ isSaving ? $t('receivingAccounts.saving') : $t('receivingAccounts.save') }}
      </button>
    </div>
  </div>
</template>

<script>
import BlockchainWalletForm from './components/BlockchainWalletForm.vue';
import PayPalForm from './components/PayPalForm.vue';
import StripeForm from './components/StripeForm.vue';

export default {
  components: {
    BlockchainWalletForm,
    PayPalForm,
    StripeForm
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
    },
    isSaving: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    getPaymentMethodName(methodId) {
      switch (methodId) {
        case 'paypal':
          return 'PayPal';
        case 'stripe':
          return 'Stripe';
        default:
          return methodId;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.formGroup {
  margin-bottom: 20px;
  
  .formLabel {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
  }
  
  .formInput {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    
    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
    
    &:focus {
      border-color: #2196F3;
      outline: none;
    }
  }
  
  .formHint {
    margin-top: 4px;
    font-size: 12px;
    color: #666;
  }
}

.actionButtons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  
  .deleteBtn {
    padding: 10px 20px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    
    &:hover {
      background-color: #f5f5f5;
    }
  }
  
  .cancelBtn {
    padding: 10px 20px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    
    &:hover {
      background-color: #f5f5f5;
    }
  }
  
  .saveBtn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    background-color: #2196F3;
    color: white;
    cursor: pointer;
    
    &:hover {
      background-color: darken(#2196F3, 10%);
    }
    
    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  }
}
</style> 