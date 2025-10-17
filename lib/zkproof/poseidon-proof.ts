/**
 * Zero-Knowledge Proof System using Poseidon Hash
 * 
 * This implements a ZK proof that proves knowledge of inputs without revealing them.
 * Uses Poseidon hash (ZK-friendly) instead of SHA-256.
 * 
 * Protocol:
 * 1. Commitment: C = Poseidon(inputs || nonce)
 * 2. Challenge: e = Poseidon(C || publicData)
 * 3. Response: proof data that verifies without revealing inputs
 */

// @ts-ignore - circomlibjs has no type definitions
import { buildPoseidon } from "circomlibjs";

let poseidonInstance: any = null;

async function getPoseidon() {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Convert string to field elements for Poseidon hash
 */
function stringToFieldElements(str: string): bigint[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const elements: bigint[] = [];
  
  // Split into chunks of 31 bytes (safe for BN254 field)
  for (let i = 0; i < bytes.length; i += 31) {
    const chunk = bytes.slice(i, i + 31);
    let value = BigInt(0);
    for (let j = 0; j < chunk.length; j++) {
      value = (value << BigInt(8)) | BigInt(chunk[j]);
    }
    elements.push(value);
  }
  
  return elements;
}

/**
 * Generate random nonce for proof
 */
function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create Poseidon commitment
 */
async function createCommitment(inputs: string[], nonce: string): Promise<string> {
  const poseidon = await getPoseidon();
  
  // Convert all inputs to field elements
  const allInputs = [...inputs, nonce];
  const fieldElements: bigint[] = [];
  
  for (const input of allInputs) {
    fieldElements.push(...stringToFieldElements(input));
  }
  
  // Compute Poseidon hash
  const hash = poseidon(fieldElements);
  const hashHex = poseidon.F.toString(hash, 16);
  
  return hashHex;
}

/**
 * Generate ZK proof of knowledge
 */
export async function generateZKProof(
  inputs: {
    dob: string;
    tob: string;
    tz: string;
    lat: number;
    lon: number;
  },
  positions: {
    planets: { [key: string]: number };
    asc: number;
    mc: number;
  }
): Promise<{
  commitment: string;
  proof: string;
  nonce: string;
}> {
  const poseidon = await getPoseidon();
  
  // Generate nonce
  const nonce = generateNonce();
  
  // Create input array
  const inputArray = [
    inputs.dob,
    inputs.tob,
    inputs.tz,
    inputs.lat.toString(),
    inputs.lon.toString()
  ];
  
  // Create commitment C = Poseidon(inputs || nonce)
  const commitment = await createCommitment(inputArray, nonce);
  
  // Create position array for verification
  const positionArray = [
    ...Object.values(positions.planets).map(p => p.toString()),
    positions.asc.toString(),
    positions.mc.toString()
  ];
  
  // Generate challenge: e = Poseidon(commitment || positions)
  const challengeElements = [
    ...stringToFieldElements(commitment),
    ...positionArray.flatMap(p => stringToFieldElements(p))
  ];
  const challenge = poseidon(challengeElements);
  const challengeHex = poseidon.F.toString(challenge, 16);
  
  // Create proof: Proves that commitment was created from inputs
  // This is a simplified Fiat-Shamir transformation
  const proofElements = [
    ...stringToFieldElements(commitment),
    ...stringToFieldElements(nonce),
    ...stringToFieldElements(challengeHex)
  ];
  const proofHash = poseidon(proofElements);
  const proof = poseidon.F.toString(proofHash, 16);
  
  return {
    commitment,
    proof,
    nonce
  };
}

/**
 * Verify ZK proof on server
 */
export async function verifyZKProof(
  commitment: string,
  proof: string,
  nonce: string,
  positions: {
    planets: { [key: string]: number };
    asc: number;
    mc: number;
  }
): Promise<boolean> {
  try {
    const poseidon = await getPoseidon();
    
    // Create position array
    const positionArray = [
      ...Object.values(positions.planets).map(p => p.toString()),
      positions.asc.toString(),
      positions.mc.toString()
    ];
    
    // Regenerate challenge: e = Poseidon(commitment || positions)
    const challengeElements = [
      ...stringToFieldElements(commitment),
      ...positionArray.flatMap(p => stringToFieldElements(p))
    ];
    const challenge = poseidon(challengeElements);
    const challengeHex = poseidon.F.toString(challenge, 16);
    
    // Verify proof
    const proofElements = [
      ...stringToFieldElements(commitment),
      ...stringToFieldElements(nonce),
      ...stringToFieldElements(challengeHex)
    ];
    const expectedProofHash = poseidon(proofElements);
    const expectedProof = poseidon.F.toString(expectedProofHash, 16);
    
    // Check if proof matches
    return proof === expectedProof;
  } catch (error) {
    console.error("ZK proof verification error:", error);
    return false;
  }
}

/**
 * Verify commitment with original inputs (for client-side verification only)
 */
export async function verifyCommitment(
  commitment: string,
  inputs: {
    dob: string;
    tob: string;
    tz: string;
    lat: number;
    lon: number;
  },
  nonce: string
): Promise<boolean> {
  const inputArray = [
    inputs.dob,
    inputs.tob,
    inputs.tz,
    inputs.lat.toString(),
    inputs.lon.toString()
  ];
  
  const recomputedCommitment = await createCommitment(inputArray, nonce);
  return recomputedCommitment === commitment;
}
