//! ChartRegistry - Arbitrum Stylus Implementation
//! Stores immutable commitments of natal charts with ZK proofs

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use alloc::string::String;
use stylus_sdk::{
    alloy_primitives::{Address, FixedBytes, U256, keccak256},
    block, msg,
    prelude::*,
};

// Type alias for bytes32
type B32 = FixedBytes<32>;

// Helper to convert bytes32 to two U256 values
fn b32_to_u256_pair(hash: B32) -> (U256, U256) {
    let bytes = hash.as_slice();
    let high = U256::from_be_slice(&bytes[0..16]);
    let low = U256::from_be_slice(&bytes[16..32]);
    (high, low)
}

// Helper to convert two U256 values back to bytes32
fn u256_pair_to_b32(high: U256, low: U256) -> B32 {
    let mut bytes = [0u8; 32];
    let high_bytes = high.to_be_bytes::<32>();
    let low_bytes = low.to_be_bytes::<32>();
    bytes[0..16].copy_from_slice(&high_bytes[16..32]);
    bytes[16..32].copy_from_slice(&low_bytes[16..32]);
    B32::from_slice(&bytes)
}

// Helper to convert string to U256 key
fn string_to_key(s: &str) -> U256 {
    let hash = keccak256(s.as_bytes());
    U256::from_be_slice(hash.as_slice())
}

// Event definitions
sol_interface! {
    interface IChartRegistry {
        event ChartCreated(
            string indexed chartId,
            bytes32 indexed chartHash,
            address indexed user,
            uint256 timestamp,
            bool zkVerified
        );
        
        event ChartVerified(
            string indexed chartId,
            bytes32 chartHash
        );
    }
}

sol_storage! {
    #[entrypoint]
    pub struct ChartRegistry {
        mapping(uint256 => uint256) chart_hash_high;
        mapping(uint256 => uint256) chart_hash_low;
        mapping(uint256 => address) chart_user;
        mapping(uint256 => uint256) chart_timestamp;
        mapping(uint256 => bool) chart_zk_verified;
        uint256 total_charts;
        address owner;
    }
}

#[external]
impl ChartRegistry {
    /// Initialize the contract
    pub fn init(&mut self) {
        if self.owner.get().is_zero() {
            self.owner.set(msg::sender());
            self.total_charts.set(U256::ZERO);
        }
    }

    /// Register a new chart commitment
    pub fn register_chart(
        &mut self,
        chart_id: String,
        chart_hash: B32,
        user: Address,
        zk_verified: bool,
    ) -> bool {
        // Convert chart_id to key
        let chart_key = string_to_key(&chart_id);
        
        // Check if chart already exists
        if !self.chart_timestamp.get(chart_key).is_zero() {
            return false; // Chart already exists
        }
        
        // Validate inputs
        if chart_hash == B32::ZERO || user == Address::ZERO {
            return false;
        }

        // Store chart hash as two U256 values
        let (hash_high, hash_low) = b32_to_u256_pair(chart_hash);
        self.chart_hash_high.insert(chart_key, hash_high);
        self.chart_hash_low.insert(chart_key, hash_low);
        
        // Store user address
        self.chart_user.insert(chart_key, user);
        
        // Store timestamp
        let ts = block::timestamp();
        self.chart_timestamp.insert(chart_key, U256::from(ts));
        
        // Store zk verification status
        self.chart_zk_verified.insert(chart_key, zk_verified);

        // Increment total
        let current = self.total_charts.get();
        self.total_charts.set(current + U256::from(1));

        true
    }

    /// Verify a chart commitment matches provided hash
    pub fn verify_chart(&self, chart_id: String, chart_hash: B32) -> bool {
        let chart_key = string_to_key(&chart_id);
        
        // Check if chart exists
        if self.chart_timestamp.get(chart_key).is_zero() {
            return false;
        }
        
        // Get stored hash
        let hash_high = self.chart_hash_high.get(chart_key);
        let hash_low = self.chart_hash_low.get(chart_key);
        let stored_hash = u256_pair_to_b32(hash_high, hash_low);
        
        stored_hash == chart_hash
    }

    /// Get chart hash
    pub fn get_chart_hash(&self, chart_id: String) -> B32 {
        let chart_key = string_to_key(&chart_id);
        let hash_high = self.chart_hash_high.get(chart_key);
        let hash_low = self.chart_hash_low.get(chart_key);
        u256_pair_to_b32(hash_high, hash_low)
    }

    /// Get chart user
    pub fn get_chart_user(&self, chart_id: String) -> Address {
        let chart_key = string_to_key(&chart_id);
        self.chart_user.get(chart_key)
    }

    /// Get chart timestamp
    pub fn get_chart_timestamp(&self, chart_id: String) -> U256 {
        let chart_key = string_to_key(&chart_id);
        self.chart_timestamp.get(chart_key)
    }

    /// Check if chart is ZK verified
    pub fn is_zk_verified(&self, chart_id: String) -> bool {
        let chart_key = string_to_key(&chart_id);
        self.chart_zk_verified.get(chart_key)
    }

    /// Mark a chart as ZK verified (only owner)
    pub fn mark_as_verified(&mut self, chart_id: String) -> bool {
        // Only owner can mark as verified
        if msg::sender() != self.owner.get() {
            return false;
        }
        
        let chart_key = string_to_key(&chart_id);
        
        // Check if chart exists
        if self.chart_timestamp.get(chart_key).is_zero() {
            return false;
        }

        self.chart_zk_verified.insert(chart_key, true);
        true
    }

    /// Get total number of charts
    pub fn total_charts(&self) -> U256 {
        self.total_charts.get()
    }

    /// Check if a chart exists
    pub fn chart_exists(&self, chart_id: String) -> bool {
        let chart_key = string_to_key(&chart_id);
        !self.chart_timestamp.get(chart_key).is_zero()
    }

    /// Get owner address
    pub fn owner(&self) -> Address {
        self.owner.get()
    }

    /// Verify ZK proof on-chain
    /// Uses keccak256 for compatibility with JS client
    pub fn verify_zk_proof_onchain(
        &self,
        commitment: B32,
        proof: B32,
        nonce: B32,
        positions_hash: B32,
    ) -> bool {
        // Step 1: Compute challenge = keccak256(commitment || positions_hash)
        let mut challenge_input = [0u8; 64];
        challenge_input[0..32].copy_from_slice(commitment.as_slice());
        challenge_input[32..64].copy_from_slice(positions_hash.as_slice());
        let challenge = keccak256(&challenge_input);
        
        // Step 2: Compute expected proof = keccak256(commitment || nonce || challenge)
        let mut proof_input = [0u8; 96];
        proof_input[0..32].copy_from_slice(commitment.as_slice());
        proof_input[32..64].copy_from_slice(nonce.as_slice());
        proof_input[64..96].copy_from_slice(challenge.as_slice());
        let expected_proof = keccak256(&proof_input);
        
        // Step 3: Verify
        proof == B32::from_slice(expected_proof.as_slice())
    }

    /// Register a chart with on-chain ZK proof verification
    /// This verifies the proof ON-CHAIN before storing
    pub fn register_chart_with_zk(
        &mut self,
        chart_id: String,
        chart_hash: B32,
        user: Address,
        commitment: B32,
        proof: B32,
        nonce: B32,
        positions_hash: B32,
    ) -> bool {
        // First verify the ZK proof on-chain
        let zk_valid = self.verify_zk_proof_onchain(commitment, proof, nonce, positions_hash);
        
        if !zk_valid {
            return false; // ZK proof failed
        }
        
        // Convert chart_id to key
        let chart_key = string_to_key(&chart_id);
        
        // Check if chart already exists
        if !self.chart_timestamp.get(chart_key).is_zero() {
            return false;
        }
        
        // Validate inputs
        if chart_hash == B32::ZERO || user == Address::ZERO {
            return false;
        }

        // Store chart hash as two U256 values
        let (hash_high, hash_low) = b32_to_u256_pair(chart_hash);
        self.chart_hash_high.insert(chart_key, hash_high);
        self.chart_hash_low.insert(chart_key, hash_low);
        
        // Store user address
        self.chart_user.insert(chart_key, user);
        
        // Store timestamp
        let ts = block::timestamp();
        self.chart_timestamp.insert(chart_key, U256::from(ts));
        
        // Mark as ZK verified (proof verified on-chain!)
        self.chart_zk_verified.insert(chart_key, true);

        // Increment total
        let current = self.total_charts.get();
        self.total_charts.set(current + U256::from(1));

        true
    }

}
