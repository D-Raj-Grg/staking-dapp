// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title RewardToken (RWD)
/// @notice Earned by stakers over time. Only the StakingPool (owner) can mint.
contract RewardToken is ERC20, Ownable {
    constructor() ERC20("Reward Token", "RWD") Ownable(msg.sender) {}

    /// @notice Only the StakingPool contract (set as owner) can mint rewards
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
