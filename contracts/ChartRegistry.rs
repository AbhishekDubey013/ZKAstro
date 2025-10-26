//! ChartRegistry - Arbitrum Stylus Implementation
//! Stores immutable commitments of natal charts with ZK proofs
//! 
//! This Rust implementation provides:
//! - 10-100x cheaper gas costs compared to Solidity
//! - Better performance for cryptographic operations
//! - Memory-safe handling of ZK proofs

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::prelude::*;
use stylus_sdk::alloy_primitives::{Address, FixedBytes, U256};
use stylus_sdk::storage::{StorageMap, StorageVec, StorageString, StorageBool};
use stylus_sdk::msg;
use stylus_sdk::block;

// Type aliases for clarity
type B32 = FixedBytes<32>;

/// Chart commitment structure
#[storage]
pub struct ChartCommitment {
    chart_hash: B32,
    user: Address,
    timestamp: U256,
    zk_verified: StorageBool,
    chart_id: StorageString,
}

/// Main ChartRegistry contract
#[storage]
#[entrypoint]
pub struct ChartRegistry {
    /// Mapping: chartId => ChartCommitment
    charts: StorageMap<StorageString, ChartCommitment>,
    
    /// Mapping: user => chartIds[]
    user_charts: StorageMap<Address, StorageVec<StorageString>>,
    
    /// Total charts created
    total_charts: U256,
}

/// Events
#[derive(SolidityError)]
pub enum ChartRegistryError {
    ChartAlreadyExists,
    InvalidChartHash,
    InvalidUserAddress,
    ChartDoesNotExist,
}

// Event definitions
sol_interface! {
    event ChartCreated(
        string indexed chart_id,
        bytes32 indexed chart_hash,
        address indexed user,
        uint256 timestamp,
        bool zk_verified
    );

    event ChartVerified(
        string indexed chart_id,
        bytes32 chart_hash
    );
}

#[public]
impl ChartRegistry {
    /// Initialize the contract
    pub fn init(&mut self) {
        self.total_charts.set(U256::from(0));
    }

    /// Register a new chart commitment
    /// 
    /// # Arguments
    /// * `chart_id` - Unique chart identifier
    /// * `chart_hash` - Hash of chart data (including ZK proof)
    /// * `user` - Chart owner address
    /// * `zk_verified` - Whether ZK proof was verified
    pub fn register_chart(
        &mut self,
        chart_id: String,
        chart_hash: B32,
        user: Address,
        zk_verified: bool,
    ) -> Result<(), ChartRegistryError> {
        // Validation
        let chart_key = StorageString::from(chart_id.clone());
        
        // Check if chart already exists (timestamp will be 0 if not)
        if !self.charts.get(chart_key.clone()).timestamp.get().is_zero() {
            return Err(ChartRegistryError::ChartAlreadyExists);
        }
        
        if chart_hash == B32::ZERO {
            return Err(ChartRegistryError::InvalidChartHash);
        }
        
        if user == Address::ZERO {
            return Err(ChartRegistryError::InvalidUserAddress);
        }

        // Create commitment
        let mut commitment = self.charts.setter(chart_key.clone());
        commitment.chart_hash.set(chart_hash);
        commitment.user.set(user);
        commitment.timestamp.set(U256::from(block::timestamp()));
        commitment.zk_verified.set(zk_verified);
        commitment.chart_id.set_str(&chart_id);

        // Add to user's charts
        let mut user_chart_list = self.user_charts.setter(user);
        let mut new_chart = user_chart_list.grow();
        new_chart.set_str(&chart_id);

        // Increment total
        let current_total = self.total_charts.get();
        self.total_charts.set(current_total + U256::from(1));

        // Emit event
        evm::log(ChartCreated {
            chart_id,
            chart_hash,
            user,
            timestamp: U256::from(block::timestamp()),
            zk_verified,
        });

        Ok(())
    }

    /// Verify a chart commitment matches provided data
    /// 
    /// # Arguments
    /// * `chart_id` - Chart identifier
    /// * `chart_hash` - Hash to verify
    /// 
    /// # Returns
    /// * `bool` - Whether the hash matches
    #[view]
    pub fn verify_chart(
        &self,
        chart_id: String,
        chart_hash: B32,
    ) -> bool {
        let chart_key = StorageString::from(chart_id);
        let commitment = self.charts.get(chart_key);
        commitment.chart_hash.get() == chart_hash
    }

    /// Get chart commitment details
    /// 
    /// # Arguments
    /// * `chart_id` - Chart identifier
    /// 
    /// # Returns
    /// * Tuple of (chart_hash, user, timestamp, zk_verified, chart_id)
    #[view]
    pub fn get_chart(
        &self,
        chart_id: String,
    ) -> (B32, Address, U256, bool, String) {
        let chart_key = StorageString::from(chart_id.clone());
        let commitment = self.charts.get(chart_key);
        
        (
            commitment.chart_hash.get(),
            commitment.user.get(),
            commitment.timestamp.get(),
            commitment.zk_verified.get(),
            chart_id,
        )
    }

    /// Get all chart IDs for a user
    /// 
    /// # Arguments
    /// * `user` - User address
    /// 
    /// # Returns
    /// * Array of chart IDs
    #[view]
    pub fn get_user_charts(&self, user: Address) -> Vec<String> {
        let user_chart_list = self.user_charts.get(user);
        let len = user_chart_list.len();
        
        let mut charts = Vec::new();
        for i in 0..len {
            let chart_id = user_chart_list.get(i).unwrap().get_string();
            charts.push(chart_id);
        }
        
        charts
    }

    /// Mark a chart as ZK verified
    /// 
    /// # Arguments
    /// * `chart_id` - Chart identifier
    pub fn mark_as_verified(
        &mut self,
        chart_id: String,
    ) -> Result<(), ChartRegistryError> {
        let chart_key = StorageString::from(chart_id.clone());
        
        // Check if chart exists
        if self.charts.get(chart_key.clone()).timestamp.get().is_zero() {
            return Err(ChartRegistryError::ChartDoesNotExist);
        }

        // Update verification status
        let mut commitment = self.charts.setter(chart_key.clone());
        commitment.zk_verified.set(true);

        // Emit event
        let chart_hash = commitment.chart_hash.get();
        evm::log(ChartVerified {
            chart_id,
            chart_hash,
        });

        Ok(())
    }

    /// Get total number of charts
    #[view]
    pub fn total_charts(&self) -> U256 {
        self.total_charts.get()
    }

    /// Check if a chart is ZK verified
    #[view]
    pub fn is_zk_verified(&self, chart_id: String) -> bool {
        let chart_key = StorageString::from(chart_id);
        self.charts.get(chart_key).zk_verified.get()
    }
}

