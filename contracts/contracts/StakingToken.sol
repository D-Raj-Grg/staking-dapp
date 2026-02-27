// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title StakingToken (STK)
/// @notice The token users will stake into the pool.
///         On deployment, all supply is minted to the deployer so they can
///         distribute via a faucet or transfer to test wallets.
contract StakingToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Staking Token", "STK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /// @notice Owner can mint more tokens (e.g. for a faucet contract)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
