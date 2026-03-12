import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('walletConfig', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('chain configurations', () => {
    it('luksoMainnet has chain ID 42', async () => {
      const { luksoMainnet } = await import('../lib/walletConfig')
      expect(luksoMainnet.id).toBe(42)
    })

    it('luksoTestnetNetwork has chain ID 4201', async () => {
      const { luksoTestnetNetwork } = await import('../lib/walletConfig')
      expect(luksoTestnetNetwork.id).toBe(4201)
    })

    it('luksoMainnet has correct native currency', async () => {
      const { luksoMainnet } = await import('../lib/walletConfig')
      expect(luksoMainnet.nativeCurrency).toEqual({
        name: 'LUKSO',
        symbol: 'LYX',
        decimals: 18,
      })
    })

    it('luksoTestnetNetwork has correct native currency', async () => {
      const { luksoTestnetNetwork } = await import('../lib/walletConfig')
      expect(luksoTestnetNetwork.nativeCurrency).toEqual({
        name: 'LUKSO Testnet',
        symbol: 'LYXt',
        decimals: 18,
      })
    })

    it('luksoMainnet has valid RPC URL', async () => {
      const { luksoMainnet } = await import('../lib/walletConfig')
      expect(luksoMainnet.rpcUrls.default.http[0]).toMatch(/^https:\/\//)
    })

    it('luksoTestnetNetwork has valid RPC URL', async () => {
      const { luksoTestnetNetwork } = await import('../lib/walletConfig')
      expect(luksoTestnetNetwork.rpcUrls.default.http[0]).toMatch(/^https:\/\//)
    })

    it('luksoMainnet has block explorer', async () => {
      const { luksoMainnet } = await import('../lib/walletConfig')
      expect(luksoMainnet.blockExplorers?.default.url).toMatch(/^https:\/\//)
      expect(luksoMainnet.blockExplorers?.default.name).toBeTruthy()
    })

    it('luksoTestnetNetwork has block explorer', async () => {
      const { luksoTestnetNetwork } = await import('../lib/walletConfig')
      expect(luksoTestnetNetwork.blockExplorers?.default.url).toMatch(/^https:\/\//)
      expect(luksoTestnetNetwork.blockExplorers?.default.name).toBeTruthy()
    })
  })

  describe('networks array', () => {
    it('contains all supported networks', async () => {
      const { networks } = await import('../lib/walletConfig')
      expect(networks).toHaveLength(4)
      expect(networks[0].id).toBe(42)    // LUKSO
      expect(networks[1].id).toBe(8453)  // Base
      expect(networks[2].id).toBe(1)     // Ethereum
      expect(networks[3].id).toBe(4201)  // LUKSO Testnet
    })

    it('has LUKSO mainnet as first entry', async () => {
      const { networks, luksoMainnet } = await import('../lib/walletConfig')
      expect(networks[0]).toBe(luksoMainnet)
    })
  })

  describe('base and ethereum chain configurations', () => {
    it('baseNetwork has chain ID 8453', async () => {
      const { baseNetwork } = await import('../lib/walletConfig')
      expect(baseNetwork.id).toBe(8453)
    })

    it('ethereumNetwork has chain ID 1', async () => {
      const { ethereumNetwork } = await import('../lib/walletConfig')
      expect(ethereumNetwork.id).toBe(1)
    })

    it('baseNetwork has ETH native currency', async () => {
      const { baseNetwork } = await import('../lib/walletConfig')
      expect(baseNetwork.nativeCurrency).toEqual({
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      })
    })

    it('ethereumNetwork has ETH native currency', async () => {
      const { ethereumNetwork } = await import('../lib/walletConfig')
      expect(ethereumNetwork.nativeCurrency).toEqual({
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      })
    })
  })

})
