"use client";

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { STAKING_POOL_ABI, STAKING_POOL_ADDRESS } from "@/lib/contracts";
import { useStakingPool } from "@/hooks/useStakingPool";

export function ClaimButton() {
  const { address } = useAccount();
  const { userEarned, rwdBalance, refetch } = useStakingPool();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { onSuccess: () => refetch() },
  });

  if (!address) return null;

  const isLoading = isPending || isConfirming;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">Rewards</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-emerald-400">{userEarned} RWD</p>
          <p className="text-xs text-gray-400 mt-1">Wallet balance: {rwdBalance} RWD</p>
        </div>
        <button
          onClick={() =>
            writeContract({
              address: STAKING_POOL_ADDRESS,
              abi: STAKING_POOL_ABI,
              functionName: "claimReward",
            })
          }
          disabled={isLoading || userEarned === "0.0000"}
          className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-semibold text-white text-sm transition-colors"
        >
          {isLoading ? "Claiming…" : "Claim RWD"}
        </button>
      </div>
    </div>
  );
}
