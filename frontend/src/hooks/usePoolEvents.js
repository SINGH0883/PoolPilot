import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { POOL_ABI } from "../config/abis";
import { formatTokenAmount } from "../lib/ethereum";

export function usePoolEvents(provider, poolState, account) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [volumeStats, setVolumeStats] = useState({
    cumulativeVolumeUSDC: 0,
    cumulativeFeesUSDC: 0,
    totalSwapsCount: 0,
    totalLiquidityCount: 0,
  });

  const fetchEvents = useCallback(async () => {
    if (!provider || !poolState.poolAddress) return;

    try {
      setLoading(true);
      setError(null);

      const poolContract = new ethers.Contract(poolState.poolAddress, POOL_ABI, provider);

      // Query past events from genesis block 0
      const [swapLogs, mintLogs, burnLogs] = await Promise.all([
        poolContract.queryFilter(poolContract.filters.Swap(), 0).catch(() => []),
        poolContract.queryFilter(poolContract.filters.Mint(), 0).catch(() => []),
        poolContract.queryFilter(poolContract.filters.Burn(), 0).catch(() => []),
      ]);

      const formatted = [];
      let totalVolumeUSDC = 0;
      let totalFeesUSDC = 0;

      // Parse Swaps
      for (const log of swapLogs) {
        const { sender, recipient, tokenIn, amountIn, amountOut } = log.args;
        const isToken0In = tokenIn.toLowerCase() === poolState.token0.address.toLowerCase();

        const inToken = isToken0In ? poolState.token0 : poolState.token1;
        const outToken = isToken0In ? poolState.token1 : poolState.token0;

        const formattedIn = formatTokenAmount(amountIn, inToken.decimals, 4);
        const formattedOut = formatTokenAmount(amountOut, outToken.decimals, 4);

        // Calculate USD volume equivalent based on USDC amount
        const usdcAmount = isToken0In
          ? Number(ethers.formatUnits(amountIn, inToken.decimals))
          : Number(ethers.formatUnits(amountOut, outToken.decimals));

        totalVolumeUSDC += usdcAmount;
        totalFeesUSDC += usdcAmount * 0.003; // 0.30% fee

        // Indicative price calculation
        const inNum = Number(ethers.formatUnits(amountIn, inToken.decimals));
        const outNum = Number(ethers.formatUnits(amountOut, outToken.decimals));
        let execPrice = "—";
        if (inNum > 0 && outNum > 0) {
          if (isToken0In) {
            execPrice = `1 ${outToken.symbol} = ${(inNum / outNum).toFixed(2)} ${inToken.symbol}`;
          } else {
            execPrice = `1 ${inToken.symbol} = ${(outNum / inNum).toFixed(2)} ${outToken.symbol}`;
          }
        }

        formatted.push({
          type: "SWAP",
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          sender,
          recipient,
          tokenInSymbol: inToken.symbol,
          tokenOutSymbol: outToken.symbol,
          amountInFormatted: formattedIn,
          amountOutFormatted: formattedOut,
          execPrice,
          isUserTx: account && (sender.toLowerCase() === account.toLowerCase() || recipient.toLowerCase() === account.toLowerCase()),
        });
      }

      // Parse Mints (Add Liquidity)
      for (const log of mintLogs) {
        const { sender, to, amount0, amount1, shares } = log.args;
        formatted.push({
          type: "ADD_LIQUIDITY",
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          sender,
          to,
          token0Symbol: poolState.token0.symbol,
          token1Symbol: poolState.token1.symbol,
          amount0Formatted: formatTokenAmount(amount0, poolState.token0.decimals, 4),
          amount1Formatted: formatTokenAmount(amount1, poolState.token1.decimals, 4),
          sharesFormatted: formatTokenAmount(shares, 18, 4),
          isUserTx: account && (sender.toLowerCase() === account.toLowerCase() || to.toLowerCase() === account.toLowerCase()),
        });
      }

      // Parse Burns (Remove Liquidity)
      for (const log of burnLogs) {
        const { sender, to, amount0, amount1, shares } = log.args;
        formatted.push({
          type: "REMOVE_LIQUIDITY",
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          sender,
          to,
          token0Symbol: poolState.token0.symbol,
          token1Symbol: poolState.token1.symbol,
          amount0Formatted: formatTokenAmount(amount0, poolState.token0.decimals, 4),
          amount1Formatted: formatTokenAmount(amount1, poolState.token1.decimals, 4),
          sharesFormatted: formatTokenAmount(shares, 18, 4),
          isUserTx: account && (sender.toLowerCase() === account.toLowerCase() || to.toLowerCase() === account.toLowerCase()),
        });
      }

      // Sort newest blocks first
      formatted.sort((a, b) => b.blockNumber - a.blockNumber);
      setEvents(formatted);

      setVolumeStats({
        cumulativeVolumeUSDC: totalVolumeUSDC,
        cumulativeFeesUSDC: totalFeesUSDC,
        totalSwapsCount: swapLogs.length,
        totalLiquidityCount: mintLogs.length + burnLogs.length,
      });
    } catch (err) {
      console.warn("Failed to fetch pool events:", err);
      setError("Could not load on-chain event history.");
    } finally {
      setLoading(false);
    }
  }, [provider, poolState.poolAddress, poolState.token0, poolState.token1, account]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    volumeStats,
    loading,
    error,
    refreshEvents: fetchEvents,
  };
}
