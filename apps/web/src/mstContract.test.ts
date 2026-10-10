import { describe, it, expect } from 'vitest';
import { ethers } from 'ethers';
import { ENV } from './lib/config';
import {
  INTRA_SUBSCRIPTION_NFT_ABI,
  fetchUserActiveNFT,
  MST_CHAIN_ID_DEC,
  fetchMstBalance,
} from './lib/mstWallet';

describe('MST Blockchain Testnet & IntraSubscriptionNFT Contract Verification', () => {
  const RPC_URL = ENV.MST_TESTNET_RPC;
  const CONTRACT_ADDRESS = ENV.INTRA_SUBSCRIPTION_NFT_ADDRESS;

  it('connects to MST Blockchain Testnet with Chain ID 91562037', async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    expect(Number(network.chainId)).toBe(MST_CHAIN_ID_DEC);
    expect(Number(network.chainId)).toBe(91562037);
  });

  it('confirms the deployed Soulbound ERC-721 contract exists on-chain at 0x19e2613e9eD73d970Af06Bca28E799E5de3Fa89B', async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const code = await provider.getCode(CONTRACT_ADDRESS);
    expect(code).not.toBe('0x');
    expect(code.length).toBeGreaterThan(100);
  });

  it('reads ERC-721 token metadata and contract owner from MST Testnet', async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, INTRA_SUBSCRIPTION_NFT_ABI, provider);

    const name = await contract.name();
    const symbol = await contract.symbol();
    const owner = await contract.owner();

    expect(name).toBe('Intra Resilience Subscription');
    expect(symbol).toBe('INTRASUB');
    expect(owner.toLowerCase()).toBe('0x73595081334A18D4298A160b162faB4Fb4B3c85B'.toLowerCase());
  });

  it('validates exact on-chain pricing tier enforcement (Free: 2 MSTC, Starter: 3 MSTC, Business: 5 MSTC)', async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, INTRA_SUBSCRIPTION_NFT_ABI, provider);

    const [freePriceWei, freeQuota] = await contract.getPlanPrice('free');
    expect(ethers.formatEther(freePriceWei)).toBe('2.0');
    expect(Number(freeQuota)).toBe(15);

    const [starterPriceWei, starterQuota] = await contract.getPlanPrice('starter');
    expect(ethers.formatEther(starterPriceWei)).toBe('3.0');
    expect(Number(starterQuota)).toBe(30);

    const [businessPriceWei, businessQuota] = await contract.getPlanPrice('business');
    expect(ethers.formatEther(businessPriceWei)).toBe('5.0');
    expect(Number(businessQuota)).toBe(45);
  });

  it('verifies live operator balance and static mint simulation against deployed contract', async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const operatorWallet = new ethers.Wallet(ENV.OPERATOR_PRIVATE_KEY, provider);

    const balanceStr = await fetchMstBalance(operatorWallet.address);
    expect(Number(balanceStr)).toBeGreaterThan(0);

    const contract = new ethers.Contract(CONTRACT_ADDRESS, INTRA_SUBSCRIPTION_NFT_ABI, operatorWallet);
    const simulatedTokenId = await contract.mintSubscription.staticCall(
      operatorWallet.address,
      'starter',
      { value: ethers.parseEther('3') }
    );
    expect(Number(simulatedTokenId)).toBeGreaterThan(0);
  });

  it('fetches existing active NFT subscription details for deployer address', async () => {
    const operatorAddress = '0x73595081334A18D4298A160b162faB4Fb4B3c85B';
    const activeNft = await fetchUserActiveNFT(operatorAddress);

    expect(activeNft).not.toBeNull();
    if (activeNft) {
      expect(activeNft.tokenId).toBeGreaterThan(0);
      expect(['free', 'starter', 'business']).toContain(activeNft.plan);
      expect(activeNft.nftQuota).toBeGreaterThan(0);
      expect(activeNft.tokenUri).toContain('data:application/json;base64,');
    }
  });
});
