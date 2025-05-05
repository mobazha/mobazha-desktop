<template>
  <div class="contentBox padMd clrP clrBr">
    <div class="listHeader">
      <h2 class="tx3 txB">收款账户列表</h2>
      <div class="flexExpand"></div>
      <el-button type="primary" @click="$emit('add-new')">
        <el-icon><Plus /></el-icon>
        <span>添加收款账户</span>
      </el-button>
    </div>
    
    <!-- 详细列表视图 -->
    <el-table
      :data="tableData"
      style="width: 100%"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="type" label="收款账户类型" min-width="200">
        <template #default="{ row }">
          <div v-if="row.isToken" class="tokenTypeCell">
            <div class="tokenIcon">
              <el-icon><component :is="getTokenIcon(row.token)" /></el-icon>
            </div>
            <span class="tokenName">{{ row.token }}</span>
          </div>
          <div v-else class="walletTypeCell">
            <div class="accountIcon" :class="row.name?.toLowerCase()">
              <el-icon><component :is="getChainIcon(row.chainType)" /></el-icon>
            </div>
            <div class="walletInfo">
              <span class="chainType">{{ row.chainType }}</span>
              <div class="walletSource">
                <el-icon><component :is="getWalletIcon(row.chainType)" /></el-icon>
                <span>{{ getWalletName(row.chainType) }}</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="address" label="收款账户" min-width="200">
        <template #default="{ row }">
          <div v-if="row.address" class="addressWrapper">
            <span class="accountAddress" :title="row.address">
              {{ formatAddress(row.address) }}
            </span>
            <el-button
              type="primary"
              link
              @click="copyAddress(row.address)"
              :title="`复制地址: ${row.address}`"
            >
              <el-icon><Document /></el-icon>
            </el-button>
          </div>
          <span v-else-if="row.email">{{ row.email }}</span>
          <span v-else-if="row.accountId">{{ formatId(row.accountId) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column prop="lastTransactionTime" label="最近入账时间" min-width="150">
        <template #default="{ row }">
          {{ row.lastTransactionTime || '暂无' }}
        </template>
      </el-table-column>

      <el-table-column prop="lastTransactionAmount" label="最近入账金额" min-width="150">
        <template #default="{ row }">
          {{ row.lastTransactionAmount || '暂无' }}
        </template>
      </el-table-column>

      <el-table-column prop="isActive" label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :type="row.isActive ? 'success' : 'info'"
            size="small"
          >
            {{ row.isActive ? '已启用' : '已禁用' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <div class="actionButtons" v-if="!row.isToken">
            <el-button
              type="primary"
              link
              @click="$emit('edit', row)"
              title="编辑"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              v-if="row.isActive"
              type="danger"
              link
              @click="$emit('disable', row)"
              title="禁用"
            >
              <el-icon><Close /></el-icon>
            </el-button>
            <el-button
              v-else
              type="success"
              link
              @click="$emit('enable', row)"
              title="启用"
            >
              <el-icon><Check /></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 空状态 -->
    <el-empty
      v-if="!receivingAccounts || receivingAccounts.length === 0"
      description="暂无收款账户，请点击'添加收款账户'按钮添加。"
    />
  </div>
</template>

<script>
import { computed } from 'vue'
import {
  Plus,
  Document,
  Edit,
  Close,
  Check,
  Money,
  Wallet,
  Coin
} from '@element-plus/icons-vue'

export default {
  components: {
    Plus,
    Document,
    Edit,
    Close,
    Check,
    Money,
    Wallet,
    Coin
  },
  props: {
    receivingAccounts: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const tableData = computed(() => {
      const blockchainAccounts = props.receivingAccounts
        .filter(account => account.chainType)
        .map(account => ({
          ...account,
          id: account.id || 0,
          children: getActiveTokens(account).map(token => ({
            isToken: true,
            token,
            id: `${account.id}-${token}`,
            lastTransactionTime: account.tokenTransactions?.[token]?.time || '暂无',
            lastTransactionAmount: account.tokenTransactions?.[token]?.amount || '暂无',
            enabled: true
          }))
        }))

      const otherAccounts = props.receivingAccounts
        .filter(account => !account.chainType)
        .map(account => ({
          ...account,
          id: account.id || 0
        }))

      return [...blockchainAccounts, ...otherAccounts]
    })

    const getActiveTokens = (account) => {
      if (account._activeTokens && Array.isArray(account._activeTokens)) {
        return account._activeTokens
      }
      return []
    }

    const formatAddress = (address) => {
      if (!address) return ''
      if (address.length <= 12) return address
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    }

    const formatId = (id) => {
      if (!id) return ''
      if (id.length <= 12) return id
      return `${id.substring(0, 6)}...${id.substring(id.length - 4)}`
    }

    const copyAddress = (address) => {
      if (!address) return
      
      navigator.clipboard.writeText(address)
        .then(() => {
          ElMessage.success('地址已复制到剪贴板')
        })
        .catch(err => {
          console.error('复制失败:', err)
          ElMessage.error('复制失败，请手动复制')
        })
    }

    const getWalletName = (chainType) => {
      const walletNames = {
        Ethereum: 'MetaMask',
        Solana: 'Phantom',
        BSC: 'Binance Wallet',
        Base: 'Base Wallet'
      }
      return walletNames[chainType] || '区块链钱包'
    }

    const getWalletIcon = (chainType) => {
      const walletIcons = {
        Ethereum: 'Wallet',
        Solana: 'Coin',
        BSC: 'Money',
        Base: 'Money'
      }
      return walletIcons[chainType] || 'Wallet'
    }

    const getTokenIcon = (token) => {
      const tokenIcons = {
        USDT: 'Money',
        USDC: 'Money',
        BUSD: 'Money',
        CAKE: 'Money',
        SOLUSDT: 'Money'
      }
      return tokenIcons[token] || 'Coin'
    }

    const getChainIcon = (chainType) => {
      return 'Money'
    }

    return {
      tableData,
      formatAddress,
      formatId,
      copyAddress,
      getWalletName,
      getWalletIcon,
      getTokenIcon,
      getChainIcon
    }
  }
}
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
        
        .el-icon {
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
  
  .addressWrapper {
    display: inline-flex;
    align-items: center;
    height: 24px;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
    padding: 0 8px;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .accountAddress {
      font-family: monospace;
      color: #555;
      font-size: 14px;
      line-height: 24px;
      cursor: default;
    }
  }
  
  .actionButtons {
    display: flex;
    gap: 5px;
  }
}
</style> 