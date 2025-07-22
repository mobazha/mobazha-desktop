// import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'
import {
  mainnet,
  sepolia,
  bsc,
  bscTestnet,
  polygon,
  base,
  baseSepolia,
  solana,
  solanaDevnet,
  bitcoin,
} from '@reown/appkit/networks'

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "aee7e021e1d2b5d8e9ec92a4c7e78464"
if (!projectId) {
  throw new Error('VITE_REOWN_PROJECT_ID is not set')
}

// 统一导出所有用到的网络对象
export const NETWORKS = {
  ETH: sepolia,
  BSC: bscTestnet,
  POLYGON: polygon,
  BASE: baseSepolia,
  SOL: solanaDevnet,
};

// 你支持的网络数组
export const networks = [sepolia, bscTestnet, solanaDevnet, baseSepolia];


export const ethersAdapter = new EthersAdapter();

export const solanaWeb3JsAdapter = new SolanaAdapter();

export const bitcoinAdapter = new BitcoinAdapter({
  projectId
});