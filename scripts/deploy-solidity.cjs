/**
 * Deploy Solidity ChartRegistry using Hardhat
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=".repeat(60));
  console.log("Deploying Solidity ChartRegistry for Benchmarking");
  console.log("=".repeat(60));

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\nDeployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy contract
  console.log("\nDeploying ChartRegistrySolidity...");
  const ChartRegistry = await hre.ethers.getContractFactory("ChartRegistrySolidity");
  
  const gasPrice = (await hre.ethers.provider.getFeeData()).gasPrice;
  console.log(`Gas Price: ${hre.ethers.formatUnits(gasPrice || 0n, "gwei")} gwei`);

  const contract = await ChartRegistry.deploy({
    gasLimit: 3000000n,
    gasPrice: gasPrice ? gasPrice * 2n : undefined
  });

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`\n✅ Solidity Contract deployed to: ${address}`);
  console.log(`   Transaction: ${contract.deploymentTransaction()?.hash}`);

  // Update .env
  const envPath = path.join(__dirname, "../.env");
  let envContent = fs.readFileSync(envPath, "utf-8");

  if (envContent.includes("SOLIDITY_CHART_REGISTRY_ADDRESS=")) {
    envContent = envContent.replace(
      /SOLIDITY_CHART_REGISTRY_ADDRESS=.*/,
      `SOLIDITY_CHART_REGISTRY_ADDRESS=${address}`
    );
  } else {
    envContent += `\nSOLIDITY_CHART_REGISTRY_ADDRESS=${address}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ Updated .env with SOLIDITY_CHART_REGISTRY_ADDRESS");

  // Verify on Arbiscan (optional)
  console.log("\n" + "=".repeat(60));
  console.log("Deployment complete!");
  console.log(`View on Arbiscan: https://sepolia.arbiscan.io/address/${address}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

