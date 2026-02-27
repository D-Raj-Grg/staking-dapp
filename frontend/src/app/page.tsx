import { ConnectButton } from "@rainbow-me/rainbowkit";
import { StatsDashboard } from "@/components/StatsDashboard";
import { StakeForm } from "@/components/StakeForm";
import { ClaimButton } from "@/components/ClaimButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { activeChain, getExplorerAddressUrl } from "@/lib/chains";
import { STAKING_POOL_ADDRESS } from "@/lib/contracts";

export default function Home() {
  const contractUrl = getExplorerAddressUrl(STAKING_POOL_ADDRESS);

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-gray-800/50 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 32 32" className="shrink-0">
              <defs>
                <linearGradient id="nav-g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="#1e293b" />
              <path
                d="M21.5 11.5c0-1.5-1.2-3-3.5-3h-5.5v5.5h5c1.8 0 3-.8 3-2.5zM18 15.5h-5.5v5.5H18c2.3 0 3.5-1.5 3.5-3s-1.2-2.5-3.5-2.5z"
                fill="none"
                stroke="url(#nav-g)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M10 9v14" stroke="url(#nav-g)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="font-bold text-lg text-white">StakeDApp</span>
          </div>
          <ConnectButton />
        </div>
      </nav>

      {/* Hero */}
      <div className="relative text-center pt-16 pb-12 px-4 bg-radial-hero">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-6">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-400" />
          </span>
          Live on {activeChain.name}
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          Stake STK.{" "}
          <span className="text-gradient">Earn RWD.</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto text-lg">
          Deposit your STK tokens into the pool and earn reward tokens every second.
          Withdraw anytime — no lock-up.
        </p>
      </div>

      {/* Content */}
      <ErrorBoundary>
        <div className="max-w-6xl mx-auto px-4 pb-20 space-y-6">
          <StatsDashboard />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StakeForm />
            <ClaimButton />
          </div>
        </div>
      </ErrorBoundary>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>
            Built with Solidity, Hardhat, Next.js, and Wagmi
          </span>
          {contractUrl && (
            <a
              href={contractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-sky-400 transition"
            >
              View Contract on {activeChain.name}
            </a>
          )}
        </div>
      </footer>
    </main>
  );
}
