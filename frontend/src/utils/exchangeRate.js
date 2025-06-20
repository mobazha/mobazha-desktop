import { ethers } from 'ethers';

// Chainlink 数据源配置
const CHAINLINK_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// 网络配置
const POLYGON_RPC_URL = 'https://polygon-rpc.com';

// 价格源配置
const PRICE_FEEDS = {
  USDT: {
    name: 'USDT/USD',
    address: '0x0A6513e40db6EB1b165753AD52E80663aeA50545'
  },
  USDC: {
    name: 'USDC/USD',
    address: '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7'
  },
  SOL: {
    name: 'SOL/USD',
    address: '0x10C8264C0935b3B9870013e057f330Ff3e9C56dC'
  },
  BNB: {
    name: 'BNB/USD',
    address: '0x82a6c4AF830caa6c97bb504425f6A66165C2c26e'
  },
  MATIC: {
    name: 'MATIC/USD',
    address: '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
  },
  BTC: {
    name: 'BTC/USD',
    address: '0xc907E116054Ad103354f2D350FD2514433D57F6f'
  },
  ETH: {
    name: 'ETH/USD',
    address: '0xF9680D99D6C9589e2a93a78A04A279e509205945'
  },
  BCH: {
    name: 'BCH/USD',
    address: '0x327d9822e9932996f55b39F557AEC838313da8b7'
  },
  LTC: {
    name: 'LTC/USD',
    address: '0xEB99F173cf7d9a6dC4D889C2Ad7103e8383b6Efa'
  },
  ZEC: {
    name: 'ZEC/USD',
    address: '0xBC08c639e579a391C4228F20d0C29d0690092DF0'
  },
  XMR: {
    name: 'XMR/USD',
    address: '0xBE6FB0AB6302B693368D0E9001fAF77ecc6571db'
  },
};

// 币种精度配置
const CURRENCY_DIVISIBILITY = {
  USD: 100,    // USD 精度为 2 位小数
  USDT: 100,   // USDT 精度为 2 位小数
  USDC: 100,   // USDC 精度为 2 位小数
  BTC: 100000000,  // BTC 精度为 8 位小数
  ETH: 1000000000000000000,  // ETH 精度为 18 位小数
  SOL: 1000000000,  // SOL 精度为 9 位小数
  BNB: 1000000000000000000,  // BNB 精度为 18 位小数
  MATIC: 1000000000000000000,  // MATIC 精度为 18 位小数
  BCH: 100000000,  // BCH 精度为 8 位小数
  LTC: 100000000,  // LTC 精度为 8 位小数
  ZEC: 100000000,  // ZEC 精度为 8 位小数
  XMR: 1000000000000,  // XMR 精度为 12 位小数
};

// 创建Provider的辅助函数
function createProvider() {
  return new ethers.JsonRpcProvider(POLYGON_RPC_URL);
}

// 获取单个价格源的最新价格数据
async function getPriceFeedData(provider, feedAddress) {
  try {
    const priceFeed = new ethers.Contract(feedAddress, CHAINLINK_ABI, provider);
    const roundData = await priceFeed.latestRoundData();
    const decimals = await priceFeed.decimals();
    
    // 安全转换BigInt到Number
    const answerValue = Number(roundData.answer.toString());
    const updatedAtValue = Number(roundData.updatedAt.toString());
    const decimalsValue = Number(decimals.toString());
    
    const price = answerValue / Math.pow(10, decimalsValue);
    
    return {
      price,
      updatedAt: new Date(updatedAtValue * 1000).toLocaleString(),
      roundId: roundData.roundId.toString()
    };
  } catch (error) {
    console.error(`获取价格时出错: ${error.message}`);
    return null;
  }
}

// 获取所有价格数据
async function getAllPrices() {
  try {
    console.log('正在从 Chainlink 获取加密货币价格...');
    
    // 创建 Provider
    const provider = createProvider();
    
    // 获取所有价格
    const results = {};
    for (const [symbol, feed] of Object.entries(PRICE_FEEDS)) {
      console.log(`\n获取 ${feed.name} 价格...`);
      const data = await getPriceFeedData(provider, feed.address);
      if (data) {
        results[symbol] = data;
        console.log(`${feed.name}: $${data.price.toFixed(2)}`);
        console.log(`更新时间: ${data.updatedAt}`);
        console.log(`轮次 ID: ${data.roundId}`);
      }
    }
    
    return results;
  } catch (error) {
    console.error('获取价格时出错:', error);
    return null;
  }
}

// 获取指定币种对USD的汇率
async function getExchangeRate(symbol) {
  try {
    // 检查币种是否支持
    if (!PRICE_FEEDS[symbol]) {
      throw new Error(`不支持的币种: ${symbol}`);
    }

    console.log(`正在获取 ${symbol}/USD 汇率...`);
    
    // 创建 Provider
    const provider = createProvider();
    
    // 获取价格数据
    const data = await getPriceFeedData(provider, PRICE_FEEDS[symbol].address);
    
    if (!data) {
      throw new Error(`无法获取 ${symbol} 的价格数据`);
    }
    
    return {
      symbol,
      pair: `${symbol}/USD`,
      rate: data.price,
      updatedAt: data.updatedAt,
      roundId: data.roundId
    };
  } catch (error) {
    console.error(`获取 ${symbol} 汇率时出错:`, error.message);
    throw error;
  }
}

// 汇率转换辅助方法
async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    // 如果源币种和目标币种相同，直接返回原金额
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        fromCurrency,
        toCurrency,
        rate: 1,
        success: true
      };
    }

    let fromRate, toRate;

    // 处理源币种是USD的情况
    if (fromCurrency === 'USD') {
      fromRate = 1; // USD对USD的汇率是1
    } else {
      // 获取源币种对USD的汇率
      const fromRateData = await getExchangeRate(fromCurrency);
      if (!fromRateData) {
        throw new Error(`无法获取源币种汇率数据: ${fromCurrency}`);
      }
      fromRate = fromRateData.rate;
    }

    // 处理目标币种是USD的情况
    if (toCurrency === 'USD') {
      toRate = 1; // USD对USD的汇率是1
    } else {
      // 获取目标币种对USD的汇率
      const toRateData = await getExchangeRate(toCurrency);
      if (!toRateData) {
        throw new Error(`无法获取目标币种汇率数据: ${toCurrency}`);
      }
      toRate = toRateData.rate;
    }

    // 获取币种精度
    const fromDivisibility = CURRENCY_DIVISIBILITY[fromCurrency] || 1;
    const toDivisibility = CURRENCY_DIVISIBILITY[toCurrency] || 1;

    // 计算转换后的金额（考虑精度）
    // 输入金额已经是最小精度单位，需要先转换为标准单位
    const amountInStandardUnit = amount / fromDivisibility;
    
    // 公式：转换后金额 = 标准单位金额 × (源币种汇率 ÷ 目标币种汇率)
    const convertedAmount = amountInStandardUnit * (fromRate / toRate);
    
    // 转换为最小精度单位
    const convertedAmountInSmallestUnit = Math.round(convertedAmount * toDivisibility);
    
    // 计算直接汇率（源币种对目标币种的汇率）
    const directRate = fromRate / toRate;

    return {
      originalAmount: amount,
      originalAmountInStandardUnit: amountInStandardUnit, // 标准单位金额
      convertedAmount,
      convertedAmountInSmallestUnit, // 以最小精度单位返回
      fromCurrency,
      toCurrency,
      fromRate,
      toRate,
      fromDivisibility,
      toDivisibility,
      directRate,
      success: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`汇率转换失败 (${fromCurrency} -> ${toCurrency}):`, error.message);
    return {
      originalAmount: amount,
      convertedAmount: null,
      fromCurrency,
      toCurrency,
      success: false,
      error: error.message
    };
  }
}

// 精度转换辅助方法
function convertToSmallestUnit(amount, currency) {
  const divisibility = CURRENCY_DIVISIBILITY[currency] || 1;
  return Math.round(amount * divisibility);
}

function convertFromSmallestUnit(amountInSmallestUnit, currency) {
  const divisibility = CURRENCY_DIVISIBILITY[currency] || 1;
  return amountInSmallestUnit / divisibility;
}

// 导出方法
export {
  getAllPrices,
  getExchangeRate,
  convertCurrency,
  convertToSmallestUnit,
  convertFromSmallestUnit,
  CURRENCY_DIVISIBILITY,
  PRICE_FEEDS
};
