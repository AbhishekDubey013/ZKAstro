/**
 * Verify chart registration transaction
 */

import { ethers } from 'ethers';
import { config } from 'dotenv';
config();

const TX_HASH = '0xfa4b26115f50bdc3f36c7ebc463a8e67c4f5bf371ddf3e99f8c8f2cae3c20fa7';

async function verifyTransaction() {
  console.log('🔍 Verifying Chart Registration Transaction\n');
  console.log('TX Hash:', TX_HASH);
  console.log('');

  const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
  const contractAddress = process.env.CHART_REGISTRY_ADDRESS;

  try {
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(TX_HASH);

    if (!receipt) {
      console.log('⏳ Transaction not found (may still be pending)');
      console.log('   Check: https://sepolia.arbiscan.io/tx/' + TX_HASH);
      return;
    }

    console.log('✅ Transaction Confirmed!\n');
    console.log('Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed');
    console.log('Block Number:', receipt.blockNumber.toString());
    console.log('Gas Used:', receipt.gasUsed.toString());
    console.log('From:', receipt.from);
    console.log('To:', receipt.to);
    console.log('');

    // Get transaction details
    const tx = await provider.getTransaction(TX_HASH);
    if (tx) {
      console.log('Transaction Details:');
      console.log('   Value:', ethers.formatEther(tx.value || 0), 'ETH');
      if (tx.gasPrice) {
        console.log('   Gas Price:', ethers.formatUnits(tx.gasPrice, 'gwei'), 'gwei');
      }
      console.log('');
    }

    // Check if it's our contract
    if (receipt.to && receipt.to.toLowerCase() === contractAddress?.toLowerCase()) {
      console.log('📝 ChartRegistry Transaction Detected!\n');
      console.log('Contract:', contractAddress);
      console.log('');

      // Decode the function call
      const abi = [
        'function registerChart(string chartId, bytes32 chartHash, address user, bool zkVerified) external returns (bool)',
      ];

      try {
        const iface = new ethers.Interface(abi);
        const decoded = iface.parseTransaction({ data: tx.data });

        if (decoded) {
          console.log('Function Called: registerChart\n');
          console.log('Arguments:');
          console.log('   Chart ID:', decoded.args[0]);
          console.log('   Chart Hash:', decoded.args[1]);
          console.log('   User Address:', decoded.args[2]);
          console.log('   ZK Verified:', decoded.args[3] ? '✅ Yes' : '❌ No');
          console.log('');

          // Verify chart exists on-chain
          const contractABI = [
            'function chartExists(string chartId) external view returns (bool)',
            'function getChartHash(string chartId) external view returns (bytes32)',
            'function getChartUser(string chartId) external view returns (address)',
            'function getChartTimestamp(string chartId) external view returns (uint256)',
            'function isZkVerified(string chartId) external view returns (bool)',
          ];

          const contract = new ethers.Contract(contractAddress!, contractABI, provider);

          const exists = await contract.chartExists(decoded.args[0]);
          if (exists) {
            console.log('✅ Chart Verified On-Chain!\n');
            
            const [hash, user, timestamp, zkVerified] = await Promise.all([
              contract.getChartHash(decoded.args[0]),
              contract.getChartUser(decoded.args[0]),
              contract.getChartTimestamp(decoded.args[0]),
              contract.isZkVerified(decoded.args[0]),
            ]);

            console.log('On-Chain Data:');
            console.log('   Chart Hash:', hash);
            console.log('   User:', user);
            console.log('   Timestamp:', new Date(Number(timestamp) * 1000).toLocaleString());
            console.log('   ZK Verified:', zkVerified ? '✅ Yes' : '❌ No');
            console.log('');

            // Verify hash matches
            if (decoded.args[1].toLowerCase() === hash.toLowerCase()) {
              console.log('✅ Hash matches transaction data!');
            } else {
              console.log('⚠️  Hash mismatch');
            }
          } else {
            console.log('❌ Chart not found on-chain');
          }
        }
      } catch (e: any) {
        console.log('Could not decode transaction:', e.message);
      }
    } else {
      console.log('⚠️  This transaction is not to the ChartRegistry contract');
    }

    console.log('\n🔗 View on Arbiscan:');
    console.log('   https://sepolia.arbiscan.io/tx/' + TX_HASH);
    console.log('\n📊 Contract Address:');
    console.log('   https://sepolia.arbiscan.io/address/' + contractAddress);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

verifyTransaction().catch(console.error);

