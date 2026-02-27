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
    query: { refetchInterval: 5_000 }, // refresh every 5s so earned ticks up
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

  const fmt = (v: bigint | undefined) =>
    v !== undefined ? parseFloat(formatEther(v)).toFixed(4) : "—";

  return {
    isLoading,
    refetch,
    totalStaked: fmt(totalStaked?.result as bigint),
    apy: apyBP?.result ? `${(Number(apyBP.result as bigint) / 100).toFixed(2)}%` : "—",
    rewardRate: fmt(rewardRate?.result as bigint),
    userStaked: fmt(userStaked?.result as bigint),
    userEarned: fmt(userEarned?.result as bigint),
    stkBalance: fmt(stkBalance?.result as bigint),
    rwdBalance: fmt(rwdBalance?.result as bigint),
    allowance: (allowance?.result as bigint) ?? 0n,
    // raw values for contract writes
    userStakedRaw: (userStaked?.result as bigint) ?? 0n,
  };
}
