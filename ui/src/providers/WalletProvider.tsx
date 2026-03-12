import { type ReactNode, useEffect, useState, createContext, useContext } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, type Config } from 'wagmi'
import { setupLuksoConnector } from '@lukso/up-modal'
import type { LuksoConnector } from '@lukso/up-modal'

const queryClient = new QueryClient()

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

export function useLuksoConnector(): LuksoConnector | null {
  return useContext(LuksoConnectorContext)
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connector, setConnector] = useState<LuksoConnector | null>(null)
  const [wagmiConfig, setWagmiConfig] = useState<Config | null>(null)

  useEffect(() => {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

    setupLuksoConnector({
      theme: 'light',
      ...(projectId ? { walletConnect: { projectId } } : {}),
      ...(isInIframe() ? { embeddedWallet: { enabled: true } } : {}),
      connectors: {
        eoa: false,
      },
    }).then((c) => {
      setConnector(c)
      setWagmiConfig(c.wagmiConfig)
    })
  }, [])

  if (!connector || !wagmiConfig) {
    return null
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LuksoConnectorContext.Provider value={connector}>
          {children}
        </LuksoConnectorContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
