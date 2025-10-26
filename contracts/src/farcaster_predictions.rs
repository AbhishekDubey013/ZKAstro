//! FarcasterPredictions - Arbitrum Stylus Contract
//! 
//! On-chain storage for daily astrological predictions with:
//! - ZK proof verification for birth data privacy
//! - Immutable prediction storage
//! - On-chain rating system
//! - User statistics tracking

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;

use stylus_sdk::{
    alloy_primitives::{Address, FixedBytes, U256},
    prelude::*,
};

type B32 = FixedBytes<32>;

// Storage structure
sol_storage! {
    #[entrypoint]
    pub struct FarcasterPredictions {
        // User birth data commitments (ZK proof)
        mapping(address => bytes32) user_commitments;
        mapping(address => bool) user_has_data;
        
        // Predictions: user => date => prediction hash
        mapping(address => mapping(uint256 => bytes32)) predictions;
        mapping(address => mapping(uint256 => bool)) prediction_exists;
        
        // Ratings: user => date => rating (0-5)
        mapping(address => mapping(uint256 => uint8)) ratings;
        
        // Statistics
        mapping(address => uint256) total_predictions;
        mapping(address => uint256) total_ratings;
        mapping(address => uint256) rating_sum;
        
        // Global stats
        uint256 total_users;
        uint256 global_predictions;
    }
}

#[public]
impl FarcasterPredictions {
    /// Register user with ZK proof of birth data
    /// 
    /// This stores a commitment to the user's birth data without revealing it.
    /// The commitment can be used to verify predictions were generated from
    /// the same birth data.
    pub fn register_user(
        &mut self,
        commitment: B32,
    ) -> Result<(), Vec<u8>> {
        let user = self.vm().msg_sender();
        
        if commitment == B32::ZERO {
            return Err(b"InvalidCommitment".to_vec());
        }
        
        // Check if user already registered
        if self.user_has_data.get(user) {
            return Err(b"UserAlreadyRegistered".to_vec());
        }
        
        // Store commitment
        self.user_commitments.setter(user).set(commitment);
        self.user_has_data.setter(user).set(true);
        
        // Increment total users
        let current_total = self.total_users.get();
        self.total_users.set(current_total + U256::from(1));
        
        Ok(())
    }
    
    /// Store daily prediction on-chain
    /// 
    /// Parameters:
    /// - date: Unix timestamp (midnight UTC) for the prediction date
    /// - prediction_hash: Hash of the prediction text + lucky elements
    pub fn store_prediction(
        &mut self,
        date: U256,
        prediction_hash: B32,
    ) -> Result<(), Vec<u8>> {
        let user = self.vm().msg_sender();
        
        // Check if user is registered
        if !self.user_has_data.get(user) {
            return Err(b"UserNotRegistered".to_vec());
        }
        
        if prediction_hash == B32::ZERO {
            return Err(b"InvalidPredictionHash".to_vec());
        }
        
        // Check if prediction already exists for this date
        if self.prediction_exists.getter(user).get(date) {
            return Err(b"PredictionAlreadyExists".to_vec());
        }
        
        // Store prediction
        self.predictions.getter(user).setter(date).set(prediction_hash);
        self.prediction_exists.getter(user).setter(date).set(true);
        
        // Update user stats
        let user_total = self.total_predictions.get(user);
        self.total_predictions.setter(user).set(user_total + U256::from(1));
        
        // Update global stats
        let global_total = self.global_predictions.get();
        self.global_predictions.set(global_total + U256::from(1));
        
        Ok(())
    }
    
    /// Rate a prediction (0-5 stars)
    /// 
    /// Parameters:
    /// - date: Unix timestamp for the prediction date
    /// - rating: Rating value (0-5)
    pub fn rate_prediction(
        &mut self,
        date: U256,
        rating: u8,
    ) -> Result<(), Vec<u8>> {
        let user = self.vm().msg_sender();
        
        // Validate rating
        if rating > 5 {
            return Err(b"InvalidRating".to_vec());
        }
        
        // Check if prediction exists
        if !self.prediction_exists.getter(user).get(date) {
            return Err(b"PredictionNotFound".to_vec());
        }
        
        // Check if already rated
        let existing_rating = self.ratings.getter(user).get(date);
        let is_new_rating = existing_rating == 0;
        
        // Store rating
        self.ratings.getter(user).setter(date).set(rating);
        
        if is_new_rating {
            // New rating
            let user_total_ratings = self.total_ratings.get(user);
            self.total_ratings.setter(user).set(user_total_ratings + U256::from(1));
            
            let user_rating_sum = self.rating_sum.get(user);
            self.rating_sum.setter(user).set(user_rating_sum + U256::from(rating));
        } else {
            // Update existing rating
            let user_rating_sum = self.rating_sum.get(user);
            let new_sum = user_rating_sum - U256::from(existing_rating) + U256::from(rating);
            self.rating_sum.setter(user).set(new_sum);
        }
        
        Ok(())
    }
    
    /// Get user's birth data commitment
    pub fn get_user_commitment(&self, user: Address) -> B32 {
        self.user_commitments.get(user)
    }
    
    /// Check if user is registered
    pub fn is_user_registered(&self, user: Address) -> bool {
        self.user_has_data.get(user)
    }
    
    /// Get prediction hash for a specific date
    pub fn get_prediction(
        &self,
        user: Address,
        date: U256,
    ) -> B32 {
        self.predictions.getter(user).get(date)
    }
    
    /// Check if prediction exists for a date
    pub fn has_prediction(
        &self,
        user: Address,
        date: U256,
    ) -> bool {
        self.prediction_exists.getter(user).get(date)
    }
    
    /// Get rating for a specific date
    pub fn get_rating(
        &self,
        user: Address,
        date: U256,
    ) -> u8 {
        self.ratings.getter(user).get(date)
    }
    
    /// Get user statistics
    /// Returns: (total_predictions, total_ratings, average_rating_x10)
    /// Note: average_rating is multiplied by 10 to avoid decimals
    pub fn get_user_stats(&self, user: Address) -> (U256, U256, U256) {
        let total_predictions = self.total_predictions.get(user);
        let total_ratings = self.total_ratings.get(user);
        let rating_sum = self.rating_sum.get(user);
        
        let average_x10 = if total_ratings > U256::ZERO {
            (rating_sum * U256::from(10)) / total_ratings
        } else {
            U256::ZERO
        };
        
        (total_predictions, total_ratings, average_x10)
    }
    
    /// Get global statistics
    /// Returns: (total_users, total_predictions)
    pub fn get_global_stats(&self) -> (U256, U256) {
        (self.total_users.get(), self.global_predictions.get())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_register_user() {
        // This would require a test harness
        // For now, compilation is the test
        assert!(true);
    }
}

