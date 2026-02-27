# Staking DApp

A DeFi staking protocol built on EVM — stake STK tokens, earn RWD rewards every second.

**Live demo:** [staking-dapp-stk.vercel.app](https://staking-dapp-stk.vercel.app/)

## Tech Stack

| Layer | Tools |
|---|---|
| Smart Contracts | Solidity 0.8.24 + Hardhat + OpenZeppelin |
| Frontend | Next.js 14, wagmi v2, RainbowKit, Tailwind CSS |
| Testnet | Sepolia (or Base Sepolia) |
| Hosting | Vercel (frontend) |

---

## Getting Started

### 1. Smart Contracts

```bash
cd contracts
npm install
cp .env.example .env      # fill in your keys
npx hardhat compile
npx hardhat test           # run the full test suite
```

**Deploy to Sepolia:**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the printed addresses into `frontend/.env.local`.

**Verify on Etherscan (optional but recommended):**
```bash
npx hardhat verify --network sepolia <STAKING_POOL_ADDRESS> <STK_ADDRESS> <RWD_ADDRESS> <REWARD_RATE>
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # paste contract addresses + WalletConnect project ID
npm run dev                         # http://localhost:3000
```

### 3. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. Set **Root Directory** to `frontend`
4. Add the environment variables from `.env.local` in the Vercel dashboard
5. Deploy!

---

## Contract Architecture

```
StakingToken (STK)   — ERC-20 token users stake
RewardToken  (RWD)   — ERC-20 reward token; only StakingPool can mint
StakingPool          — Core logic: stake / unstake / claimReward / exit
```

Reward math uses the Synthetix **rewardPerTokenStored** pattern — gas-efficient,
no iteration over stakers required.

---

## Get Test Tokens

After deploying:
1. The deployer wallet receives 1,000,000 STK
2. Transfer some to your test wallet, or use MetaMask to add a custom token by address
3. Get Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com)

---

## License

MIT
