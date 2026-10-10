# MST Blockchain Facts & Developer Reference

Verified facts for the Zentrix platform built for the MST Blockchain × NEWRRO Buildathon.

## 1. Network Parameters

| Parameter | Value | Source |
|---|---|---|
| Network Name | MST Testnet | IDE_HANDSONPRACTICES.MD, DEPLOYONMAINNET.MD |
| RPC URL | `https://testnetrpc.mstblockchain.com` | VIBEKIT.MD, DEPLOYONMAINNET.MD |
| Chain ID | `91562037` (`0x5752035`) | VIBEKIT.MD, RPC eth_chainId query |
| Currency Symbol | `tMSTC` | IDE_HANDSONPRACTICES.MD |
| Testnet Explorer | `https://testnet.mstscan.com` | IDE_HANDSONPRACTICES.MD |
| Faucet URL | `https://faucet.masterstroke.academy` | RESOURCES.MD, BuildathonDocs.pdf |
| Mainnet Chain ID (DO NOT USE) | `4646` | DEPLOYONMAINNET.MD |
| Mainnet RPC (DO NOT USE) | `https://mariorpc.mstblockchain.com` | DEPLOYONMAINNET.MD |

## 2. Wallet & Browser Integration

- Official Wallet: **BridgeKey** (Chrome Web Store ID `bfjojdcfenehemjgjlepdjomkpginlkg`, bridgekey.io)
- Standard: EIP-1193 compatible provider (`window.ethereum` or `window.bridgekey`)
- Provider Methods:
  - `eth_requestAccounts`: Connects wallet and returns active account address
  - `wallet_switchEthereumChain`: Switches to MST Testnet (`chainId: '0x5752035'`)
  - `wallet_addEthereumChain`: Adds MST Testnet if missing
  - `personal_sign`: Cryptographic signature of authentication nonces
- Fallback: MetaMask is fully supported as an EVM fallback provider if BridgeKey is not detected.

## 3. Tooling & SDKs

- **Vibe Kit**: `@mstblockchain/mst-vibe-kit` (scaffolder CLI `create-mst-app`, monorepo packages for contracts, frontend, shared)
- **MST SDK**: `@mstblockchain/mst-sdk` (TypeScript SDK for MST blockchain interactions)
- **MCP Endpoint**: `https://mcp.mstblockchain.com/sse` (Model Context Protocol endpoint for AI agent queries)

## 4. Smart Contract Specifications

- Solidity Version: `^0.8.20`
- OpenZeppelin Contracts: `v5.0.2`
- Nonce and Signature Verification: EIP-191 / EIP-712 compatible message signatures
- Soulbound NFT Pattern: Override OpenZeppelin ERC721 `_update(to, tokenId, auth)` to revert on transfers between non-zero addresses:
  ```solidity
  function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
      address from = _ownerOf(tokenId);
      if (from != address(0) && to != address(0)) {
          revert("Soulbound: transfer not allowed");
      }
      return super._update(to, tokenId, auth);
  }
  ```
