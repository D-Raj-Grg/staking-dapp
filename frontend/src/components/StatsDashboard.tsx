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
        value={`${totalStaked} STK`}
        isLoading={isLoading}
        accent="brand"
      />
      <StatCard
        label="APY"
        value={apy}
        sub="Variable — based on total staked"
        isLoading={isLoading}
        accent="emerald"
      />
      {address ? (
        <>
          <StatCard
            label="Your Staked"
            value={`${userStaked} STK`}
            isLoading={isLoading}
            accent="amber"
          />
          <StatCard
            label="Wallet Balance"
            value={`${stkBalance} STK`}
            isLoading={isLoading}
          />
        </>
      ) : (
        <>
          <StatCard label="Your Staked" value="—" sub="Connect wallet to view" />
          <StatCard label="Wallet Balance" value="—" sub="Connect wallet to view" />
        </>
      )}
    </div>
  );
}
