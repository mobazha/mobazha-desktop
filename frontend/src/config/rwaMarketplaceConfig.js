// RWA Marketplace配置文件
// 包含合约地址、代币配置等信息

// Sepolia测试网配置
const SEPOLIA_CONFIG = {
  rwaMarketplace: '0x196738d76a0d44f8568488819a2435E284149daA', // RWA Marketplace合约地址
  mockUSDT: '0xF36BFeE8fd7F1950c0129714Faf6d1e1F94a66AA', // 模拟USDT合约地址
  mockUSDC: '0xF36BFeE8fd7F1950c0129714Faf6d1e1F94a66AA', // 模拟USDC合约地址
  mockDAI: '0xF36BFeE8fd7F1950c0129714Faf6d1e1F94a66AA',  // 模拟DAI合约地址
};

// 主网配置（暂未部署）
const MAINNET_CONFIG = {
  rwaMarketplace: '0x0000000000000000000000000000000000000000', // 主网RWA Marketplace合约地址
  mockUSDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // 主网USDT
  mockUSDC: '0xA0b86a33E6441b8B4b0B8B4b0B8B4b0B8B4b0B8B', // 主网USDC
  mockDAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',  // 主网DAI
};

// 当前使用的网络配置
let CURRENT_NETWORK = 'sepolia'; // 或 'mainnet'

/**
 * 获取合约地址
 * @param {string} contractName 合约名称
 * @returns {string} 合约地址
 */
export function getContractAddress(contractName) {
  const config = CURRENT_NETWORK === 'mainnet' ? MAINNET_CONFIG : SEPOLIA_CONFIG;
  
  if (!config[contractName]) {
    throw new Error(`未找到合约配置: ${contractName}`);
  }
  
  return config[contractName];
}

/**
 * 获取代币配置
 * @param {string} tokenSymbol 代币符号
 * @returns {object} 代币配置
 */
export function getTokenConfig(tokenSymbol) {
  const tokenConfigs = {
    'USDT': {
      address: getContractAddress('mockUSDT'),
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD'
    },
    'USDC': {
      address: getContractAddress('mockUSDC'),
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin'
    },
    'DAI': {
      address: getContractAddress('mockDAI'),
      decimals: 18,
      symbol: 'DAI',
      name: 'Dai Stablecoin'
    },
    'ETH': {
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      symbol: 'ETH',
      name: 'Ethereum'
    }
  };
  
  return tokenConfigs[tokenSymbol] || null;
}

/**
 * 获取当前网络配置
 * @returns {object} 网络配置
 */
export function getCurrentNetworkConfig() {
  return CURRENT_NETWORK === 'mainnet' ? MAINNET_CONFIG : SEPOLIA_CONFIG;
}

/**
 * 设置当前网络
 * @param {string} network 网络名称 ('sepolia' 或 'mainnet')
 */
export function setCurrentNetwork(network) {
  if (network !== 'sepolia' && network !== 'mainnet') {
    throw new Error('不支持的网络类型');
  }
  CURRENT_NETWORK = network;
}

/**
 * 获取当前网络名称
 * @returns {string} 网络名称
 */
export function getCurrentNetwork() {
  return CURRENT_NETWORK;
} 