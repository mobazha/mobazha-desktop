<template>
  <div class="contentBox padMd clrP clrBr">
    <div class="listHeader">
      <h2 class="tx3 txB">收款账户列表</h2>
      <div class="flexExpand"></div>
      <a class="btn clrP clrBr btnFlx" @click="$emit('add-new')">
        <i class="ion-plus-round"></i>
        <span>添加收款账户</span>
      </a>
    </div>
    
    <!-- 详细列表视图 -->
    <div class="accountsTable">
      <table>
        <thead>
          <tr>
            <th>收款账户类型</th>
            <th>收款账户</th>
            <th>最近入账时间</th>
            <th>最近入账金额</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- 区块链钱包账户 -->
          <template v-for="account in blockchainAccounts" :key="account.name">
            <!-- 主币行 -->
            <tr>
              <td>
                <div class="walletTypeCell">
                  <div class="accountIcon" :class="account.name.toLowerCase()">
                    <i :class="getChainIcon(account.chainType)"></i>
                  </div>
                  <div class="walletInfo">
                    <span class="chainType">{{ account.chainType }}</span>
                    <div class="walletSource">
                      <i :class="getWalletIcon(account.chainType)"></i>
                      <span>{{ getWalletName(account.chainType) }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="addressCell">
                <div class="addressWrapper">
                  <span class="accountAddress" :title="account.address">
                    {{ formatAddress(account.address) }}
                  </span>
                  <button class="copyBtn" 
                    @click="copyAddress(account.address)" 
                    :title="`复制地址: ${account.address}`"
                  >
                    <i class="ion-ios-copy-outline"></i>
                  </button>
                </div>
              </td>
              <td>{{ account.lastTransactionTime || '暂无' }}</td>
              <td>{{ account.lastTransactionAmount || '暂无' }}</td>
              <td>
                <div class="statusBadge" :class="{ enabled: account.enabled }">
                  {{ account.enabled ? '已启用' : '已禁用' }}
                </div>
              </td>
              <td>
                <div class="actionButtons">
                  <button @click="$emit('edit', account)" class="btn editBtn" title="编辑">
                    <i class="ion-edit"></i>
                  </button>
                  <button v-if="account.enabled" @click="$emit('disable', account)" class="btn disableBtn" title="禁用">
                    <i class="ion-ios-close-outline"></i>
                  </button>
                  <button v-else @click="$emit('enable', account)" class="btn enableBtn" title="启用">
                    <i class="ion-checkmark-round"></i>
                  </button>
                </div>
              </td>
            </tr>
            
            <!-- 代币行 -->
            <tr v-for="token in getEnabledTokens(account)" :key="`${account.name}-${token}`" class="tokenRow">
              <td>
                <div class="tokenTypeCell">
                  <div class="tokenIcon">
                    <i :class="getTokenIcon(token)"></i>
                  </div>
                  <span class="tokenName">{{ token }}</span>
                </div>
              </td>
              <td></td>
              <td>{{ account.tokenTransactions?.[token]?.time || '暂无' }}</td>
              <td>{{ account.tokenTransactions?.[token]?.amount || '暂无' }}</td>
              <td>
                <div class="statusBadge enabled">已启用</div>
              </td>
              <td></td>
            </tr>
          </template>
          
          <!-- 其他支付方式账户 -->
          <tr v-for="account in otherAccounts" :key="account.name">
            <td>
              <div class="walletTypeCell">
                <div class="accountIcon" :class="account.name.toLowerCase()">
                  <i :class="getPaymentMethodIcon(account.name)"></i>
                </div>
                <span>{{ getPaymentMethodName(account.name) }}</span>
              </div>
            </td>
            <td>
              <span v-if="account.email">{{ account.email }}</span>
              <span v-else-if="account.accountId">{{ formatId(account.accountId) }}</span>
              <span v-else>-</span>
            </td>
            <td>{{ account.lastTransactionTime || '暂无' }}</td>
            <td>{{ account.lastTransactionAmount || '暂无' }}</td>
            <td>
              <div class="statusBadge" :class="{ enabled: account.enabled }">
                {{ account.enabled ? '已启用' : '已禁用' }}
              </div>
            </td>
            <td>
              <div class="actionButtons">
                <button @click="$emit('edit', account)" class="btn editBtn" title="编辑">
                  <i class="ion-edit"></i>
                </button>
                <button v-if="account.enabled" @click="$emit('disable', account)" class="btn disableBtn" title="禁用">
                  <i class="ion-ios-close-outline"></i>
                </button>
                <button v-else @click="$emit('enable', account)" class="btn enableBtn" title="启用">
                  <i class="ion-checkmark-round"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 空状态 -->
    <div v-if="!receivingAccounts || receivingAccounts.length === 0" class="emptyState">
      <p>暂无收款账户，请点击"添加收款账户"按钮添加。</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    receivingAccounts: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    blockchainAccounts() {
      return this.receivingAccounts.filter(account => account.chainType);
    },
    otherAccounts() {
      return this.receivingAccounts.filter(account => !account.chainType);
    }
  },
  methods: {
    getEnabledTokens(account) {
      if (account._enabledTokens && Array.isArray(account._enabledTokens)) {
        return account._enabledTokens;
      }
      return [];
    },
    
    formatAddress(address) {
      if (!address) return '';
      if (address.length <= 12) return address;
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },
    
    formatId(id) {
      if (!id) return '';
      if (id.length <= 12) return id;
      return `${id.substring(0, 6)}...${id.substring(id.length - 4)}`;
    },
    
    copyAddress(address) {
      if (!address) return;
      
      navigator.clipboard.writeText(address)
        .then(() => {
          console.log('地址已复制到剪贴板');
        })
        .catch(err => {
          console.error('复制失败:', err);
          alert('复制失败，请手动复制');
        });
    },
    
    getWalletName(chainType) {
      switch (chainType) {
        case 'Ethereum':
          return 'MetaMask';
        case 'Solana':
          return 'Phantom';
        case 'BSC':
          return 'Binance Wallet';
        case 'Base':
          return 'Base Wallet';
        default:
          return '区块链钱包';
      }
    },
    
    getWalletIcon(chainType) {
      switch (chainType) {
        case 'Ethereum':
          return 'ion-social-chrome-outline'; // MetaMask图标
        case 'Solana':
          return 'ion-ios-circle-outline'; // Phantom图标
        case 'BSC':
          return 'ion-android-globe'; // Binance Wallet图标
        case 'Base':
          return 'ion-ios-world-outline'; // Base Wallet图标
        default:
          return 'ion-android-globe';
      }
    },
    
    getTokenIcon(token) {
      switch (token) {
        case 'USDT':
          return 'ion-social-usd-outline';
        case 'USDC':
          return 'ion-social-usd';
        case 'BUSD':
          return 'ion-social-usd-outline';
        case 'CAKE':
          return 'ion-ios-nutrition-outline';
        case 'SOLUSDT':
          return 'ion-social-usd-outline';
        default:
          return 'ion-ios-circle-filled';
      }
    },
    
    getChainIcon(chainType) {
      switch (chainType) {
        case 'Ethereum':
          return 'ion-social-bitcoin-outline';
        case 'Solana':
          return 'ion-social-bitcoin-outline';
        case 'BSC':
          return 'ion-social-bitcoin-outline';
        case 'Base':
          return 'ion-social-bitcoin-outline';
        default:
          return 'ion-social-bitcoin-outline';
      }
    },
    
    getPaymentMethodIcon(methodId) {
      switch (methodId) {
        case 'paypal':
          return 'ion-card';
        case 'stripe':
          return 'ion-social-usd-outline';
        default:
          return 'ion-card';
      }
    },
    
    getPaymentMethodName(methodId) {
      switch (methodId) {
        case 'paypal':
          return 'PayPal';
        case 'stripe':
          return 'Stripe';
        default:
          return methodId;
      }
    },
    
    getPaymentMethodCurrency(methodId) {
      switch (methodId) {
        case 'paypal':
          return 'USD, EUR, GBP等';
        case 'stripe':
          return '多种法币';
        default:
          return '';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.contentBox {
  padding: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  .listHeader {
    display: flex;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    
    h2 {
      margin: 0;
    }
    
    .flexExpand {
      flex-grow: 1;
    }
    
    .btn {
      display: flex;
      align-items: center;
      
      i {
        margin-right: 5px;
      }
    }
  }
  
  .accountsTable {
    width: 100%;
    border-collapse: collapse;
    
    table {
      width: 100%;
      
      th {
        text-align: left;
        padding: 12px 16px;
        border-bottom: 2px solid #e0e0e0;
        font-weight: 600;
        color: #555;
        font-size: 14px;
      }
      
      td {
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
        vertical-align: middle;
      }
    }
    
    .tokenRow {
      background-color: #f8f9fa;
      
      td {
        color: #666;
        border-bottom: 1px dashed #e9ecef;
        padding-top: 8px;
        padding-bottom: 8px;
      }
      
      .tokenTypeCell {
        padding-left: 30px;
        position: relative;
        display: flex;
        align-items: center;
        
        .tokenIcon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
          font-size: 14px;
          color: #666;
        }
        
        .tokenName {
          font-weight: 500;
        }
      }
    }
    
    .walletTypeCell {
      display: flex;
      align-items: center;
      
      .walletInfo {
        display: flex;
        flex-direction: column;
        
        .chainType {
          font-weight: 500;
          font-size: 15px;
        }
        
        .walletSource {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #666;
          margin-top: 3px;
          
          i {
            font-size: 14px;
            margin-right: 4px;
          }
        }
      }
      
      .accountIcon {
        font-size: 20px;
        margin-right: 10px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        
        &.bitcoin { background-color: rgba(247, 147, 26, 0.1); color: #F7931A; }
        &.ethereum { background-color: rgba(98, 126, 234, 0.1); color: #627EEA; }
        &.solana { background-color: rgba(153, 69, 255, 0.1); color: #9945FF; }
        &.bsc { background-color: rgba(243, 186, 47, 0.1); color: #F3BA2F; }
        &.base { background-color: rgba(0, 82, 255, 0.1); color: #0052FF; }
        &.paypal { background-color: rgba(0, 48, 135, 0.1); color: #003087; }
        &.stripe { background-color: rgba(99, 91, 255, 0.1); color: #635BFF; }
      }
    }
    
    .addressCell {
      padding: 12px 16px;
      vertical-align: middle;
      
      .addressWrapper {
        display: inline-flex;
        align-items: center;
        height: 24px;
        background-color: rgba(0, 0, 0, 0.02);
        border-radius: 4px;
        padding: 0 8px;
        position: relative;
        
        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
      }
      
      .accountAddress {
        font-family: monospace;
        color: #555;
        font-size: 14px;
        line-height: 24px;
        cursor: default;
      }
      
      .copyBtn {
        margin-left: 8px;
        background: none;
        border: none;
        color: #2196F3;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          color: darken(#2196F3, 10%);
          transform: scale(1.1);
        }
        
        &:active {
          transform: scale(0.95);
        }
        
        i {
          font-size: 16px;
          transition: transform 0.2s ease;
        }
      }
    }
    
    .statusBadge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      background-color: #f5f5f5;
      color: #666;
      
      &.enabled {
        background-color: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
      }
    }
    
    .actionButtons {
      display: flex;
      gap: 5px;
      
      .btn {
        width: 30px;
        height: 30px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        font-size: 16px;
        
        &.editBtn {
          background-color: rgba(33, 150, 243, 0.1);
          color: #2196F3;
          
          &:hover {
            background-color: rgba(33, 150, 243, 0.2);
          }
        }
        
        &.disableBtn {
          background-color: rgba(244, 67, 54, 0.1);
          color: #F44336;
          
          &:hover {
            background-color: rgba(244, 67, 54, 0.2);
          }
        }
        
        &.enableBtn {
          background-color: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
          
          &:hover {
            background-color: rgba(76, 175, 80, 0.2);
          }
        }
      }
    }
  }
  
  .emptyState {
    padding: 30px;
    text-align: center;
    color: #666;
  }
}
</style> 