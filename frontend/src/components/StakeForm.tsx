"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther, maxUint256 } from "viem";
import {
  STAKING_POOL_ABI,
  STAKING_POOL_ADDRESS,
  ERC20_ABI,
  STAKING_TOKEN_ADDRESS,
} from "@/lib/contracts";
import { useStakingPool } from "@/hooks/useStakingPool";

type Tab = "stake" | "unstake";

export function StakeForm() {
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>("stake");
  const [amount, setAmount] = useState("");
  const { allowance, stkBalance, userStaked, userStakedRaw, refetch } = useStakingPool();

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      onSuccess: () => {
        refetch();
        setAmount("");
      },
    },
  });

  const needsApproval = tab === "stake" && allowance < parseEther(amount || "0");
  const isLoading = isPending || isConfirming;

  function handleApprove() {
    writeContract({
      address: STAKING_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [STAKING_POOL_ADDRESS, maxUint256],
    });
  }

  function handleStake() {
    if (!amount) return;
    writeContract({
      address: STAKING_POOL_ADDRESS,
      abi: STAKING_POOL_ABI,
      functionName: "stake",
      args: [parseEther(amount)],
    });
  }

  function handleUnstake() {
    if (!amount) return;
    writeContract({
      address: STAKING_POOL_ADDRESS,
      abi: STAKING_POOL_ABI,
      functionName: "unstake",
      args: [parseEther(amount)],
    });
  }

  function handleMax() {
    setAmount(tab === "stake" ? stkBalance : userStaked);
  }

  if (!address) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-400">
        Connect your wallet to start staking
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden border border-gray-700">
        {(["stake", "unstake"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setAmount(""); }}
            className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-sky-600 text-white"
                : "bg-transparent text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Amount</span>
          <span>
            Available:{" "}
            <button onClick={handleMax} className="text-sky-400 hover:underline">
              {tab === "stake" ? stkBalance : userStaked} {tab === "stake" ? "STK" : "STK"}
            </button>
          </span>
        </div>
        <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-white text-sm outline-none"
          />
          <span className="px-4 text-gray-400 text-sm font-medium">STK</span>
        </div>
      </div>

      {/* Action button */}
      {tab === "stake" && needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 font-semibold text-black transition-colors"
        >
          {isLoading ? "Approving…" : "Approve STK"}
        </button>
      ) : (
        <button
          onClick={tab === "stake" ? handleStake : handleUnstake}
          disabled={isLoading || !amount}
          className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 font-semibold text-white transition-colors"
        >
          {isLoading
            ? "Confirming…"
            : tab === "stake"
            ? "Stake STK"
            : "Unstake STK"}
        </button>
      )}

      {txHash && (
        <p className="text-xs text-gray-500 text-center break-all">
          Tx: {txHash}
        </p>
      )}
    </div>
  );
}
