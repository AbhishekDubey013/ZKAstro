/**
 * Deploy Solidity ChartRegistry for Benchmarking
 * Deploys the Solidity equivalent to Arbitrum Sepolia for gas comparison
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Solidity contract ABI and bytecode (compiled)
const SOLIDITY_ABI = [
  "constructor()",
  "function init() external",
  "function registerChart(string calldata chartId, bytes32 chartHash, address user, bool zkVerified) external returns (bool)",
  "function verifyChart(string calldata chartId, bytes32 chartHash) external view returns (bool)",
  "function getChartHash(string calldata chartId) external view returns (bytes32)",
  "function getChartUser(string calldata chartId) external view returns (address)",
  "function getChartTimestamp(string calldata chartId) external view returns (uint256)",
  "function isZkVerified(string calldata chartId) external view returns (bool)",
  "function markAsVerified(string calldata chartId) external returns (bool)",
  "function chartExists(string calldata chartId) external view returns (bool)",
  "function totalCharts() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function batchRegisterCharts(string[] calldata chartIds, bytes32[] calldata chartHashes, address[] calldata users, bool[] calldata zkVerifieds) external returns (uint256)",
  "event ChartCreated(string indexed chartId, bytes32 indexed chartHash, address indexed user, uint256 timestamp, bool zkVerified)",
  "event ChartVerified(string indexed chartId, bytes32 chartHash)"
];

// Compiled bytecode - we'll compile this separately
// For now, use solc to compile
async function compileSolidity(): Promise<string> {
  const { execSync } = await import('child_process');
  
  const contractPath = path.join(__dirname, '../contracts/ChartRegistrySolidity.sol');
  
  try {
    // Try to compile with solc
    console.log('Compiling Solidity contract...');
    const result = execSync(`solc --bin --optimize --optimize-runs 200 ${contractPath}`, {
      encoding: 'utf-8'
    });
    
    // Extract bytecode from output
    const lines = result.split('\n');
    const binaryIdx = lines.findIndex(l => l.includes('Binary:'));
    if (binaryIdx !== -1 && lines[binaryIdx + 1]) {
      return '0x' + lines[binaryIdx + 1].trim();
    }
  } catch (error) {
    console.log('solc not found, using pre-compiled bytecode or ethers compilation...');
  }
  
  // Fallback: Use ethers ContractFactory with source
  throw new Error('Please install solc: npm install -g solc');
}

async function main() {
  const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC;
  const PRIVATE_KEY = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  
  if (!RPC_URL || !PRIVATE_KEY) {
    console.error('Missing ARBITRUM_SEPOLIA_RPC or AGENT_DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }
  
  console.log('='.repeat(60));
  console.log('Deploying Solidity ChartRegistry for Benchmarking');
  console.log('='.repeat(60));
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`\nDeployer: ${wallet.address}`);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  
  // Get bytecode
  let bytecode: string;
  try {
    bytecode = await compileSolidity();
  } catch (error) {
    console.log('\n⚠️  Cannot compile Solidity automatically.');
    console.log('Please compile manually or use Remix/Hardhat.');
    console.log('\nAlternatively, use the pre-deployed address if available.');
    
    // Check if we have a pre-deployed address
    const preDeployed = process.env.SOLIDITY_CHART_REGISTRY_ADDRESS;
    if (preDeployed) {
      console.log(`\nUsing pre-deployed Solidity contract: ${preDeployed}`);
      return;
    }
    
    process.exit(1);
  }
  
  console.log('\nDeploying contract...');
  
  const factory = new ethers.ContractFactory(SOLIDITY_ABI, bytecode, wallet);
  
  const gasPrice = (await provider.getFeeData()).gasPrice;
  console.log(`Gas Price: ${ethers.formatUnits(gasPrice || 0, 'gwei')} gwei`);
  
  const contract = await factory.deploy({
    gasLimit: 3000000,
    gasPrice: gasPrice ? gasPrice * 2n : undefined
  });
  
  console.log(`Transaction hash: ${contract.deploymentTransaction()?.hash}`);
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`\n✅ Solidity Contract deployed to: ${address}`);
  
  // Save address
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  if (envContent.includes('SOLIDITY_CHART_REGISTRY_ADDRESS=')) {
    envContent = envContent.replace(
      /SOLIDITY_CHART_REGISTRY_ADDRESS=.*/,
      `SOLIDITY_CHART_REGISTRY_ADDRESS=${address}`
    );
  } else {
    envContent += `\nSOLIDITY_CHART_REGISTRY_ADDRESS=${address}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('Updated .env with SOLIDITY_CHART_REGISTRY_ADDRESS');
  
  console.log('\n' + '='.repeat(60));
  console.log('Deployment complete! Ready for benchmarking.');
  console.log('='.repeat(60));
}

main().catch(console.error);

