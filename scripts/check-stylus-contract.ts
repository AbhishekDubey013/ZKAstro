/**
 * Check if a contract address is a Stylus contract
 * 
 * Stylus contracts can be identified by:
 * 1. WASM bytecode (different from Solidity bytecode)
 * 2. Contract code size
 * 3. Specific function selectors
 * 4. Explorer verification
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const CONTRACT_ADDRESS = process.env.FARCASTER_CONTRACT_ADDRESS || "0xfbcbb9088301cb94946ad415d7d862a583f6289d";
const ARBITRUM_SEPOLIA_RPC = process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc";

async function checkStylusContract() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║   🔍 Stylus Contract Verification 🔍                            ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log(`📡 Network: Arbitrum Sepolia`);
  console.log(`📡 RPC: ${ARBITRUM_SEPOLIA_RPC}`);
  console.log(`📍 Contract: ${CONTRACT_ADDRESS}\n`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);

  try {
    // 1. Check if contract exists
    console.log('1️⃣  Checking if contract exists...');
    const code = await provider.getCode(CONTRACT_ADDRESS);
    
    if (code === '0x') {
      console.log('❌ No contract found at this address\n');
      return;
    }
    
    console.log(`✅ Contract exists`);
    console.log(`   Code length: ${code.length} characters`);
    console.log(`   Code size: ~${Math.floor((code.length - 2) / 2)} bytes\n`);

    // 2. Check code size (Stylus contracts are typically larger)
    // Solidity contracts: usually < 50KB
    // Stylus/WASM contracts: can be 100KB+
    const codeSizeBytes = (code.length - 2) / 2;
    console.log('2️⃣  Analyzing contract size...');
    if (codeSizeBytes > 50000) {
      console.log(`⚠️  Large contract size (${codeSizeBytes} bytes)`);
      console.log(`   This could indicate a Stylus/WASM contract\n`);
    } else {
      console.log(`ℹ️  Contract size: ${codeSizeBytes} bytes`);
      console.log(`   Typical Solidity contracts are < 50KB\n`);
    }

    // 3. Check for WASM magic bytes
    // WASM files start with: 00 61 73 6D (which is "\0asm" in ASCII)
    console.log('3️⃣  Checking for WASM bytecode signature...');
    const wasmMagicBytes = '0061736d'; // "\0asm" in hex
    if (code.toLowerCase().includes(wasmMagicBytes)) {
      console.log('✅ WASM bytecode detected!');
      console.log('   This is likely a Stylus contract\n');
    } else {
      console.log('❌ No WASM magic bytes found');
      console.log('   This might be a Solidity contract\n');
    }

    // 4. Try to call contract functions
    console.log('4️⃣  Testing contract functions...');
    const contractABI = [
      "function registerUser(bytes32 commitment) external",
      "function isUserRegistered(address user) external view returns (bool)",
      "function getGlobalStats() external view returns (uint256, uint256)",
    ];

    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
    
    try {
      const [totalUsers, totalPredictions] = await contract.getGlobalStats();
      console.log('✅ Contract functions are callable');
      console.log(`   Total users: ${totalUsers.toString()}`);
      console.log(`   Total predictions: ${totalPredictions.toString()}\n`);
    } catch (error: any) {
      console.log('⚠️  Could not call contract functions');
      console.log(`   Error: ${error.message}\n`);
    }

    // 5. Check Arbitrum Sepolia explorer
    console.log('5️⃣  Explorer links:');
    console.log(`   🔗 Arbiscan: https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}`);
    console.log(`   🔗 Arbiscan (Code): https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}#code\n`);

    // 6. Check bytecode patterns
    console.log('6️⃣  Analyzing bytecode patterns...');
    const codeLower = code.toLowerCase();
    
    // Stylus contracts often have specific patterns
    // Check for common EVM opcodes vs WASM patterns
    const evmOpcodes = ['60', '80', '40', '52', '59']; // PUSH1, DUP1, ADDRESS, MSTORE, MSIZE
    const hasEVMPatterns = evmOpcodes.some(opcode => codeLower.includes(opcode));
    
    if (hasEVMPatterns && codeSizeBytes < 50000) {
      console.log('ℹ️  Bytecode contains common EVM opcodes');
      console.log('   This suggests a Solidity contract\n');
    } else if (codeSizeBytes > 50000) {
      console.log('ℹ️  Large bytecode size');
      console.log('   Could be Stylus, but need to verify on explorer\n');
    }

    // 7. Final verdict
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('📊 VERDICT:\n');
    
    const hasWasm = code.toLowerCase().includes(wasmMagicBytes);
    const isLarge = codeSizeBytes > 50000;
    
    if (hasWasm) {
      console.log('✅ This is LIKELY a Stylus contract (WASM bytecode detected)');
    } else if (isLarge) {
      console.log('⚠️  This MIGHT be a Stylus contract (large size, but no WASM signature)');
      console.log('   Check the explorer to confirm');
    } else {
      console.log('❌ This appears to be a Solidity contract');
      console.log('   (No WASM signature, typical size)');
    }
    
    console.log('\n💡 To be 100% sure:');
    console.log('   1. Visit the Arbiscan link above');
    console.log('   2. Check the "Contract" tab');
    console.log('   3. Look for "WASM" or "Stylus" indicators');
    console.log('   4. Check if bytecode starts with WASM magic bytes\n');

  } catch (error: any) {
    console.error('❌ Error checking contract:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the check
checkStylusContract().catch(console.error);


