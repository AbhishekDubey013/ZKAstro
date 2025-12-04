//! Main entry point for ABI export

use chart_registry_stylus::ChartRegistry;

fn main() {
    stylus_sdk::abi::export::print_abi::<ChartRegistry>("MIT-OR-APACHE-2.0", "pragma solidity ^0.8.23;");
}
