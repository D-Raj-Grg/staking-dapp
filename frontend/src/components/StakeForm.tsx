"use client";

import { useState, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther, maxUint256, formatEther } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import {
  STAKING_POOL_ABI,
  STAKING_POOL_ADDRESS,
  ERC20_ABI,
  STAKING_TOKEN_ADDRESS,
} from "@/lib/contracts";
import { useStakingPool } from "@/hooks/useStakingPool";
import { getExplorerTxUrl } from "@/lib/chains";

type Tab = "stake" | "unstake";

const DECIMAL_REGEX = /^\d*\.?\d*$/;

export function StakeForm() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [tab, setTab] = useState<Tab>("stake");
  const [amount, setAmount] = useState("");
  const { allowance, stkBalance, userStaked, stkBalanceRaw, userStakedRaw, refetch } =
    useStakingPool();

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

  // Watch for confirmation and show success toast
  const handleSuccess = useCallback(
    (action: string) => {
      const url = txHash ? getExplorerTxUrl(txHash) : null;
      toast.success(`${action} confirmed!`, {
        description: url ? undefined : `Tx: ${txHash?.slice(0, 10)}...`,
        action: url
          ? {
              label: "View on Explorer",
              onClick: () => window.open(url, "_blank"),
            }
          : undefined,
      });
      refetch();
      setAmount("");
    },
    [txHash, refetch],
  );

  const needsApproval = tab === "stake" && allowance < parseEther(amount || "0");
  const isLoading = isPending || isConfirming;

  function handleInputChange(value: string) {
    if (value === "" || DECIMAL_REGEX.test(value)) {
      setAmount(value);
    }
  }

  function handleApprove() {
    toast.loading("Waiting for approval...", { id: "tx" });
    writeContract(
      {
        address: STAKING_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [STAKING_POOL_ADDRESS, maxUint256],
      },
      {
        onSuccess: () => {
          toast.success("Approval confirmed!", { id: "tx" });
          refetch();
        },
        onError: () => toast.dismiss("tx"),
      },
    );
  }

  function handleStake() {
    if (!amount) return;
    toast.loading("Staking...", { id: "tx" });
    writeContract(
      {
        address: STAKING_POOL_ADDRESS,
        abi: STAKING_POOL_ABI,
        functionName: "stake",
        args: [parseEther(amount)],
      },
      {
        onSuccess: () => handleSuccess("Stake"),
        onError: () => toast.dismiss("tx"),
      },
    );
  }

  function handleUnstake() {
    if (!amount) return;
    toast.loading("Unstaking...", { id: "tx" });
    writeContract(
      {
        address: STAKING_POOL_ADDRESS,
        abi: STAKING_POOL_ABI,
        functionName: "unstake",
        args: [parseEther(amount)],
      },
      {
        onSuccess: () => handleSuccess("Unstake"),
        onError: () => toast.dismiss("tx"),
      },
    );
  }

  function handleMax() {
    const raw = tab === "stake" ? stkBalanceRaw : userStakedRaw;
    setAmount(raw > 0n ? formatEther(raw) : "");
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
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
        <p className="text-gray-400 mb-4">Connect your wallet to start staking</p>
        <button
          onClick={openConnectModal}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold text-sm hover:brightness-110 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden bg-gray-800/50 p-1 gap-1">
        {(["stake", "unstake"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setAmount("");
            }}
            className={`flex-1 py-2 text-sm font-medium capitalize rounded-lg transition-all ${
              tab === t
                ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Amount</span>
          <span>
            Available:{" "}
            <button onClick={handleMax} className="text-sky-400 hover:text-sky-300 transition">
              {tab === "stake" ? stkBalance : userStaked} STK
            </button>
          </span>
        </div>
        <div className="flex items-center bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => handleInputChange(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-white text-sm outline-none font-[var(--font-mono)]"
          />
          <span className="px-4 text-gray-400 text-sm font-medium">STK</span>
        </div>
      </div>

      {/* Action button */}
      {tab === "stake" && needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 font-semibold text-black transition-all"
        >
          {isLoading ? "Approving..." : "Approve STK"}
        </button>
      ) : (
        <button
          onClick={tab === "stake" ? handleStake : handleUnstake}
          disabled={isLoading || !amount}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 font-semibold text-white transition-all"
        >
          {isLoading
            ? "Confirming..."
            : tab === "stake"
              ? "Stake STK"
              : "Unstake STK"}
        </button>
      )}
    </div>
  );
}
