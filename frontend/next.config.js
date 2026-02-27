/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ox (used by viem/wagmi) ships raw .ts with complex recursive types
    // that fail type-checking in Next.js builds — a known web3 ecosystem issue
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "encoding");
    // MetaMask SDK optionally imports react-native storage — stub it out
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

module.exports = nextConfig;
