import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, baseSepolia, mainnet } from "wagmi/chains";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111);

const chainMap = {
  1: mainnet,
  11155111: sepolia,
  84532: baseSepolia,
} as const;

const activeChain = chainMap[chainId as keyof typeof chainMap] ?? sepolia;

export const wagmiConfig = getDefaultConfig({
  appName: "Staking DApp",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo",
  chains: [activeChain],
  ssr: true,
});

export { activeChain };
