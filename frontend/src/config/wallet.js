import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'
import { mainnet, bsc, polygon, base, solana, bitcoin } from '@reown/appkit/networks'

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "aee7e021e1d2b5d8e9ec92a4c7e78464"
if (!projectId) {
  throw new Error('VITE_REOWN_PROJECT_ID is not set')
}

export const networks = [mainnet, bsc, base, polygon, solana, bitcoin];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId
});

export const solanaWeb3JsAdapter = new SolanaAdapter();

export const bitcoinAdapter = new BitcoinAdapter({
  projectId
});