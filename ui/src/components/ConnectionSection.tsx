import { formatAddress } from '../utils'
import { LuksoProfileAvatar } from './LuksoProfileAvatar'
import { getChainById } from '../constants'
import type { ProfileData, ConnectionMethod } from '../hooks/useWallet'

interface ConnectionSectionProps {
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  profileData: ProfileData | null
  connectionMethod: ConnectionMethod
  error: string | null
  chainId?: number | null
  onConnect: () => void
  onDisconnect: () => void
}

export function ConnectionSection({
  isConnected,
  isConnecting,
  address,
  profileData,
  connectionMethod,
  error,
  chainId,
  onConnect,
  onDisconnect,
}: ConnectionSectionProps) {
  // Connected state — show profile info
  if (isConnected && address) {
    const connectionLabel = connectionMethod === 'up-provider'
      ? 'UP Provider'
      : connectionMethod === 'walletconnect'
        ? 'WalletConnect'
        : connectionMethod === 'extension'
          ? 'Extension'
          : null

    return (
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Profile Avatar */}
            <LuksoProfileAvatar
              address={address}
              profileUrl={profileData?.profileImage}
              name={profileData?.profileName}
              size="xl"
              showIdenticon={true}
            />

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {profileData?.profileName || 'Universal Profile'}
                  {chainId && chainId !== 42 && chainId !== 4201 && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                      (on {getChainById(chainId)?.name ?? 'Unknown'})
                    </span>
                  )}
                </h3>
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                  Connected
                </span>
                {connectionLabel && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">
                    {connectionLabel}
                  </span>
                )}
              </div>
              <p className="address mt-1">{formatAddress(address, 6)}</p>
              {profileData && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {profileData.controllersCount} controller{profileData.controllersCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onDisconnect}
            className="btn-secondary text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  // Not connected — show single connect button
  return (
    <div className="card">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-lukso-pink/20 to-lukso-purple/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-lukso-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Connect Your Universal Profile</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Connect to authorize OpenClaw as a controller on your Universal Profile.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="btn-primary inline-flex items-center justify-center gap-2 w-full"
          >
            {isConnecting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Connect Wallet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
