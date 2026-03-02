# 🐙 OpenClaw Universal Profile Skill

An [OpenClaw](https://openclaw.ai) skill for managing [LUKSO Universal Profiles](https://docs.lukso.tech/standards/accounts/lsp0-erc725account) — identity, permissions, tokens, and blockchain operations via direct or gasless relay transactions. Multi-chain support for LUKSO, Base, and Ethereum.

## What It Does

This skill gives your OpenClaw agent the ability to:

- **Manage Universal Profiles** — read/update profile metadata (LSP3), images, links, tags
- **On-chain social** — follow/unfollow profiles (LSP26), react to content
- **Token operations** — send/receive LSP7 tokens, interact with LSP8 NFTs
- **Permission management** — encode/decode LSP6 KeyManager permissions, generate authorization URLs
- **Gasless transactions** — relay service integration for gas-free operations on LUKSO
- **Multi-chain execution** — direct execution on LUKSO, Base, and Ethereum
- **IPFS pinning** — pin metadata to IPFS before setting on-chain

## Installation

### Via ClawHub (recommended)

```bash
clawhub install universal-profile
```

### Manual

```bash
git clone https://github.com/lukso-network/openclaw-universalprofile-skill.git
cd openclaw-universalprofile-skill/skill
npm install
```

## Setup

1. **Create a Universal Profile** at [my.universalprofile.cloud](https://my.universalprofile.cloud)
2. **Generate a controller key** and authorize it using the [Authorization UI](https://openclaw.universalprofile.cloud)
3. **Configure the skill:**

```bash
up profile configure <your-up-address> --chain lukso
```

4. **Store your controller key** — choose one method:

**Option A: macOS Keychain (recommended on macOS):**

```bash
security add-generic-password \
  -a "<controller-address>" \
  -s "universalprofile-controller" \
  -l "UP Controller Key" \
  -D "Ethereum Private Key" \
  -w "<private-key>" \
  -T /usr/bin/security -U
```

**Option B: JSON credentials file:**

Save to `~/.openclaw/credentials/universal-profile-key.json`:

```json
{
  "universalProfile": {
    "address": "0xYourUniversalProfileAddress"
  },
  "controller": {
    "address": "0xYourControllerAddress",
    "privateKey": "0xYourPrivateKey"
  }
}
```

Then lock down permissions:

```bash
chmod 600 ~/.openclaw/credentials/universal-profile-key.json
```

## Execution Models

### Gasless Relay (LUKSO only — chains 42/4201)

```
Controller signs LSP25 → Relay API submits → KeyManager.executeRelayCall() → UP
```

The controller signs a message and the LUKSO relay service submits the transaction on-chain. Gas is paid from the UP's relay quota. **Only available on LUKSO mainnet and testnet.**

### Direct Execution (all chains — controller pays gas)

```
Controller → UP.execute(operation, target, value, data) → Target
```

The controller calls `execute()` directly on the UP contract. The controller must hold native tokens (LYX/ETH) to pay gas.

Typical gas costs: LUKSO ~free via relay, Base ~$0.001-0.01/tx, Ethereum ~$0.10-1.00/tx.

## Networks

| Chain | ID | RPC | Explorer | Relay | Token |
|---|---|---|---|---|---|
| LUKSO | 42 | `https://42.rpc.thirdweb.com` | `https://explorer.lukso.network` | `https://relayer.mainnet.lukso.network/api` | LYX |
| LUKSO Testnet | 4201 | `https://rpc.testnet.lukso.network` | `https://explorer.testnet.lukso.network` | `https://relayer.testnet.lukso.network/api` | LYXt |
| Base | 8453 | `https://mainnet.base.org` | `https://basescan.org` | — | ETH |
| Ethereum | 1 | `https://eth.llamarpc.com` | `https://etherscan.io` | — | ETH |

## CLI Commands

| Command | Description |
|---------|-------------|
| `up status` | Config, keys, connectivity check |
| `up profile info [address]` | View profile details |
| `up profile configure <address>` | Save UP address for use |
| `up key generate [--save]` | Generate controller keypair |
| `up permissions encode <perms>` | Encode permissions to bytes32 |
| `up permissions decode <hex>` | Decode permissions to names |
| `up permissions presets` | List available permission presets |
| `up authorize url` | Generate authorization URL |
| `up quota` | Check relay gas quota |

### Permission Presets

| Preset | Risk | Description |
|--------|------|-------------|
| `read-only` | 🟢 Low | View profile data only |
| `token-operator` | 🟡 Medium | Send/receive tokens |
| `nft-trader` | 🟡 Medium | Trade NFTs |
| `defi-trader` | 🟠 High | DeFi interactions |
| `profile-manager` | 🟡 Medium | Update profile metadata |
| `full-access` | 🔴 Critical | All permissions except DELEGATECALL and REENTRANCY |

## Credentials

The skill looks for credentials in this order:

1. `UP_CREDENTIALS_PATH` environment variable
2. `~/.openclaw/universal-profile/config.json`
3. `~/.clawdbot/universal-profile/config.json` (legacy)

Key files: `UP_KEY_PATH` env → `~/.openclaw/credentials/universal-profile-key.json` → `~/.clawdbot/credentials/universal-profile-key.json` (legacy)

### Previous Installations (Legacy Paths)

If you previously used `.clawdbot` paths, they still work — the skill checks both locations. The recommended path going forward is `~/.openclaw/`. You can migrate at your convenience:

```bash
mv ~/.clawdbot/universal-profile ~/.openclaw/universal-profile
mv ~/.clawdbot/credentials ~/.openclaw/credentials
```

## Tech Stack

- **LUKSO Standards**: LSP0 (ERC725Account), LSP2 (ERC725YJSONSchema), LSP3 (Profile Metadata), LSP6 (KeyManager), LSP7 (Digital Asset), LSP8 (Identifiable Digital Asset), LSP26 (Follower System)
- **Libraries**: ethers.js v6, viem v2
- **Networks**: LUKSO Mainnet (42), LUKSO Testnet (4201), Base (8453), Ethereum (1)

## Links

- [LUKSO Documentation](https://docs.lukso.tech)
- [LSP Standards](https://docs.lukso.tech/standards/introduction)
- [Universal Everything](https://universaleverything.io)
- [OpenClaw](https://openclaw.ai)
- [ClawHub](https://clawhub.com)

## License

MIT
