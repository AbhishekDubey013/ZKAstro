//! Main entry point for ABI export

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

#[cfg(feature = "export-abi")]
fn main() {
    use chart_registry_stylus::ChartRegistry;
    stylus_sdk::abi::export::print_abi::<ChartRegistry>("MIT-OR-APACHE-2.0", "pragma solidity ^0.8.23;");
}

#[cfg(not(feature = "export-abi"))]
fn main() {}
