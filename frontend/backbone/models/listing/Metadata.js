/* eslint-disable class-methods-use-this */
import is from 'is_js';
import app from '../../app';
import BaseModel from '../BaseModel';
import { isSupportedWalletCur } from '../../data/walletCurrencies';
import { getCurrencyByCode } from '../../data/currencies';
import { isValidCoinDivisibility } from '../../utils/currency';

export default class extends BaseModel {
  defaults() {
    return {
      contractType: 'PHYSICAL_GOOD',
      format: 'FIXED_PRICE', // this is not in the design at this time
      // by default, setting to "never" expire (due to a unix bug, the max is before 2038)
      expiry: (new Date(2037, 11, 31, 0, 0, 0, 0)).toISOString(),
      acceptedCurrencies: [
        ...((app && app.profile && app.profile.get('currencies')) || []),
      ],
    };
  }

  get contractTypes() {
    return [
      'PHYSICAL_GOOD',
      'DIGITAL_GOOD',
      'SERVICE',
      // 2023.12.20, temporarily disable CRYPTOCURRENCY, check if there is some request in future
      'CRYPTOCURRENCY',
      'RWA_TOKEN',
    ];
  }

  get contractTypesVerbose() {
    return this.contractTypes
      .map((contractType) => (
        {
          code: contractType,
          name: app.polyglot.t(`formats.${contractType}`),
        }
      ));
  }

  get formats() {
    return [
      'FIXED_PRICE',
      'MARKET_PRICE',
    ];
  }

  set(key, val, options = {}) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    let opts = options;

    if (typeof key === 'object') {
      attrs = key;
      opts = val || {};
    } else {
      (attrs = {})[key] = val;
    }

    return super.set(attrs, opts);
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!this.contractTypes.includes(attrs.contractType)) {
      addError('contractType', `The contract type must be one of ${this.contractTypes}.`);
    }

    if (!this.formats.includes(attrs.format)) {
      addError('format', `The format must be one of ${this.formats}.`);
    }

    const firstDayOf2038 = new Date(2038, 0, 1, 0, 0, 0, 0);

    // please provide data as ISO string (or possibly unix timestamp)
    // todo: validate date is provided in the the right format
    if (is.not.inDateRange(new Date(attrs.expiry), new Date(Date.now()), firstDayOf2038)) {
      addError('expiry', 'The expiration date must be between now and the year 2038.');
    }

    if (attrs.contractType === 'CRYPTOCURRENCY') {
      if (Array.isArray(attrs.acceptedCurrencies) && attrs.acceptedCurrencies.length > 1) {
        addError('acceptedCurrencies', 'For cryptocurrency listings, only one accepted '
          + 'currency is allowed.');
      }

      if (!attrs.cryptoListingCurrencyCode || typeof attrs.cryptoListingCurrencyCode !== 'string') {
        addError('cryptoListingCurrencyCode', 'Please provide a cryptoListingCurrencyCode.');
      }
    } else if (attrs.contractType === 'RWA_TOKEN') {
      // RWA Token支持同一个链上的多种支付币种（如USDT、USDC等）
      if (!Array.isArray(attrs.acceptedCurrencies) || attrs.acceptedCurrencies.length === 0) {
        addError('acceptedCurrencies', 'For RWA token listings, at least one accepted currency is required.');
      }

      // RWA Token 需要验证定价币种
      if (typeof attrs.pricingCurrency !== 'object') {
        addError('pricingCurrency', 'The pricingCurrency must be provided as an object for RWA token listings.');
      } else {
        if (
          !attrs.pricingCurrency.code
          || !getCurrencyByCode(attrs.pricingCurrency.code)
        ) {
          addError('pricingCurrency.code', 'The pricing currency is not one of the available ones.');
        }

        if (!isValidCoinDivisibility(attrs.pricingCurrency.divisibility)[0]) {
          addError('pricingCurrency.divisibility', 'The divisibility is not valid.');
        }
      }
    } else {
      // The ones in this block should not be user facing unless there's a dev error.
      if (typeof attrs.pricingCurrency !== 'object') {
        addError('pricingCurrency', 'The pricingCurrency must be provided as an object.');
      } else {
        if (
          !attrs.pricingCurrency.code
          || !getCurrencyByCode(attrs.pricingCurrency.code)
        ) {
          addError('pricingCurrency.code', 'The currency is not one of the available ones.');
        }

        if (!isValidCoinDivisibility(attrs.pricingCurrency.divisibility)[0]) {
          addError('pricingCurrency.divisibility', 'The divisibility is not valid.');
        }
      }
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
