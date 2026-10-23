const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("=========================================");
  console.log("PoolPilot Deployment");
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name, "(ChainID:", (await hre.ethers.provider.getNetwork()).chainId, ")");
  console.log("=========================================\n");

  // 1. Deploy Mock Tokens
  console.log("1. Deploying Mock Tokens...");
  const MockToken = await hre.ethers.getContractFactory("MockERC20");

  const usdc = await MockToken.deploy("USD Coin (Mock)", "USDC", 18);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("   - Mock USDC deployed at:", usdcAddress);

  const weth = await MockToken.deploy("Wrapped Ether (Mock)", "WETH", 18);
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("   - Mock WETH deployed at:", wethAddress);

  // 2. Deploy PoolPilot AMM Pool
  console.log("\n2. Deploying PoolPilotPool...");
  const PoolFactory = await hre.ethers.getContractFactory("PoolPilotPool");
  const pool = await PoolFactory.deploy(usdcAddress, wethAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("   - PoolPilotPool deployed at:", poolAddress);

  const token0 = await pool.token0();
  const token1 = await pool.token1();
  console.log("   - Canonical token0:", token0);
  console.log("   - Canonical token1:", token1);

  // 3. Mint initial tokens to deployer
  console.log("\n3. Minting initial tokens for liquidity...");
  const mintUSDC = hre.ethers.parseEther("1000000"); // 1,000,000 USDC
  const mintWETH = hre.ethers.parseEther("1000");    // 1,000 WETH
  await usdc.mint(deployer.address, mintUSDC);
  await weth.mint(deployer.address, mintWETH);
  console.log("   - Minted 1,000,000 USDC and 1,000 WETH to deployer");

  // 4. Seed initial liquidity (50,000 USDC & 20 WETH => initial price = 2,500 USDC/ETH)
  console.log("\n4. Seeding initial liquidity (50,000 USDC & 20 WETH)...");
  await usdc.approve(poolAddress, hre.ethers.MaxUint256);
  await weth.approve(poolAddress, hre.ethers.MaxUint256);

  const initialUSDC = hre.ethers.parseEther("50000");
  const initialWETH = hre.ethers.parseEther("20");
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const isUsdcToken0 = usdcAddress.toLowerCase() === token0.toLowerCase();
  const amount0 = isUsdcToken0 ? initialUSDC : initialWETH;
  const amount1 = isUsdcToken0 ? initialWETH : initialUSDC;

  const tx = await pool.addLiquidity(
    amount0,
    amount1,
    0,
    0,
    deployer.address,
    deadline
  );
  await tx.wait();
  console.log("   - Seeded pool liquidity successfully!");

  const [res0, res1] = await pool.getReserves();
  console.log("   - Reserve0:", hre.ethers.formatEther(res0));
  console.log("   - Reserve1:", hre.ethers.formatEther(res1));

  // 5. Save deployed addresses and ABIs for frontend and documentation
  const deploymentInfo = {
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    poolAddress,
    token0Address: token0,
    token1Address: token1,
    usdcAddress,
    wethAddress,
    isUsdcToken0,
    deployedAt: new Date().toISOString(),
  };

  const contractsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(contractsDir, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Also write to frontend config if frontend dir exists
  const frontendConfigDir = path.join(__dirname, "..", "..", "frontend", "src", "config");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendConfigDir, "contracts.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n Deployment complete. Config written to frontend/src/config/contracts.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
