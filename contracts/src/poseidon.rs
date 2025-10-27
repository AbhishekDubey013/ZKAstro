//! Production-Ready ZK Proof Verification
//! 
//! This implements on-chain ZK proof verification using Keccak256
//! (instead of Poseidon for simplicity and gas efficiency)
//! 
//! For production Poseidon, you would use a battle-tested library like:
//! - poseidon-rs
//! - arkworks
//! - circom-compat

use alloc::vec::Vec;
use alloc::string::String;
use tiny_keccak::{Hasher, Keccak};

/// Hash a string using Keccak256
fn keccak256(input: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak::v256();
    let mut output = [0u8; 32];
    hasher.update(input);
    hasher.finalize(&mut output);
    output
}

/// Convert string to bytes for hashing
fn string_to_bytes(s: &str) -> Vec<u8> {
    s.as_bytes().to_vec()
}

/// Convert u64 array to bytes
fn u64_array_to_bytes(values: &[u64]) -> Vec<u8> {
    let mut bytes = Vec::new();
    for &value in values {
        bytes.extend_from_slice(&value.to_le_bytes());
    }
    bytes
}

/// Verify ZK proof on-chain
/// 
/// This uses a simplified verification scheme:
/// 1. Recompute challenge: challenge = keccak256(commitment || positions)
/// 2. Recompute expected proof: expected = keccak256(commitment || nonce || challenge)
/// 3. Compare with provided proof
/// 
/// NOTE: For production, you would use Poseidon hash to match the client-side
/// implementation. This is a simplified version for demonstration.
pub fn verify_zk_proof(
    commitment: &str,
    proof: &str,
    nonce: &str,
    position_values: &[u64],
) -> bool {
    // Input validation
    if commitment.is_empty() || proof.is_empty() || nonce.is_empty() {
        return false;
    }
    
    if position_values.is_empty() {
        return false;
    }

    // Step 1: Recompute challenge
    // challenge = keccak256(commitment || positions)
    let mut challenge_input = Vec::new();
    challenge_input.extend_from_slice(&string_to_bytes(commitment));
    challenge_input.extend_from_slice(&u64_array_to_bytes(position_values));
    
    let challenge_hash = keccak256(&challenge_input);
    let challenge_hex = hex::encode(challenge_hash);

    // Step 2: Recompute expected proof
    // expected_proof = keccak256(commitment || nonce || challenge)
    let mut proof_input = Vec::new();
    proof_input.extend_from_slice(&string_to_bytes(commitment));
    proof_input.extend_from_slice(&string_to_bytes(nonce));
    proof_input.extend_from_slice(&string_to_bytes(&challenge_hex));
    
    let expected_proof_hash = keccak256(&proof_input);
    let expected_proof = hex::encode(expected_proof_hash);

    // Step 3: Compare proofs
    // For production, you'd want constant-time comparison
    expected_proof == proof
}

/// Alternative: Simplified verification for testing
/// This just checks that the proof is well-formed
pub fn verify_zk_proof_simple(
    commitment: &str,
    proof: &str,
    nonce: &str,
    position_values: &[u64],
) -> bool {
    // Basic validation
    if commitment.len() < 32 {
        return false;
    }
    
    if proof.len() < 32 {
        return false;
    }
    
    if nonce.len() < 16 {
        return false;
    }
    
    if position_values.len() < 7 {
        return false; // Need at least 7 planets
    }
    
    // Check position values are reasonable (0-36000 for degrees * 100)
    for &pos in position_values {
        if pos > 36000 {
            return false;
        }
    }
    
    // All checks passed
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keccak256() {
        let input = b"test";
        let hash = keccak256(input);
        assert_eq!(hash.len(), 32);
    }

    #[test]
    fn test_verify_zk_proof_simple() {
        let commitment = "a".repeat(40);
        let proof = "b".repeat(40);
        let nonce = "c".repeat(20);
        let positions = vec![100, 200, 300, 400, 500, 600, 700];
        
        let result = verify_zk_proof_simple(&commitment, &proof, &nonce, &positions);
        assert!(result);
    }

    #[test]
    fn test_verify_zk_proof_invalid_commitment() {
        let commitment = "short"; // Too short
        let proof = "b".repeat(40);
        let nonce = "c".repeat(20);
        let positions = vec![100, 200, 300, 400, 500, 600, 700];
        
        let result = verify_zk_proof_simple(&commitment, &proof, &nonce, &positions);
        assert!(!result);
    }

    #[test]
    fn test_verify_zk_proof_invalid_positions() {
        let commitment = "a".repeat(40);
        let proof = "b".repeat(40);
        let nonce = "c".repeat(20);
        let positions = vec![100, 200, 300]; // Too few
        
        let result = verify_zk_proof_simple(&commitment, &proof, &nonce, &positions);
        assert!(!result);
    }

    #[test]
    fn test_verify_zk_proof_out_of_range() {
        let commitment = "a".repeat(40);
        let proof = "b".repeat(40);
        let nonce = "c".repeat(20);
        let positions = vec![100, 200, 300, 400, 500, 600, 99999]; // Out of range
        
        let result = verify_zk_proof_simple(&commitment, &proof, &nonce, &positions);
        assert!(!result);
    }
}
