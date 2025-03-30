<template>
  <div class="pageReceivingAccounts">
    <div class="contentContainer">
      <div class="pageHeading">
        <h1>收款账户管理</h1>
        <div class="flexExpand"></div>
        <div class="backLink" v-if="showApplyNewAccount || editingPaymentMethod || applyingPaymentMethod">
          <a class="btn clrP clrBr btnFlx" @click="backToList">
            <i class="ion-arrow-left-c"></i>
            <span>返回列表</span>
          </a>
        </div>
      </div>

      <!-- 空状态显示 -->
      <div v-if="!hasAnyPaymentMethod && !showApplyNewAccount && !editingPaymentMethod && !applyingPaymentMethod" class="contentBox padLg clrP clrBr emptyStateContainer">
        <div class="emptyStateIcon">
          <i class="ion-ios-circle-outline"></i>
        </div>
        <h2 class="tx3 txB txC">暂无任何收款账户</h2>
        <p class="tx5 txC">收款账户开通后，您即可从电商平台进行收款。</p>
        <div class="flexHCenter rowMd">
          <a class="btn clrP clrBr btnFlx btnLg" @click="showApplyNewAccount = true">
            <i class="ion-plus-round"></i>
            <span>申请收款账户</span>
          </a>
        </div>
      </div>

      <!-- 列表状态显示 -->
      <div v-if="hasAnyPaymentMethod && !showApplyNewAccount && !editingPaymentMethod && !applyingPaymentMethod" class="contentBox padMd clrP clrBr">
        <div class="flexRow rowMd">
          <h2 class="tx3 txB">收款账户列表</h2>
          <div class="flexExpand"></div>
          <a class="btn clrP clrBr btnFlx" @click="showApplyNewAccount = true">
            <i class="ion-plus-round"></i>
            <span>申请收款账户</span>
          </a>
        </div>
        <div class="tableContainer">
          <table class="table">
            <thead>
              <tr>
                <th class="colType">收款类型</th>
                <th class="colAccount">收款账户</th>
                <th class="colDate">最近入账时间</th>
                <th class="colAmount">最近入账金额</th>
                <th class="colActions">操作</th>
              </tr>
            </thead>
            <tbody>
              <!-- 表格内容保持不变 -->
              <tr v-if="paymentMethods.ethereum.enabled">
                <td>
                  <div class="flexVCent">
                    <i class="ion-social-bitcoin walletIcon"></i>
                    <span>以太坊 ETH</span>
                  </div>
                </td>
                <td class="txEll">{{ paymentMethods.ethereum.address }}</td>
                <td>尚未入账</td>
                <td>-</td>
                <td>
                  <a class="btn btnTxtOnly" @click="editPaymentMethod('ethereum')">详情</a>
                  <a class="btn btnTxtOnly txAlert" @click="togglePaymentMethod('ethereum', false)">停用</a>
                </td>
              </tr>
              <!-- 其他币种的列表项... -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- 申请新收款账户 -->
      <div v-if="showApplyNewAccount" class="contentBox padMd clrP clrBr">
        <div class="flexRow rowMd">
          <h2 class="tx3 txB">申请收款账户</h2>
        </div>
        
        <div class="paymentMethodOptions">
          <div class="pmOption" v-for="(info, key) in paymentMethodsInfo" :key="key" @click="applyPaymentMethod(key)">
            <div :class="`pmIcon ${info.iconClass}`">
              <i :class="info.icon"></i>
            </div>
            <div class="pmInfo">
              <h4>{{ info.name }}</h4>
              <p>{{ info.description }}</p>
            </div>
            <i class="ion-chevron-right"></i>
          </div>
        </div>
      </div>

      <!-- 编辑收款账户 -->
      <div v-if="editingPaymentMethod" class="contentBox padMd clrP clrBr">
        <div class="flexRow rowMd">
          <h2 class="tx3 txB">编辑收款账户</h2>
        </div>
        
        <PaymentMethodSetup 
          :method="editingPaymentMethod"
          :address="getAddressForMethod(editingPaymentMethod)"
          :email="paymentMethods.paypal.email"
          :accountId="paymentMethods.stripe.accountId"
          @connect="connectWallet"
          @connectStripe="connectStripe"
          @updateEmail="updatePaypalEmail"
          @copy="copyAddress"
        />
        
        <div class="btnActions">
          <button class="btn cancelBtn" @click="editingPaymentMethod = null">取消</button>
          <button class="btn primaryBtn" @click="savePaymentMethod">保存</button>
        </div>
      </div>

      <!-- 设置新收款账户 -->
      <div v-if="applyingPaymentMethod" class="contentBox padMd clrP clrBr">
        <div class="flexRow rowMd">
          <h2 class="tx3 txB">设置 {{ paymentMethodsInfo[applyingPaymentMethod]?.name }} 收款账户</h2>
        </div>
        
        <PaymentMethodSetup 
          :method="applyingPaymentMethod"
          :address="getAddressForMethod(applyingPaymentMethod)"
          :email="paymentMethods.paypal.email"
          :accountId="paymentMethods.stripe.accountId"
          @connect="connectWallet"
          @connectStripe="connectStripe"
          @updateEmail="updatePaypalEmail"
          @copy="copyAddress"
        />
        
        <div class="btnActions">
          <button class="btn cancelBtn" @click="applyingPaymentMethod = null">取消</button>
          <button class="btn primaryBtn" @click="savePaymentMethod">保存</button>
        </div>
      </div>

      <!-- 成功提示 -->
      <div v-if="saveSuccess" class="saveSuccessToast">
        <i class="ion-checkmark-circled"></i>
        <span>保存成功</span>
      </div>
    </div>
  </div>
</template>

<script>
import { useOnboard } from '@web3-onboard/vue';
import PaymentMethodSetup from '../modals/receiving/PaymentMethodSetup.vue';
import app from '../../../backbone/app.js';
import { myGet } from '../../api/api.js';
import { recordEvent } from '../../../backbone/utils/metrics.js';

export default {
  components: {
    PaymentMethodSetup
  },
  data() {
    return {
      paymentMethods: {
        ethereum: {
          address: '',
          enabled: false
        },
        bsc: {
          address: '',
          enabled: false
        },
        solana: {
          address: '',
          enabled: false
        },
        base: {
          address: '',
          enabled: false
        },
        paypal: {
          email: '',
          enabled: false
        },
        stripe: {
          accountId: '',
          enabled: false
        }
      },
      isSaving: false,
      saveSuccess: false,
      showApplyNewAccount: false,
      editingPaymentMethod: null,
      applyingPaymentMethod: null,
      onboard: {},
      paymentMethodsInfo: {
        ethereum: {
          name: '以太坊',
          description: '接收ETH和ERC-20代币交易',
          icon: 'ion-social-bitcoin',
          iconClass: ''
        },
        bsc: {
          name: '币安智能链',
          description: '接收BNB和BEP-20代币交易',
          icon: 'ion-social-bitcoin',
          iconClass: 'bscIcon'
        },
        solana: {
          name: 'Solana',
          description: '接收SOL和SPL代币交易',
          icon: 'ion-social-bitcoin',
          iconClass: 'solanaIcon'
        },
        base: {
          name: 'Base',
          description: '接收Base链上的加密货币交易',
          icon: 'ion-social-bitcoin',
          iconClass: 'baseIcon'
        },
        paypal: {
          name: 'PayPal',
          description: '通过PayPal接收法币支付',
          icon: 'ion-card',
          iconClass: 'paypalIcon'
        },
        stripe: {
          name: 'Stripe',
          description: '通过Stripe接收信用卡支付',
          icon: 'ion-card',
          iconClass: 'stripeIcon'
        }
      },
      templateHelpers: {}
    };
  },
  created() {
    this.onboard = useOnboard();
    this.fetchPaymentMethods();
  },
  computed: {
    ob() {
      return {
        ...this.templateHelpers,
      };
    },
    hasEthAddress() {
      return !!this.paymentMethods.ethereum.address;
    },
    hasBscAddress() {
      return !!this.paymentMethods.bsc.address;
    },
    hasSolanaAddress() {
      return !!this.paymentMethods.solana.address;
    },
    hasBaseAddress() {
      return !!this.paymentMethods.base.address;
    },
    hasStripeAccount() {
      return !!this.paymentMethods.stripe.accountId;
    },
    hasAnyPaymentMethod() {
      return (
        (this.paymentMethods.ethereum.enabled && this.paymentMethods.ethereum.address) ||
        (this.paymentMethods.bsc.enabled && this.paymentMethods.bsc.address) ||
        (this.paymentMethods.solana.enabled && this.paymentMethods.solana.address) ||
        (this.paymentMethods.base.enabled && this.paymentMethods.base.address) ||
        (this.paymentMethods.paypal.enabled && this.paymentMethods.paypal.email) ||
        (this.paymentMethods.stripe.enabled && this.paymentMethods.stripe.accountId)
      );
    }
  },
  methods: {
    backToList() {
      this.showApplyNewAccount = false;
      this.editingPaymentMethod = null;
      this.applyingPaymentMethod = null;
    },
    
    async fetchPaymentMethods() {
      try {
        // 假设这里调用后端API获取当前用户的支付方式
        const response = await myGet(app.getServerUrl('ob/payment-methods'));
        
        if (response && response.paymentMethods) {
          this.paymentMethods = response.paymentMethods;
        }
      } catch (error) {
        console.error('获取支付方式失败:', error);
        
        // 确保初始化时所有支付方式都是禁用状态
        this.resetPaymentMethods();
      }
    },
    
    resetPaymentMethods() {
      // 重置所有支付方式为初始状态（未启用）
      this.paymentMethods = {
        ethereum: { address: '', enabled: false },
        bsc: { address: '', enabled: false },
        solana: { address: '', enabled: false },
        base: { address: '', enabled: false },
        paypal: { email: '', enabled: false },
        stripe: { accountId: '', enabled: false }
      };
    },
    
    async savePaymentMethod() {
      if (this.isSaving) return;
      
      this.isSaving = true;
      this.saveSuccess = false;
      
      try {
        // 假设这里调用后端API保存支付方式
        // await myPut(app.getServerUrl('ob/payment-methods'), {
        //   paymentMethods: this.paymentMethods
        // });
        
        // 如果有正在编辑的方法，确保它被启用
        if (this.editingPaymentMethod && this.paymentMethods[this.editingPaymentMethod]) {
          this.paymentMethods[this.editingPaymentMethod].enabled = true;
        }
        
        // 如果是申请新方法，也确保它被启用
        if (this.applyingPaymentMethod && this.paymentMethods[this.applyingPaymentMethod]) {
          this.paymentMethods[this.applyingPaymentMethod].enabled = true;
        }
        
        // 演示环境下，先不调用后端API
        // 在实际项目中，应该取消这里的注释，调用真实的后端API
        /*
        await myPut(app.getServerUrl('ob/payment-methods'), {
          paymentMethods: this.paymentMethods
        });
        */
        
        // 模拟成功
        setTimeout(() => {
          this.saveSuccess = true;
          
          // 重置状态
          this.editingPaymentMethod = null;
          this.applyingPaymentMethod = null;
          this.showApplyNewAccount = false;
          
          // 2秒后移除成功提示
          setTimeout(() => {
            this.saveSuccess = false;
            this.isSaving = false;
          }, 2000);
        }, 500);
        
      } catch (error) {
        console.error('保存支付方式失败:', error);
        this.isSaving = false;
        alert('保存失败，请重试');
      }
    },
    
    editPaymentMethod(method) {
      this.editingPaymentMethod = method;
      this.showApplyNewAccount = false;
      this.applyingPaymentMethod = null;
    },
    
    applyPaymentMethod(method) {
      this.applyingPaymentMethod = method;
      
      // 如果已有地址，设置为编辑模式而不是申请模式
      if ((method === 'ethereum' && this.hasEthAddress) ||
          (method === 'bsc' && this.hasBscAddress) ||
          (method === 'solana' && this.hasSolanaAddress) ||
          (method === 'base' && this.hasBaseAddress)) {
        this.editPaymentMethod(method);
        return;
      }
      
      // 如果是新申请，重置状态
      this.showApplyNewAccount = false;
    },
    
    togglePaymentMethod(method, enabled) {
      if (this.paymentMethods[method]) {
        this.paymentMethods[method].enabled = enabled;
        
        if (enabled) {
          // 如果是启用操作，但没有地址，则进入设置流程
          if (['ethereum', 'bsc', 'solana', 'base'].includes(method) && 
              !this.paymentMethods[method].address) {
            this.applyPaymentMethod(method);
            return;
          }
          
          if (method === 'paypal' && !this.paymentMethods.paypal.email) {
            this.applyPaymentMethod(method);
            return;
          }
          
          if (method === 'stripe' && !this.paymentMethods.stripe.accountId) {
            this.applyPaymentMethod(method);
            return;
          }
        }
        
        // 直接保存状态变更
        this.savePaymentMethod();
      }
    },
    
    getAddressForMethod(method) {
      if (!method || !this.paymentMethods[method]) return '';
      
      if (['ethereum', 'bsc', 'solana', 'base'].includes(method)) {
        return this.paymentMethods[method].address || '';
      }
      
      return '';
    },
    
    updatePaypalEmail(email) {
      this.paymentMethods.paypal.email = email;
    },
    
    async connectWallet(chain) {
      recordEvent('PaymentMethods_ConnectWallet', { chain });
      
      try {
        let chainId;
        switch (chain) {
          case 'ethereum':
            chainId = '0x1'; // 以太坊主网
            break;
          case 'bsc':
            chainId = '0x38'; // 币安智能链主网
            break;
          case 'solana':
            // Solana使用不同的连接方式
            await this.connectSolanaWallet();
            return;
          case 'base':
            chainId = '0x2105'; // Base主网
            break;
          default:
            console.error('不支持的链类型:', chain);
            return;
        }
        
        // 使用web3-onboard连接钱包
        if (!this.onboard) {
          console.error('Onboard未初始化');
          
          // 模拟地址（仅用于演示）
          const mockAddresses = {
            ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            bsc: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            base: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
          };
          
          if (mockAddresses[chain]) {
            this.paymentMethods[chain].address = mockAddresses[chain];
            this.paymentMethods[chain].enabled = true;
            
            // 强制UI更新
            this.$forceUpdate();
          }
          
          return;
        }
        
        // 连接钱包
        const wallets = await this.onboard.connectWallet();
        
        if (wallets && wallets.length > 0) {
          const connectedWallet = wallets[0];
          
          if (connectedWallet && connectedWallet.accounts && connectedWallet.accounts.length > 0) {
            const address = connectedWallet.accounts[0].address;
            
            // 更新对应的地址和启用状态
            switch (chain) {
              case 'ethereum':
                this.paymentMethods.ethereum.address = address;
                this.paymentMethods.ethereum.enabled = true;
                break;
              case 'bsc':
                this.paymentMethods.bsc.address = address;
                this.paymentMethods.bsc.enabled = true;
                break;
              case 'base':
                this.paymentMethods.base.address = address;
                this.paymentMethods.base.enabled = true;
                break;
              default:
                break;
            }
            
            // 强制UI更新
            this.$forceUpdate();
            
            // 尝试切换到指定的链
            try {
              if (connectedWallet.provider && typeof connectedWallet.provider.request === 'function') {
                await connectedWallet.provider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId }],
                });
              }
            } catch (error) {
              console.error('切换链失败:', error);
              
              // 如果是因为链未添加导致的错误，可以提示用户添加链
              if (error.code === 4902) {
                try {
                  // 这里可以添加请求添加链的代码
                  // 例如，对于BSC:
                  if (chain === 'bsc') {
                    await connectedWallet.provider.request({
                      method: 'wallet_addEthereumChain',
                      params: [{
                        chainId: '0x38',
                        chainName: 'Binance Smart Chain',
                        nativeCurrency: {
                          name: 'BNB',
                          symbol: 'BNB',
                          decimals: 18
                        },
                        rpcUrls: ['https://bsc-dataseed.binance.org/'],
                        blockExplorerUrls: ['https://bscscan.com/']
                      }]
                    });
                  }
                  // 类似地，可以为其他链添加相应的请求
                } catch (addError) {
                  console.error('添加链失败:', addError);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('连接钱包失败:', error);
        
        // 模拟地址（仅用于演示）
        const mockAddresses = {
          ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          bsc: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          base: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        };
        
        if (mockAddresses[chain]) {
          this.paymentMethods[chain].address = mockAddresses[chain];
          this.paymentMethods[chain].enabled = true;
          
          // 强制UI更新
          this.$forceUpdate();
        }
      }
    },
    
    async connectSolanaWallet() {
      // Solana使用不同的连接方式
      try {
        // 这里是Solana连接的示例代码，实际实现可能不同
        if (window.solana && window.solana.isPhantom) {
          const connection = await window.solana.connect();
          const address = connection.publicKey.toString();
          
          this.paymentMethods.solana.address = address;
          this.paymentMethods.solana.enabled = true;
        } else {
          alert('请安装Phantom钱包来连接Solana');
          window.open('https://phantom.app/', '_blank');
        }
      } catch (error) {
        console.error('连接Solana钱包失败:', error);
      }
    },
    
    async connectStripe() {
      recordEvent('PaymentMethods_ConnectStripe');
      
      try {
        // 这里是调用Stripe API的示例代码
        const response = await myGet(app.getServerUrl('ob/stripe/connect-url'));
        
        if (response && response.url) {
          // 重定向到Stripe OAuth页面
          window.location.href = response.url;
        } else {
          // 模拟Stripe连接（仅用于演示）
          this.paymentMethods.stripe.accountId = 'acct_' + Math.random().toString(36).substring(2, 10);
          this.paymentMethods.stripe.enabled = true;
        }
      } catch (error) {
        console.error('获取Stripe连接URL失败:', error);
        
        // 模拟Stripe连接（仅用于演示）
        this.paymentMethods.stripe.accountId = 'acct_' + Math.random().toString(36).substring(2, 10);
        this.paymentMethods.stripe.enabled = true;
      }
    },
    
    copyAddress(address) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(address)
          .then(() => {
            alert('地址已复制到剪贴板');
          })
          .catch((err) => {
            console.error('复制地址失败:', err);
          });
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          document.execCommand('copy');
          alert('地址已复制到剪贴板');
        } catch (err) {
          console.error('复制地址失败:', err);
        }
        
        document.body.removeChild(textArea);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.pageReceivingAccounts {
  padding: 20px;
  
  .contentContainer {
    max-width: 1000px;
    margin: 0 auto;
  }

  .pageHeading {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    h1 {
      margin: 0;
      font-size: 24px;
    }
    
    .backLink {
      margin-left: 15px;
    }
  }
  
  .emptyStateContainer {
    text-align: center;
    padding: 60px 20px;
    
    .emptyStateIcon {
      font-size: 60px;
      margin-bottom: 20px;
      color: #ccc;
    }
  }
  
  .tableContainer {
    overflow-x: auto;
    margin-top: 16px;
    
    .table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      th {
        font-weight: bold;
        background-color: rgba(0, 0, 0, 0.02);
      }
      
      .colType {
        width: 18%;
      }
      
      .colAccount {
        width: 40%;
      }
      
      .colDate, .colAmount {
        width: 15%;
      }
      
      .colActions {
        width: 12%;
        text-align: center;
      }
      
      .txEll {
        max-width: 280px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .btnTxtOnly {
        background: none;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
        color: #2196F3;
        
        &.txAlert {
          color: #f44336;
        }
      }
    }
  }
  
  .walletIcon {
    display: inline-block;
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    background-color: #627eea;
    color: white;
    border-radius: 50%;
    margin-right: 8px;
    
    &.bscIcon {
      background-color: #f8bc17;
    }
    
    &.solanaIcon {
      background-color: #9945ff;
    }
    
    &.baseIcon {
      background-color: #0052ff;
    }
    
    &.paypalIcon {
      background-color: #003087;
    }
    
    &.stripeIcon {
      background-color: #6772e5;
    }
  }
  
  /* 支付方式选项列表样式 */
  .paymentMethodOptions {
    margin-top: 16px;
    
    .pmOption {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.02);
        transform: translateY(-2px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      }
      
      .pmIcon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #627eea;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        margin-right: 16px;
        flex-shrink: 0;
        
        &.bscIcon {
          background-color: #f8bc17;
        }
        
        &.solanaIcon {
          background-color: #9945ff;
        }
        
        &.baseIcon {
          background-color: #0052ff;
        }
        
        &.paypalIcon {
          background-color: #003087;
        }
        
        &.stripeIcon {
          background-color: #6772e5;
        }
      }
      
      .pmInfo {
        flex: 1;
        
        h4 {
          margin: 0 0 4px 0;
          font-weight: 600;
        }
        
        p {
          margin: 0;
          color: rgba(0, 0, 0, 0.6);
          font-size: 14px;
        }
      }
      
      i.ion-chevron-right {
        font-size: 16px;
        opacity: 0.5;
      }
    }
  }
  
  /* 按钮样式 */
  .btnActions {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    
    .btn {
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      
      &.primaryBtn {
        background-color: #2196F3;
        color: white;
        border: none;
        
        &:hover {
          background-color: darken(#2196F3, 10%);
        }
      }
      
      &.cancelBtn {
        background-color: transparent;
        color: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(0, 0, 0, 0.1);
        margin-right: 8px;
        
        &:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
      }
    }
  }
  
  .btnLg {
    padding: 12px 24px;
    font-size: 16px;
  }

  .saveSuccessToast {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #4CAF50;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    
    i {
      margin-right: 8px;
      font-size: 18px;
    }
  }
}
</style> 