import { ethers } from 'ethers';
import { ENV } from './config';
import { saveUserProfile } from './firebase';
import { computeSha256 } from './crypto';

export interface WalletState {
  address: string;
  balance: string;
  chainId: number;
  providerType: 'bridgekey-extension' | 'bridgekey-operator';
  signature?: string;
  mappedAt?: string;
}

export const MST_CHAIN_ID_HEX = '0x5752035'; // 91562037 in hex
export const MST_CHAIN_ID_DEC = 91562037;

export async function fetchMstBalance(address: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(ENV.MST_TESTNET_RPC);
  const balanceWei = await provider.getBalance(address);
  const formatted = ethers.formatEther(balanceWei);
  return Number(formatted).toFixed(4);
}

export async function fetchMstBlockNumber(): Promise<number> {
  const provider = new ethers.JsonRpcProvider(ENV.MST_TESTNET_RPC);
  return await provider.getBlockNumber();
}

export async function verifyMstTransactionHash(txHash: string): Promise<{
  confirmed: boolean;
  blockNumber: number;
  from: string;
  to: string | null;
  value: string;
  status: number | null;
}> {
  const provider = new ethers.JsonRpcProvider(ENV.MST_TESTNET_RPC);
  const tx = await provider.getTransaction(txHash);
  if (!tx) {
    throw new Error(`Transaction ${txHash} not found on MST Blockchain Testnet (Chain ID ${MST_CHAIN_ID_DEC})`);
  }
  const receipt = await provider.getTransactionReceipt(txHash);
  return {
    confirmed: !!receipt,
    blockNumber: tx.blockNumber || (receipt?.blockNumber ?? 0),
    from: tx.from,
    to: tx.to,
    value: ethers.formatEther(tx.value),
    status: receipt ? receipt.status : null,
  };
}

// Connect BridgeKey Web3 Wallet (MST Blockchain)
export async function connectBridgeKeyWallet(): Promise<WalletState> {
  const providerObj = (window as any).bridgekey || (window as any).mst || (window as any).ethereum;
  if (!providerObj) {
    throw new Error('BridgeKey Wallet not detected. Please install or open BridgeKey Wallet for MST Blockchain.');
  }

  const browserProvider = new ethers.BrowserProvider(providerObj);
  const accounts: string[] = await browserProvider.send('eth_requestAccounts', []);
  if (!accounts || accounts.length === 0) {
    throw new Error('No BridgeKey accounts selected.');
  }

  const address = ethers.getAddress(accounts[0]);

  // Attempt to switch or add MST Blockchain network (Chain ID 91562037)
  try {
    await providerObj.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MST_CHAIN_ID_HEX }],
    });
  } catch (switchErr: any) {
    if (switchErr?.code === 4902 || switchErr?.message?.includes('4902')) {
      try {
        await providerObj.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: MST_CHAIN_ID_HEX,
              chainName: 'MST Blockchain Testnet',
              rpcUrls: [ENV.MST_TESTNET_RPC],
              nativeCurrency: { name: 'MST Token', symbol: 'MST', decimals: 18 },
              blockExplorerUrls: ['https://testnet.mstscan.com'],
            },
          ],
        });
      } catch (addErr) {
        console.warn('Could not auto-add MST network to BridgeKey wallet:', addErr);
      }
    }
  }

  const balance = await fetchMstBalance(address);

  return {
    address,
    balance,
    chainId: MST_CHAIN_ID_DEC,
    providerType: 'bridgekey-extension',
  };
}

// Connect BridgeKey Operator Session using verified MST Keypair
export async function connectBridgeKeyOperatorSession(): Promise<WalletState> {
  const wallet = new ethers.Wallet(ENV.OPERATOR_PRIVATE_KEY);
  const address = wallet.address;
  const balance = await fetchMstBalance(address);

  return {
    address,
    balance,
    chainId: MST_CHAIN_ID_DEC,
    providerType: 'bridgekey-operator',
  };
}

// Compatibility aliases
export const connectBrowserWallet = connectBridgeKeyWallet;
export const connectOperatorWallet = connectBridgeKeyOperatorSession;

export async function signIdentityChallenge(
  walletState: WalletState,
  uid: string
): Promise<{ signature: string; challenge: string; checksum: string }> {
  const timestamp = new Date().toISOString();
  const challenge = `Intra BridgeKey Identity Verification\nBridgeKey Wallet: ${walletState.address}\nFirebase UID: ${uid}\nChain ID: ${MST_CHAIN_ID_DEC}\nTimestamp: ${timestamp}`;

  let signature = '';
  const providerObj = (window as any).bridgekey || (window as any).mst || (window as any).ethereum;

  if (walletState.providerType === 'bridgekey-extension' && providerObj) {
    const browserProvider = new ethers.BrowserProvider(providerObj);
    const signer = await browserProvider.getSigner();
    signature = await signer.signMessage(challenge);
  } else {
    const operatorWallet = new ethers.Wallet(ENV.OPERATOR_PRIVATE_KEY);
    signature = await operatorWallet.signMessage(challenge);
  }

  // Calculate SHA-256 Checksum for structured ledger audit
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(`${challenge}|${signature}`));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  console.log(`[INTRA LEDGER CHECKSUM] sha256:${checksum} (event: bridgekey_wallet_linked, address: ${walletState.address}, uid: ${uid}, chain: ${MST_CHAIN_ID_DEC})`);

  return { signature, challenge, checksum };
}

export async function mapWalletToFirebase(
  uid: string,
  idToken: string,
  walletState: WalletState,
  plan: string,
  nfts: number,
  signature: string
): Promise<void> {
  const mappedAt = new Date().toISOString();
  const payload = {
    uid,
    walletAddress: walletState.address,
    walletSignature: signature,
    mstBalance: walletState.balance,
    chainId: MST_CHAIN_ID_DEC,
    plan,
    nfts,
    mappedAt,
  };

  await saveUserProfile(uid, idToken, payload);
}

export const INTRA_SUBSCRIPTION_NFT_ABI = [
  'function mintSubscription(address recipient, string calldata plan) external payable returns (uint256)',
  'function getPlanPrice(string memory plan) public pure returns (uint256 priceWei, uint256 quota)',
  'function subscriptions(uint256 tokenId) external view returns (string plan, uint256 nftQuota, uint256 mintedAt, uint256 pricePaid)',
  'function userActiveTokenId(address user) external view returns (uint256)',
  'function hasActiveSubscription(address user) external view returns (bool)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function owner() external view returns (address)',
  'event SubscriptionMinted(address indexed recipient, uint256 indexed tokenId, string plan, uint256 nftQuota, uint256 pricePaid)'
];

export interface ActiveNFTInfo {
  tokenId: number;
  plan: string;
  nftQuota: number;
  mintedAt: number;
  pricePaidMstc: string;
  tokenUri: string;
  svgImage?: string;
}

export async function fetchUserActiveNFT(address: string): Promise<ActiveNFTInfo | null> {
  if (!address || !ethers.isAddress(address)) return null;
  try {
    const provider = new ethers.JsonRpcProvider(ENV.MST_TESTNET_RPC);
    const contract = new ethers.Contract(ENV.INTRA_SUBSCRIPTION_NFT_ADDRESS, INTRA_SUBSCRIPTION_NFT_ABI, provider);
    const hasSub = await contract.hasActiveSubscription(address);
    if (!hasSub) return null;
    const rawTokenId = await contract.userActiveTokenId(address);
    const tokenId = Number(rawTokenId);
    if (!tokenId) return null;

    const sub = await contract.subscriptions(tokenId);
    const uri = await contract.tokenURI(tokenId);
    let svgImage = '';
    try {
      const base64Json = uri.replace('data:application/json;base64,', '');
      const parsed = JSON.parse(atob(base64Json));
      svgImage = parsed.image || '';
    } catch {
      // ignore
    }

    return {
      tokenId,
      plan: sub[0] || 'free',
      nftQuota: Number(sub[1] || 15),
      mintedAt: Number(sub[2] || 0),
      pricePaidMstc: ethers.formatEther(sub[3] || 0n),
      tokenUri: uri,
      svgImage,
    };
  } catch (err) {
    console.warn('Could not fetch active subscription NFT for', address, err);
    return null;
  }
}

export interface PlanPurchaseResult {
  txHash: string;
  plan: 'free' | 'starter' | 'business';
  nfts: number;
  amountMstc: string;
  fromAddress: string;
  checksum: string;
  timestamp: string;
  tokenId: number;
  tokenUri: string;
}

export async function purchasePlanWithMstc(
  walletState: WalletState,
  plan: 'free' | 'starter' | 'business',
  amountMstc: string,
  userUid: string,
  idToken: string
): Promise<PlanPurchaseResult> {
  const nfts = plan === 'free' ? 15 : plan === 'starter' ? 30 : 45;
  const timestamp = new Date().toISOString();
  let txHash = '';
  const provider = new ethers.JsonRpcProvider(ENV.MST_TESTNET_RPC);
  const providerObj = (window as any).bridgekey || (window as any).mst || (window as any).ethereum;

  let receipt: any = null;
  let tokenId = 0;
  let tokenUri = '';

  // Execute on-chain mint on live deployed IntraSubscriptionNFT contract
  if (walletState.providerType === 'bridgekey-extension' && providerObj) {
    const browserProvider = new ethers.BrowserProvider(providerObj);
    const signer = await browserProvider.getSigner();
    const nftContract = new ethers.Contract(ENV.INTRA_SUBSCRIPTION_NFT_ADDRESS, INTRA_SUBSCRIPTION_NFT_ABI, signer);
    const tx = await nftContract.mintSubscription(walletState.address, plan, {
      value: ethers.parseEther(amountMstc),
    });
    txHash = tx.hash;
    receipt = await tx.wait(1);
    if (receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const parsed = nftContract.interface.parseLog(log);
          if (parsed && parsed.name === 'SubscriptionMinted') {
            tokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch {}
      }
    }
  } else {
    // Direct operator broadcast on MST Blockchain Testnet
    const operatorWallet = new ethers.Wallet(ENV.OPERATOR_PRIVATE_KEY, provider);
    const nftContract = new ethers.Contract(ENV.INTRA_SUBSCRIPTION_NFT_ADDRESS, INTRA_SUBSCRIPTION_NFT_ABI, operatorWallet);
    const tx = await nftContract.mintSubscription(walletState.address, plan, {
      value: ethers.parseEther(amountMstc),
    });
    txHash = tx.hash;
    receipt = await tx.wait(1);
    if (receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const parsed = nftContract.interface.parseLog(log);
          if (parsed && parsed.name === 'SubscriptionMinted') {
            tokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch {}
      }
    }
  }

  // Verify on-chain transaction receipt directly against MST Testnet RPC
  await verifyMstTransactionHash(txHash);

  // Read minted NFT tokenId and metadata directly from the blockchain
  const readContract = new ethers.Contract(ENV.INTRA_SUBSCRIPTION_NFT_ADDRESS, INTRA_SUBSCRIPTION_NFT_ABI, provider);
  if (!tokenId) {
    try {
      const rawTokenId = await readContract.userActiveTokenId(walletState.address);
      tokenId = Number(rawTokenId);
    } catch (err) {
      console.warn('Could not read userActiveTokenId:', err);
    }
  }

  if (tokenId > 0) {
    try {
      tokenUri = await readContract.tokenURI(tokenId);
    } catch (err) {
      console.warn('Could not read minted NFT metadata:', err);
    }
  }

  // Calculate genuine cryptographic SHA-256 seal for ledger audit
  const sealPayload = `${txHash}|${plan}|${amountMstc}|${userUid}|${walletState.address}|${tokenId}|${timestamp}`;
  const checksum = await computeSha256(sealPayload);

  // Update Firebase profile with new tier, NFT rate limits, and on-chain token reference
  const updatedBalance = await fetchMstBalance(walletState.address);
  await saveUserProfile(userUid, idToken, {
    uid: userUid,
    walletAddress: walletState.address,
    plan,
    nfts,
    mstBalance: updatedBalance,
    lastPurchaseTx: txHash,
    lastPurchaseChecksum: checksum,
    lastPurchaseAt: timestamp,
    activeTokenId: tokenId,
    activeTokenUri: tokenUri,
  });

  console.log(
    `[INTRA LEDGER CHECKSUM] sha256:${checksum} (event: nft_subscription_minted, plan: ${plan}, amount: ${amountMstc} MSTC, tokenId: ${tokenId}, tx: ${txHash}, wallet: ${walletState.address})`
  );

  return {
    txHash,
    plan,
    nfts,
    amountMstc,
    fromAddress: walletState.address,
    checksum,
    timestamp,
    tokenId,
    tokenUri,
  };
}

