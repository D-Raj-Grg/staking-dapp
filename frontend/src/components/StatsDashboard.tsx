"use client";

import { useStakingPool } from "@/hooks/useStakingPool";
import { StatCard } from "./StatCard";
import { useAccount } from "wagmi";

export function StatsDashboard() {
  const { totalStaked, apy, userStaked, stkBalance, isLoading } = useStakingPool();
  const { address } = useAccount();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Total Value Locked"
        value={isLoading ? "…" : `${totalStaked} STK`}
      />
      <StatCard
        label="APY"
        value={isLoading ? "…" : apy}
        sub="Variable — based on total staked"
      />
      {address ? (
        <>
          <StatCard
            label="Your Staked"
            value={isLoading ? "…" : `${userStaked} STK`}
          />
          <StatCard
            label="Wallet Balance"
            value={isLoading ? "…" : `${stkBalance} STK`}
          />
        </>
      ) : (
        <>
          <StatCard label="Your Staked" value="—" sub="Connect wallet" />
          <StatCard label="Wallet Balance" value="—" sub="Connect wallet" />
        </>
      )}
    </div>
  );
}
