"use client";

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { STAKING_POOL_ABI, STAKING_POOL_ADDRESS } from "@/lib/contracts";
import { useStakingPool } from "@/hooks/useStakingPool";
import { getExplorerTxUrl } from "@/lib/chains";

export function ClaimButton() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { userEarned, rwdBalance, userEarnedRaw, refetch } = useStakingPool();

  const { writeContract, data: txHash, isPending } = useWriteContract({
    mutation: {
      onError: (err) => {
        const msg = err.message.includes("User rejected")
          ? "Transaction rejected"
          : err.message.slice(0, 120);
        toast.error(msg);
      },
    },
  });

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
    },
  });

  const isLoading = isPending || isConfirming;
  const hasRewards = userEarnedRaw > 0n;

  function handleClaim() {
    toast.loading("Claiming rewards...", { id: "claim-tx" });
    writeContract(
      {
        address: STAKING_POOL_ADDRESS,
        abi: STAKING_POOL_ABI,
        functionName: "claimReward",
      },
      {
        onSuccess: (hash) => {
          const url = getExplorerTxUrl(hash);
          toast.success("Rewards claimed!", {
            id: "claim-tx",
            action: url
              ? {
                  label: "View on Explorer",
                  onClick: () => window.open(url, "_blank"),
                }
              : undefined,
          });
          refetch();
        },
        onError: () => toast.dismiss("claim-tx"),
      },
    );
  }

  if (!address) {
    return (
      <div className="glass-card p-8 text-center">
        <svg
          className="mx-auto mb-4 text-gray-500"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 18V6" />
        </svg>
        <p className="text-gray-400 mb-4">Connect your wallet to view rewards</p>
        <button
          onClick={openConnectModal}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:brightness-110 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">Rewards</h3>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-emerald-400 font-[var(--font-mono)]">
              {userEarned} RWD
            </p>
            {hasRewards && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Wallet balance: {rwdBalance} RWD
          </p>
        </div>
        <button
          onClick={handleClaim}
          disabled={isLoading || !hasRewards}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 font-semibold text-white text-sm transition-all"
        >
          {isLoading ? "Claiming..." : "Claim RWD"}
        </button>
      </div>
    </div>
  );
}
