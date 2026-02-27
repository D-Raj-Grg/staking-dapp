const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Deploy StakingToken — mint 1,000,000 STK to deployer
  const StakingToken = await ethers.getContractFactory("StakingToken");
  const stakingToken = await StakingToken.deploy(1_000_000);
  await stakingToken.waitForDeployment();
  console.log("StakingToken deployed to:", await stakingToken.getAddress());

  // 2. Deploy RewardToken (no initial supply — StakingPool will mint on demand)
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.waitForDeployment();
  console.log("RewardToken deployed to:", await rewardToken.getAddress());

  // 3. Deploy StakingPool
  //    rewardRate = 1 RWD per second (1e18 in 18-decimal units)
  //    Adjust this to taste — lower = slower rewards
  const rewardRate = ethers.parseEther("1");
  const StakingPool = await ethers.getContractFactory("StakingPool");
  const stakingPool = await StakingPool.deploy(
    await stakingToken.getAddress(),
    await rewardToken.getAddress(),
    rewardRate
  );
  await stakingPool.waitForDeployment();
  console.log("StakingPool deployed to:", await stakingPool.getAddress());

  // 4. Transfer RewardToken ownership to StakingPool so it can mint
  const tx = await rewardToken.transferOwnership(await stakingPool.getAddress());
  await tx.wait();
  console.log("RewardToken ownership transferred to StakingPool");

  // Print a summary for the frontend .env
  console.log("\n--- Copy these into frontend/.env.local ---");
  console.log(`NEXT_PUBLIC_STAKING_TOKEN_ADDRESS=${await stakingToken.getAddress()}`);
  console.log(`NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=${await rewardToken.getAddress()}`);
  console.log(`NEXT_PUBLIC_STAKING_POOL_ADDRESS=${await stakingPool.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
