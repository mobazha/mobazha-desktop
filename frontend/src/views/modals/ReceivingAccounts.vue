<template>
  <div class="modal receivingAccounts modalScrollPage">
    <div class="modalContent clrP clrBr clrSh3">
      <div class="flexColRows gutterV">
        <div class="topControls flexRow">
          <div class="contentBox padSm clrP clrBr gutterHTn flexNoShrink">
            <div class="flexVCent receivingAccountsIconWrap">
              <i class="ion-card"></i>
            </div>
            <span>收款账户管理</span>
            <a class="jsModalClose tx6 txU" @click.stop="onClose">关闭</a>
          </div>
        </div>

        <!-- 空状态显示 -->
        <div v-if="!hasAnyPaymentMethod" class="contentBox padLg clrP clrBr emptyStateContainer">
          <div class="emptyStateIcon">
            <i class="ion-ios-circle-outline"></i>
          </div>
          <h2 class="tx3 txB txC">暂无任何收款账户</h2>
          <p class="tx5 txC">收款账户开通后，您即可从电商平台进行收款。</p>
          <div class="flexHCenter rowMd">
            <a class="btn clrP clrBr btnFlx" @click="showApplyNewAccount = true">
              <i class="ion-plus-round"></i>
              <span>申请收款账户</span>
            </a>
          </div>
        </div>

        <!-- 列表状态显示 -->
        <template v-else>
          <div class="contentBox padMd clrP clrBr" v-if="!showApplyNewAccount && !editingPaymentMethod && !applyingPaymentMethod">
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
                  <tr v-if="paymentMethods.bsc.enabled">
                    <td>
                      <div class="flexVCent">
                        <i class="ion-social-bitcoin walletIcon bscIcon"></i>
                        <span>币安智能链 BSC</span>
                      </div>
                    </td>
                    <td class="txEll">{{ paymentMethods.bsc.address }}</td>
                    <td>尚未入账</td>
                    <td>-</td>
                    <td>
                      <a class="btn btnTxtOnly" @click="editPaymentMethod('bsc')">详情</a>
                      <a class="btn btnTxtOnly txAlert" @click="togglePaymentMethod('bsc', false)">停用</a>
                    </td>
                  </tr>
                  <tr v-if="paymentMethods.solana.enabled">
                    <td>
                      <div class="flexVCent">
                        <i class="ion-social-bitcoin walletIcon solanaIcon"></i>
                        <span>Solana SOL</span>
                      </div>
                    </td>
                    <td class="txEll">{{ paymentMethods.solana.address }}</td>
                    <td>尚未入账</td>
                    <td>-</td>
                    <td>
                      <a class="btn btnTxtOnly" @click="editPaymentMethod('solana')">详情</a>
                      <a class="btn btnTxtOnly txAlert" @click="togglePaymentMethod('solana', false)">停用</a>
                    </td>
                  </tr>
                  <tr v-if="paymentMethods.base.enabled">
                    <td>
                      <div class="flexVCent">
                        <i class="ion-social-bitcoin walletIcon baseIcon"></i>
                        <span>Base</span>
                      </div>
                    </td>
                    <td class="txEll">{{ paymentMethods.base.address }}</td>
                    <td>尚未入账</td>
                    <td>-</td>
                    <td>
                      <a class="btn btnTxtOnly" @click="editPaymentMethod('base')">详情</a>
                      <a class="btn btnTxtOnly txAlert" @click="togglePaymentMethod('base', false)">停用</a>
                    </td>
                  </tr>
                  <tr v-if="paymentMethods.paypal.enabled">
                    <td>
                      <div class="flexVCent">
                        <i class="ion-card walletIcon paypalIcon"></i>
                        <span>PayPal</span>
                      </div>
                    </td>
                    <td class="txEll">{{ paymentMethods.paypal.email }}</td>
                    <td>尚未入账</td>
                    <td>-</td>
                    <td>
                      <a class="btn btnTxtOnly" @click="editPaymentMethod('paypal')">详情</a>
                      <a class="btn btnTxtOnly txAlert" @click="togglePaymentMethod('paypal', false)">停用</a>
                    </td>
                  </tr>
                  <tr v-if="paymentMethods.stripe.enabled">
                    <td>
                      <div class="flexVCent">
                        <i class="ion-card walletIcon stripeIcon"></i>
                        <span>Stripe</span>
                      </div>
                    </td>
                    <td class="txEll">{{ paymentMethods.stripe.accountId }}</td>
                    <td>尚未入账</td>
                    <td>-</td>
                    <td>
                      <a class="btn btnTxtOnly" @click="editPaymentMethod('stripe')">详情</a>
                      <a class="btn btnTxtOnly txAlert" @click="togglePaymentMethod('stripe', false)">停用</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- 申请新收款账户 -->
        <div v-if="showApplyNewAccount" class="contentBox padMd clrP clrBr">
          <div class="flexRow rowMd">
            <h2 class="tx3 txB">申请收款账户</h2>
            <div class="flexExpand"></div>
            <a class="btn clrP clrBr btnFlx" @click="showApplyNewAccount = false">
              <i class="ion-arrow-left-c"></i>
              <span>返回列表</span>
            </a>
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
            <div class="flexExpand"></div>
            <a class="btn clrP clrBr btnFlx" @click="editingPaymentMethod = null">
              <i class="ion-arrow-left-c"></i>
              <span>返回列表</span>
            </a>
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
            <button class="btn primaryBtn" @click="savePaymentMethods">保存更改</button>
          </div>
        </div>

        <!-- 设置新收款账户 -->
        <div v-if="applyingPaymentMethod" class="contentBox padMd clrP clrBr">
          <div class="flexRow rowMd">
            <h2 class="tx3 txB">设置 {{ paymentMethodsInfo[applyingPaymentMethod]?.name }} 收款账户</h2>
            <div class="flexExpand"></div>
            <a class="btn clrP clrBr btnFlx" @click="applyingPaymentMethod = null; showApplyNewAccount = true">
              <i class="ion-arrow-left-c"></i>
              <span>返回选择</span>
            </a>
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
            <button class="btn cancelBtn" @click="applyingPaymentMethod = null; showApplyNewAccount = true">返回</button>
            <button class="btn primaryBtn" @click="completeApplyPaymentMethod">完成设置</button>
          </div>
        </div>

        <div class="flexHRight" v-if="hasAnyPaymentMethod && !showApplyNewAccount && !editingPaymentMethod && !applyingPaymentMethod">
          <a class="btn clrP clrBr btnFlx" @click="savePaymentMethods">
            <span>保存设置</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useOnboard } from '@web3-onboard/vue';
import PaymentMethodSetup from './receiving/PaymentMethodSetup.vue';
import app from '../../../backbone/app.js';
import { recordEvent } from '../../../backbone/utils/metrics.js';
import { myGet, myPost } from '../../api/api.js';

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
          name: '以太坊/ERC-20代币',
          description: '接收ETH和基于以太坊的代币',
          icon: 'ion-social-bitcoin',
          iconClass: ''
        },
        bsc: {
          name: 'BSC/BEP-20代币',
          description: '接收BNB和币安智能链代币',
          icon: 'ion-social-bitcoin',
          iconClass: 'bscIcon'
        },
        solana: {
          name: 'Solana',
          description: '接收SOL和Solana代币',
          icon: 'ion-social-bitcoin',
          iconClass: 'solanaIcon'
        },
        base: {
          name: 'Base',
          description: '接收Base链上的代币',
          icon: 'ion-social-bitcoin',
          iconClass: 'baseIcon'
        },
        paypal: {
          name: 'PayPal',
          description: '接收PayPal支付',
          icon: 'ion-card',
          iconClass: 'paypalIcon'
        },
        stripe: {
          name: 'Stripe',
          description: '接收信用卡支付',
          icon: 'ion-card',
          iconClass: 'stripeIcon'
        }
      }
    };
  },
  created() {
    this.initEventChain();
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
    onClose() {
      this.$emit('close');
    },
    
    async fetchPaymentMethods() {
      try {
        // 实际项目中应该从API获取数据
        const response = await myGet(app.getServerUrl('ob/payment-methods'));
        
        if (response && response.data) {
          this.paymentMethods = response.data;
        }
      } catch (error) {
        console.error('获取收款方式失败:', error);
        // 假数据，实际项目应移除
        this.paymentMethods = {
          ethereum: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            enabled: true
          },
          bsc: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            enabled: true
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
            email: 'your-business@example.com',
            enabled: true
          },
          stripe: {
            accountId: '',
            enabled: false
          }
        };
      }
    },
    
    async savePaymentMethods() {
      this.isSaving = true;
      
      try {
        const response = await myPost(app.getServerUrl('ob/payment-methods'), {
          data: this.paymentMethods
        });
        
        if (response && response.success) {
          this.saveSuccess = true;
          setTimeout(() => {
            this.saveSuccess = false;
          }, 3000);
        }
      } catch (error) {
        console.error('保存收款方式失败:', error);
      } finally {
        this.isSaving = false;
        
        // 返回列表视图
        this.editingPaymentMethod = null;
        this.applyingPaymentMethod = null;
        this.showApplyNewAccount = false;
      }
    },
    
    applyPaymentMethod(method) {
      this.applyingPaymentMethod = method;
      this.showApplyNewAccount = false;
    },
    
    completeApplyPaymentMethod() {
      if (this.applyingPaymentMethod) {
        // 启用该支付方式
        if (this.applyingPaymentMethod === 'paypal' && this.paymentMethods.paypal.email) {
          this.paymentMethods.paypal.enabled = true;
        } else if (this.applyingPaymentMethod === 'stripe' && this.paymentMethods.stripe.accountId) {
          this.paymentMethods.stripe.enabled = true;
        } else if (['ethereum', 'bsc', 'solana', 'base'].includes(this.applyingPaymentMethod)) {
          const method = this.paymentMethods[this.applyingPaymentMethod];
          if (method && method.address) {
            method.enabled = true;
          }
        }
        
        // 保存并返回列表
        this.savePaymentMethods();
      }
    },
    
    editPaymentMethod(method) {
      this.editingPaymentMethod = method;
    },
    
    togglePaymentMethod(method, enabled) {
      if (this.paymentMethods[method]) {
        this.paymentMethods[method].enabled = enabled;
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
      
      let chainId;
      
      switch(chain) {
        case 'ethereum':
          chainId = '0x1'; // 以太坊主网
          break;
        case 'bsc':
          chainId = '0x38'; // BSC主网
          break;
        case 'base':
          chainId = '0x2105'; // Base主网
          break;
        default:
          chainId = '0x1';
      }
      
      try {
        const wallets = await this.onboard.connectWallet();
        
        if (wallets && wallets.length > 0) {
          const connectedWallet = wallets[0];
          
          if (connectedWallet.accounts && connectedWallet.accounts.length > 0) {
            const address = connectedWallet.accounts[0].address;
            
            switch(chain) {
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
          }
          
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
          }
        }
      } catch (error) {
        console.error('连接钱包失败:', error);
      }
    },
    
    async connectStripe() {
      // 这里是Stripe连接的逻辑，通常是重定向到Stripe的OAuth页面
      // 实际实现可能需要后端支持
      recordEvent('PaymentMethods_ConnectStripe');
      
      try {
        // 假设这里调用后端获取Stripe OAuth URL的API
        const response = await myGet(app.getServerUrl('ob/stripe/connect-url'));
        
        if (response && response.url) {
          // 重定向到Stripe OAuth页面
          window.location.href = response.url;
        }
      } catch (error) {
        console.error('获取Stripe连接URL失败:', error);
        
        // 模拟Stripe连接（仅用于演示）
        this.paymentMethods.stripe.accountId = 'acct_' + Math.random().toString(36).substring(2, 15);
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
        // 兼容不支持clipboard API的浏览器
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
    },
    
    initEventChain() {
      this.templateHelpers = {
        polyT: (key) => {
          const translations = {
            'receivingAccounts.title': '收款账户管理',
            'receivingAccounts.closeLink': '关闭',
            'paymentMethods.cryptoSection': '加密货币收款',
            'paymentMethods.tradPaymentSection': '传统支付方式'
          };
          return translations[key] || key;
        }
      };
    }
  }
};
</script>

<style lang="scss" scoped>
.receivingAccounts {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  
  .modalContent {
    width: 90%;
    max-width: 800px;
    max-height: 85vh;
    overflow-y: auto;
    border-radius: 8px;
    padding: 20px;
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
          font-size: 16px;
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
        margin-left: 8px;
      }
    }
  }
  
  .paymentSetupContainer {
    padding: 16px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    margin: 16px 0;
    
    .setupHeader {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      
      .setupIcon {
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
      
      h4 {
        margin: 0;
        font-size: 18px;
      }
    }
    
    .setupSteps {
      margin-top: 20px;
      
      .setupStep {
        display: flex;
        margin-bottom: 20px;
        
        .stepNumber {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: #2196F3;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 16px;
          flex-shrink: 0;
        }
        
        .stepContent {
          flex: 1;
          
          h5 {
            margin: 0 0 4px 0;
            font-size: 16px;
          }
          
          p {
            margin: 0;
            color: rgba(0, 0, 0, 0.6);
            font-size: 14px;
          }
        }
      }
    }
    
    .addressDisplay {
      background-color: rgba(0, 0, 0, 0.03);
      padding: 12px;
      border-radius: 4px;
      margin-top: 16px;
      
      .addressLabel {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
        margin-bottom: 8px;
      }
      
      .addressValue {
        display: flex;
        align-items: center;
        
        .address {
          flex: 1;
          word-break: break-all;
          font-family: monospace;
        }
        
        .copyBtn {
          margin-left: 8px;
          cursor: pointer;
          color: #2196F3;
        }
      }
    }
  }
  
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
}
</style> 