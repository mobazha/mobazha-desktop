<template>
  <div class="rwaTokenSelector">
    <!-- 搜索和查找模式切换 -->
    <div class="searchModeToggle">
              <button 
          class="modeBtn" 
          :class="{ active: searchMode === 'search' }"
          @click="searchMode = 'search'"
        >
          {{ $t('rwaTokenSelector.searchMode') }}
        </button>
        <button 
          class="modeBtn" 
          :class="{ active: searchMode === 'address' }"
          @click="searchMode = 'address'"
        >
          {{ $t('rwaTokenSelector.addressMode') }}
        </button>
    </div>

    <!-- 搜索模式 -->
    <div v-if="searchMode === 'search'" class="searchSection">
      <div class="searchInput">
                  <input
            type="text"
            v-model="searchQuery"
            :placeholder="$t('rwaTokenSelector.searchPlaceholder')"
            @input="onSearchInput"
            class="clrBr clrP clrSh2"
          />
        <button @click="performSearch" class="searchBtn">
          <i class="icon-search"></i>
        </button>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="searchResults">
        <div class="resultsHeader">
          <h4>{{ $t('rwaTokenSelector.searchResults') }} ({{ searchResults.length }})</h4>
        </div>
        <div class="tokenList">
          <div
            v-for="token in searchResults"
            :key="token.contractAddress"
            class="tokenItem"
            @click="selectToken(token)"
          >
            <div class="tokenInfo">
              <div class="tokenIcon">
                <img :src="getTokenTypeIcon(token.code)" :alt="getTokenTypeName(token.tokenType)" />
              </div>
              <div class="tokenDetails">
                <div class="tokenName">{{ token.name }}</div>
                <div class="tokenSymbol">{{ token.symbol }}</div>
                <div class="tokenType">{{ getTokenTypeName(token.tokenType) }}</div>
              </div>
            </div>
            <div class="tokenDetails">
              <div class="tokenPrice">{{ $t('rwaTokenSelector.currentPrice') }}: ${{ token.currentPrice }}</div>
              <div class="tokenAddress">{{ formatAddress(token.contractAddress) }}</div>
            </div>
            <div class="tokenVerification" v-if="token.verification.isVerified">
              <i class="icon-verified"></i>
              <span>{{ $t('rwaTokenSelector.verified') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 无搜索结果 -->
      <div v-else-if="hasSearched && searchResults.length === 0" class="noResults">
        <p>{{ $t('rwaTokenSelector.noResults') }}</p>
      </div>
    </div>

    <!-- 地址输入模式 -->
    <div v-else class="addressSection">
      <div class="addressInput">
        <label>{{ $t('rwaTokenSelector.contractAddress') }}</label>
        <input
          type="text"
          v-model="addressInput"
          :placeholder="$t('rwaTokenSelector.addressPlaceholder')"
          @input="onAddressInput"
          class="clrBr clrP clrSh2"
          :class="{ error: addressError }"
        />
        <div v-if="addressError" class="errorMessage">{{ addressError }}</div>
      </div>

      <button 
        @click="verifyAddress" 
        :disabled="!isValidAddress || isVerifying"
        class="verifyBtn"
      >
        <span v-if="isVerifying">{{ $t('rwaTokenSelector.verifying') }}</span>
        <span v-else>{{ $t('rwaTokenSelector.verifyAddress') }}</span>
      </button>

      <!-- 地址验证结果 -->
      <div v-if="verifiedToken" class="verifiedToken">
        <div class="verificationSuccess">
          <i class="icon-success"></i>
          <span>{{ $t('rwaTokenSelector.addressVerified') }}</span>
        </div>
        <div class="tokenCard">
          <div class="tokenHeader">
            <h4>{{ verifiedToken.name }}</h4>
            <span class="tokenSymbol">{{ verifiedToken.symbol }}</span>
          </div>
          <div class="tokenDetails">
            <div class="detailRow">
              <span class="label">{{ $t('rwaTokenSelector.issuer') }}:</span>
              <span class="value">{{ verifiedToken.issuer }}</span>
            </div>
            <div class="detailRow">
              <span class="label">{{ $t('rwaTokenSelector.currentPrice') }}:</span>
              <span class="value">${{ verifiedToken.currentPrice }}</span>
            </div>
            <div class="detailRow">
              <span class="label">{{ $t('rwaTokenSelector.riskLevel') }}:</span>
              <span class="value">{{ verifiedToken.metadata.riskLevel }}</span>
            </div>
            <div class="detailRow">
              <span class="label">{{ $t('rwaTokenSelector.verification') }}:</span>
              <span class="value">{{ verifiedToken.verification.verifiedBy }}</span>
            </div>
          </div>
          <button @click="selectToken(verifiedToken)" class="selectBtn">
            {{ $t('rwaTokenSelector.selectThisToken') }}
          </button>
        </div>
      </div>

      <!-- 地址未找到 -->
      <div v-else-if="addressNotFound" class="addressNotFound">
        <div class="notFoundMessage">
          <i class="icon-warning"></i>
          <span>{{ $t('rwaTokenSelector.addressNotFound') }}</span>
        </div>
        <p>{{ $t('rwaTokenSelector.addressNotFoundHelp') }}</p>
      </div>
    </div>

    <!-- 已选择的Token -->
    <div v-if="selectedToken" class="selectedToken">
      <div class="selectedHeader">
        <h4>{{ $t('rwaTokenSelector.selectedToken') }}</h4>
        <button @click="clearSelection" class="clearBtn">
          {{ $t('rwaTokenSelector.change') }}
        </button>
      </div>
      <div class="selectedTokenCard">
        <div class="tokenInfo">
          <div class="tokenIcon">
            <img :src="getTokenTypeIcon(selectedToken.code)" :alt="getTokenTypeName(selectedToken.tokenType)" />
          </div>
          <div class="tokenDetails">
            <div class="tokenName">{{ selectedToken.name }}</div>
            <div class="tokenSymbol">{{ selectedToken.symbol }}</div>
            <div class="tokenAddress">{{ formatAddress(selectedToken.contractAddress) }}</div>
          </div>
        </div>
        <div class="tokenStats">
          <div class="stat">
            <span class="label">{{ $t('rwaTokenSelector.currentPrice') }}</span>
            <span class="value">${{ selectedToken.currentPrice }}</span>
          </div>
          <div class="stat">
            <span class="label">{{ $t('rwaTokenSelector.riskLevel') }}</span>
            <span class="value">{{ selectedToken.metadata.riskLevel }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  rwaTokenMockData, 
  findRwaTokenByAddress, 
  findRwaTokenByCode,
  searchRwaTokens, 
  validateContractAddress,
  getRwaTokenIconPath
} from '../data/rwaTokenMockData.js';

export default {
  name: 'RwaTokenSelector',
  props: {
    modelValue: {
      type: Object,
      default: null
    },
    blockchain: {
      type: String,
      default: null
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      searchMode: 'search', // 'search' or 'address'
      searchQuery: '',
      searchResults: [],
      hasSearched: false,
      addressInput: '',
      addressError: '',
      isVerifying: false,
      verifiedToken: null,
      addressNotFound: false,
      selectedToken: null,
      tokenTypeNames: {
        'REAL_ESTATE': '房地产代币',
        'BOND': '债券代币',
        'COMMODITY': '商品代币',
        'ART': '艺术品代币',
        'CARBON_CREDIT': '碳信用代币',
        'CUSTOM': '自定义代币'
      }
    };
  },
  computed: {
    isValidAddress() {
      return validateContractAddress(this.addressInput);
    }
  },
  watch: {
    modelValue: {
      handler(newVal) {
        if (newVal && newVal.cryptoListingCurrencyCode) {
          this.selectedToken = findRwaTokenByCode(newVal.cryptoListingCurrencyCode);
        }
      },
      immediate: true
    },
    blockchain: {
      handler() {
        // 当区块链改变时，清空搜索结果和搜索状态
        this.searchResults = [];
        this.hasSearched = false;
        this.searchQuery = '';
        this.verifiedToken = null;
        this.addressNotFound = false;
        this.addressError = '';
      }
    }
  },
  methods: {
    onSearchInput() {
      if (this.searchQuery.length >= 2) {
        this.performSearch();
      } else {
        this.searchResults = [];
        this.hasSearched = false;
      }
    },

    performSearch() {
      if (this.searchQuery.trim()) {
        this.searchResults = searchRwaTokens(this.searchQuery, this.blockchain);
        this.hasSearched = true;
      }
    },

    onAddressInput() {
      this.addressError = '';
      this.verifiedToken = null;
      this.addressNotFound = false;
    },

    async verifyAddress() {
      if (!this.isValidAddress) {
        this.addressError = this.$t('rwaTokenSelector.invalidAddress');
        return;
      }

      this.isVerifying = true;
      this.addressError = '';
      this.verifiedToken = null;
      this.addressNotFound = false;

      try {
        // 模拟网络请求延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const token = findRwaTokenByAddress(this.addressInput);
        // 如果指定了区块链，检查代币是否匹配
        if (token && (!this.blockchain || token.blockchain.toLowerCase() === this.blockchain.toLowerCase())) {
          this.verifiedToken = token;
        } else {
          this.addressNotFound = true;
        }
      } catch (error) {
        this.addressError = this.$t('rwaTokenSelector.verificationError');
      } finally {
        this.isVerifying = false;
      }
    },

    selectToken(token) {
      this.selectedToken = token;
      
      // 清空搜索状态
      this.searchQuery = '';
      this.searchResults = [];
      this.hasSearched = false;
      
      // 清空地址输入状态
      this.addressInput = '';
      this.addressError = '';
      this.verifiedToken = null;
      this.addressNotFound = false;
      
      this.$emit('update:modelValue', {
        code: token.code, // 用于cryptoListingCurrencyCode
        name: token.name,
        symbol: token.symbol,
        description: token.description,
        issuer: token.issuer,
        currentPrice: token.currentPrice,
        tokenType: token.tokenType,
        metadata: token.metadata,
        contractAddress: token.contractAddress
      });
    },

    clearSelection() {
      this.selectedToken = null;
      
      // 清空搜索状态
      this.searchQuery = '';
      this.searchResults = [];
      this.hasSearched = false;
      
      // 清空地址输入状态
      this.addressInput = '';
      this.addressError = '';
      this.verifiedToken = null;
      this.addressNotFound = false;
      
      this.$emit('update:modelValue', null);
    },

    getTokenTypeName(tokenType) {
      return this.tokenTypeNames[tokenType] || tokenType;
    },

    formatAddress(address) {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    getTokenTypeIcon(tokenCode) {
      return getRwaTokenIconPath(tokenCode);
    }
  }
};
</script>

<style lang="scss" scoped>
.rwaTokenSelector {
  .searchModeToggle {
    display: flex;
    margin-bottom: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;

    .modeBtn {
      flex: 1;
      padding: 10px 15px;
      border: none;
      background: #f5f5f5;
      cursor: pointer;
      transition: all 0.3s ease;

      &.active {
        background: #007bff;
        color: white;
      }

      &:hover:not(.active) {
        background: #e9ecef;
      }
    }
  }

  .searchSection, .addressSection {
    .searchInput, .addressInput {
      position: relative;
      margin-bottom: 15px;

      input {
        width: 100%;
        padding: 12px 40px 12px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;

        &.error {
          border-color: #dc3545;
        }
      }

      .searchBtn {
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        color: #666;
      }
    }

    .errorMessage {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }
  }

  .searchResults {
    .resultsHeader {
      margin-bottom: 10px;
      
      h4 {
        margin: 0;
        color: #333;
        font-size: 16px;
      }
    }

    .tokenList {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 6px;

      .tokenItem {
        padding: 15px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
          background-color: #f8f9fa;
        }

        &:last-child {
          border-bottom: none;
        }

        .tokenInfo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .tokenIcon {
            flex-shrink: 0;
            
            img {
              width: 24px;
              height: 24px;
              border-radius: 4px;
            }
          }

          .tokenDetails {
            flex: 1;

            .tokenName {
              font-weight: bold;
              color: #333;
              margin-bottom: 4px;
            }

            .tokenSymbol {
              color: #666;
              font-size: 12px;
              margin-bottom: 2px;
            }

            .tokenType {
              color: #007bff;
              font-size: 11px;
              background: #e3f2fd;
              padding: 2px 6px;
              border-radius: 3px;
              display: inline-block;
            }
          }
        }

        .tokenDetails {
          font-size: 12px;
          color: #666;

          .tokenPrice {
            margin-bottom: 2px;
          }

          .tokenAddress {
            font-family: monospace;
          }
        }

        .tokenVerification {
          margin-top: 8px;
          color: #28a745;
          font-size: 11px;

          i {
            margin-right: 4px;
          }
        }
      }
    }
  }

  .noResults {
    text-align: center;
    padding: 20px;
    color: #666;
  }

  .verifyBtn {
    width: 100%;
    padding: 12px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    margin-bottom: 15px;

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }

  .verifiedToken {
    .verificationSuccess {
      color: #28a745;
      margin-bottom: 15px;
      font-weight: bold;

      i {
        margin-right: 8px;
      }
    }

    .tokenCard {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background: #f8f9fa;

      .tokenHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;

        h4 {
          margin: 0;
          color: #333;
        }

        .tokenSymbol {
          background: #007bff;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
      }

      .tokenDetails {
        margin-bottom: 15px;

        .detailRow {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;

          .label {
            color: #666;
          }

          .value {
            color: #333;
            font-weight: 500;
          }
        }
      }

      .selectBtn {
        width: 100%;
        padding: 10px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
    }
  }

  .addressNotFound {
    text-align: center;
    padding: 20px;
    color: #dc3545;

    .notFoundMessage {
      font-weight: bold;
      margin-bottom: 10px;

      i {
        margin-right: 8px;
      }
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .selectedToken {
    margin-top: 20px;
    border-top: 2px solid #007bff;
    padding-top: 20px;

    .selectedHeader {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      h4 {
        margin: 0;
        color: #333;
      }

      .clearBtn {
        background: none;
        border: 1px solid #dc3545;
        color: #dc3545;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;

        &:hover {
          background: #dc3545;
          color: white;
        }
      }
    }

    .selectedTokenCard {
      border: 2px solid #28a745;
      border-radius: 8px;
      padding: 15px;
      background: #f8fff9;

      .tokenInfo {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 15px;

        .tokenIcon {
          flex-shrink: 0;
          
          img {
            width: 32px;
            height: 32px;
            border-radius: 6px;
          }
        }

        .tokenDetails {
          flex: 1;

          .tokenName {
            font-weight: bold;
            color: #333;
            margin-bottom: 4px;
          }

          .tokenSymbol {
            color: #007bff;
            font-size: 12px;
            margin-bottom: 4px;
          }

          .tokenAddress {
            font-family: monospace;
            font-size: 12px;
            color: #666;
          }
        }
      }

      .tokenStats {
        display: flex;
        gap: 20px;

        .stat {
          .label {
            display: block;
            font-size: 11px;
            color: #666;
            margin-bottom: 2px;
          }

          .value {
            font-weight: bold;
            color: #333;
          }
        }
      }
    }
  }
}
</style> 