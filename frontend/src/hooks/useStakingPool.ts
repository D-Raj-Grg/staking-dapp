"use client";

import { useReadContracts, useAccount } from "wagmi";
import { formatEther } from "viem";
import {
  STAKING_POOL_ABI,
  STAKING_POOL_ADDRESS,
  ERC20_ABI,
  STAKING_TOKEN_ADDRESS,
  REWARD_TOKEN_ADDRESS,
} from "@/lib/contracts";

function formatTokenAmount(v: bigint | undefined): string {
  if (v === undefined) return "—";
  const num = parseFloat(formatEther(v));
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatAPY(basisPoints: bigint | undefined): string {
  if (basisPoints === undefined) return "—";
  const pct = Number(basisPoints) / 100;
  if (pct >= 1_000_000) return `${(pct / 1_000_000).toFixed(1)}M%`;
  if (pct >= 1_000) return `${(pct / 1_000).toFixed(1)}K%`;
  return `${pct.toFixed(2)}%`;
}

export function useStakingPool() {
  const { address } = useAccount();

  const poolContract = { address: STAKING_POOL_ADDRESS, abi: STAKING_POOL_ABI } as const;
  const stkContract = { address: STAKING_TOKEN_ADDRESS, abi: ERC20_ABI } as const;
  const rwdContract = { address: REWARD_TOKEN_ADDRESS, abi: ERC20_ABI } as const;

  const { data, refetch, isLoading } = useReadContracts({
    contracts: [
      { ...poolContract, functionName: "totalStaked" },
      { ...poolContract, functionName: "getAPYBasisPoints" },
      { ...poolContract, functionName: "rewardRate" },
      // user-specific reads (only meaningful when connected)
      { ...poolContract, functionName: "stakedBalance", args: address ? [address] : undefined },
      { ...poolContract, functionName: "earned", args: address ? [address] : undefined },
      { ...stkContract, functionName: "balanceOf", args: address ? [address] : undefined },
      { ...rwdContract, functionName: "balanceOf", args: address ? [address] : undefined },
      {
        ...stkContract,
        functionName: "allowance",
        args: address ? [address, STAKING_POOL_ADDRESS] : undefined,
      },
    ],
    query: { refetchInterval: 5_000 },
  });

  const [
    totalStaked,
    apyBP,
    rewardRate,
    userStaked,
    userEarned,
    stkBalance,
    rwdBalance,
    allowance,
  ] = data ?? [];

  return {
    isLoading,
    refetch,
    totalStaked: formatTokenAmount(totalStaked?.result as bigint),
    apy: formatAPY(apyBP?.result as bigint),
    rewardRate: formatTokenAmount(rewardRate?.result as bigint),
    userStaked: formatTokenAmount(userStaked?.result as bigint),
    userEarned: formatTokenAmount(userEarned?.result as bigint),
    stkBalance: formatTokenAmount(stkBalance?.result as bigint),
    rwdBalance: formatTokenAmount(rwdBalance?.result as bigint),
    allowance: (allowance?.result as bigint) ?? 0n,
    // raw values for contract writes & max buttons
    stkBalanceRaw: (stkBalance?.result as bigint) ?? 0n,
    userStakedRaw: (userStaked?.result as bigint) ?? 0n,
    userEarnedRaw: (userEarned?.result as bigint) ?? 0n,
  };
}
