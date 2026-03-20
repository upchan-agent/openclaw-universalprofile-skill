import { type ReactNode, useEffect, useState, useRef, createContext, useContext } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, type Config } from 'wagmi'
import { createConfig, createStorage, injected } from '@wagmi/core'
import { walletConnect } from '@wagmi/connectors'
import { createClient, http } from 'viem'
import { lukso, luksoTestnet } from 'viem/chains'
import { watchAccount } from '@wagmi/core'
import { setupLuksoConnector, wagmi as wagmiService } from '@lukso/up-modal'
import type { LuksoConnector } from '@lukso/up-modal'
import { CHAINS } from '../constants'

const queryClient = new QueryClient()

/** Force-close the up-modal connect dialog via its `open` property */
function forceCloseModal() {
  const modal = document.querySelector('connect-modal') as any
  if (modal) {
    modal.open = false
  }
}

function isInIframe(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

// Context to share the LuksoConnector with hooks
const LuksoConnectorContext = createContext<LuksoConnector | null>(null)

// Context for updating the modal's target chain
const SetModalChainContext = createContext<((chainId: number) => void) | null>(null)

export function useLuksoConnector(): LuksoConnector | null {
  return useContext(LuksoConnectorContext)
}

export function useSetModalChain(): (chainId: number) => void {
  const fn = useContext(SetModalChainContext)
  return fn || (() => {})
}

/** Mark that we're actively opening the modal — so watchAccount can close it on connect */
export function markModalOpening() {
  isModalOpeningRef.current = true
}

// Track whether we're actively opening the modal (to avoid closing it on stale watchAccount events)
const isModalOpeningRef = { current: false }

/**
 * Create our own wagmi config with ALL chains (LUKSO + Ethereum + Base).
 * We pass this to setupLuksoConnector so the modal uses it instead of
 * creating its own (which only includes LUKSO chains).
 */
function createMultiChainWagmiConfig(projectId?: string): ReturnType<typeof createConfig> {
  const chains = [lukso, CHAINS.ethereum, CHAINS.base, luksoTestnet] as const

  const storage = createStorage({
    key: 'up-wagmi',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  })

  const connectors = []

  if (projectId) {
    connectors.push(
      walletConnect({
        projectId,
        showQrModal: false,
      })
    )
  }

  connectors.push(injected())

  return createConfig({
    storage,
    multiInjectedProviderDiscovery: true,
    connectors,
    chains,
    client({ chain }) {
      return createClient({ chain, transport: http() })
    },
  })
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connector, setConnector] = useState<LuksoConnector | null>(null)
  const [wagmiConfig, setWagmiConfig] = useState<Config | null>(null)
  const wagmiConfigRef = useRef<Config | null>(null)

  useEffect(() => {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

    // Create our own wagmi config with all chains
    const ourWagmiConfig = createMultiChainWagmiConfig(projectId)

    setupLuksoConnector({
      theme: 'light',
      wagmiConfig: ourWagmiConfig as any,
      ...(projectId ? { walletConnect: { projectId } } : {}),
      ...(isInIframe() ? { embeddedWallet: { enabled: true } } : {}),
      connectors: {
        eoa: false,
      },
      onConnect: (...args: any[]) => {
        console.log('[WalletProvider] onConnect fired!', args)
        isModalOpeningRef.current = false
        forceCloseModal()
      },
    }).then((c) => {
      // The connector will use our wagmiConfig since we passed it
      setConnector(c)
      wagmiConfigRef.current = c.wagmiConfig
      setWagmiConfig(c.wagmiConfig as unknown as Config)

      // Debug: log wagmi config chains
      const cfg = c.wagmiConfig as any
      console.log('[WalletProvider] wagmi config chains:', cfg.chains?.map((ch: any) => ({ id: ch.id, name: ch.name })))
      console.log('[WalletProvider] wagmi connectors:', cfg.connectors?.map((cn: any) => ({ id: cn.id, name: cn.name, type: cn.type })))

      // Watch for account changes via wagmi — close the modal when connected
      // Only close if we're actively opening the modal (isModalOpeningRef)
      watchAccount(c.wagmiConfig as any, {
        onChange(account) {
          console.log('[WalletProvider] watchAccount:', account.status, account.address, account.chainId, 'modalOpening:', isModalOpeningRef.current)
          if (account.isConnected && isModalOpeningRef.current) {
            console.log('[WalletProvider] Connection detected during modal flow, closing modal')
            isModalOpeningRef.current = false
            forceCloseModal()
          }
        },
      })
    })
  }, [])

  // Callback to update the modal's target chain before opening
  const setModalChain = useRef((chainId: number) => {
    console.log('[WalletProvider] setModalChain called:', chainId, 'wagmiConfig:', !!wagmiConfigRef.current)
    if (wagmiConfigRef.current) {
      wagmiService.configure({
        wagmiConfig: wagmiConfigRef.current,
        chainId,
        connectors: { eoa: false },
      })
    }
  })

  if (!connector || !wagmiConfig) {
    return null
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LuksoConnectorContext.Provider value={connector}>
          <SetModalChainContext.Provider value={setModalChain.current}>
            {children}
          </SetModalChainContext.Provider>
        </LuksoConnectorContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
