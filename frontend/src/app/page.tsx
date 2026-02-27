import { ConnectButton } from "@rainbow-me/rainbowkit";
import { StatsDashboard } from "@/components/StatsDashboard";
import { StakeForm } from "@/components/StakeForm";
import { ClaimButton } from "@/components/ClaimButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sky-500 rounded-lg" />
          <span className="font-bold text-lg">StakeDApp</span>
        </div>
        <ConnectButton />
      </nav>

      {/* Hero */}
      <div className="text-center pt-14 pb-10 px-4">
        <h1 className="text-4xl font-extrabold mb-3">Stake STK. Earn RWD.</h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Deposit your STK tokens into the pool and earn reward tokens every second.
          Withdraw anytime, no lock-up.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 pb-20 space-y-6">
        <StatsDashboard />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StakeForm />
          <ClaimButton />
        </div>
      </div>
    </main>
  );
}
