/**
 * Agent Creation API
 * Supports both TypeScript agents (instant) and GAME framework agents (on-chain)
 */

import { Request, Response } from 'express';
import { db } from './db';
import { agents } from '../shared/schema';
import { ethers } from 'ethers';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { storage } from './storage';

// GAME SDK agent creation (when contracts are deployed)
async function createGameAgent(agentData: {
  handle: string;
  name: string;
  method: string;
  personality: string;
  aggressiveness: number;
}) {
  const factoryAddress = process.env.AGENT_FACTORY_ADDRESS;

  if (!factoryAddress || factoryAddress === '0x...') {
    // Factory not deployed yet - create TypeScript agent
    console.log('⚠️  Factory not deployed, creating TypeScript agent');
    return { type: 'typescript', contractAddress: null };
  }

  // Deploy via GAME SDK / Factory contract
  const provider = new ethers.JsonRpcProvider(
    process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'
  );
  const wallet = new ethers.Wallet(
    process.env.AGENT_DEPLOYER_PRIVATE_KEY!,
    provider
  );

  const factoryABI = [
    'function createAgent(string handle, string name, string method, uint256 aggressiveness, string personality, string metadataURI) payable returns (address)',
  ];

  const factory = new ethers.Contract(factoryAddress, factoryABI, wallet);

  try {
    // Create metadata (in production, upload to IPFS)
    const metadata = JSON.stringify({
      handle: agentData.handle,
      name: agentData.name,
      method: agentData.method,
      personality: agentData.personality,
      aggressiveness: agentData.aggressiveness,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
    });

    const metadataURI = `data:application/json;base64,${Buffer.from(metadata).toString('base64')}`;

    // Deploy agent contract
    const tx = await factory.createAgent(
      agentData.handle,
      agentData.name,
      agentData.method,
      Math.floor(agentData.aggressiveness * 1000), // Convert to basis points
      agentData.personality,
      metadataURI
    );

    console.log('🚀 Deploying agent contract...', tx.hash);
    const receipt = await tx.wait();

    // Extract agent address from event logs
    const agentAddress = receipt.logs[0]?.address || 'Unknown';

    console.log('✅ Agent deployed:', agentAddress);

    return {
      type: 'game',
      contractAddress: agentAddress,
      deploymentTx: tx.hash,
    };
  } catch (error: any) {
    console.error('❌ GAME agent deployment failed:', error.message);
    // Fallback to TypeScript agent
    return { type: 'typescript', contractAddress: null };
  }
}

// Create agent endpoint
export async function createAgentHandler(req: Request, res: Response) {
  try {
    const { handle, name, method, personality, aggressiveness } = req.body;

    // Validate
    if (!handle || !name || !method || !personality) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (!handle.startsWith('@')) {
      return res.status(400).json({ error: 'Handle must start with @' });
    }

    if (aggressiveness < 0.5 || aggressiveness > 1.5) {
      return res.status(400).json({ error: 'Aggressiveness must be 0.5-1.5' });
    }

    // Check if handle already exists
    const [existing] = await db
      .select()
      .from(agents)
      .where(eq(agents.handle, handle))
      .limit(1);

    if (existing) {
      return res.status(400).json({ error: 'Handle already taken' });
    }

    // Create agent (try GAME SDK first, fallback to TypeScript)
    const deployment = await createGameAgent({
      handle,
      name,
      method,
      personality,
      aggressiveness,
    });

    // Store in database using storage API
    const newAgent = await storage.createAgent({
      id: crypto.randomUUID(),
      handle,
      method,
      description: `${name} - ${personality}`,
      reputation: 0,
      isActive: true,
      contractAddress: deployment.contractAddress,
      deploymentTx: deployment.type === 'game' ? deployment.deploymentTx : null,
      chainId: deployment.type === 'game' ? 84532 : null,
      personality,
      aggressiveness,
    });

    console.log('✅ Agent created in database:', newAgent.handle);

    res.json({
      success: true,
      agent: newAgent,
      deploymentType: deployment.type,
      message:
        deployment.type === 'game'
          ? 'Agent deployed on-chain via GAME SDK'
          : 'Agent created as TypeScript implementation',
    });
  } catch (error: any) {
    console.error('❌ Agent creation failed:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get agent creation stats
export async function getAgentCreationStats(req: Request, res: Response) {
  try {
    const allAgents = await db.query.agents.findMany();

    const stats = {
      total: allAgents.length,
      onChain: allAgents.filter((a) => a.contractAddress).length,
      typescript: allAgents.filter((a) => !a.contractAddress).length,
      active: allAgents.filter((a) => a.isActive).length,
      totalReputation: allAgents.reduce((sum, a) => sum + (a.reputation || 0), 0),
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

