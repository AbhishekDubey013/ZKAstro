# 🔥 Stylus vs Solidity REAL Benchmark Results

## Overview

| Property | Value |
|----------|-------|
| **Date** | 12/4/2025, 3:39:53 PM |
| **Network** | Arbitrum Sepolia |
| **Stylus Contract** | `0x0e32b7c642469dd02227734a6c8990cea71574bc` |
| **Solidity Contract** | `0x5e31DBA1230372343FE08B762172E2da30fA343d` |
| **Methodology** | Real transactions on both contracts |

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| **Overall Gas Savings** | **-56.0%** |
| **Average per Operation** | -111.2% |
| **Best Case** | -29.0% |
| **Worst Case** | -169.0% |
| **Total Stylus Gas** | 1,295,724 |
| **Total Solidity Gas** | 827,160 |

## 📈 Detailed Results

| Operation | Stylus Gas | Solidity Gas | Savings | Stylus TX | Solidity TX |
|-----------|------------|--------------|---------|-----------|-------------|
| registerChart | 178,517 | 137,688 | **-29.0%** | [tx](https://sepolia.arbiscan.io/tx/0x1a4a3332e8ff4b286dedf7059527db094241c0ea5a9116eb869564419cf4d89d) | [tx](https://sepolia.arbiscan.io/tx/0x6de45763f8444b9bbc9693528a9fe3f7af73b9b993275fcaee15e4bfb0122d1a) |
| verifyChart (view) | 70,316 | 27,765 | **-153.0%** | view | view |
| getChartHash (view) | 67,325 | 25,016 | **-169.0%** | view | view |
| registerChart (5x batch) | 892,633 | 602,916 | **-48.0%** | [tx](https://sepolia.arbiscan.io/tx/0x4694e70661da540eb052fc6507819be6744e3774c73acfe054836c5571da09f3) | [tx](https://sepolia.arbiscan.io/tx/0x1d5f364676648a0821ac741ffa4889d3df81a81cc417a6cbd6e3c0ff317228c7) |
| markAsVerified | 86,933 | 33,775 | **-157.0%** | [tx](https://sepolia.arbiscan.io/tx/0x67091b5b54b3e2d277f76a68eae430454958b2eddc9b321ee30d957843f1fa82) | [tx](https://sepolia.arbiscan.io/tx/0xeccb0fe2e8cf1d3e77f22a854053bb2839d98fa1bb4f6b5360179397a83e3f63) |

## 💰 Cost Analysis

At current gas price (0.02 gwei) and ~$3500 ETH:

| Metric | Cost |
|--------|------|
| Stylus Total | $0.090701 |
| Solidity Total | $0.057901 |
| **Savings** | **$-0.032799** |
| **1M Operations** | **~$-6559.90** |

## 🔗 Verify On-Chain

- [Stylus Contract](https://sepolia.arbiscan.io/address/0x0e32b7c642469dd02227734a6c8990cea71574bc)
- [Solidity Contract](https://sepolia.arbiscan.io/address/0x5e31DBA1230372343FE08B762172E2da30fA343d)

---

*Real benchmark data from Arbitrum Sepolia*
