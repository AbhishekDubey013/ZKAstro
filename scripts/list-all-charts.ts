/**
 * List all charts in database
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const { storage } = await import('../server/storage.js');

async function main() {
  console.log('📊 All Charts in Database\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const allCharts = await storage.getAllCharts();
    
    console.log(`Total Charts: ${allCharts.length}\n`);

    allCharts.forEach((chart, index) => {
      console.log(`${index + 1}. Chart ID: ${chart.id}`);
      console.log(`   User: ${chart.userId || 'Anonymous'}`);
      console.log(`   Created: ${new Date(chart.createdAt).toLocaleString()}`);
      console.log(`   ZK Enabled: ${chart.zkEnabled ? '✅' : '❌'}`);
      console.log(`   On-Chain: ${chart.txHash ? '✅ ' + chart.txHash.substring(0, 20) + '...' : '❌ Not recorded'}`);
      console.log(`   Chain: ${chart.chain || 'Not set'}`);
      console.log('');
    });

    // Show the most recent chart details
    if (allCharts.length > 0) {
      const latest = allCharts[0];
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('📋 Most Recent Chart Details:\n');
      console.log(`   ID: ${latest.id}`);
      console.log(`   Inputs Hash: ${latest.inputsHash.substring(0, 30)}...`);
      console.log(`   ZK Proof: ${latest.zkProof ? latest.zkProof.substring(0, 30) + '...' : 'Not set'}`);
      console.log(`   ZK Salt: ${latest.zkSalt ? latest.zkSalt.substring(0, 30) + '...' : 'Not set'}`);
      
      const params = latest.paramsJson as any;
      if (params && params.planets) {
        console.log(`\n   Planetary Positions:`);
        Object.entries(params.planets).forEach(([planet, deg]: [string, any]) => {
          const degrees = deg / 100;
          const signNum = Math.floor(degrees / 30);
          const signDeg = degrees % 30;
          const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
          const sign = signs[signNum >= 0 ? signNum % 12 : (signNum % 12 + 12) % 12];
          console.log(`     ${planet.charAt(0).toUpperCase() + planet.slice(1)}: ${signDeg.toFixed(2)}° ${sign}`);
        });
        console.log(`   ASC: ${params.asc / 100}°`);
        console.log(`   MC: ${params.mc / 100}°`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);

