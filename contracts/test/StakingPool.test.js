const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("StakingPool", function () {
  let stakingToken, rewardToken, stakingPool;
  let owner, alice, bob;

  const REWARD_RATE = ethers.parseEther("1"); // 1 RWD/second
  const INITIAL_SUPPLY = 1_000_000n;
  const STAKE_AMOUNT = ethers.parseEther("1000");

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy tokens
    const StakingToken = await ethers.getContractFactory("StakingToken");
    stakingToken = await StakingToken.deploy(INITIAL_SUPPLY);

    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();

    // Deploy pool
    const StakingPool = await ethers.getContractFactory("StakingPool");
    stakingPool = await StakingPool.deploy(
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      REWARD_RATE
    );

    // Transfer reward token ownership to pool
    await rewardToken.transferOwnership(await stakingPool.getAddress());

    // Give alice and bob some STK tokens
    await stakingToken.transfer(alice.address, STAKE_AMOUNT);
    await stakingToken.transfer(bob.address, STAKE_AMOUNT);

    // Approve pool to spend their tokens
    await stakingToken.connect(alice).approve(await stakingPool.getAddress(), STAKE_AMOUNT);
    await stakingToken.connect(bob).approve(await stakingPool.getAddress(), STAKE_AMOUNT);
  });

  // ─────────────────────────────────────── staking ──

  describe("stake()", function () {
    it("increases user staked balance and totalStaked", async function () {
      await stakingPool.connect(alice).stake(STAKE_AMOUNT);

      expect(await stakingPool.stakedBalance(alice.address)).to.equal(STAKE_AMOUNT);
      expect(await stakingPool.totalStaked()).to.equal(STAKE_AMOUNT);
    });

    it("pulls STK from user wallet", async function () {
      await stakingPool.connect(alice).stake(STAKE_AMOUNT);
      expect(await stakingToken.balanceOf(alice.address)).to.equal(0);
    });

    it("reverts on zero amount", async function () {
      await expect(stakingPool.connect(alice).stake(0)).to.be.revertedWith(
        "StakingPool: amount must be > 0"
      );
    });

    it("emits Staked event", async function () {
      await expect(stakingPool.connect(alice).stake(STAKE_AMOUNT))
        .to.emit(stakingPool, "Staked")
        .withArgs(alice.address, STAKE_AMOUNT);
    });
  });

  // ─────────────────────────────────────── unstaking ──

  describe("unstake()", function () {
    beforeEach(async function () {
      await stakingPool.connect(alice).stake(STAKE_AMOUNT);
    });

    it("returns STK to user wallet", async function () {
      await stakingPool.connect(alice).unstake(STAKE_AMOUNT);
      expect(await stakingToken.balanceOf(alice.address)).to.equal(STAKE_AMOUNT);
    });

    it("decreases stakedBalance and totalStaked", async function () {
      await stakingPool.connect(alice).unstake(STAKE_AMOUNT);
      expect(await stakingPool.stakedBalance(alice.address)).to.equal(0);
      expect(await stakingPool.totalStaked()).to.equal(0);
    });

    it("reverts if amount exceeds staked balance", async function () {
      await expect(
        stakingPool.connect(alice).unstake(STAKE_AMOUNT + 1n)
      ).to.be.revertedWith("StakingPool: insufficient staked balance");
    });

    it("emits Unstaked event", async function () {
      await expect(stakingPool.connect(alice).unstake(STAKE_AMOUNT))
        .to.emit(stakingPool, "Unstaked")
        .withArgs(alice.address, STAKE_AMOUNT);
    });
  });

  // ─────────────────────────────────────── rewards ──

  describe("earned() / claimReward()", function () {
    it("accrues rewards over time", async function () {
      await stakingPool.connect(alice).stake(STAKE_AMOUNT);

      // Advance blockchain by 100 seconds
      await time.increase(100);

      // With 1 RWD/sec and Alice being the only staker, she should earn ~100 RWD
      const earned = await stakingPool.earned(alice.address);
      expect(earned).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("1"));
    });

    it("mints RWD to user on claimReward", async function () {
      await stakingPool.connect(alice).stake(STAKE_AMOUNT);
      await time.increase(100);

      await stakingPool.connect(alice).claimReward();

      const rwdBalance = await rewardToken.balanceOf(alice.address);
      expect(rwdBalance).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("1"));
    });

    it("resets pending rewards to 0 after claiming", async function () {
      await stakingPool.connect(alice).stake(STAKE_AMOUNT);
      await time.increase(100);
      await stakingPool.connect(alice).claimReward();

      // Immediately after claiming, earned should be ~0 (1 block worth at most)
      const earned = await stakingPool.earned(alice.address);
      expect(earned).to.be.lt(ethers.parseEther("2"));
    });

    it("splits rewards proportionally between two stakers", async function () {
      await stakingPool.connect(alice).stake(STAKE_AMOUNT);
      await stakingPool.connect(bob).stake(STAKE_AMOUNT);

      await time.increase(100);

      const aliceEarned = await stakingPool.earned(alice.address);
      const bobEarned = await stakingPool.earned(bob.address);

      // Both stake equal amounts, so rewards should be roughly equal
      expect(aliceEarned).to.be.closeTo(bobEarned, ethers.parseEther("2"));
    });

    it("reverts claimReward if nothing to claim", async function () {
      await expect(stakingPool.connect(alice).claimReward()).to.be.revertedWith(
        "StakingPool: nothing to claim"
      );
    });
  });

  // ─────────────────────────────────────── exit ──

  describe("exit()", function () {
    it("unstakes and claims in one tx", async function () {
      await stakingPool.connect(alice).stake(STAKE_AMOUNT);
      await time.increase(50);

      await stakingPool.connect(alice).exit();

      expect(await stakingToken.balanceOf(alice.address)).to.equal(STAKE_AMOUNT);
      expect(await rewardToken.balanceOf(alice.address)).to.be.gt(0);
      expect(await stakingPool.stakedBalance(alice.address)).to.equal(0);
    });
  });

  // ─────────────────────────────────────── admin ──

  describe("setRewardRate()", function () {
    it("only owner can set reward rate", async function () {
      await expect(
        stakingPool.connect(alice).setRewardRate(ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(stakingPool, "OwnableUnauthorizedAccount");
    });

    it("owner can update reward rate", async function () {
      await stakingPool.setRewardRate(ethers.parseEther("2"));
      expect(await stakingPool.rewardRate()).to.equal(ethers.parseEther("2"));
    });
  });
});
