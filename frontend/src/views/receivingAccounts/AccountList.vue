<template>
  <div class="contentBox padMd clrP clrBr">
    <div class="listHeader">
      <h2 class="tx3 txB">{{ $t('receivingAccounts.title') }}</h2>
      <div class="flexExpand"></div>
      <el-button type="primary" @click="$emit('add-new')">
        <el-icon><Plus /></el-icon>
        <span>{{ $t('receivingAccounts.addNewAccount') }}</span>
      </el-button>
    </div>
    
    <!-- 详细列表视图 -->
    <el-table
      :data="tableData"
      style="width: 100%"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="type" :label="$t('receivingAccounts.accountType')" min-width="200">
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
              <span class="chainType">{{ row.chainType || row.name }}</span>
              <div class="walletSource">
                <el-icon><component :is="getWalletIcon(row.chainType)" /></el-icon>
                <span>{{ getWalletName(row.chainType) }}</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="address" :label="$t('receivingAccounts.receivingAccount')" min-width="200">
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

      <el-table-column prop="lastTransactionTime" :label="$t('receivingAccounts.lastTransactionTime')" min-width="150">
        <template #default="{ row }">
          {{ row.lastTransactionTime || $t('receivingAccounts.noData') }}
        </template>
      </el-table-column>

      <el-table-column prop="lastTransactionAmount" :label="$t('receivingAccounts.lastTransactionAmount')" min-width="150">
        <template #default="{ row }">
          {{ row.lastTransactionAmount || $t('receivingAccounts.noData') }}
        </template>
      </el-table-column>

      <el-table-column prop="isActive" :label="$t('receivingAccounts.status')" width="150">
        <template #default="{ row }">
          <div v-if="row.chainType === 'Stripe'" class="stripe-status">
            <el-tag
              :type="getStripeStatusType(row.status)"
              size="small"
            >
              {{ getStripeStatusText(row.status) }}
            </el-tag>
          </div>
          <el-tag
            v-else
            :type="row.isActive ? 'success' : 'info'"
            size="small"
          >
            {{ row.isActive ? $t('receivingAccounts.enabled') : $t('receivingAccounts.disabled') }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column :label="$t('receivingAccounts.actions')" width="180" fixed="right">
        <template #default="{ row }">
          <div class="actionButtons" v-if="!row.isToken">
            <el-button
              type="primary"
              link
              @click="$emit('edit', row)"
              :title="$t('receivingAccounts.edit')"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              v-if="row.isActive"
              type="danger"
              link
              @click="$emit('disable', row)"
              :title="$t('receivingAccounts.disable')"
            >
              <el-icon><Close /></el-icon>
            </el-button>
            <el-button
              v-else
              type="success"
              link
              @click="$emit('enable', row)"
              :title="$t('receivingAccounts.enable')"
            >
              <el-icon><Check /></el-icon>
            </el-button>
            <template v-if="row.chainType === 'Stripe'">
              <el-button
                v-if="!row.stripeAccountId"
                type="primary"
                link
                @click="$emit('connect-stripe', row)"
                :title="$t('receivingAccounts.connectStripeAccount')"
              >
                <el-icon><Link /></el-icon>
              </el-button>
              <el-button
                v-else-if="row.status !== 'approved'"
                type="warning"
                link
                @click="$emit('reverify-stripe', row)"
                :title="$t('receivingAccounts.reverifyStripeAccount')"
              >
                <el-icon><Refresh /></el-icon>
              </el-button>
            </template>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 空状态 -->
    <el-empty
      v-if="!receivingAccounts || receivingAccounts.length === 0"
      :description="$t('receivingAccounts.noAccounts')"
    />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus,
  Document,
  Edit,
  Close,
  Check,
  Money,
  Wallet,
  Coin,
  Link,
  Refresh,
  Warning
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { myGet } from '../../api/api.js'

export default {
  components: {
    Plus,
    Document,
    Edit,
    Close,
    Check,
    Money,
    Wallet,
    Coin,
    Link,
    Refresh,
    Warning
  },
  props: {
    receivingAccounts: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const { t } = useI18n()
    
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
            lastTransactionTime: account.tokenTransactions?.[token]?.time || t('receivingAccounts.noData'),
            lastTransactionAmount: account.tokenTransactions?.[token]?.amount || t('receivingAccounts.noData'),
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
          ElMessage.success(t('receivingAccounts.addressCopied'))
        })
        .catch(err => {
          console.error('复制失败:', err)
          ElMessage.error(t('receivingAccounts.copyFailed'))
        })
    }

    const getWalletName = (chainType) => {
      const walletNames = {
        Ethereum: 'MetaMask',
        Solana: 'Phantom',
        BSC: 'Binance Wallet',
        Base: 'Base Wallet',
        Stripe: 'Stripe',
        PayPal: 'PayPal',
      }
      return walletNames[chainType] || t('receivingAccounts.blockchainWallet')
    }

    const getWalletIcon = (chainType) => {
      const walletIcons = {
        Ethereum: 'Wallet',
        Solana: 'Coin',
        BSC: 'Money',
        Base: 'Money',
        Stripe: 'Money',
        PayPal: 'Money',
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

    const connectStripeAccount = async (account) => {
      try {
        const response = await myGet('/v1/stripe/connect-url')
        if (response.url) {
          window.open(response.url, '_blank')
        } else {
          throw new Error('获取Stripe连接URL失败')
        }
      } catch (error) {
        console.error('连接Stripe账户失败:', error)
        ElMessage.error('连接Stripe账户失败，请重试')
      }
    }

    const getStripeStatusType = (status) => {
      switch (status) {
        case 'approved':
          return 'success';
        case 'pending':
          return 'warning';
        default:
          return 'danger';
      }
    }
    
    const getStripeStatusText = (status) => {
      switch (status) {
        case 'approved':
          return t('receivingAccounts.verified');
        case 'pending':
          return t('receivingAccounts.verifying');
        default:
          return t('receivingAccounts.unverified');
      }
    }

    return {
      tableData,
      formatAddress,
      formatId,
      copyAddress,
      getWalletName,
      getWalletIcon,
      getTokenIcon,
      getChainIcon,
      connectStripeAccount,
      getStripeStatusType,
      getStripeStatusText
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

  .stripe-status {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .requirements-tooltip {
      cursor: pointer;
      color: #e6a23c;
    }
  }

  .requirements-list {
    text-align: left;
    padding: 8px;
    
    p {
      margin: 0 0 8px 0;
      font-weight: bold;
    }
    
    ul {
      margin: 0;
      padding-left: 16px;
      
      li {
        margin: 4px 0;
      }
    }
  }
}
</style> 