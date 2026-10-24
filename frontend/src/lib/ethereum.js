import { ethers } from "ethers";

/**
 * Format bigint units to human-readable string with specified decimal precision.
 */
export function formatTokenAmount(amount, decimals = 18, maxDecimals = 4) {
  if (amount === undefined || amount === null) return "0.0";
  try {
    const rawStr = ethers.formatUnits(amount, decimals);
    const parts = rawStr.split(".");
    if (parts.length === 1) return parts[0];
    const fraction = parts[1].slice(0, maxDecimals);
    return fraction ? `${parts[0]}.${fraction}` : parts[0];
  } catch {
    return "0.0";
  }
}

/**
 * Parse human input string to exact bigint base units.
 */
export function parseTokenAmount(input, decimals = 18) {
  if (!input || isNaN(Number(input)) || Number(input) <= 0) return 0n;
  try {
    // Truncate input string to max decimals if user entered more than allowed
    const parts = input.trim().split(".");
    let sanitized = parts[0];
    if (parts.length > 1) {
      sanitized += "." + parts[1].slice(0, decimals);
    }
    return ethers.parseUnits(sanitized, decimals);
  } catch {
    return 0n;
  }
}

/**
 * Calculate minimum output amount applying user-defined slippage percentage.
 * @param {bigint} amountOut Expected output amount
 * @param {number} slippagePercent e.g. 0.5 for 0.5%
 * @returns {bigint} Minimum acceptable amountOut
 */
export function calculateSlippageMin(amountOut, slippagePercent) {
  if (!amountOut || amountOut <= 0n) return 0n;
  const basisPoints = Math.round(Number(slippagePercent) * 100); // 0.5% -> 50 bps
  const safeBps = Math.min(Math.max(basisPoints, 1), 5000); // between 0.01% and 50%
  const multiplier = 10000n - BigInt(safeBps);
  return (amountOut * multiplier) / 10000n;
}

/**
 * Shorten hex address for display (0x1234...abcd)
 */
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Extract user-friendly error message from contract revert or wallet rejection.
 */
export function parseContractError(error) {
  if (!error) return "Unknown error occurred";
  if (error.code === 4001 || error.code === "ACTION_REJECTED") {
    return "Transaction signature rejected in wallet.";
  }
  if (error.reason) return error.reason;
  if (error.data) {
    // Check known custom errors
    const errorStr = String(error.data);
    if (errorStr.includes("InsufficientOutputAmount")) return "Slippage error: Output amount lower than minimum specified.";
    if (errorStr.includes("DeadlineExpired")) return "Transaction deadline expired before confirmation.";
    if (errorStr.includes("ZeroAmount")) return "Amount cannot be zero.";
    if (errorStr.includes("InsufficientLiquidity")) return "Pool does not have enough liquidity for this trade.";
    if (errorStr.includes("ERC20InsufficientBalance")) return "Insufficient token balance in your wallet.";
    if (errorStr.includes("ERC20InsufficientAllowance")) return "Insufficient allowance. Please approve the token first.";
  }
  if (error.message) {
    if (error.message.includes("user rejected action") || error.message.includes("User rejected")) {
      return "Transaction rejected by user.";
    }
    if (error.message.includes("insufficient funds")) {
      return "Insufficient gas funds (ETH) in account to pay transaction fee.";
    }
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("fetch failed") ||
      error.code === "SERVER_ERROR"
    ) {
      return "Unable to reach RPC node at http://127.0.0.1:8545. Please check that your local Hardhat/Anvil node is running.";
    }
    if (error.message.length < 120) return error.message;
  }
  return "Transaction reverted by the smart contract.";
}

/**
 * Supported chain IDs and explorer URLs.
 */
export const SUPPORTED_NETWORKS = {
  31337: {
    name: "Hardhat / Anvil Local",
    isTestnet: true,
    explorerUrl: null,
  },
  11155111: {
    name: "Ethereum Sepolia",
    isTestnet: true,
    explorerUrl: "https://sepolia.etherscan.io",
  },
  84532: {
    name: "Base Sepolia",
    isTestnet: true,
    explorerUrl: "https://sepolia.basescan.org",
  },
  421614: {
    name: "Arbitrum Sepolia",
    isTestnet: true,
    explorerUrl: "https://sepolia.arbiscan.io",
  },
};
