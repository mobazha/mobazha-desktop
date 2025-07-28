<template>
  <div class="rwaTokenType padSmKids padStackAll">
    <div class="flexRow">
      <div class="col12">
        <div class="flexRow">
          <label for="editListingRwaTitle" class="required flexExpand">{{ ob.polyT('editListing.title') }}</label>
          <ViewListingLinks :createMode="ob.createMode" @viewListing="onClickViewListing" @viewListingOnWeb="onClickViewListingOnWeb" />
        </div>
        <FormError v-if="ob.errors['item.title']" :errors="ob.errors['item.title']" />
        <input
          type="text"
          v-focus
          class="clrBr clrP clrSh2"
          v-model.trim="localTitle"
          id="editListingRwaTitle"
          :maxLength="ob.max.title"
          :placeholder="ob.polyT('editListing.placeholderTitle')"
          @input="onTitleChange"
        />
        <div class="clrT2 txSm helper">{{ ob.polyT('editListing.helperTitle') }}</div>
      </div>
    </div>
    
    <div class="flexRow">
      <div class="col12">
        <label for="editListingRwaContractType" class="required">{{ ob.polyT('editListing.type') }}</label>
        <template v-if="formData.metadata.contractType === 'RWA_TOKEN' && ob.errors['metadata.contractType']">
          <FormError :errors="ob.errors['metadata.contractType']" />
        </template>
        <Select2 id="editListingRwaContractType" v-model="localContractType" class="clrBr clrP clrSh2 marginTopAuto" :options="{ minimumResultsForSearch: Infinity }" @change="onContractTypeChange">
          <template v-for="(contractType, j) in ob.contractTypes" :key="j">
            <option :value="contractType.code" :selected="contractType.code === localContractType">{{ contractType.name }}</option>
          </template>
        </Select2>
        <div class="clrT2 txSm helper">
          <div v-html="ob.polyT('editListing.helperType', { smart_count: 5 })"></div>
        </div>
      </div>
    </div>

    <div class="flexRow">
      <div class="col12">
        <label for="editListingRwaBlockchain" class="required">{{ ob.polyT('editListing.rwaTokenType.lblBlockchain') }}</label>
        <FormError v-if="ob.errors['item.rwaBlockchain']" :errors="ob.errors['item.rwaBlockchain']" />
        <Select2 id="editListingRwaBlockchain" v-model="localRwaBlockchain" class="clrBr clrP clrSh2 marginTopAuto" :options="{ minimumResultsForSearch: Infinity }" @change="onRwaBlockchainChange">
          <template v-for="(blockchain, j) in rwaBlockchains" :key="j">
            <option :value="blockchain.code" :selected="blockchain.code === localRwaBlockchain">{{ blockchain.name }}</option>
          </template>
        </Select2>
        <div class="clrT2 txSm helper">{{ ob.polyT('editListing.rwaTokenType.helperBlockchain') }}</div>
      </div>
    </div>
    
    <div class="flexRow">
      <div class="col12">
        <label class="required">{{ ob.polyT('editListing.rwaTokenType.lblTokenSelection') }}</label>
        <FormError v-if="ob.errors['item.rwaTokenAddress']" :errors="ob.errors['item.rwaTokenAddress']" />
        <RwaTokenSelector 
          v-model="selectedRwaToken"
          :modelValue="selectedRwaToken || { cryptoListingCurrencyCode: modelValue?.item?.cryptoListingCurrencyCode }"
          @update:modelValue="onRwaTokenSelected"
        />
        <div class="clrT2 txSm helper">{{ ob.polyT('editListing.rwaTokenType.helperTokenSelection') }}</div>
      </div>
    </div>
    
    <!-- 选中Token的详细信息 -->
    <div class="flexRow" v-if="selectedRwaToken">
      <div class="col12">
        <div class="selectedTokenInfo">
          <h4>已选择的RWA代币信息</h4>
          <div class="tokenInfoGrid">
            <div class="infoItem">
              <span class="label">代币名称:</span>
              <span class="value">{{ selectedRwaToken.name }}</span>
            </div>
            <div class="infoItem">
              <span class="label">代币符号:</span>
              <span class="value">{{ selectedRwaToken.symbol }}</span>
            </div>
            <div class="infoItem">
              <span class="label">代币类型:</span>
              <span class="value">{{ getTokenTypeName(selectedRwaToken.tokenType) }}</span>
            </div>
            <div class="infoItem">
              <span class="label">当前价格:</span>
              <span class="value">${{ selectedRwaToken.currentPrice }}</span>
            </div>
            <div class="infoItem">
              <span class="label">发行方:</span>
              <span class="value">{{ selectedRwaToken.issuer }}</span>
            </div>
            <div class="infoItem">
              <span class="label">风险等级:</span>
              <span class="value">{{ selectedRwaToken.metadata?.riskLevel }}</span>
            </div>
            <div class="infoItem">
              <span class="label">验证状态:</span>
              <span class="value verified">
                <i class="icon-verified"></i>
                {{ selectedRwaToken.verification?.verifiedBy || '已验证' }}
              </span>
            </div>
            <div class="infoItem">
              <span class="label">合约地址:</span>
              <span class="value address">{{ formatAddress(selectedRwaToken.contractAddress) }}</span>
            </div>
          </div>
          
          <!-- 投资建议 -->
          <div class="investmentAdvice" v-if="investmentSuggestions.length > 0">
            <h5>投资建议</h5>
            <ul>
              <li v-for="(suggestion, index) in investmentSuggestions" :key="index">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="flexRow gutterH" v-if="selectedRwaToken">
      <div class="col6 simpleFlexCol">
        <!-- 预留空间，保持布局一致 -->
      </div>
      <div class="col6 simpleFlexCol">
        <!-- 预留空间，保持布局一致 -->
      </div>
    </div>
    
    <!-- 价格字段 - 类似DIGITAL_GOOD -->
    <div class="flexRow gutterH">
      <div class="col6 simpleFlexCol">
        <label for="editListingRwaPrice" class="required">{{ ob.polyT('editListing.price') }}</label>
        <FormError v-if="ob.errors['item.price']" :errors="ob.errors['item.price']" />
        <div class="inputSelect marginTopAuto">
          <input
            type="number"
            class="clrBr clrP clrSh2"
            v-model="localPrice"
            id="editListingRwaPrice"
            placeholder="0.00"
            data-var-type="bignumber"
            @input="onPriceChange"
          />
          <Select2 id="editListingRwaCurrency" v-model="localPricingCurrency" class="clrBr clrP nestInputRight">
            <template v-for="(currency, j) in currencies" :key="j">
              <option :value="currency.code" :selected="currency.code.toUpperCase() === localPricingCurrency.toUpperCase()">
                {{ currency.code }}
              </option>
            </template>
          </Select2>
        </div>
        <div class="clrT2 txSm helper">{{ ob.polyT('editListing.helperPrice', { cur: helperCryptoCurName }) }}</div>
      </div>
      <div class="col6 simpleFlexCol">
        <!-- 预留空间，保持布局一致 -->
      </div>
    </div>
    
    <!-- 多种支付币种选择 -->
    <div class="flexRow">
      <div class="col12">
        <label for="editListingRwaReceive" class="required">{{ ob.polyT('editListing.rwaTokenType.lblReceive') }}</label>
        <div class="posR marginTopAuto">
          <template v-if="ob.errors['metadata.acceptedCurrencies'] && ob.metadata.contractType === 'RWA_TOKEN'">
            <FormError :errors="ob.errors['metadata.acceptedCurrencies']" />
          </template>
          <!-- 支持多种支付币种选择 -->
          <div class="acceptedCurrenciesContainer">
            <div v-for="(currency, index) in selectedAcceptedCurrencies" :key="index" class="currencyItem">
              <Select2 
                :id="`editListingRwaReceive${index}`" 
                v-model="selectedAcceptedCurrencies[index]" 
                class="clrBr clrP clrSh2 marginTopAuto"
                @change="onAcceptedCurrencyChange"
              >
                <template v-for="(coin, j) in ob.receiveCurs" :key="j">
                  <option :value="coin.code" :selected="coin.code === selectedAcceptedCurrencies[index]">{{ coin.name }}</option>
                </template>
              </Select2>
              <button 
                v-if="selectedAcceptedCurrencies.length > 1" 
                type="button" 
                class="btn clrP clrBr clrT txSm removeCurrencyBtn" 
                @click="removeAcceptedCurrency(index)"
              >
                <span class="ion-ios-close-empty"></span>
              </button>
            </div>
            <button 
              type="button" 
              class="btn clrP clrBr clrSh2 addCurrencyBtn" 
              @click="addAcceptedCurrency"
            >
              <span class="ion-plus"></span> {{ ob.polyT('editListing.rwaTokenType.addCurrency') }}
            </button>
          </div>
          <div class="clrT2 txSm helper">{{ ob.polyT('editListing.rwaTokenType.helperReceive') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import bigNumber from 'bignumber.js';
import app from '../../../../backbone/app';
import { supportedWalletCurs } from '../../../../backbone/data/walletCurrencies';
import { isJQPromise } from '../../../../backbone/utils/object';
import { getCurrenciesSortedByCode } from '../../../../backbone/data/currencies';

import ViewListingLinks from './ViewListingLinks.vue';
import RwaTokenSelector from '../../../components/RwaTokenSelector.vue';
import { findRwaTokenByCode } from '../../../data/rwaTokenMockData.js';

export default {
  components: {
    ViewListingLinks,
    RwaTokenSelector,
  },
  props: ["options", "bb", "modelValue"],
  emits: ['update:modelValue', 'clickViewListing', 'clickViewListingOnWeb'],
  data () {
    return {
      curAccepted: '',
      hideTradingPair: true,

      // 本地变量，避免直接修改父组件数据
      localTitle: '',
      localContractType: '',
      localRwaTokenAddress: '',
      localRwaBlockchain: '',
      localPrice: '',
      localPricingCurrency: '',
      selectedAcceptedCurrencies: [], // 支持多种支付币种
      selectedRwaToken: null,
      investmentSuggestions: [],
      currencies: [],
      
      // RWA区块链列表
      rwaBlockchains: [
        { code: 'ETH', name: 'Ethereum (ETH)' },
        { code: 'BSC', name: 'Binance Smart Chain (BSC)' },
        { code: 'BASE', name: 'Base (BASE)' },
        { code: 'POLYGON', name: 'Polygon (MATIC)' },
        { code: 'ARBITRUM', name: 'Arbitrum (ARB)' },
        { code: 'OPTIMISM', name: 'Optimism (OP)' },
        { code: 'AVALANCHE', name: 'Avalanche (AVAX)' },
        { code: 'SOLANA', name: 'Solana (SOL)' }
      ],
    };
  },
  created () {
    this.loadData(this.options);
  },
  mounted () {
  },
  watch: {
    selectedAcceptedCurrencies: {
      handler(newVal, oldVal) {
        // 避免循环更新：只有当值真正改变时才触发更新
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          this.$emit('update:modelValue', {
            ...this.modelValue,
            metadata: {
              ...this.modelValue.metadata,
              acceptedCurrencies: newVal
            }
          });
        }
      },
      deep: true
    },
    modelValue: {
      handler(newVal, oldVal) {
        // 避免循环更新：只有当值真正改变时才同步
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          // 同步本地变量
          this.localTitle = newVal?.item?.title || '';
          this.localContractType = newVal?.metadata?.contractType || '';
          this.localRwaTokenAddress = newVal?.item?.rwaTokenAddress || '';
          this.localRwaBlockchain = newVal?.item?.rwaBlockchain || 'ETH';
          
          // 初始化价格字段
          const price = newVal?.item?.price;
          if (price instanceof bigNumber) {
            // 检查BigNumber是否为空或无效
            if (price.isNaN() || price.isZero() || price.toString() === 'NaN') {
              this.localPrice = '';
            } else {
              this.localPrice = price.toString();
            }
          } else if (typeof price === 'string' && price) {
            this.localPrice = price;
          } else if (typeof price === 'number') {
            this.localPrice = price.toString();
          } else {
            this.localPrice = price || '';
          }
          this.localPricingCurrency = newVal?.metadata?.pricingCurrency?.code || 'USDT';
          
          // 同步多种支付币种 - 使用临时变量避免直接修改
          let newAcceptedCurrencies = ['ETHUSDT']; // 默认币种
          if (newVal?.metadata?.acceptedCurrencies) {
            newAcceptedCurrencies = Array.isArray(newVal.metadata.acceptedCurrencies) 
              ? [...newVal.metadata.acceptedCurrencies] 
              : [newVal.metadata.acceptedCurrencies];
          }
          
          // 只有当币种列表真正改变时才更新
          if (JSON.stringify(this.selectedAcceptedCurrencies) !== JSON.stringify(newAcceptedCurrencies)) {
            this.selectedAcceptedCurrencies = newAcceptedCurrencies;
          }
          
          // 如果有cryptoListingCurrencyCode，尝试查找对应的Token
          if (newVal?.item?.cryptoListingCurrencyCode) {
            // 根据cryptoListingCurrencyCode查找对应的Token信息
            const tokenCode = newVal.item.cryptoListingCurrencyCode;
            const foundToken = this.findRwaTokenByCode(tokenCode);
            if (foundToken) {
              this.selectedRwaToken = foundToken;
              // 更新相关字段，但不覆盖已有的价格
              this.updateRelatedFieldsWithoutPrice(foundToken);
            }
          }
        }
      },
      deep: true
    }
  },
  computed: {
    formData: {
      get() {
        return this.modelValue;
      },
    },
    ob () {
      // 确保 model 存在
      if (!this.model) {
        const bb = this.bb();
        this.model = bb.model;
      }
      
      return {
        ...this.templateHelpers,
        contractTypes: this.model.get('metadata').contractTypesVerbose,
        receiveCurs: this.receiveCurs,
        errors: this.model.validationError || {},
        max: {
          title: this.model.get('item').max.titleLength,
        },
        ...this.model.toJSON(),
      };
    },
    helperCryptoCurName() {
      const ob = this.ob;
      const supportedWalletCurs = ob.crypto.supportedWalletCurs().map((cur) => ob.crypto.ensureMainnetCode(cur));
      const helperCryptoCurCode = supportedWalletCurs.includes('USDT') ? 'USDT' : supportedWalletCurs.sort()[0] || 'USDT';
      return ob.polyT(`cryptoCurrencies.${helperCryptoCurCode}`, ob.polyT(`currencies.${helperCryptoCurCode}`, { _: helperCryptoCurCode }));
    }
  },
  methods: {
    loadData (options = {}) {
      // 通过 bb 函数获取 model
      const bb = this.bb();
      this.model = bb.model;
      
      if (!this.model) {
        throw new Error('Please provide a Listing model.');
      }

      this.baseInit({
        ...options,
      });

      // 初始化币种列表
      this.currencies = getCurrenciesSortedByCode();

      // 确保 receiveCurs 被正确初始化
      if (!this.receiveCurs || this.receiveCurs.length === 0) {
        this.receiveCurs = [
          { code: 'ETHUSDT', name: 'USDT (Ethereum)' },
          { code: 'ETHUSDC', name: 'USDC (Ethereum)' },
          { code: 'ETHDAI', name: 'DAI (Ethereum)' }
        ];
      }

      // 初始化多种支付币种
      this.selectedAcceptedCurrencies = ['ETHUSDT']; // 默认至少一个币种
      
      // 根据区块链选择对应的稳定币（在初始化币种后调用）
      this.updateReceiveCurrencies();

      // 初始化本地变量
      this.localTitle = this.modelValue?.item?.title || '';
      this.localContractType = this.modelValue?.metadata?.contractType || '';
      this.localRwaTokenAddress = this.modelValue?.item?.rwaTokenAddress || '';
      this.localRwaBlockchain = this.modelValue?.item?.rwaBlockchain || 'ETH';
      
      // 初始化价格字段
      const price = this.modelValue?.item?.price;
      if (price instanceof bigNumber) {
        // 检查BigNumber是否为空或无效
        if (price.isNaN() || price.isZero() || price.toString() === 'NaN') {
          this.localPrice = '';
        } else {
          this.localPrice = price.toString();
        }
      } else if (typeof price === 'string' && price) {
        this.localPrice = price;
      } else if (typeof price === 'number') {
        this.localPrice = price.toString();
      } else {
        this.localPrice = price || '';
      }
      this.localPricingCurrency = this.modelValue?.metadata?.pricingCurrency?.code || 'USDT';
      
      // 初始化选中的Token - 根据cryptoListingCurrencyCode查找
      if (this.modelValue?.item?.cryptoListingCurrencyCode) {
        const tokenCode = this.modelValue.item.cryptoListingCurrencyCode;
        const foundToken = this.findRwaTokenByCode(tokenCode);
        if (foundToken) {
          this.selectedRwaToken = foundToken;
          // 更新相关字段，但不覆盖已有的价格
          this.updateRelatedFieldsWithoutPrice(foundToken);
        }
      } else {
        this.selectedRwaToken = null;
      }
    },

    onClickViewListing() {
      this.$emit('clickViewListing');
    },

    onClickViewListingOnWeb() {
      this.$emit('clickViewListingOnWeb');
    },

    onTitleChange() {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        item: {
          ...this.modelValue.item,
          title: this.localTitle
        }
      });
    },

    onContractTypeChange() {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        metadata: {
          ...this.modelValue.metadata,
          contractType: this.localContractType
        }
      });
    },

    onPriceChange() {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        item: {
          ...this.modelValue.item,
          price: this.localPrice ? new bigNumber(this.localPrice) : new bigNumber(0)
        },
        metadata: {
          ...this.modelValue.metadata,
          pricingCurrency: {
            code: this.localPricingCurrency
          }
        }
      });
    },

    onRwaBlockchainChange() {
      // 更新接收币种
      this.updateReceiveCurrencies();
      
      this.$emit('update:modelValue', {
        ...this.modelValue,
        item: {
          ...this.modelValue.item,
          rwaBlockchain: this.localRwaBlockchain,
          price: this.localPrice ? new bigNumber(this.localPrice) : new bigNumber(0)
        },
        metadata: {
          ...this.modelValue.metadata,
          contractType: 'RWA_TOKEN',
          pricingCurrency: {
            code: this.localPricingCurrency
          }
        }
      });
    },

    updateReceiveCurrencies() {
      // 根据选择的区块链提供对应的稳定币选项
      const blockchainStablecoins = {
        'ETH': [
          { code: 'ETHUSDT', name: 'USDT (Ethereum)' },
          { code: 'ETHUSDC', name: 'USDC (Ethereum)' },
          { code: 'ETHDAI', name: 'DAI (Ethereum)' }
        ],
        'BSC': [
          { code: 'BSCUSDT', name: 'USDT (BSC)' },
          { code: 'BSCBUSD', name: 'BUSD (BSC)' }
        ],
        'BASE': [
          { code: 'BASEUSDC', name: 'USDC (Base)' },
          { code: 'BASEUSDT', name: 'USDT (Base)' }
        ],
        'POLYGON': [
          { code: 'POLYGONUSDT', name: 'USDT (Polygon)' },
          { code: 'POLYGONUSDC', name: 'USDC (Polygon)' }
        ],
        'ARBITRUM': [
          { code: 'ARBITRUMUSDC', name: 'USDC (Arbitrum)' },
          { code: 'ARBITRUMUSDT', name: 'USDT (Arbitrum)' }
        ],
        'OPTIMISM': [
          { code: 'OPTIMISMUSDC', name: 'USDC (Optimism)' },
          { code: 'OPTIMISMUSDT', name: 'USDT (Optimism)' }
        ],
        'AVALANCHE': [
          { code: 'AVALANCHEUSDT', name: 'USDT (Avalanche)' },
          { code: 'AVALANCHEUSDC', name: 'USDC (Avalanche)' }
        ],
        'SOLANA': [
          { code: 'SOLANAUSDC', name: 'USDC (Solana)' },
          { code: 'SOLANAUSDT', name: 'USDT (Solana)' }
        ]
      };

      this.receiveCurs = blockchainStablecoins[this.localRwaBlockchain] || blockchainStablecoins['ETH'];
      
      // 只有在币种列表已经初始化后才更新selectedAcceptedCurrencies
      if (this.selectedAcceptedCurrencies && this.selectedAcceptedCurrencies.length > 0) {
        const newCurrencies = this.receiveCurs.map(cur => cur.code);
        const currentCurrencies = [...this.selectedAcceptedCurrencies];
        
        // 检查是否需要更新币种列表
        let needsUpdate = false;
        
        // 如果当前选择的币种不在新的列表中，需要更新
        for (let i = 0; i < currentCurrencies.length; i++) {
          if (!newCurrencies.includes(currentCurrencies[i])) {
            currentCurrencies[i] = newCurrencies[0] || 'ETHUSDT';
            needsUpdate = true;
          }
        }
        
        // 只有当需要更新时才触发变化
        if (needsUpdate) {
          this.selectedAcceptedCurrencies = currentCurrencies;
        }
      }
    },

    onRwaTokenSelected(tokenData) {
      if (tokenData) {
        this.selectedRwaToken = tokenData;
        
        // 自动更新关联字段（不触发emit）
        this.updateRelatedFields(tokenData);
        
        this.$emit('update:modelValue', {
          ...this.modelValue,
          item: {
            ...this.modelValue.item,
            cryptoListingCurrencyCode: tokenData.code, // 使用code字段
            contractAddress: tokenData.contractAddress,
            price: this.localPrice ? new bigNumber(this.localPrice) : new bigNumber(0),
          },
          metadata: {
            ...this.modelValue.metadata,
            contractType: 'RWA_TOKEN',
            pricingCurrency: {
              code: this.localPricingCurrency
            }
          }
        });
      } else {
        this.selectedRwaToken = null;
        
        // 清空关联字段
        this.clearRelatedFields();
        
        this.$emit('update:modelValue', {
          ...this.modelValue,
          item: {
            ...this.modelValue.item,
            cryptoListingCurrencyCode: '',
            contractAddress: ''
          }
        });
      }
    },

    updateRelatedFields(tokenData) {
      // 根据选择的Token更新相关字段
      if (tokenData.code) {
        // 更新RWA Token类型选择
        this.localContractType = 'RWA_TOKEN';
        
        // 更新标题（如果为空或包含默认值）
        if (!this.localTitle || this.localTitle.includes('代币')) {
          this.localTitle = `${tokenData.name} 代币`;
        }
        
        // 只有在价格完全为空时才设置默认价格（基于Token当前价格）
        // 这样可以确保后端返回的价格不会被覆盖
        if (!this.localPrice && tokenData.currentPrice) {
          this.localPrice = tokenData.currentPrice;
        }

        // 根据Token的风险等级和类型提供建议
        this.updateTokenSuggestions(tokenData);
      }
    },

    updateRelatedFieldsWithoutPrice(tokenData) {
      // 根据选择的Token更新相关字段，但不覆盖已有的价格
      if (tokenData.code) {
        // 更新RWA Token类型选择
        this.localContractType = 'RWA_TOKEN';
        
        // 更新标题（如果为空或包含默认值）
        if (!this.localTitle || this.localTitle.includes('代币')) {
          this.localTitle = `${tokenData.name} 代币`;
        }
        
        // 不更新价格，保持原有的价格值
        
        // 根据Token的风险等级和类型提供建议
        this.updateTokenSuggestions(tokenData);
      }
    },

    updateTokenSuggestions(tokenData) {
      // 根据Token类型和风险等级提供建议
      const suggestions = [];
      
      if (tokenData.metadata && tokenData.metadata.riskLevel === '低') {
        suggestions.push('低风险代币，适合保守型投资者');
      } else if (tokenData.metadata && tokenData.metadata.riskLevel === '中等') {
        suggestions.push('中等风险代币，适合平衡型投资者');
      } else if (tokenData.metadata && tokenData.metadata.riskLevel === '高') {
        suggestions.push('高风险代币，适合激进型投资者');
      }

      if (tokenData.tokenType === 'REAL_ESTATE') {
        suggestions.push('房地产代币通常具有稳定的现金流');
      } else if (tokenData.tokenType === 'CARBON_CREDIT') {
        suggestions.push('碳信用代币支持环保项目');
      }

      // 设置投资建议
      this.investmentSuggestions = suggestions;
    },

    clearRelatedFields() {
      // 清空关联字段
      this.localTitle = '';
      this.localContractType = '';
      this.localRwaBlockchain = '';
      this.investmentSuggestions = [];
    },

    getTokenTypeName(tokenType) {
      const tokenTypeNames = {
        'REAL_ESTATE': '房地产代币',
        'BOND': '债券代币',
        'COMMODITY': '商品代币',
        'ART': '艺术品代币',
        'CARBON_CREDIT': '碳信用代币',
        'CUSTOM': '自定义代币'
      };
      return tokenTypeNames[tokenType] || tokenType;
    },

    formatAddress(address) {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    // 添加支付币种
    addAcceptedCurrency() {
      if (this.selectedAcceptedCurrencies.length < 5) { // 限制最多5种币种
        this.selectedAcceptedCurrencies.push('ETHUSDT');
      }
    },

    // 移除支付币种
    removeAcceptedCurrency(index) {
      if (this.selectedAcceptedCurrencies.length > 1) {
        this.selectedAcceptedCurrencies.splice(index, 1);
      }
    },

    // 支付币种变化处理
    onAcceptedCurrencyChange() {
      // 不需要手动触发更新，watch会自动处理
    },

    // 根据代码查找RWA Token
    findRwaTokenByCode(code) {
      return findRwaTokenByCode(code);
    }
  }
}
</script>

<style lang="scss" scoped>
.selectedTokenInfo {
  background: #f8f9fa;
  border: 2px solid #28a745;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;

  h4 {
    color: #28a745;
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: bold;
  }

  .tokenInfoGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;

    .infoItem {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: #666;
        font-size: 14px;
        font-weight: 500;
      }

      .value {
        color: #333;
        font-size: 14px;
        font-weight: 600;

        &.verified {
          color: #28a745;
          display: flex;
          align-items: center;
          gap: 4px;

          i {
            font-size: 12px;
          }
        }

        &.address {
          font-family: monospace;
          font-size: 12px;
          color: #007bff;
        }
      }
    }

    .investmentAdvice {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e9ecef;

      h5 {
        color: #007bff;
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: bold;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 6px 0;
          color: #666;
          font-size: 13px;
          position: relative;
          padding-left: 20px;

          &:before {
            content: "💡";
            position: absolute;
            left: 0;
            top: 6px;
            font-size: 12px;
          }
        }
      }
    }
  }
}

.acceptedCurrenciesContainer {
  .currencyItem {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;

    .removeCurrencyBtn {
      padding: 5px 8px;
      border-radius: 4px;
      font-size: 12px;
      min-width: auto;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background-color: #dc3545;
        color: white;
      }
    }
  }

  .addCurrencyBtn {
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 5px;

    &:hover {
      background-color: #28a745;
      color: white;
    }
  }
}
</style> 