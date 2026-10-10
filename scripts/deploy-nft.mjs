import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.MST_TESTNET_RPC || 'https://testnetrpc.mstblockchain.com';
const CHAIN_ID = Number(process.env.CHAIN_ID || 91562037);
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;

if (!OPERATOR_PRIVATE_KEY) {
  console.error('OPERATOR_PRIVATE_KEY missing in .env');
  process.exit(1);
}

function findImports(importPath) {
  try {
    let fullPath = '';
    if (importPath.startsWith('@openzeppelin/')) {
      fullPath = path.resolve('node_modules', importPath);
    } else {
      fullPath = path.resolve('contracts', importPath);
    }
    const contents = fs.readFileSync(fullPath, 'utf8');
    return { contents };
  } catch (err) {
    return { error: `File not found: ${importPath} (${err.message})` };
  }
}

async function compileContract() {
  console.log('[1/4] Compiling IntraSubscriptionNFT.sol with solc...');
  const contractPath = path.resolve('contracts', 'IntraSubscriptionNFT.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'IntraSubscriptionNFT.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    const errors = output.errors.filter((e) => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:', errors);
      process.exit(1);
    }
  }

  const contractObj = output.contracts['IntraSubscriptionNFT.sol']['IntraSubscriptionNFT'];
  const abi = contractObj.abi;
  const bytecode = contractObj.evm.bytecode.object;

  console.log(`[2/4] Compilation successful! Bytecode size: ${bytecode.length / 2} bytes`);
  return { abi, bytecode };
}

async function deploy() {
  const { abi, bytecode } = await compileContract();

  console.log(`[3/4] Connecting to MST Blockchain Testnet (${RPC_URL}, chain ${CHAIN_ID})...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer Address: ${wallet.address}`);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} tMSTC`);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  console.log('[4/4] Broadcasting deployment transaction...');
  const contract = await factory.deploy(wallet.address);
  console.log(`Deployment TX: ${contract.deploymentTransaction().hash}`);
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`\n======================================================`);
  console.log(`  IntraSubscriptionNFT DEPLOYED SUCCESSFULLY!`);
  console.log(`  Contract Address: ${contractAddress}`);
  console.log(`  MST Explorer:     https://testnet.mstscan.com/address/${contractAddress}`);
  console.log(`======================================================\n`);

  // Write deployment artifact
  const artifact = {
    address: contractAddress,
    abi,
    network: 'MST Blockchain Testnet',
    chainId: CHAIN_ID,
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
    pricing: {
      free: { priceMstc: '2', quota: 15 },
      starter: { priceMstc: '3', quota: 30 },
      business: { priceMstc: '5', quota: 45 },
    },
  };

  fs.mkdirSync(path.resolve('contracts', 'deployments'), { recursive: true });
  fs.writeFileSync(
    path.resolve('contracts', 'deployments', 'IntraSubscriptionNFT.json'),
    JSON.stringify(artifact, null, 2)
  );

  console.log(`Saved deployment artifact to contracts/deployments/IntraSubscriptionNFT.json`);
}

deploy().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
