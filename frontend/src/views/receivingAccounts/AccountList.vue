<template>
  <div class="accountListView contentBox padMd clrP clrBr">
    <div class="listHeader">
      <h2 class="tx3 txB">收款账户列表</h2>
      <button @click="$emit('add-new')" class="btn addAccountBtn">
        <i class="ion-plus-round"></i>
        添加收款账户
      </button>
    </div>
    
    <!-- 区块链账户 -->
    <div class="accountSection">
      <h3 class="sectionTitle">区块链钱包</h3>
      <div class="accountGrid">
        <div v-for="account in blockchainAccounts" 
             :key="account.address" 
             class="accountCard" 
             :class="{ enabled: account.enabled }">
          <div class="accountHeader">
            <div class="accountType">{{ account.chainType }}</div>
            <div class="accountStatus">{{ account.enabled ? '已启用' : '未启用' }}</div>
          </div>
          <div class="accountAddress">{{ account.address }}</div>
          <div v-if="account._enabledTokens && account._enabledTokens.length > 0" class="accountTokens">
            <span v-for="token in account._enabledTokens" :key="token" class="tokenTag">
              {{ token }}
            </span>
          </div>
          <div class="accountActions">
            <button @click="$emit('edit', account)" class="btn editBtn">编辑</button>
            <button v-if="account.enabled" @click="$emit('disable', account)" class="btn disableBtn">停用</button>
            <button v-else @click="$emit('enable', account)" class="btn enableBtn">启用</button>
            <button @click="$emit('delete', account)" class="btn deleteBtn">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 其他支付方式 -->
    <div class="accountSection">
      <h3 class="sectionTitle">其他支付方式</h3>
      <div class="accountGrid">
        <div v-for="account in otherAccounts" 
             :key="account.name" 
             class="accountCard" 
             :class="{ enabled: account.enabled }">
          <div class="accountHeader">
            <div class="accountType">{{ getPaymentMethodName(account.name) }}</div>
            <div class="accountStatus">{{ account.enabled ? '已启用' : '未启用' }}</div>
          </div>
          <div class="accountDetail">{{ account.email || account.accountId || '未设置' }}</div>
          <div class="accountActions">
            <button @click="$emit('edit', account)" class="btn editBtn">编辑</button>
            <button v-if="account.enabled" @click="$emit('disable', account)" class="btn disableBtn">停用</button>
            <button v-else @click="$emit('enable', account)" class="btn enableBtn">启用</button>
            <button @click="$emit('delete', account)" class="btn deleteBtn">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    receivingAccounts: {
      type: Array,
      required: true
    }
  },
  computed: {
    blockchainAccounts() {
      return this.receivingAccounts.filter(a => a.chainType);
    },
    otherAccounts() {
      return this.receivingAccounts.filter(a => !a.chainType);
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
.accountListView {
  .listHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .addAccountBtn {
      display: flex;
      align-items: center;
      background-color: #2196F3;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      
      i {
        margin-right: 8px;
      }
      
      &:hover {
        background-color: darken(#2196F3, 10%);
      }
    }
  }
  
  .accountSection {
    margin-bottom: 30px;
    
    .sectionTitle {
      font-size: 18px;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .accountGrid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      
      .accountCard {
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        padding: 15px;
        background-color: white;
        
        &.enabled {
          border-left: 4px solid #4CAF50;
        }
        
        .accountHeader {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          
          .accountType {
            font-weight: bold;
            font-size: 16px;
          }
          
          .accountStatus {
            font-size: 14px;
            color: rgba(0, 0, 0, 0.6);
          }
        }
        
        .accountAddress, .accountDetail {
          font-family: monospace;
          background-color: rgba(0, 0, 0, 0.05);
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 10px;
          word-break: break-all;
          font-size: 14px;
        }
        
        .accountTokens {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-bottom: 10px;
          
          .tokenTag {
            background-color: rgba(33, 150, 243, 0.1);
            color: #2196F3;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
          }
        }
        
        .accountActions {
          display: flex;
          gap: 8px;
          
          .btn {
            flex: 1;
            padding: 6px 0;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 4px;
            background-color: white;
            cursor: pointer;
            font-size: 14px;
            
            &:hover {
              background-color: rgba(0, 0, 0, 0.05);
            }
            
            &.editBtn {
              color: #2196F3;
            }
            
            &.enableBtn {
              color: #4CAF50;
            }
            
            &.disableBtn {
              color: #FF9800;
            }
            
            &.deleteBtn {
              color: #F44336;
            }
          }
        }
      }
    }
  }
}
</style> 