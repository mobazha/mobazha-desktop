import app from '../../../app';
import BaseModel from '../../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      tokenAddress: '',
      tokenAmount: '',
      transactionHash: '',
      blockchain: 'ETH',
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.tokenAddress || (typeof attrs.tokenAddress === 'string' && !attrs.tokenAddress.trim())) {
      addError('tokenAddress', app.polyglot.t('orderFulfillmentModelErrors.provideRwaTokenAddress'));
    }

    if (!attrs.tokenAmount || (typeof attrs.tokenAmount === 'string' && !attrs.tokenAmount.trim())) {
      addError('tokenAmount', app.polyglot.t('orderFulfillmentModelErrors.provideRwaTokenAmount'));
    }

    if (!attrs.transactionHash || (typeof attrs.transactionHash === 'string' && !attrs.transactionHash.trim())) {
      addError('transactionHash', app.polyglot.t('orderFulfillmentModelErrors.provideRwaTransactionHash'));
    }

    if (!attrs.blockchain || (typeof attrs.blockchain === 'string' && !attrs.blockchain.trim())) {
      addError('blockchain', app.polyglot.t('orderFulfillmentModelErrors.provideRwaBlockchain'));
    }

    // 验证代币地址格式
    if (attrs.tokenAddress && !this.isValidTokenAddress(attrs.tokenAddress)) {
      addError('tokenAddress', app.polyglot.t('orderFulfillmentModelErrors.invalidRwaTokenAddress'));
    }

    // 验证交易哈希格式
    if (attrs.transactionHash && !this.isValidTransactionHash(attrs.transactionHash)) {
      addError('transactionHash', app.polyglot.t('orderFulfillmentModelErrors.invalidRwaTransactionHash'));
    }

    // 验证数量格式
    if (attrs.tokenAmount && !this.isValidAmount(attrs.tokenAmount)) {
      addError('tokenAmount', app.polyglot.t('orderFulfillmentModelErrors.invalidRwaTokenAmount'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  isValidTokenAddress(address) {
    // 简单的以太坊地址格式验证
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  }

  isValidTransactionHash(hash) {
    // 简单的交易哈希格式验证
    const transactionHashRegex = /^0x[a-fA-F0-9]{64}$/;
    return transactionHashRegex.test(hash);
  }

  isValidAmount(amount) {
    // 验证数量是否为有效数字
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }
} 