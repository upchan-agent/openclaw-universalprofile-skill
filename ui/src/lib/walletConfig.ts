import { defineChain } from 'viem'

// Define LUKSO chains
export const luksoMainnet = defineChain({
  id: 42,
  name: 'LUKSO',
  nativeCurrency: { name: 'LUKSO', symbol: 'LYX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.lukso.network'] },
  },
  blockExplorers: {
    default: { name: 'LUKSO Explorer', url: 'https://explorer.execution.mainnet.lukso.network' },
  },
})

export const luksoTestnetNetwork = defineChain({
  id: 4201,
  name: 'LUKSO Testnet',
  nativeCurrency: { name: 'LUKSO Testnet', symbol: 'LYXt', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.lukso.network'] },
  },
  blockExplorers: {
    default: { name: 'LUKSO Testnet Explorer', url: 'https://explorer.execution.testnet.lukso.network' },
  },
  testnet: true,
})

export const baseNetwork = defineChain({
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
})

export const ethereumNetwork = defineChain({
  id: 1,
  name: 'Ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://eth.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
})

// All supported networks
export const networks = [luksoMainnet, baseNetwork, ethereumNetwork, luksoTestnetNetwork]
