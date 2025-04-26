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
// 创建 Provider
const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC_URL);

// 价格源配置
export const PRICE_FEEDS = {
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

// 获取单个价格源的最新价格数据
export async function getPriceFeedData(feedAddress) {
  try {
    const priceFeed = new ethers.Contract(feedAddress, CHAINLINK_ABI, provider);
    const roundData = await priceFeed.latestRoundData();
    const decimals = await priceFeed.decimals();
    const price = roundData.answer.toNumber() / Math.pow(10, decimals);
    
    return {
      price,
      updatedAt: new Date(roundData.updatedAt.toNumber() * 1000).toLocaleString(),
      roundId: roundData.roundId.toString()
    };
  } catch (error) {
    console.error(`获取价格时出错: ${error.message}`);
    return null;
  }
}
