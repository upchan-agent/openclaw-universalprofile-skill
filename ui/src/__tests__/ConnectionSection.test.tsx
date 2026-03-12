import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConnectionSection } from '../components/ConnectionSection'
import type { ProfileData, ConnectionMethod } from '../hooks/useWallet'

const defaultProps = {
  isConnected: false,
  isConnecting: false,
  address: null as string | null,
  profileData: null as ProfileData | null,
  connectionMethod: null as ConnectionMethod,
  error: null as string | null,
  onConnect: vi.fn(),
  onDisconnect: vi.fn(),
}

function renderSection(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides }
  return render(<ConnectionSection {...props} />)
}

describe('ConnectionSection', () => {
  describe('disconnected state', () => {
    it('shows connect heading when disconnected', () => {
      renderSection()
      expect(screen.getByText('Connect Your Universal Profile')).toBeInTheDocument()
    })

    it('shows Connect Wallet button', () => {
      renderSection()
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })
  })

  describe('connected state', () => {
    const connectedProps = {
      isConnected: true,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      connectionMethod: 'extension' as ConnectionMethod,
    }

    it('shows Connected badge', () => {
      renderSection(connectedProps)
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })

    it('shows disconnect button', () => {
      renderSection(connectedProps)
      expect(screen.getByText('Disconnect')).toBeInTheDocument()
    })

    it('shows connection method label for extension', () => {
      renderSection({ ...connectedProps, connectionMethod: 'extension' })
      expect(screen.getByText('Extension')).toBeInTheDocument()
    })

    it('shows connection method label for WalletConnect', () => {
      renderSection({ ...connectedProps, connectionMethod: 'walletconnect' })
      expect(screen.getByText('WalletConnect')).toBeInTheDocument()
    })

    it('shows connection method label for UP Provider', () => {
      renderSection({ ...connectedProps, connectionMethod: 'up-provider' })
      expect(screen.getByText('UP Provider')).toBeInTheDocument()
    })

    it('shows truncated address', () => {
      renderSection(connectedProps)
      expect(screen.getByText('0x123456...345678')).toBeInTheDocument()
    })

    it('shows profile name when available', () => {
      renderSection({
        ...connectedProps,
        profileData: {
          address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as `0x${string}`,
          controllersCount: 3,
          profileName: 'Test Profile',
        },
      })
      expect(screen.getByText('Test Profile')).toBeInTheDocument()
    })

    it('shows "Universal Profile" when no profile name', () => {
      renderSection(connectedProps)
      expect(screen.getByText('Universal Profile')).toBeInTheDocument()
    })

    it('shows controllers count', () => {
      renderSection({
        ...connectedProps,
        profileData: {
          address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as `0x${string}`,
          controllersCount: 5,
        },
      })
      expect(screen.getByText('5 controllers')).toBeInTheDocument()
    })

    it('uses singular "controller" for count of 1', () => {
      renderSection({
        ...connectedProps,
        profileData: {
          address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as `0x${string}`,
          controllersCount: 1,
        },
      })
      expect(screen.getByText('1 controller')).toBeInTheDocument()
    })
  })

  describe('button interactions', () => {
    it('calls onConnect when connect button clicked', () => {
      const onConnect = vi.fn()
      renderSection({ onConnect })

      fireEvent.click(screen.getByText('Connect Wallet'))
      expect(onConnect).toHaveBeenCalledTimes(1)
    })

    it('calls onDisconnect when disconnect button clicked', () => {
      const onDisconnect = vi.fn()
      renderSection({
        isConnected: true,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        onDisconnect,
      })

      fireEvent.click(screen.getByText('Disconnect'))
      expect(onDisconnect).toHaveBeenCalledTimes(1)
    })

    it('disables connect button when connecting', () => {
      renderSection({ isConnecting: true })
      const button = screen.getByText('Connecting...').closest('button')
      expect(button).toBeDisabled()
    })

    it('shows spinner text when connecting', () => {
      renderSection({ isConnecting: true })
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })
  })

  describe('error display', () => {
    it('shows error message when error is present', () => {
      renderSection({ error: 'Something went wrong' })
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('does not show error section when error is null', () => {
      const { container } = renderSection({ error: null })
      expect(container.querySelector('.bg-red-100')).not.toBeInTheDocument()
    })
  })
})
