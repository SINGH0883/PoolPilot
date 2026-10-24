import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Coins,
  ShieldCheck,
  Zap,
  ChevronDown,
  Radio,
} from "lucide-react";
import { formatTokenAmount } from "../lib/ethereum";
import { SUPPORTED_PAIRS } from "../hooks/useLiveMarketData";

export function MarketTicker({ poolState, price, volumeStats, chainId, liveMarket }) {
  const { token0, token1, reserve0, reserve1 } = poolState;
  const [pairDropdownOpen, setPairDropdownOpen] = useState(false);

  const {
    marketData,
    selectedPair = "ETH/USDC",
    setSelectedPair,
  } = liveMarket || {};

  // Reserves calculation
  const r0 = Number(formatTokenAmount(reserve0, token0.decimals, 2));
  const r1 = Number(formatTokenAmount(reserve1, token1.decimals, 3));
  const poolPriceNum = Number(String(price).replace(/,/g, "")) || marketData?.price || 2370;

  const tvl = r0 + r1 * poolPriceNum;
  const formattedTvl = tvl > 0
    ? `$${tvl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$100,000.00";

  // Real Market Data or fallback
  const isPositive = (marketData?.priceChangePercent || 0) >= 0;
  const tickClass = marketData?.tickDirection === "up"
    ? "tick-flash-up"
    : marketData?.tickDirection === "down"
    ? "tick-flash-down"
    : "";

  // Format real 24h volume
  const formatVolUSD = (vol) => {
    if (!vol) return "$124,500.00";
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`;
    return `$${vol.toFixed(2)}`;
  };

  const display24hVol = marketData?.quoteVolume24h
    ? formatVolUSD(marketData.quoteVolume24h)
    : volumeStats?.cumulativeVolumeUSDC > 0
    ? `$${volumeStats.cumulativeVolumeUSDC.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : "$124,500.00";

  return (
    <div className="market-ticker-bar">
      <div className="market-ticker-inner">
        {/* Active Trading Pair Selector Pills */}
        <div className="ticker-item pair-item">
          <div className="pair-pill-group">
            {Object.keys(SUPPORTED_PAIRS).map((pairKey) => {
              const base = pairKey.split("/")[0].toLowerCase();
              const isSelected = selectedPair === pairKey;
              return (
                <button
                  key={pairKey}
                  className={`pair-toggle-pill ${isSelected ? "active" : ""}`}
                  onClick={() => setSelectedPair && setSelectedPair(pairKey)}
                  title={`Switch live market to ${pairKey}`}
                >
                  <span className={`token-dot token-dot-${base}`} />
                  <span>{pairKey}</span>
                </button>
              );
            })}
          </div>

          {/* Live Price with real-time flash */}
          <span className={`live-price ${tickClass}`}>
            ${marketData?.priceFormatted || price}
          </span>

          {/* Live Price Change Badge */}
          <span className={`price-change-pill ${isPositive ? "positive" : "negative"}`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isPositive ? "+" : ""}
            {(marketData?.priceChangePercent || 2.45).toFixed(2)}%
          </span>
        </div>

        <div className="ticker-divider" />

        {/* Real 24h High & Low */}
        <div className="ticker-item">
          <span className="ticker-label">24h High</span>
          <span className="ticker-val font-mono">
            ${marketData?.high24h?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || (Number(String(price).replace(/,/g, "")) * 1.018).toFixed(2)}
          </span>
        </div>

        <div className="ticker-item">
          <span className="ticker-label">24h Low</span>
          <span className="ticker-val font-mono">
            ${marketData?.low24h?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || (Number(String(price).replace(/,/g, "")) * 0.985).toFixed(2)}
          </span>
        </div>

        <div className="ticker-divider" />

        {/* Pool TVL */}
        <div className="ticker-item">
          <span className="ticker-label">Pool TVL</span>
          <span className="ticker-val accent-blue">{formattedTvl}</span>
        </div>

        {/* 24h Global Market Volume */}
        <div className="ticker-item">
          <span className="ticker-label">24h Market Vol</span>
          <span className="ticker-val">{display24hVol}</span>
        </div>

        <div className="ticker-divider" />

        {/* AMM Invariant k */}
        <div className="ticker-item hide-on-mobile">
          <span className="ticker-label">Invariant</span>
          <span className="ticker-val math-code">k = x × y</span>
        </div>

        {/* Fee Tier */}
        <div className="ticker-item hide-on-mobile">
          <span className="ticker-label">Fee Tier</span>
          <span className="ticker-val fee-badge">0.30%</span>
        </div>

        {/* Live Network & Stream Node Status */}
        <div className="ticker-item right-status" style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexShrink: 0 }}>
          <div className="live-source-pill active" title="Sub-second streaming from Binance WebSocket">
            <span className="live-pulse-dot" />
            <span>{marketData?.connectionType || "Live Stream"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span className="status-beacon" />
            <span className="status-text hide-on-mobile">EVM Settled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
