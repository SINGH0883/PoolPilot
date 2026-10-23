import React from "react";
import { DollarSign, BarChart3, Coins, Layers, ArrowRightLeft } from "lucide-react";
import { formatTokenAmount, shortenAddress } from "../lib/ethereum";

export function TraderMetrics({ poolState, volumeStats }) {
  const { reserve0, reserve1, token0, token1, totalLpSupply, userLpBalance } = poolState;

  // Calculate indicative rate
  let rate0to1 = "0.0";
  let rate1to0 = 0;
  let formattedRate = "0.0";

  const r0Num = Number(formatTokenAmount(reserve0, token0.decimals, 6));
  const r1Num = Number(formatTokenAmount(reserve1, token1.decimals, 6));

  if (r0Num > 0 && r1Num > 0) {
    rate0to1 = (r1Num / r0Num).toFixed(6);
    rate1to0 = r0Num / r1Num;
    formattedRate = rate1to0.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Calculate TVL in USD: Reserve0 + (Reserve1 * Price)
  const tvlUSD = r0Num + (r1Num * rate1to0);
  const formattedTVL = tvlUSD > 0
    ? `$${tvlUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$0.00";

  // Calculate Reserve Percentages for Depth Meter
  const totalValueNum = tvlUSD > 0 ? tvlUSD : 1;
  const pct0 = ((r0Num / totalValueNum) * 100).toFixed(1);
  const pct1 = (((r1Num * rate1to0) / totalValueNum) * 100).toFixed(1);

  // Formatted Volume & Fees
  const formattedVolume = `$${volumeStats.cumulativeVolumeUSDC.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedFees = `$${volumeStats.cumulativeFeesUSDC.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* 4 Top KPI Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* TVL */}
        <div className="glass-panel" style={{ padding: "1.1rem" }}>
          <div className="stat-label">
            <DollarSign size={15} color="var(--accent-blue)" />
            <span>Total Value Locked</span>
          </div>
          <div className="stat-value" style={{ fontSize: "1.45rem" }}>
            {formattedTVL}
          </div>
          <div className="stat-sub">
            {formatTokenAmount(reserve0, token0.decimals, 2)} {token0.symbol} + {formatTokenAmount(reserve1, token1.decimals, 2)} {token1.symbol}
          </div>
        </div>

        {/* Cumulative Volume */}
        <div className="glass-panel" style={{ padding: "1.1rem" }}>
          <div className="stat-label">
            <BarChart3 size={15} color="var(--accent-cyan)" />
            <span>Total Volume Traded</span>
          </div>
          <div className="stat-value" style={{ fontSize: "1.45rem" }}>
            {formattedVolume}
          </div>
          <div className="stat-sub">
            {volumeStats.totalSwapsCount} confirmed swaps
          </div>
        </div>

        {/* LP Fees Generated */}
        <div className="glass-panel" style={{ padding: "1.1rem" }}>
          <div className="stat-label">
            <Coins size={15} color="var(--accent-emerald)" />
            <span>LP Fees Generated</span>
          </div>
          <div className="stat-value" style={{ fontSize: "1.45rem", color: "var(--accent-emerald)" }}>
            {formattedFees}
          </div>
          <div className="stat-sub">
            0.30% fee retained in reserves
          </div>
        </div>

        {/* Indicative Rate */}
        <div className="glass-panel" style={{ padding: "1.1rem" }}>
          <div className="stat-label">
            <ArrowRightLeft size={15} color="var(--accent-violet)" />
            <span>Exchange Price</span>
          </div>
          <div className="stat-value" style={{ fontSize: "1.45rem" }}>
            ${formattedRate}
          </div>
          <div className="stat-sub">
            1 {token1.symbol} = {formattedRate} {token0.symbol}
          </div>
        </div>
      </div>

      {/* Pool Reserve Ratio & Depth Meter */}
      <div className="glass-panel" style={{ padding: "1.1rem 1.4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Pool Reserve Ratio & Asset Depth
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
            Invariant: k = x × y
          </span>
        </div>

        {/* Depth Meter Bar */}
        <div
          style={{
            height: "10px",
            borderRadius: "var(--radius-full)",
            background: "var(--tab-container-bg)",
            overflow: "hidden",
            display: "flex",
            margin: "0.5rem 0",
          }}
        >
          <div
            style={{
              width: `${pct0}%`,
              background: "linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)",
              transition: "width 0.4s ease",
            }}
            title={`${token0.symbol}: ${pct0}%`}
          />
          <div
            style={{
              width: `${pct1}%`,
              background: "linear-gradient(90deg, #8B5CF6 0%, #A855F7 100%)",
              transition: "width 0.4s ease",
            }}
            title={`${token1.symbol}: ${pct1}%`}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginTop: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#2563EB" }} />
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{token0.symbol} ({pct0}%):</span>
            <span style={{ color: "var(--text-secondary)" }}>{formatTokenAmount(reserve0, token0.decimals, 2)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#8B5CF6" }} />
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{token1.symbol} ({pct1}%):</span>
            <span style={{ color: "var(--text-secondary)" }}>{formatTokenAmount(reserve1, token1.decimals, 2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
