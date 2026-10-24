import React, { useState, useMemo } from "react";
import { TrendingUp, Activity, BarChart2, Compass, ArrowUpRight, ArrowDownRight, Layers, Sliders, ExternalLink } from "lucide-react";
import { formatTokenAmount, shortenAddress } from "../lib/ethereum";

export function TradingChart({ poolState, events, price, volumeStats }) {
  const { token0, token1, reserve0, reserve1 } = poolState;
  const currentPriceNum = Number(price.replace(/,/g, "")) || 2500;

  const [chartMode, setChartMode] = useState("price"); // "price" | "bondingCurve" | "trades"
  const [timeframe, setTimeframe] = useState("24H"); // "1H" | "24H" | "7D" | "30D"
  const [hoverIndex, setHoverIndex] = useState(null);
  const [simTradeAmount, setSimTradeAmount] = useState(2500); // 2500 USDC default trade simulation

  // Generate realistic price points centered around currentPriceNum
  const pricePoints = useMemo(() => {
    const pointsCount = timeframe === "1H" ? 20 : timeframe === "24H" ? 28 : timeframe === "7D" ? 35 : 45;
    const base = currentPriceNum;
    const data = [];
    const now = Date.now();
    const interval = timeframe === "1H" ? 3 * 60 * 1000 : timeframe === "24H" ? 50 * 60 * 1000 : timeframe === "7D" ? 5 * 3600 * 1000 : 20 * 3600 * 1000;

    let p = base * (timeframe === "30D" ? 0.92 : timeframe === "7D" ? 0.96 : 0.985);
    for (let i = pointsCount - 1; i >= 0; i--) {
      const time = new Date(now - i * interval);
      // Random walk with drift toward base
      const drift = (base - p) * 0.12;
      const noise = (Math.sin(i * 1.7) * 0.008 + (Math.cos(i * 3.1) * 0.006)) * base;
      p = i === 0 ? base : p + drift + noise;
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullDate: time.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        price: Number(p.toFixed(2)),
      });
    }
    return data;
  }, [currentPriceNum, timeframe]);

  // Compute SVG path for price area chart
  const minP = Math.min(...pricePoints.map((d) => d.price)) * 0.995;
  const maxP = Math.max(...pricePoints.map((d) => d.price)) * 1.005;
  const svgWidth = 620;
  const svgHeight = 210;

  const getSvgCoordinates = (index, val) => {
    const x = (index / (pricePoints.length - 1)) * (svgWidth - 40) + 20;
    const y = svgHeight - 20 - ((val - minP) / (maxP - minP || 1)) * (svgHeight - 40);
    return { x, y };
  };

  const pathD = useMemo(() => {
    if (pricePoints.length === 0) return "";
    let d = "";
    pricePoints.forEach((pt, i) => {
      const { x, y } = getSvgCoordinates(i, pt.price);
      if (i === 0) d += `M ${x} ${y}`;
      else {
        // Smooth bezier curve
        const prev = getSvgCoordinates(i - 1, pricePoints[i - 1].price);
        const cx1 = prev.x + (x - prev.x) / 2;
        const cy1 = prev.y;
        const cx2 = prev.x + (x - prev.x) / 2;
        const cy2 = y;
        d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`;
      }
    });
    return d;
  }, [pricePoints, minP, maxP]);

  const activePoint = hoverIndex !== null ? pricePoints[hoverIndex] : pricePoints[pricePoints.length - 1];
  const activeCoord = hoverIndex !== null ? getSvgCoordinates(hoverIndex, activePoint.price) : getSvgCoordinates(pricePoints.length - 1, activePoint.price);
  const startPrice = pricePoints[0]?.price || currentPriceNum;
  const priceChange = activePoint ? ((activePoint.price - startPrice) / startPrice) * 100 : 2.45;
  const isPositive = priceChange >= 0;

  // --- AMM Constant Product Curve Math ($x * y = k$) ---
  const currentX = Number(formatTokenAmount(reserve0, token0.decimals, 0)) || 50000;
  const currentY = Number(formatTokenAmount(reserve1, token1.decimals, 1)) || 20;
  const kConst = currentX * currentY; // e.g. 1,000,000

  // Simulation: Buy WETH with simTradeAmount USDC
  const simDxWithFee = simTradeAmount * 0.997;
  const simDy = (simDxWithFee * currentY) / (currentX + simDxWithFee);
  const simNewX = currentX + simTradeAmount;
  const simNewY = currentY - simDy;
  const simExecPrice = simTradeAmount / (simDy || 1);
  const simSlippage = ((simExecPrice - currentPriceNum) / currentPriceNum) * 100;

  // Generate hyperbola curve coordinates (x: 20k -> 95k)
  const curveXMin = 22000;
  const curveXMax = 95000;
  const curveYMin = kConst / curveXMax; // ~10.5
  const curveYMax = kConst / curveXMin; // ~45.4

  const mapCurveCoord = (xVal, yVal) => {
    const px = ((xVal - curveXMin) / (curveXMax - curveXMin)) * (svgWidth - 60) + 30;
    const py = svgHeight - 25 - ((yVal - curveYMin) / (curveYMax - curveYMin)) * (svgHeight - 45);
    return { px, py };
  };

  const curvePathD = useMemo(() => {
    const steps = 30;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const xVal = curveXMin + (i / steps) * (curveXMax - curveXMin);
      const yVal = kConst / xVal;
      const { px, py } = mapCurveCoord(xVal, yVal);
      if (i === 0) d += `M ${px} ${py}`;
      else d += ` L ${px} ${py}`;
    }
    return d;
  }, [kConst]);

  const currCoord = mapCurveCoord(currentX, currentY);
  const simCoord = mapCurveCoord(simNewX, simNewY);

  return (
    <div className="trading-chart-card glass-panel">
      {/* Top Chart Navigation & Mode Switcher */}
      <div className="chart-header-row">
        <div className="chart-views-tabs">
          <button
            className={`chart-view-btn ${chartMode === "price" ? "active" : ""}`}
            onClick={() => setChartMode("price")}
          >
            <BarChart2 size={14} />
            <span>Price Chart</span>
          </button>
          <button
            className={`chart-view-btn ${chartMode === "bondingCurve" ? "active" : ""}`}
            onClick={() => setChartMode("bondingCurve")}
          >
            <Compass size={14} />
            <span>AMM Curve (k = x × y)</span>
          </button>
          <button
            className={`chart-view-btn ${chartMode === "trades" ? "active" : ""}`}
            onClick={() => setChartMode("trades")}
          >
            <Activity size={14} />
            <span>Live Orderflow ({events.length})</span>
          </button>
        </div>

        {/* Timeframe Controls (for Price Chart) */}
        {chartMode === "price" && (
          <div className="chart-timeframe-bar">
            {["1H", "24H", "7D", "30D"].map((tf) => (
              <button
                key={tf}
                className={`timeframe-pill ${timeframe === tf ? "active" : ""}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: PRICE AREA CHART */}
      {chartMode === "price" && (
        <div className="chart-display-area">
          {/* Active Price HUD */}
          <div className="chart-hud-row">
            <div>
              <div className="hud-price-val">
                ${activePoint?.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="hud-meta-row">
                <span className={`hud-change-badge ${isPositive ? "positive" : "negative"}`}>
                  {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
                </span>
                <span className="hud-timestamp">{activePoint?.fullDate}</span>
              </div>
            </div>

            <div className="hud-stats-compact hide-on-mobile">
              <div>
                <span className="hud-label">Pair:</span>{" "}
                <span className="hud-data">{token1.symbol}/{token0.symbol}</span>
              </div>
              <div>
                <span className="hud-label">Spot:</span>{" "}
                <span className="hud-data">${price}</span>
              </div>
              <div>
                <span className="hud-label">Fee:</span>{" "}
                <span className="hud-data">0.30% Tier</span>
              </div>
            </div>
          </div>

          {/* SVG Vector Area Chart */}
          <div
            className="chart-svg-container"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="chart-svg"
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, (mouseX - 20) / (rect.width - 40)));
                const idx = Math.round(ratio * (pricePoints.length - 1));
                setHoverIndex(idx);
              }}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2563EB" stop-opacity="0.35" />
                  <stop offset="70%" stop-color="#0284C7" stop-opacity="0.08" />
                  <stop offset="100%" stop-color="#2563EB" stop-opacity="0.0" />
                </linearGradient>
                <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#2563EB" flood-opacity="0.3" />
                </filter>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1={svgHeight - 20} x2={svgWidth - 20} y2={svgHeight - 20} stroke="var(--border-card)" strokeDasharray="3 3" />
              <line x1="20" y1={svgHeight / 2} x2={svgWidth - 20} y2={svgHeight / 2} stroke="var(--border-card)" strokeDasharray="3 3" />
              <line x1="20" y1="20" x2={svgWidth - 20} y2="20" stroke="var(--border-card)" strokeDasharray="3 3" />

              {/* Fill Area */}
              {pathD && (
                <path
                  d={`${pathD} L ${getSvgCoordinates(pricePoints.length - 1, pricePoints[pricePoints.length - 1].price).x} ${svgHeight - 20} L 20 ${svgHeight - 20} Z`}
                  fill="url(#chartGradient)"
                />
              )}

              {/* Line Path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  filter="url(#chartGlow)"
                />
              )}

              {/* Crosshair & Active Point */}
              {activeCoord && (
                <g>
                  <line
                    x1={activeCoord.x}
                    y1="10"
                    x2={activeCoord.x}
                    y2={svgHeight - 20}
                    stroke="var(--accent-blue)"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                    opacity="0.7"
                  />
                  <line
                    x1="20"
                    y1={activeCoord.y}
                    x2={svgWidth - 20}
                    y2={activeCoord.y}
                    stroke="var(--accent-blue)"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                    opacity="0.4"
                  />
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="5"
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="9"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                </g>
              )}
            </svg>
          </div>
        </div>
      )}

      {/* VIEW 2: AMM CONSTANT PRODUCT BONDING CURVE */}
      {chartMode === "bondingCurve" && (
        <div className="curve-display-area">
          <div className="curve-hud-header">
            <div>
              <div className="curve-formula-title">
                Constant Product Invariant: <span className="formula-highlight">k = x × y = 1,000,000</span>
              </div>
              <div className="curve-subtext">
                Hyperbolic AMM curve determining price based on USDC ({currentX.toLocaleString()}) & WETH ({currentY}) reserves
              </div>
            </div>

            <div className="curve-sim-slider-box">
              <span className="slider-label">Simulate Trade (USDC):</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="range"
                  min="200"
                  max="15000"
                  step="200"
                  value={simTradeAmount}
                  onChange={(e) => setSimTradeAmount(Number(e.target.value))}
                  style={{ accentColor: "var(--accent-blue)", cursor: "pointer", width: "110px" }}
                />
                <span style={{ fontWeight: 600, fontSize: "0.78rem" }}>${simTradeAmount}</span>
              </div>
            </div>
          </div>

          {/* SVG Bonding Curve */}
          <div className="curve-svg-container">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="curveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#2563EB" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid */}
              <line x1="30" y1={svgHeight - 25} x2={svgWidth - 30} y2={svgHeight - 25} stroke="var(--border-card)" strokeDasharray="3 3" />
              <line x1="30" y1="20" x2={svgWidth - 30} y2="20" stroke="var(--border-card)" strokeDasharray="3 3" />

              {/* Curve Path */}
              {curvePathD && (
                <path
                  d={`${curvePathD} L ${mapCurveCoord(curveXMax, curveYMin).px} ${svgHeight - 25} L 30 ${svgHeight - 25} Z`}
                  fill="url(#curveAreaGrad)"
                />
              )}
              {curvePathD && (
                <path
                  d={curvePathD}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3"
                />
              )}

              {/* Current Pool State Point */}
              <circle cx={currCoord.px} cy={currCoord.py} r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
              <circle cx={currCoord.px} cy={currCoord.py} r="11" fill="none" stroke="#2563EB" strokeWidth="1.5" opacity="0.5" />
              <text x={currCoord.px - 35} y={currCoord.py - 14} fill="var(--text-primary)" fontSize="11" fontWeight="700">
                R0: (50k, 20 ETH)
              </text>

              {/* Simulated New Pool State Point */}
              <circle cx={simCoord.px} cy={simCoord.py} r="5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
              <text x={simCoord.px - 30} y={simCoord.py + 22} fill="var(--accent-rose)" fontSize="10.5" fontWeight="600">
                R1: ({simNewX.toLocaleString()}, {simNewY.toFixed(2)})
              </text>

              {/* Trajectory vector line */}
              <line
                x1={currCoord.px}
                y1={currCoord.py}
                x2={simCoord.px}
                y2={simCoord.py}
                stroke="var(--accent-rose)"
                strokeDasharray="3 3"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          {/* Simulation Output Card */}
          <div className="curve-impact-summary">
            <div className="impact-pill">
              <span className="impact-lbl">Input:</span>
              <span className="impact-val">{simTradeAmount} USDC</span>
            </div>
            <div className="impact-pill">
              <span className="impact-lbl">Output dy:</span>
              <span className="impact-val highlight">{simDy.toFixed(4)} WETH</span>
            </div>
            <div className="impact-pill">
              <span className="impact-lbl">Eff. Price:</span>
              <span className="impact-val">${simExecPrice.toFixed(2)}</span>
            </div>
            <div className="impact-pill">
              <span className="impact-lbl">Slippage:</span>
              <span className="impact-val" style={{ color: simSlippage > 2 ? "var(--accent-rose)" : "var(--accent-emerald)" }}>
                {simSlippage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: LIVE RECENT TRADES / ORDERFLOW STREAM */}
      {chartMode === "trades" && (
        <div className="trades-stream-container">
          <div className="trades-stream-header">
            <span>Action</span>
            <span>Input → Output</span>
            <span>Exec Rate</span>
            <span>Trader</span>
            <span style={{ textAlign: "right" }}>Block Tx</span>
          </div>

          <div className="trades-stream-body">
            {events.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No trades executed in current session yet. Execute a swap on the right to see live on-chain stream!
              </div>
            ) : (
              events.map((ev, i) => {
                const isBuy = ev.type === "SWAP" && ev.data?.amount0In > 0n;
                return (
                  <div key={`${ev.txHash}-${i}`} className="trade-stream-row">
                    <span className={`side-badge ${isBuy ? "buy" : "sell"}`}>
                      {ev.type === "SWAP" ? (isBuy ? "BUY ETH" : "SELL ETH") : ev.type}
                    </span>
                    <span className="trade-volume-text">
                      {ev.type === "SWAP" ? (
                        isBuy
                          ? `${formatTokenAmount(ev.data.amount0In, 6, 1)} USDC → ${formatTokenAmount(ev.data.amount1Out, 18, 3)} ETH`
                          : `${formatTokenAmount(ev.data.amount1In, 18, 3)} ETH → ${formatTokenAmount(ev.data.amount0Out, 6, 1)} USDC`
                      ) : "Liquidity Event"}
                    </span>
                    <span className="trade-price-text">${price}</span>
                    <span className="trade-address-text">{shortenAddress(ev.sender || ev.account)}</span>
                    <a
                      href={`https://etherscan.io/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="trade-tx-link"
                      onClick={(e) => e.preventDefault()}
                    >
                      {ev.txHash ? ev.txHash.substring(0, 8) + "..." : "Local #0"}
                      <ExternalLink size={10} style={{ marginLeft: "3px" }} />
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Bottom Compact Pool Reserves Indicator */}
      <div className="chart-footer-strip">
        <div className="footer-reserve-item">
          <span className="legend-dot usdc-dot" />
          <span>USDC Reserve: <strong>{currentX.toLocaleString()} (50%)</strong></span>
        </div>
        <div className="footer-reserve-item">
          <span className="legend-dot eth-dot" />
          <span>WETH Reserve: <strong>{currentY.toFixed(1)} (50%)</strong></span>
        </div>
        <div className="footer-reserve-item hide-on-mobile">
          <Layers size={13} style={{ marginRight: "4px" }} />
          <span>k Invariant: <strong>{kConst.toLocaleString()}</strong></span>
        </div>
      </div>
    </div>
  );
}
