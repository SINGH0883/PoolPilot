import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { POOL_ABI, ERC20_ABI } from "../config/abis";
import contractAddresses from "../config/contracts.json";

export function usePoolData(provider, account) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Baseline active liquidity for hosted / demo environments
  const getInitialPoolState = () => {
    let savedReserves = null;
    try {
      const stored = localStorage.getItem("poolpilot_hosted_reserves");
      if (stored) savedReserves = JSON.parse(stored);
    } catch {}

    const r0 = savedReserves?.reserve0 ? BigInt(savedReserves.reserve0) : ethers.parseUnits("914444", 18);
    const r1 = savedReserves?.reserve1 ? BigInt(savedReserves.reserve1) : ethers.parseUnits("386.5", 18);
    const lp = savedReserves?.totalLp ? BigInt(savedReserves.totalLp) : ethers.parseUnits("18800", 18);

    // Check account demo balance in localStorage
    let demoBal0 = 0n;
    let demoBal1 = 0n;
    let demoLp = 0n;
    if (account) {
      try {
        const storedBal = localStorage.getItem(`poolpilot_demo_balances_${account.toLowerCase()}`);
        if (storedBal) {
          const parsed = JSON.parse(storedBal);
          if (parsed.usdc) demoBal0 = ethers.parseUnits(String(parsed.usdc), 18);
          if (parsed.weth) demoBal1 = ethers.parseUnits(String(parsed.weth), 18);
          if (parsed.lp) demoLp = ethers.parseUnits(String(parsed.lp), 18);
        }
      } catch {}
    }

    return {
      poolAddress: contractAddresses.poolAddress,
      token0Address: contractAddresses.token0Address,
      token1Address: contractAddresses.token1Address,
      reserve0: r0,
      reserve1: r1,
      totalLpSupply: lp,
      userLpBalance: demoLp,
      token0: {
        address: contractAddresses.token0Address,
        symbol: "USDC",
        name: "USD Coin (Mock)",
        decimals: 18,
        userBalance: demoBal0,
        allowance: ethers.parseUnits("1000000000", 18),
      },
      token1: {
        address: contractAddresses.token1Address,
        symbol: "WETH",
        name: "Wrapped Ether (Mock)",
        decimals: 18,
        userBalance: demoBal1,
        allowance: ethers.parseUnits("1000000000", 18),
      },
    };
  };

  const [poolState, setPoolState] = useState(getInitialPoolState);

  const fetchPoolData = useCallback(async () => {
    // If no provider or no pool address, just refresh from state/localStorage
    if (!provider || !contractAddresses.poolAddress) {
      setPoolState(getInitialPoolState());
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
        token0Contract.symbol().catch(() => "USDC"),
        token0Contract.name().catch(() => "USD Coin (Mock)"),
        token0Contract.decimals().catch(() => 18),
        token1Contract.symbol().catch(() => "WETH"),
        token1Contract.name().catch(() => "Wrapped Ether (Mock)"),
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

        // Sync demo balances from localStorage
        try {
          const storedBal = localStorage.getItem(`poolpilot_demo_balances_${account.toLowerCase()}`);
          if (storedBal) {
            const parsed = JSON.parse(storedBal);
            if (parsed.usdc && Number(parsed.usdc) > 0) {
              const demo0 = ethers.parseUnits(String(parsed.usdc), 18);
              if (demo0 > bal0) bal0 = demo0;
            }
            if (parsed.weth && Number(parsed.weth) > 0) {
              const demo1 = ethers.parseUnits(String(parsed.weth), 18);
              if (demo1 > bal1) bal1 = demo1;
            }
            if (parsed.lp && Number(parsed.lp) > 0) {
              const demoLpVal = ethers.parseUnits(String(parsed.lp), 18);
              if (demoLpVal > userLp) userLp = demoLpVal;
            }
          }
        } catch {}
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
      // In hosted/Vercel environment where local RPC is unreachable, gracefully fall back to active demo pool
      setPoolState(getInitialPoolState());
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
