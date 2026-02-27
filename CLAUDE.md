# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ERC-20 staking DApp: users stake STK tokens into a StakingPool and earn RWD reward tokens per second (Synthetix-style `rewardPerTokenStored` pattern). Three Solidity contracts + Next.js 14 frontend with RainbowKit/Wagmi.

## Commands

### Contracts (`contracts/`)
```bash
npm run compile              # hardhat compile
npm run test                 # hardhat test
npm run node                 # local hardhat node
npm run deploy:local         # deploy to localhost
npm run deploy:sepolia       # deploy to Sepolia testnet
```

Run a single test:
```bash
cd contracts && npx hardhat test --grep "test name pattern"
```

### Frontend (`frontend/`)
```bash
npm run dev                  # next dev on localhost:3000
npm run build                # next build
npm run lint                 # next lint
```

## Architecture

### Smart Contracts (`contracts/contracts/`)
- **StakingToken.sol** — ERC-20 "STK" with 1M initial supply + owner mint
- **RewardToken.sol** — ERC-20 "RWD" with zero supply; ownership transferred to StakingPool which mints rewards
- **StakingPool.sol** — Core logic: `stake`, `unstake`, `claimReward`, `exit`. Uses Synthetix reward-per-token pattern for O(1) gas-efficient reward calculation. Protected with ReentrancyGuard and Ownable. `rewardRate` (tokens/sec) distributable proportionally across all stakers.

Deployment order matters: StakingToken → RewardToken → StakingPool → transfer RWD ownership to pool.

### Frontend (`frontend/src/`)
- **`lib/contracts.ts`** — Minimal ABIs and contract addresses from env vars. Supports chain IDs: Sepolia (11155111), Base Sepolia (84532), Mainnet (1).
- **`lib/wagmi.ts`** — Wagmi config with RainbowKit; chain selected via `NEXT_PUBLIC_CHAIN_ID`.
- **`hooks/useStakingPool.ts`** — Single hook for all contract reads (batched via `useReadContracts`). Auto-refetches every 5 seconds for live reward display.
- **`components/`** — `StatsDashboard` (pool + user stats), `StakeForm` (stake/unstake tabs with approval flow), `ClaimButton`, `StatCard`.
- **`app/providers.tsx`** — WagmiProvider + QueryClientProvider + RainbowKitProvider wrapping.

### Stack
- Solidity 0.8.24 / Hardhat / OpenZeppelin v5
- Next.js 14 / React 18 / TypeScript / Tailwind CSS
- Wagmi v2 / Viem v2 / RainbowKit v2 / TanStack React Query

## Environment Variables

Contracts need `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY` (see `contracts/.env.example`).

Frontend needs `NEXT_PUBLIC_STAKING_POOL_ADDRESS`, `NEXT_PUBLIC_STAKING_TOKEN_ADDRESS`, `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_CHAIN_ID` (see `frontend/.env.local.example`).
