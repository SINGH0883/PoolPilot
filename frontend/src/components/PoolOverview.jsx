import React from "react";
import { Coins, TrendingUp, Layers, Percent, Database, ArrowRightLeft } from "lucide-react";
import { formatTokenAmount, shortenAddress } from "../lib/ethereum";

export function PoolOverview({ poolState, account }) {
  const { reserve0, reserve1, token0, token1, totalLpSupply, userLpBalance, poolAddress } = poolState;

  // Compute exchange rate
  let rate0to1 = "0.0";
  let rate1to0 = "0.0";

  if (reserve0 > 0n && reserve1 > 0n) {
    const r0Num = Number(formatTokenAmount(reserve0, token0.decimals, 6));
    const r1Num = Number(formatTokenAmount(reserve1, token1.decimals, 6));
    if (r0Num > 0 && r1Num > 0) {
      rate0to1 = (r1Num / r0Num).toFixed(6);
      rate1to0 = (r0Num / r1Num).toFixed(4);
    }
  }

  // Compute user LP share percentage
  let userSharePct = "0.00%";
  if (totalLpSupply > 0n && userLpBalance > 0n) {
    const pct = (Number(userLpBalance) / Number(totalLpSupply)) * 100;
    userSharePct = pct < 0.01 ? "< 0.01%" : `${pct.toFixed(2)}%`;
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "1.5rem auto 0 auto", padding: "0 2rem" }}>
      <div className="stats-grid">
        {/* Reserve 0 Card */}
        <div className="glass-panel stat-card">
          <div className="stat-label">
            <Coins size={15} color="var(--accent-cyan)" />
            <span>Pool {token0.symbol} Reserve</span>
          </div>
          <div className="stat-value">
            {formatTokenAmount(reserve0, token0.decimals, 4)} {token0.symbol}
          </div>
          <div className="stat-sub">
            Contract: {shortenAddress(token0.address)}
          </div>
        </div>

        {/* Reserve 1 Card */}
        <div className="glass-panel stat-card">
          <div className="stat-label">
            <Coins size={15} color="var(--accent-violet)" />
            <span>Pool {token1.symbol} Reserve</span>
          </div>
          <div className="stat-value">
            {formatTokenAmount(reserve1, token1.decimals, 4)} {token1.symbol}
          </div>
          <div className="stat-sub">
            Contract: {shortenAddress(token1.address)}
          </div>
        </div>

        {/* Indicative Rate Card */}
        <div className="glass-panel stat-card">
          <div className="stat-label">
            <ArrowRightLeft size={15} color="var(--accent-emerald)" />
            <span>Indicative Rate</span>
          </div>
          <div className="stat-value" style={{ fontSize: "1.35rem" }}>
            1 {token1.symbol} ≈ {rate1to0} {token0.symbol}
          </div>
          <div className="stat-sub">
            1 {token0.symbol} ≈ {rate0to1} {token1.symbol}
          </div>
        </div>

        {/* LP Pool Share Card */}
        <div className="glass-panel stat-card">
          <div className="stat-label">
            <Layers size={15} color="var(--accent-indigo)" />
            <span>Your Pool Share</span>
          </div>
          <div className="stat-value">
            {userSharePct}
          </div>
          <div className="stat-sub">
            {formatTokenAmount(userLpBalance, 18, 4)} PLP Shares
          </div>
        </div>
      </div>
    </div>
  );
}
