import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { POOL_ABI, ERC20_ABI } from "../config/abis";
import contractAddresses from "../config/contracts.json";

export function usePoolData(provider, account) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [poolState, setPoolState] = useState({
    poolAddress: contractAddresses.poolAddress,
    token0Address: contractAddresses.token0Address,
    token1Address: contractAddresses.token1Address,
    reserve0: 0n,
    reserve1: 0n,
    totalLpSupply: 0n,
    userLpBalance: 0n,
    token0: {
      address: contractAddresses.token0Address,
      symbol: "USDC",
      name: "USD Coin (Mock)",
      decimals: 18,
      userBalance: 0n,
      allowance: 0n,
    },
    token1: {
      address: contractAddresses.token1Address,
      symbol: "WETH",
      name: "Wrapped Ether (Mock)",
      decimals: 18,
      userBalance: 0n,
      allowance: 0n,
    },
  });

  const fetchPoolData = useCallback(async () => {
    if (!provider || !contractAddresses.poolAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const poolContract = new ethers.Contract(contractAddresses.poolAddress, POOL_ABI, provider);

      // Fetch reserves and LP supply
      const [reserves, totalLp] = await Promise.all([
        poolContract.getReserves(),
        poolContract.totalSupply(),
      ]);

      const t0Address = await poolContract.token0();
      const t1Address = await poolContract.token1();

      const token0Contract = new ethers.Contract(t0Address, ERC20_ABI, provider);
      const token1Contract = new ethers.Contract(t1Address, ERC20_ABI, provider);

      // Fetch token metadata
      const [sym0, name0, dec0, sym1, name1, dec1] = await Promise.all([
        token0Contract.symbol().catch(() => "TK0"),
        token0Contract.name().catch(() => "Token 0"),
        token0Contract.decimals().catch(() => 18),
        token1Contract.symbol().catch(() => "TK1"),
        token1Contract.name().catch(() => "Token 1"),
        token1Contract.decimals().catch(() => 18),
      ]);

      // If account connected, fetch user balances and allowances
      let bal0 = 0n;
      let bal1 = 0n;
      let allow0 = 0n;
      let allow1 = 0n;
      let userLp = 0n;

      if (account) {
        [bal0, bal1, allow0, allow1, userLp] = await Promise.all([
          token0Contract.balanceOf(account).catch(() => 0n),
          token1Contract.balanceOf(account).catch(() => 0n),
          token0Contract.allowance(account, contractAddresses.poolAddress).catch(() => 0n),
          token1Contract.allowance(account, contractAddresses.poolAddress).catch(() => 0n),
          poolContract.balanceOf(account).catch(() => 0n),
        ]);
      }

      setPoolState({
        poolAddress: contractAddresses.poolAddress,
        token0Address: t0Address,
        token1Address: t1Address,
        reserve0: reserves[0],
        reserve1: reserves[1],
        totalLpSupply: totalLp,
        userLpBalance: userLp,
        token0: {
          address: t0Address,
          symbol: sym0,
          name: name0,
          decimals: Number(dec0),
          userBalance: bal0,
          allowance: allow0,
        },
        token1: {
          address: t1Address,
          symbol: sym1,
          name: name1,
          decimals: Number(dec1),
          userBalance: bal1,
          allowance: allow1,
        },
      });
    } catch (err) {
      console.warn("Failed to fetch pool data:", err);
      setError("Unable to read pool state from connected RPC. Is your local node or testnet active?");
    } finally {
      setLoading(false);
    }
  }, [provider, account]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  return {
    poolState,
    loading,
    error,
    refresh: fetchPoolData,
  };
}
