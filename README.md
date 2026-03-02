# 🐙 OpenClaw Universal Profile Skill

An [OpenClaw](https://openclaw.ai) skill for managing [LUKSO Universal Profiles](https://docs.lukso.tech/standards/accounts/lsp0-erc725account) — identity, permissions, tokens, and blockchain operations via direct or gasless relay transactions.

## What It Does

This skill gives your OpenClaw agent the ability to:

- **Manage Universal Profiles** — read/update profile metadata (LSP3), images, links, tags
- **On-chain social** — follow/unfollow profiles (LSP26)
- **Token operations** — send/receive LSP7 tokens, interact with LSP8 NFTs
- **Permission management** — encode/decode LSP6 KeyManager permissions, generate authorization URLs
- **Gasless transactions** — relay service integration for gas-free operations on LUKSO
- **Multi-chain** — direct execution on Base and Ethereum (controller pays gas)

## Installation

### Via ClawHub (recommended)

```
clawhub install universal-profile
```

### Manual

```
git clone https://github.com/lukso-network/openclaw-universalprofile-skill.git
cd openclaw-universalprofile-skill/skill
npm install
```

## Setup

1. **Create a Universal Profile** at [my.universalprofile.cloud](https://my.universalprofile.cloud)
2. **Generate a controller key** and authorize it using the [Authorization UI](https://openclaw.universalprofile.cloud)
3. **Store your credentials** at:

```
~/.openclaw/credentials/universal-profile-key.json
```

Or set `UP_CREDENTIALS_PATH` to a custom path.

**Credentials format:**
```json
{
  "universalProfile": {
    "address": "0x..."
  },
  "controller": {
    "address": "0x...",
    "privateKey": "0x..."
  }
}
```

## Execution Models

### Gasless Relay (LUKSO mainnet/testnet only)
```
Controller signs LSP25 → LUKSO Relay API → KeyManager.executeRelayCall() → UP
```
Requires `EXECUTE_RELAY_CALL` + `SIGN` permissions and relay quota.

### Direct (all chains — controller pays gas)
```
Controller → UP.execute(operation, target, value, data) → Target
```
Works on LUKSO, Base, and Ethereum.

## Networks

| Chain | ID | Relay |
|---|---|---|
| LUKSO Mainnet | 42 | ✅ `https://relayer.mainnet.lukso.network/api` |
| LUKSO Testnet | 4201 | ✅ `https://relayer.testnet.lukso.network/api` |
| Base | 8453 | ❌ Direct only |
| Ethereum | 1 | ❌ Direct only |

## Permission Presets

| Preset | Risk | Description |
|---|---|---|
| `read-only` | 🟢 Low | View profile data only |
| `token-operator` | 🟡 Medium | Send/receive tokens |
| `nft-trader` | 🟡 Medium | Trade NFTs |
| `defi-trader` | 🟠 High | DeFi interactions |
| `profile-manager` | 🟡 Medium | Update profile metadata |
| `full-access` | 🔴 Critical | All safe permissions (excludes DELEGATECALL, REENTRANCY) |

## Tech Stack

- **LUKSO Standards**: LSP0, LSP3, LSP6, LSP7, LSP8, LSP25, LSP26
- **Libraries**: ethers.js v6, viem v2
- **Network**: LUKSO Mainnet (42), Testnet (4201), Base (8453), Ethereum (1)

## Links

- [LUKSO Documentation](https://docs.lukso.tech)
- [OpenClaw](https://openclaw.ai)
- [Authorization UI](https://openclaw.universalprofile.cloud)
- [Full Skill Documentation](./skill/SKILL.md)

## License

MIT
