import { DATA_KEYS, PERMISSIONS, PERMISSION_RISK, PERMISSION_PRESETS } from './constants'
import { 
  toHex, 
  pad,
  toFunctionSelector,
  keccak256,
  type Hex,
  type Address
} from 'viem'

/**
 * Combine multiple permissions into a single bytes32 value
 */
export function combinePermissions(permissions: (string | bigint)[]): Hex {
  let combined = 0n
  for (const perm of permissions) {
    combined |= BigInt(perm)
  }
  return pad(toHex(combined), { size: 32 })
}

/**
 * Decode a permissions bytes32 into individual permission names
 */
export function decodePermissions(permissionValue: string): string[] {
  const permissions: string[] = []
  const value = BigInt(permissionValue)
  
  for (const [name, hex] of Object.entries(PERMISSIONS)) {
    if (name === 'ALL_PERMISSIONS') continue
    if ((value & BigInt(hex)) !== 0n) {
      permissions.push(name)
    }
  }
  
  return permissions
}

/**
 * Check if a permission value includes a specific permission
 */
export function hasPermission(permissionValue: string | bigint, permission: string | bigint): boolean {
  return (BigInt(permissionValue) & BigInt(permission)) !== 0n
}

/**
 * Get the data key for a controller's permissions
 */
export function getPermissionsDataKey(controllerAddress: Address): Hex {
  const prefix = DATA_KEYS['AddressPermissions:Permissions_prefix']
  const addressBytes = controllerAddress.slice(2).toLowerCase()
  return `${prefix}${addressBytes}` as Hex
}

/**
 * Get the data key for a controller's AllowedCalls
 */
export function getAllowedCallsDataKey(controllerAddress: Address): Hex {
  const prefix = DATA_KEYS['AddressPermissions:AllowedCalls_prefix']
  const addressBytes = controllerAddress.slice(2).toLowerCase()
  return `${prefix}${addressBytes}` as Hex
}

/**
 * Get the data key for a controller's AllowedERC725YDataKeys
 */
export function getAllowedDataKeysDataKey(controllerAddress: Address): Hex {
  const prefix = DATA_KEYS['AddressPermissions:AllowedERC725YDataKeys_prefix']
  const addressBytes = controllerAddress.slice(2).toLowerCase()
  return `${prefix}${addressBytes}` as Hex
}

/**
 * Get the data key for a specific index in the AddressPermissions[] array
 */
export function getArrayIndexDataKey(index: number): Hex {
  const prefix = DATA_KEYS['AddressPermissions[]_index_prefix']
  const indexHex = pad(toHex(index), { size: 16 }).slice(2)
  return `${prefix}${indexHex}` as Hex
}

/**
 * Build the data keys and values for adding a new controller or updating an existing one
 * @param isExisting - If true, skip adding to the array (controller already exists)
 * @param emptySlotIndex - If provided and controller is new, use this empty slot instead of appending
 */
export function buildControllerData(
  controllerAddress: Address,
  permissions: Hex,
  currentLength: number,
  allowedCalls?: Hex,
  allowedDataKeys?: Hex,
  isExisting: boolean = false,
  emptySlotIndex: number | null = null
): { dataKeys: Hex[]; dataValues: Hex[] } {
  const dataKeys: Hex[] = []
  const dataValues: Hex[] = []

  // Only add to array if this is a new controller
  if (!isExisting) {
    if (emptySlotIndex !== null) {
      // Use the empty slot - no need to update array length
      // Just set the controller address at the empty slot index
      dataKeys.push(getArrayIndexDataKey(emptySlotIndex))
      dataValues.push(pad(controllerAddress, { size: 20 }))
    } else {
      // No empty slot found - append to end
      // 1. Update array length
      dataKeys.push(DATA_KEYS['AddressPermissions[]'] as Hex)
      dataValues.push(pad(toHex(currentLength + 1), { size: 16 }))

      // 2. Add controller address to array at new index
      dataKeys.push(getArrayIndexDataKey(currentLength))
      dataValues.push(pad(controllerAddress, { size: 20 }))
    }
  }

  // 3. Set permissions for controller (always do this)
  dataKeys.push(getPermissionsDataKey(controllerAddress))
  dataValues.push(permissions)

  // 4. Optionally set AllowedCalls
  if (allowedCalls) {
    dataKeys.push(getAllowedCallsDataKey(controllerAddress))
    dataValues.push(allowedCalls)
  }

  // 5. Optionally set AllowedERC725YDataKeys
  if (allowedDataKeys) {
    dataKeys.push(getAllowedDataKeysDataKey(controllerAddress))
    dataValues.push(allowedDataKeys)
  }

  return { dataKeys, dataValues }
}

/**
 * Encode AllowedCalls for a controller
 * @param calls Array of { callTypes, address, interfaceId, functionSelector }
 */
export interface AllowedCall {
  callTypes: number // Bitmap: 0x1 = CALL, 0x2 = STATICCALL, 0x4 = DELEGATECALL
  address: Address // Contract address (use 0xFFFF...FFFF for any)
  interfaceId: Hex // 4 bytes interface ID (use 0xFFFFFFFF for any)
  functionSelector: Hex // 4 bytes selector (use 0xFFFFFFFF for any)
}

export function encodeAllowedCalls(calls: AllowedCall[]): Hex {
  if (calls.length === 0) return '0x' as Hex

  // CompactBytesArray format: each entry is 2-byte length prefix (0x0020 = 32) + 32 bytes data
  // Each allowed call entry is 32 bytes:
  // - 4 bytes: call types (left-padded)
  // - 20 bytes: address
  // - 4 bytes: interface ID
  // - 4 bytes: function selector
  const encoded = calls.map(call => {
    const callTypes = pad(toHex(call.callTypes), { size: 4 }).slice(2)
    const address = call.address.toLowerCase().slice(2)
    const interfaceId = call.interfaceId.slice(2).padStart(8, '0')
    const functionSelector = call.functionSelector.slice(2).padStart(8, '0')
    // CompactBytesArray: 0x0020 prefix (32 bytes length) + 32 bytes data
    return `0020${callTypes}${address}${interfaceId}${functionSelector}`
  }).join('')

  return `0x${encoded}` as Hex
}

/**
 * Encode AllowedERC725YDataKeys
 * @param dataKeyPrefixes Array of data key prefixes to allow
 */
export function encodeAllowedDataKeys(dataKeyPrefixes: Hex[]): Hex {
  if (dataKeyPrefixes.length === 0) return '0x' as Hex

  // CompactBytesArray format: length (2 bytes) + data
  const parts = dataKeyPrefixes.map(prefix => {
    const length = (prefix.length - 2) / 2 // bytes length
    const lengthHex = pad(toHex(length), { size: 2 }).slice(2)
    return lengthHex + prefix.slice(2)
  })

  return `0x${parts.join('')}` as Hex
}

/**
 * Decode AllowedCalls from CompactBytesArray format
 * Returns an array of AllowedCall objects
 */
export function decodeAllowedCalls(data: Hex): AllowedCall[] {
  if (!data || data === '0x' || data.length < 6) return []

  const calls: AllowedCall[] = []
  let offset = 2 // skip '0x'

  while (offset < data.length) {
    // Read 2-byte length prefix
    const lengthHex = data.slice(offset, offset + 4)
    const length = parseInt(lengthHex, 16)
    offset += 4

    if (length !== 32) {
      // Unexpected length, skip
      offset += length * 2
      continue
    }

    // Read 32 bytes: 4 callTypes + 20 address + 4 interfaceId + 4 functionSelector
    const entry = data.slice(offset, offset + 64)
    const callTypes = parseInt(entry.slice(0, 8), 16)
    const address = `0x${entry.slice(8, 48)}` as Address
    const interfaceId = `0x${entry.slice(48, 56)}` as Hex
    const functionSelector = `0x${entry.slice(56, 64)}` as Hex

    calls.push({ callTypes, address, interfaceId, functionSelector })
    offset += 64
  }

  return calls
}

/**
 * Convert decoded AllowedCall[] to UI AllowedCallEntry[]
 */
export function allowedCallsToEntries(calls: AllowedCall[]): AllowedCallEntry[] {
  return calls.map((call, i) => {
    const anyAddress = call.address.toLowerCase() === '0xffffffffffffffffffffffffffffffffffffffff'
    const anyInterface = call.interfaceId === '0xffffffff'
    const anyFunction = call.functionSelector === '0xffffffff'

    return {
      id: `existing-${i}`,
      callTypes: {
        call: (call.callTypes & 1) !== 0,
        staticCall: (call.callTypes & 2) !== 0,
        delegateCall: (call.callTypes & 4) !== 0,
      },
      address: anyAddress ? '' : call.address,
      useAnyAddress: anyAddress,
      interfaceId: anyInterface ? '' : call.interfaceId,
      useAnyInterface: anyInterface,
      functionInput: anyFunction ? '' : call.functionSelector,
      useAnyFunction: anyFunction,
    }
  })
}

/**
 * Decode AllowedERC725YDataKeys from CompactBytesArray format
 * Returns an array of data key prefixes (Hex)
 */
export function decodeAllowedDataKeys(data: Hex): Hex[] {
  if (!data || data === '0x' || data.length < 6) return []

  const keys: Hex[] = []
  let offset = 2 // skip '0x'

  while (offset < data.length) {
    // Read 2-byte length prefix
    const lengthHex = data.slice(offset, offset + 4)
    const length = parseInt(lengthHex, 16)
    offset += 4

    if (length === 0 || offset + length * 2 > data.length) break

    const keyHex = `0x${data.slice(offset, offset + length * 2)}` as Hex
    keys.push(keyHex)
    offset += length * 2
  }

  return keys
}

/**
 * Convert decoded data key prefixes to UI DataKeyEntry[]
 */
export function dataKeysToEntries(keys: Hex[]): DataKeyEntry[] {
  return keys.map((key, i) => ({
    id: `existing-${i}`,
    name: '',
    key: key,
    isPreset: false,
  }))
}

/**
 * AllowedCallEntry — UI state model for a single AllowedCalls entry
 */
export interface AllowedCallEntry {
  id: string
  callTypes: { call: boolean; staticCall: boolean; delegateCall: boolean }
  address: string
  useAnyAddress: boolean
  interfaceId: string
  useAnyInterface: boolean
  functionInput: string
  useAnyFunction: boolean
}

/**
 * DataKeyEntry — UI state model for a single AllowedERC725YDataKeys entry
 */
export interface DataKeyEntry {
  id: string
  name: string
  key: string
  isPreset: boolean
}

/**
 * Compute a function selector from hex or human-readable signature
 */
export function computeSelector(input: string): Hex | null {
  if (!input || input.trim() === '') return null
  const trimmed = input.trim()
  // Already a 4-byte hex selector
  if (/^0x[a-fA-F0-9]{8}$/.test(trimmed)) {
    return trimmed.toLowerCase() as Hex
  }
  // Try to parse as function signature
  try {
    return toFunctionSelector(trimmed)
  } catch {
    return null
  }
}

/**
 * Convert UI AllowedCallEntry[] to AllowedCall[] for encoding
 */
export function convertEntriesToAllowedCalls(entries: AllowedCallEntry[]): AllowedCall[] {
  return entries.map(entry => {
    let callTypeBitmap = 0
    if (entry.callTypes.call) callTypeBitmap |= 1
    if (entry.callTypes.staticCall) callTypeBitmap |= 2
    if (entry.callTypes.delegateCall) callTypeBitmap |= 4

    const address = entry.useAnyAddress
      ? '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF' as Address
      : entry.address as Address

    const interfaceId = entry.useAnyInterface
      ? '0xFFFFFFFF' as Hex
      : (entry.interfaceId || '0xFFFFFFFF') as Hex

    const selector = entry.useAnyFunction
      ? '0xFFFFFFFF' as Hex
      : (computeSelector(entry.functionInput) || '0xFFFFFFFF') as Hex

    return { callTypes: callTypeBitmap, address, interfaceId, functionSelector: selector }
  })
}

/**
 * Validate permissions and return warnings/risks
 */
export interface PermissionValidation {
  valid: boolean
  warnings: string[]
  risks: string[]
}

export function validatePermissions(permissions: string | bigint): PermissionValidation {
  const warnings: string[] = []
  const risks: string[] = []
  const permValue = BigInt(permissions)

  for (const [name, hex] of Object.entries(PERMISSIONS)) {
    if (name === 'ALL_PERMISSIONS') continue
    if ((permValue & BigInt(hex)) !== 0n) {
      const risk = PERMISSION_RISK[name]
      if (risk === 'critical') {
        risks.push(`${name}: This is an extremely dangerous permission`)
      } else if (risk === 'high') {
        warnings.push(`${name}: This permission requires caution`)
      }
    }
  }

  return {
    valid: risks.length === 0,
    warnings,
    risks,
  }
}

/**
 * Format an address for display (truncated)
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Parse URL parameters for pre-filled values
 */
export function parseUrlParams(): {
  controllerAddress?: Address
  upAddress?: Address
  chainId?: number
  preset?: string
} {
  const params = new URLSearchParams(window.location.search)
  return {
    controllerAddress: params.get('controller') as Address | undefined,
    upAddress: params.get('up') as Address | undefined,
    chainId: params.get('chain') ? parseInt(params.get('chain')!) : undefined,
    preset: params.get('preset') || undefined,
  }
}

/**
 * Generate authorization URL with parameters
 */
export function generateAuthUrl(
  baseUrl: string,
  controllerAddress: Address,
  preset?: string,
  chainId?: number
): string {
  const params = new URLSearchParams()
  params.set('controller', controllerAddress)
  if (preset) params.set('preset', preset)
  if (chainId) params.set('chain', chainId.toString())
  return `${baseUrl}?${params.toString()}`
}

/**
 * Convert IPFS URL to HTTP gateway URL
 * Handles ipfs://, ipfs://ipfs/, and raw CIDs
 * Uses LUKSO's gateway as primary, with cloudflare-ipfs as a reliable alternative
 */
export const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs/'

export function convertIpfsUrl(url: string): string {
  if (!url) return url
  
  // Already an HTTP URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // IPFS protocol URLs
  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '').replace(/^ipfs\//, '')
    return `${IPFS_GATEWAY}${hash}`
  }
  
  // Raw IPFS hash (starts with Qm or baf)
  if (url.startsWith('Qm') || url.startsWith('baf')) {
    return `${IPFS_GATEWAY}${url}`
  }
  
  return url
}

/**
 * Fetch profile data from LUKSO's Envio indexer.
 * Returns pre-resolved HTTP URLs for profile images.
 */
const LUKSO_INDEXER = 'https://envio.lukso-mainnet.universal.tech/v1/graphql'

export async function fetchProfileFromIndexer(address: string): Promise<{
  name: string | null
  profileImageUrl: string | null
} | null> {
  const query = `
    query GetProfile($address: String!) {
      Profile(where: { id: { _eq: $address } }) {
        name
        profileImages(
          where: { error: { _is_null: true } }
          order_by: { width: asc }
        ) {
          width
          src
          url
        }
      }
    }
  `

  const response = await fetch(LUKSO_INDEXER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { address: address.toLowerCase() },
    }),
  })

  if (!response.ok) return null

  const json = await response.json()
  const profile = json?.data?.Profile?.[0]
  if (!profile) return null

  // Get best image — prefer ~200px width for medium size
  let bestImage: string | null = null
  const images = profile.profileImages || []
  if (images.length > 0) {
    // Sort by width, find closest to 200px
    const sorted = [...images].sort((a: { width: number }, b: { width: number }) => a.width - b.width)
    let best = sorted[0]
    let bestDiff = Math.abs(best.width - 200)
    for (const img of sorted) {
      const diff = Math.abs(img.width - 200)
      if (diff < bestDiff) {
        best = img
        bestDiff = diff
      }
    }
    // Prefer src (HTTP) over url (IPFS)
    const rawUrl = best.src || best.url
    if (rawUrl) {
      bestImage = rawUrl.startsWith('ipfs://')
        ? `https://api.universalprofile.cloud/image/${rawUrl.replace('ipfs://', '')}`
        : rawUrl
    }
  }

  return {
    name: profile.name || null,
    profileImageUrl: bestImage,
  }
}

/**
 * Find a preset that exactly matches the given permissions
 * Returns the preset key if found, null otherwise
 */
export function findMatchingPreset(permissions: bigint): string | null {
  for (const [key, preset] of Object.entries(PERMISSION_PRESETS)) {
    if (preset.permissions === permissions) {
      return key
    }
  }
  return null
}

/**
 * Parse permissions from a hex string (as returned from chain)
 * Returns the bigint value
 */
export function parsePermissionsHex(hex: Hex | string): bigint {
  if (!hex || hex === '0x') return 0n
  return BigInt(hex)
}

/**
 * Build a full 32-byte LSP2 Mapping key from a 12-byte prefix and an address.
 * Full key = first10bytes(keyName hash) + 0000 + last20bytes(keccak256(address))
 * The prefix already contains the first 12 bytes (10 bytes of key name hash + 2 zero bytes).
 */
export function buildMappingKey(prefix: string, address: string): Hex {
  // prefix is 12 bytes = "0x" + 24 hex chars
  const prefixClean = prefix.toLowerCase()
  // Hash the address and take last 20 bytes (40 hex chars)
  const addressHash = keccak256(address.toLowerCase() as Hex)
  const last20Bytes = addressHash.slice(-40)
  return `${prefixClean}${last20Bytes}` as Hex
}
