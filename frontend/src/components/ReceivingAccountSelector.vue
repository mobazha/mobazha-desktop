<template>
  <div class="receivingAccountSelector">
    <div v-if="availableReceivingAccounts.length > 0" class="accountSelection">
      <Select2
        :id="selectorId"
        v-model="selectedAccountId"
        @change="onAccountChange"
        class="clrBr clrP rowSm"
      >
        <option value="" disabled>{{ $t('receivingAccountSelector.placeholder') }}</option>
        <option
          v-for="account in availableReceivingAccounts"
          :key="account.id"
          :value="account.id"
        >
          {{ account.name }} - {{ formatAddress(account.address) }}
        </option>
      </Select2>
      <div class="accountInfo clrT2 txSm">
        {{ $t('receivingAccountSelector.infoText') }}
      </div>
    </div>
    <div v-else class="noAccountWarning">
      <div class="warningMessage">
        <i class="ion-alert-circled"></i>
        <span>{{ $t('receivingAccountSelector.noAccountText') }}</span>
      </div>
    </div>

    <div class="addAccountSection">
      <el-button 
        type="primary" 
        size="small" 
        @click="navigateToReceivingAccounts"
        class="addAccountBtn"
      >
        <i class="ion-plus-round"></i>
        {{ $t('receivingAccountSelector.addAccountText') }}
      </el-button>
    </div>
    
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';
import { myGet } from '@/api/api.js';
import app from '../../backbone/app.js';

export default {
  name: 'ReceivingAccountSelector',
  props: {
    // 选择器ID
    selectorId: {
      type: String,
      default: 'receivingAccountSelector'
    },
    // 区块链类型
    blockchain: {
      type: String,
      required: true
    },
    // 默认选中的账户ID
    defaultAccountId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      availableReceivingAccounts: [],
      selectedAccountId: this.defaultAccountId
    };
  },
  computed: {
    selectedAccount() {
      if (!this.selectedAccountId) return null;
      return this.availableReceivingAccounts.find(acc => acc.id === this.selectedAccountId);
    }
  },
  watch: {
    blockchain: {
      handler() {
        this.fetchAvailableReceivingAccounts();
      },
      immediate: true
    },
    defaultAccountId: {
      handler(newValue) {
        this.selectedAccountId = newValue;
      },
      immediate: true
    }
  },
  methods: {
    // 获取可用的收款账户
    async fetchAvailableReceivingAccounts() {
      try {
        // 获取当前用户的收款账户列表
        const response = await myGet(app.getServerUrl('wallet/receivingaccountlist'));
        
        if (response && response.receivingAccounts) {
          // 区块链类型映射，处理不同的格式
          const blockchainMapping = {
            'ETH': ['ETH', 'Ethereum'],
            'SOL': ['SOL', 'Solana'],
            'BSC': ['BSC', 'Binance Smart Chain'],
            'BASE': ['BASE', 'Base'],
            'POLYGON': ['POLYGON', 'Polygon'],
            'ARBITRUM': ['ARBITRUM', 'Arbitrum'],
            'OPTIMISM': ['OPTIMISM', 'Optimism'],
            'AVALANCHE': ['AVALANCHE', 'Avalanche']
          };
          
          // 获取当前区块链的所有可能格式
          const validChainTypes = blockchainMapping[this.blockchain] || [this.blockchain];
          
          // 过滤出相同区块链类型的激活账户
          this.availableReceivingAccounts = response.receivingAccounts.filter(account => {
            const isValidChainType = validChainTypes.includes(account.chainType);
            const isActive = account.isActive;
            
            return isValidChainType && isActive;
          });
          
          // 如果有可用账户且没有默认选择，则选择第一个
          if (this.availableReceivingAccounts.length > 0 && !this.selectedAccountId) {
            this.selectedAccountId = this.availableReceivingAccounts[0].id;
            this.$emit('account-selected', this.availableReceivingAccounts[0]);
          }
        } else {
          this.availableReceivingAccounts = [];
          this.selectedAccountId = '';
        }
      } catch (error) {
        console.error('获取收款账户失败:', error);
        ElMessage.error(this.$t('receivingAccountSelector.fetchError'));
        this.availableReceivingAccounts = [];
        this.selectedAccountId = '';
      }
    },

    // 导航到收款账户管理页面
    navigateToReceivingAccounts() {
      // 直接在这里处理导航逻辑
      this.$emit('navigate-to-accounts');
    },
    
    // 外部调用刷新账户列表的方法
    refreshAccounts() {
      this.fetchAvailableReceivingAccounts();
    },

    // 格式化地址
    formatAddress(address) {
      if (!address) return '';
      const maxLength = 10; // 显示前10位和后10位
      if (address.length <= maxLength * 2) {
        return address;
      }
      return `${address.substring(0, maxLength)}...${address.substring(address.length - maxLength)}`;
    },

    // 账户选择改变时触发
    onAccountChange() {
      const selectedAccount = this.availableReceivingAccounts.find(acc => acc.id === this.selectedAccountId);
      if (selectedAccount) {
        this.$emit('account-selected', selectedAccount);
      } else {
        this.$emit('account-selected', null);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.receivingAccountSelector {
  .accountSelection {
    .accountInfo {
      margin-top: 8px;
      padding: 8px 12px;
      background-color: #f0f9ff;
      border-radius: 4px;
      border-left: 3px solid #3b82f6;
    }
  }

  .noAccountWarning {
    padding: 16px;
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    margin-top: 8px;

    .warningMessage {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      color: #92400e;
      
      i {
        margin-right: 8px;
        font-size: 16px;
      }
    }
  }

  .addAccountSection {
    margin-top: 12px;
    padding: 12px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    text-align: center;

    .addAccountBtn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      
      i {
        font-size: 14px;
      }
    }
  }
}
</style> 