// 代币配置
export const tokens = [
  // // Bitcoin
  // { id: 'BTC', token: 'BTC', chain: 'BTC', isNative: true, decimals: 8, disabled: false },
  
  // 以太坊代币
  { id: 'ETH', token: 'ETH', chain: 'ETH', isNative: true, decimals: 18, disabled: false },
  { id: 'ETHUSDT', token: 'USDT', chain: 'ETH', type: 'ERC20', isNative: false, decimals: 6, disabled: false },
  { id: 'ETHUSDC', token: 'USDC', chain: 'ETH', type: 'ERC20', isNative: false, decimals: 6, disabled: false },
  { id: 'DAI', token: 'DAI', chain: 'ETH', type: 'ERC20', isNative: false, decimals: 18, disabled: false },
  
  // Solana代币
  { id: 'SOL', token: 'SOL', chain: 'SOL', isNative: true, decimals: 9, disabled: false },
  { id: 'SOLUSDT', token: 'USDT', chain: 'SOL', type: 'SPL', isNative: false, decimals: 6, disabled: false },
  { id: 'SOLUSDC', token: 'USDC', chain: 'SOL', type: 'SPL', isNative: false, decimals: 6, disabled: false },
  
  // BSC代币
  { id: 'BNB', token: 'BNB', chain: 'BSC', isNative: true, decimals: 18, disabled: false },
  { id: 'BSCUSDT', token: 'USDT', chain: 'BSC', type: 'BEP20', isNative: false, decimals: 18, disabled: false },
  { id: 'BSCUSDC', token: 'USDC', chain: 'BSC', type: 'BEP20', isNative: false, decimals: 18, disabled: false },
  
  // Base代币
  { id: 'BASEETH', token: 'ETH', chain: 'BASE', isNative: false, decimals: 18, disabled: false },
  { id: 'BASEUSDT', token: 'USDT', chain: 'BASE', type: 'Base', isNative: false, decimals: 6, disabled: false },
  { id: 'BASEUSDC', token: 'USDC', chain: 'BASE', type: 'Base', isNative: false, decimals: 6, disabled: false },
  
  // Polygon代币
  { id: 'MATIC', token: 'MATIC', chain: 'MATIC', isNative: true, decimals: 18, disabled: false },
  { id: 'MATICUSDT', token: 'USDT', chain: 'MATIC', type: 'Polygon', isNative: false, decimals: 6, disabled: false },
  { id: 'MATICUSDC', token: 'USDC', chain: 'MATIC', type: 'Polygon', isNative: false, decimals: 6, disabled: false },
  
  // // 隐私币
  // { id: 'XMR', token: 'XMR', chain: 'XMR', isNative: true, decimals: 12, disabled: false },
  // { id: 'ZEC', token: 'ZEC', chain: 'ZEC', isNative: true, decimals: 8, disabled: false }
];

// 链配置 - 参考后端 cointype.go 中的 ChainType 定义
export const chains = import.meta.env.VITE_PROD_TEST ? [
  { id: 'all', name: 'All', icon: 'ion-android-list', count: 0 },
  // { id: 'BTC', name: 'Bitcoin', iconCode: 'BTC', count: 0 },
  // { id: 'BCH', name: 'Bitcoin Cash', iconCode: 'BCH', count: 0 },
  // { id: 'LTC', name: 'Litecoin', iconCode: 'LTC', count: 0 },
  // { id: 'ZEC', name: 'ZCash', iconCode: 'ZEC', count: 0 },
  { id: 'ETH', name: 'Ethereum', iconCode: 'ETH', count: 0 },
  { id: 'SOL', name: 'Solana', iconCode: 'SOL', count: 0 },
  { id: 'BASE', name: 'Base', iconCode: 'BASE', count: 0 },
  { id: 'BSC', name: 'Binance Smart Chain', iconCode: 'BSC', count: 0 },
  // { id: 'MATIC', name: 'Polygon', iconCode: 'MATIC', count: 0 },
  // { id: 'CFX', name: 'Conflux', iconCode: 'CFX', count: 0 },
  
  // { id: 'XMR', name: 'Monero', iconCode: 'XMR', count: 0 },
  // { id: 'DASH', name: 'Dash', iconCode: 'DASH', count: 0 },
  // { id: 'privacy', name: 'Privacy Coins', icon: 'ion-ios-locked', count: 0 }
] : [
  { id: 'all', name: 'All', icon: 'ion-android-list', count: 0 },
  { id: 'BASE', name: 'Base', iconCode: 'BASE', count: 0 },
  { id: 'BSC', name: 'Binance Smart Chain', iconCode: 'BSC', count: 0 },
];

// 法币支付方式
export const fiatMethods = [
  { 
    id: 'stripe', 
    name: 'Stripe', 
    icon: 'ion-card',
    disabled: true
  },
  // { 
  //   id: 'paypal', 
  //   name: 'PayPal', 
  //   icon: 'ion-social-usd',
  //   disabled: false
  // }
];

// 根据链ID获取代币列表
export function getTokensByChain(chainId) {
  if (chainId === 'all') {
    return tokens;
  }
  return tokens.filter(token => token.chain === chainId);
}

// 根据代币ID获取代币信息
export function getTokenById(tokenId) {
  return tokens.find(token => token.id === tokenId);
}

// 获取所有链的代币数量
export function getChainTokenCounts() {
  const counts = {};
  chains.forEach(chain => {
    if (chain.id === 'all') {
      counts[chain.id] = tokens.length;
    } else {
      counts[chain.id] = tokens.filter(token => token.chain === chain.id).length;
    }
  });
  return counts;
}

// 根据代币ID获取代币精度
export function getTokenDecimals(tokenId) {
  const token = getTokenById(tokenId);
  return token ? token.decimals : 18; // 默认精度为18
}

// 检查代币是否为原生代币
export function isNativeToken(tokenId) {
  const token = getTokenById(tokenId);
  return token ? token.isNative : false;
}

// 获取指定链的所有原生代币
export function getNativeTokensByChain(chainId) {
  if (chainId === 'all') {
    return tokens.filter(token => token.isNative);
  }
  return tokens.filter(token => token.chain === chainId && token.isNative);
}

// 获取指定链的所有合约代币
export function getContractTokensByChain(chainId) {
  if (chainId === 'all') {
    return tokens.filter(token => !token.isNative);
  }
  return tokens.filter(token => token.chain === chainId && !token.isNative);
}

// 格式化代币金额（考虑精度）
export function formatTokenAmount(amount, tokenId) {
  const token = getTokenById(tokenId);
  if (!token) return amount;
  
  const decimals = token.decimals;
  const divisor = Math.pow(10, decimals);
  return (amount / divisor).toFixed(decimals);
}

// 将用户输入转换为最小单位（考虑精度）
export function parseTokenAmount(amount, tokenId) {
  const token = getTokenById(tokenId);
  if (!token) return amount;
  
  const decimals = token.decimals;
  const multiplier = Math.pow(10, decimals);
  return Math.floor(parseFloat(amount) * multiplier);
}

// 根据代币ID获取对应的网络类型
export function getNetworkTypeByTokenId(tokenId) {
  const token = getTokenById(tokenId);
  if (!token) return null;
  
  if (['ETH', 'BSC', 'BASE', 'MATIC'].includes(token.chain)) {
    return 'ethereum';
  } else if (token.chain === 'SOL') {
    return 'solana';
  }
  return null;
}
