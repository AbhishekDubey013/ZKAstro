/**
 * Test script for Stylus contract integration
 */

import { config } from 'dotenv';
config();

// Test data
const testChartRequest = {
  zkEnabled: true,
  inputsHash: "0x" + "a".repeat(64), // 32 bytes hex
  zkProof: "test_proof_" + Date.now(),
  zkSalt: "test_salt_" + Date.now(),
  params: {
    quant: "centi-deg" as const,
    zodiac: "tropical" as const,
    houseSystem: "equal" as const,
    planets: {
      sun: 8500,  // 85.00 degrees (Gemini)
      moon: 12000, // 120.00 degrees (Leo)
      mercury: 9000,
      venus: 7500,
      mars: 18000,
      jupiter: 27000,
      saturn: 30000,
    },
    retro: {
      mercury: false,
      venus: false,
      mars: false,
      jupiter: false,
      saturn: true,
    },
    asc: 4500, // 45.00 degrees (Taurus)
    mc: 13500, // 135.00 degrees (Leo)
  }
};

async function testStylusContract() {
  console.log("🧪 Testing Stylus Contract Integration\n");
  console.log("Contract Address:", process.env.CHART_REGISTRY_ADDRESS);
  console.log("");

  // 1. Create a chart via API
  console.log("1️⃣  Creating chart via API...");
  
  try {
    const response = await fetch("http://localhost:5000/api/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testChartRequest),
    });

    const data = await response.json();
    console.log("   Response:", JSON.stringify(data, null, 2));
    
    if (data.chartId) {
      console.log("\n✅ Chart created successfully!");
      console.log("   Chart ID:", data.chartId);
      
      if (data.onChainRecord) {
        console.log("\n2️⃣  On-chain record:");
        console.log("   TX Hash:", data.onChainRecord.txHash);
        console.log("   Chart Hash:", data.onChainRecord.chartHash);
        console.log("   Explorer:", data.onChainRecord.explorerUrl);
      } else {
        console.log("\n⚠️  No on-chain record (check server logs)");
      }
    } else {
      console.log("\n❌ Chart creation failed:", data.error || data.message);
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // 2. Test contract directly
  console.log("\n3️⃣  Testing contract directly...");
  
  try {
    const { ethers } = await import('ethers');
    
    const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    const contractAddress = process.env.CHART_REGISTRY_ADDRESS;
    
    if (!contractAddress) {
      console.log("   ⚠️  CHART_REGISTRY_ADDRESS not set");
      return;
    }
    
    const abi = [
      'function total_charts() external view returns (uint256)',
      'function owner() external view returns (address)',
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const totalCharts = await contract.total_charts();
    const owner = await contract.owner();
    
    console.log("   Total Charts:", totalCharts.toString());
    console.log("   Contract Owner:", owner);
    console.log("\n✅ Stylus contract is working!");
    
  } catch (error: any) {
    console.error("   ❌ Contract error:", error.message);
  }
}

testStylusContract().catch(console.error);

