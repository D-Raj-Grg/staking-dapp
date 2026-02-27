// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RewardToken.sol";

/// @title StakingPool
/// @notice Users stake STK tokens and earn RWD tokens over time.
///
/// Reward mechanism (Synthetix-style):
///   rewardPerTokenStored accumulates reward-per-staked-token every second.
///   Each user tracks their personal snapshot so rewards are calculated lazily
///   without iterating over all stakers.
contract StakingPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────── state ──

    IERC20 public immutable stakingToken;
    RewardToken public immutable rewardToken;

    /// @notice Reward tokens emitted per second across all stakers
    uint256 public rewardRate;

    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    uint256 public totalStaked;

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    // ──────────────────────────────────────────────────────────── events ──

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);

    // ──────────────────────────────────────────────────────── constructor ──

    /// @param _stakingToken  Address of the ERC-20 token users stake
    /// @param _rewardToken   Address of the RewardToken this contract will mint
    /// @param _rewardRate    Initial reward tokens per second (18-decimal units)
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate
    ) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = RewardToken(_rewardToken);
        rewardRate = _rewardRate;
        lastUpdateTime = block.timestamp;
    }

    // ─────────────────────────────────────────────────────── modifiers ──

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    // ──────────────────────────────────────────────────────── views ──

    /// @notice Accumulated reward per staked token since contract deployment
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return
            rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked);
    }

    /// @notice Unclaimed rewards for a given account
    function earned(address account) public view returns (uint256) {
        return
            ((stakedBalance[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) /
                1e18) + rewards[account];
    }

    /// @notice APY estimate in basis points (1% = 100). Rough approximation.
    ///         Formula: (rewardRate * 365 days / totalStaked) * 10000
    function getAPYBasisPoints() external view returns (uint256) {
        if (totalStaked == 0) return 0;
        return (rewardRate * 365 days * 10_000) / totalStaked;
    }

    // ──────────────────────────────────────────────────────── actions ──

    /// @notice Stake `amount` of STK tokens. Requires prior approval.
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "StakingPool: amount must be > 0");

        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /// @notice Unstake `amount` of STK tokens back to your wallet.
    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "StakingPool: amount must be > 0");
        require(stakedBalance[msg.sender] >= amount, "StakingPool: insufficient staked balance");

        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /// @notice Claim all pending RWD reward tokens.
    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "StakingPool: nothing to claim");

        rewards[msg.sender] = 0;
        rewardToken.mint(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    /// @notice Unstake everything and claim rewards in one transaction.
    function exit() external nonReentrant updateReward(msg.sender) {
        uint256 staked = stakedBalance[msg.sender];
        if (staked > 0) {
            stakedBalance[msg.sender] = 0;
            totalStaked -= staked;
            stakingToken.safeTransfer(msg.sender, staked);
            emit Unstaked(msg.sender, staked);
        }

        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.mint(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    // ──────────────────────────────────────────────────── admin ──

    /// @notice Owner can adjust the reward emission rate at any time.
    function setRewardRate(uint256 newRate) external onlyOwner updateReward(address(0)) {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }
}
