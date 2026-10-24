import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Activity,
  BarChart2,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sliders,
  ExternalLink,
  CandlestickChart,
  LineChart as LineChartIcon,
  Radio,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { formatTokenAmount, shortenAddress } from "../lib/ethereum";
import { SUPPORTED_PAIRS } from "../hooks/useLiveMarketData";

export function TradingChart({
  poolState,
  events = [],
  price,
  volumeStats,
  liveMarket,
}) {
  const { token0, token1, reserve0, reserve1 } = poolState;
  const baseSymbol = liveMarket?.pairConfig?.baseSymbol || token1?.symbol || "WETH";

  // Chart modes: "price" | "bondingCurve" | "trades"
  const [chartMode, setChartMode] = useState("price");
  // Chart visual style: "area" | "candlestick"
  const [chartStyle, setChartStyle] = useState("area");
  // Hover index for crosshair inspection
  const [hoverIndex, setHoverIndex] = useState(null);
  // Trades view filter: "onchain" | "global"
  const [tradesSource, setTradesSource] = useState("global");
  // AMM Trade simulation amount
  const [simTradeAmount, setSimTradeAmount] = useState(2500);

  // Extract live market data if available
  const {
    marketData,
    candles = [],
    candlesLoading = false,
    timeframe = "24H",
    setTimeframe,
    liveTrades = [],
    selectedPair = "ETH/USDC",
    setSelectedPair,
  } = liveMarket || {};

  // Current price to display (use live market if available, otherwise pool price)
  const currentPriceNum = marketData?.price || Number(String(price).replace(/,/g, "")) || 2370;
  const displayPriceStr = marketData?.priceFormatted || (currentPriceNum ? currentPriceNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "2,370.00");
  const tickDir = marketData?.tickDirection;

  // --- Candlestick & Price Chart Geometry ---
  const svgWidth = 640;
  const svgHeight = 230;
  const paddingLeft = 25;
  const paddingRight = 55;
  const paddingTop = 20;
  const paddingBottom = 45;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Min / Max calculation with fallback if candles are empty
  const priceData = useMemo(() => {
    if (candles && candles.length > 0) return candles;
    // Fallback pseudo-history only if offline
    const base = currentPriceNum;
    const fallbackPoints = [];
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const p = base * (1 + Math.sin(i * 0.4) * 0.015);
      fallbackPoints.push({
        timestamp: now - i * 3600 * 1000,
        time: new Date(now - i * 3600 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fullDate: new Date(now - i * 3600 * 1000).toLocaleString(),
        open: p * 0.998,
        high: p * 1.004,
        low: p * 0.996,
        close: p,
        price: p,
        volume: 120 + i * 5,
        quoteVolume: (120 + i * 5) * p,
        isUp: i % 2 === 0,
      });
    }
    return fallbackPoints;
  }, [candles, currentPriceNum]);

  const { minP, maxP, maxV } = useMemo(() => {
    if (priceData.length === 0) return { minP: 2300, maxP: 2450, maxV: 100 };

    // Filter out any anomalous points that belong to a different pair
    const cleanPoints = priceData.filter((d) => {
      const p = d.close || d.price || 0;
      return p > 0 && Math.abs(p - currentPriceNum) / (currentPriceNum || 1) < 0.35;
    });
    const dataset = cleanPoints.length >= 3 ? cleanPoints : priceData;

    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;
    dataset.forEach((d) => {
      const lowVal = (d.low && Math.abs(d.low - currentPriceNum) / (currentPriceNum || 1) < 0.35)
        ? d.low
        : (d.close || currentPriceNum);
      const highVal = (d.high && Math.abs(d.high - currentPriceNum) / (currentPriceNum || 1) < 0.35)
        ? d.high
        : (d.close || currentPriceNum);

      if (lowVal < min) min = lowVal;
      if (highVal > max) max = highVal;
      if (d.volume > maxVol) maxVol = d.volume;
    });

    if (min === Infinity || max === -Infinity || min >= max) {
      min = currentPriceNum * 0.98;
      max = currentPriceNum * 1.02;
    }

    // Add 4% buffer for aesthetics
    const buffer = (max - min) * 0.04 || (currentPriceNum * 0.015);
    return {
      minP: Math.max(0.001, min - buffer),
      maxP: max + buffer,
      maxV: maxVol || 1,
    };
  }, [priceData, currentPriceNum]);

  const getYCoord = (val) => {
    return paddingTop + chartHeight - ((val - minP) / (maxP - minP || 1)) * chartHeight;
  };

  const getXCoord = (index) => {
    return paddingLeft + (index / (priceData.length - 1 || 1)) * chartWidth;
  };

  // Build SVG path for Area Line Chart
  const pathD = useMemo(() => {
    if (priceData.length === 0) return "";
    let d = "";
    priceData.forEach((pt, i) => {
      const x = getXCoord(i);
      const y = getYCoord(pt.close || pt.price);
      if (i === 0) d += `M ${x} ${y}`;
      else {
        // Smooth bezier interpolation
        const prevX = getXCoord(i - 1);
        const prevY = getYCoord(priceData[i - 1].close || priceData[i - 1].price);
        const cx1 = prevX + (x - prevX) / 2;
        const cy1 = prevY;
        const cx2 = prevX + (x - prevX) / 2;
        const cy2 = y;
        d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`;
      }
    });
    return d;
  }, [priceData, minP, maxP]);

  // Active hover point / crosshair data
  const isHovering = hoverIndex !== null;
  const activePoint = isHovering && priceData[hoverIndex]
    ? priceData[hoverIndex]
    : priceData[priceData.length - 1];

  const activeCoord = isHovering && priceData[hoverIndex]
    ? { x: getXCoord(hoverIndex), y: getYCoord(priceData[hoverIndex].close || priceData[hoverIndex].price) }
    : null;

  const latestCoord = priceData.length > 0
    ? { x: getXCoord(priceData.length - 1), y: getYCoord(priceData[priceData.length - 1].close || priceData[priceData.length - 1].price) }
    : null;

  const startPrice = priceData[0]?.open || priceData[0]?.price || currentPriceNum;
  const currentActivePrice = activePoint?.close || activePoint?.price || currentPriceNum;
  const priceChange = startPrice > 0 ? ((currentActivePrice - startPrice) / startPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // --- AMM Constant Product Curve Math ($x * y = k$) ---
  // If pool reserves on contract are 0, use realistic calibrated pool baseline based on current live price
  const onChainX = Number(formatTokenAmount(reserve0, token0.decimals, 0));
  const onChainY = Number(formatTokenAmount(reserve1, token1.decimals, 2));

  const hasOnChainLiquidity = onChainX > 0 && onChainY > 0;
  const currentX = hasOnChainLiquidity ? onChainX : 50000;
  // If unseeded, derive Y such that spot price = current live market price
  const currentY = hasOnChainLiquidity ? onChainY : Number((50000 / (currentPriceNum || 2370)).toFixed(4));
  const kConst = currentX * currentY;

  // Simulation: Buy WETH with simTradeAmount USDC
  const simDxWithFee = simTradeAmount * 0.997;
  const simDy = (simDxWithFee * currentY) / (currentX + simDxWithFee);
  const simNewX = currentX + simTradeAmount;
  const simNewY = currentY - simDy;
  const simExecPrice = simTradeAmount / (simDy || 1);
  const spotRate = currentX / (currentY || 1);
  const simSlippage = ((simExecPrice - spotRate) / (spotRate || 1)) * 100;

  // Hyperbola curve coordinates for AMM view
  const curveXMin = currentX * 0.45;
  const curveXMax = currentX * 1.95;
  const curveYMin = kConst / curveXMax;
  const curveYMax = kConst / curveXMin;

  const mapCurveCoord = (xVal, yVal) => {
    const px = ((xVal - curveXMin) / (curveXMax - curveXMin || 1)) * (svgWidth - 70) + 35;
    const py = svgHeight - 30 - ((yVal - curveYMin) / (curveYMax - curveYMin || 1)) * (svgHeight - 55);
    return { px, py };
  };

  const curvePathD = useMemo(() => {
    const steps = 35;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const xVal = curveXMin + (i / steps) * (curveXMax - curveXMin);
      const yVal = kConst / (xVal || 1);
      const { px, py } = mapCurveCoord(xVal, yVal);
      if (i === 0) d += `M ${px} ${py}`;
      else d += ` L ${px} ${py}`;
    }
    return d;
  }, [kConst, curveXMin, curveXMax]);

  const currCoord = mapCurveCoord(currentX, currentY);
  const simCoord = mapCurveCoord(simNewX, simNewY);

  return (
    <div className="trading-chart-card glass-panel">
      {/* Top Chart Navigation & Controls */}
      <div className="chart-header-row">
        {/* Main View Switcher Tabs */}
        <div className="chart-views-tabs">
          <button
            className={`chart-view-btn ${chartMode === "price" ? "active" : ""}`}
            onClick={() => setChartMode("price")}
          >
            <BarChart2 size={14} />
            <span>Live Price Feed</span>
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
            <span>Live Orderflow ({liveTrades.length + events.length})</span>
          </button>
        </div>

        {/* Price Chart Toolbar (Style, Timeframe & Pair Selector) */}
        {chartMode === "price" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Chart Style Toggle: Area vs Candlestick */}
            <div className="chart-style-switcher">
              <button
                className={`chart-style-btn ${chartStyle === "area" ? "active" : ""}`}
                onClick={() => setChartStyle("area")}
                title="Line / Area Chart"
              >
                <LineChartIcon size={13} />
              </button>
              <button
                className={`chart-style-btn ${chartStyle === "candlestick" ? "active" : ""}`}
                onClick={() => setChartStyle("candlestick")}
                title="Candlestick Chart"
              >
                <CandlestickChart size={13} />
              </button>
            </div>

            {/* Timeframe Controls */}
            <div className="chart-timeframe-bar">
              {["1H", "24H", "7D", "30D", "1Y"].map((tf) => (
                <button
                  key={tf}
                  className={`timeframe-pill ${timeframe === tf ? "active" : ""}`}
                  onClick={() => setTimeframe && setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Live Feed Status Pill */}
            <div
              className={`live-source-pill ${marketData?.isLive ? "active" : ""}`}
              title="Real-time WebSocket & REST Stream from Binance/Coinbase"
            >
              <span className="live-pulse-dot" />
              <span>{marketData?.connectionType || "Live Feed"}</span>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: PROFESSIONAL REAL-TIME MARKET PRICE CHART */}
      {chartMode === "price" && (
        <div className="chart-display-area" onMouseLeave={() => setHoverIndex(null)}>
          {/* Active Price HUD */}
          <div className="chart-hud-row">
            <div>
              <div
                className={`hud-price-val ${
                  tickDir === "up" ? "tick-flash-up" : tickDir === "down" ? "tick-flash-down" : ""
                }`}
              >
                ${(activePoint?.close || activePoint?.price || currentPriceNum).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="hud-meta-row">
                <span className={`hud-change-badge ${isPositive ? "positive" : "negative"}`}>
                  {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {isPositive ? "+" : ""}
                  {priceChange.toFixed(2)}%
                </span>
                <span className="hud-timestamp">
                  <Clock size={11} style={{ marginRight: "3px" }} />
                  {activePoint?.fullDate || new Date().toLocaleString()}
                </span>
              </div>
            </div>

            {/* Detailed Candle OHLC stats */}
            <div className="hud-stats-compact hide-on-mobile">
              {chartStyle === "candlestick" && activePoint?.open !== undefined ? (
                <div style={{ display: "flex", gap: "0.85rem", fontSize: "0.74rem" }}>
                  <div>
                    <span className="hud-label">O:</span>{" "}
                    <span className="hud-data">${activePoint.open.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="hud-label">H:</span>{" "}
                    <span className="hud-data">${activePoint.high.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="hud-label">L:</span>{" "}
                    <span className="hud-data">${activePoint.low.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="hud-label">C:</span>{" "}
                    <span className="hud-data">${activePoint.close.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className="hud-label">Pair:</span>{" "}
                    <span className="hud-data">{selectedPair}</span>
                  </div>
                  <div>
                    <span className="hud-label">24h High:</span>{" "}
                    <span className="hud-data">${marketData?.high24h?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="hud-label">24h Low:</span>{" "}
                    <span className="hud-data">${marketData?.low24h?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SVG Vector Chart Container */}
          <div
            className="chart-svg-container"
            onMouseLeave={() => setHoverIndex(null)}
            onMouseMove={(e) => {
              if (priceData.length === 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              if (!rect.width) return;
              const mouseX = e.clientX - rect.left;
              // Map screen pixels to SVG viewBox horizontal units (0 to svgWidth)
              const svgX = (mouseX / rect.width) * svgWidth;
              // If outside candle chart bounds, immediately reset hover
              if (svgX < paddingLeft || svgX > svgWidth - paddingRight) {
                setHoverIndex(null);
                return;
              }
              const ratio = (svgX - paddingLeft) / (chartWidth || 1);
              const idx = Math.min(
                priceData.length - 1,
                Math.max(0, Math.round(ratio * (priceData.length - 1)))
              );
              setHoverIndex(idx);
            }}
            onTouchMove={(e) => {
              if (priceData.length === 0 || !e.touches[0]) return;
              const rect = e.currentTarget.getBoundingClientRect();
              if (!rect.width) return;
              const touchX = e.touches[0].clientX - rect.left;
              const svgX = (touchX / rect.width) * svgWidth;
              if (svgX < paddingLeft || svgX > svgWidth - paddingRight) {
                setHoverIndex(null);
                return;
              }
              const ratio = (svgX - paddingLeft) / (chartWidth || 1);
              const idx = Math.min(
                priceData.length - 1,
                Math.max(0, Math.round(ratio * (priceData.length - 1)))
              );
              setHoverIndex(idx);
            }}
            onTouchEnd={() => setHoverIndex(null)}
          >
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="chart-svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradientLive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.38" />
                  <stop offset="70%" stopColor="#0284C7" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
                <filter id="chartGlowLive" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563EB" floodOpacity="0.45" />
                </filter>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              <line
                x1={paddingLeft}
                y1={paddingTop + chartHeight}
                x2={svgWidth - paddingRight}
                y2={paddingTop + chartHeight}
                stroke="var(--border-card)"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingLeft}
                y1={paddingTop + chartHeight / 2}
                x2={svgWidth - paddingRight}
                y2={paddingTop + chartHeight / 2}
                stroke="var(--border-card)"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={svgWidth - paddingRight}
                y2={paddingTop}
                stroke="var(--border-card)"
                strokeDasharray="3 3"
              />

              {/* Y-Axis Price Labels */}
              <text x={svgWidth - paddingRight + 6} y={paddingTop + 10} fill="var(--text-muted)" fontSize="9.5" fontFamily="monospace">
                ${maxP.toFixed(0)}
              </text>
              <text x={svgWidth - paddingRight + 6} y={paddingTop + chartHeight / 2 + 3} fill="var(--text-muted)" fontSize="9.5" fontFamily="monospace">
                ${((maxP + minP) / 2).toFixed(0)}
              </text>
              <text x={svgWidth - paddingRight + 6} y={paddingTop + chartHeight - 2} fill="var(--text-muted)" fontSize="9.5" fontFamily="monospace">
                ${minP.toFixed(0)}
              </text>

              {/* Volume Profile Bars at Bottom */}
              {priceData.map((pt, i) => {
                const x = getXCoord(i);
                const barW = Math.max(2, Math.min(6, (chartWidth / priceData.length) * 0.6));
                const barH = (pt.volume / maxV) * 26;
                const barY = svgHeight - 12 - barH;
                const isBull = pt.close >= pt.open;
                return (
                  <rect
                    key={`vol-${i}`}
                    x={x - barW / 2}
                    y={barY}
                    width={barW}
                    height={Math.max(2, barH)}
                    fill={isBull ? "#10B981" : "#EF4444"}
                    opacity="0.32"
                    rx="1"
                  />
                );
              })}

              {/* STYLE A: AREA / GRADIENT LINE CHART */}
              {chartStyle === "area" && (
                <>
                  {pathD && (
                    <path
                      d={`${pathD} L ${getXCoord(priceData.length - 1)} ${paddingTop + chartHeight} L ${paddingLeft} ${paddingTop + chartHeight} Z`}
                      fill="url(#chartGradientLive)"
                    />
                  )}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      filter="url(#chartGlowLive)"
                    />
                  )}
                </>
              )}

              {/* STYLE B: AUTHENTIC CANDLESTICKS WITH WICKS */}
              {chartStyle === "candlestick" &&
                priceData.map((candle, i) => {
                  const cx = getXCoord(i);
                  const yHigh = getYCoord(candle.high);
                  const yLow = getYCoord(candle.low);
                  const yOpen = getYCoord(candle.open);
                  const yClose = getYCoord(candle.close);
                  const isBull = candle.close >= candle.open;
                  const candleColor = isBull ? "#10B981" : "#EF4444";
                  const candleW = Math.max(3, Math.min(10, (chartWidth / priceData.length) * 0.7));
                  const bodyTop = Math.min(yOpen, yClose);
                  const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

                  return (
                    <g key={`candle-${i}`}>
                      {/* Upper & Lower Wick Line */}
                      <line
                        x1={cx}
                        y1={yHigh}
                        x2={cx}
                        y2={yLow}
                        stroke={candleColor}
                        strokeWidth="1.2"
                      />
                      {/* Candle Body */}
                      <rect
                        x={cx - candleW / 2}
                        y={bodyTop}
                        width={candleW}
                        height={bodyHeight}
                        fill={isBull ? "#10B981" : "#EF4444"}
                        stroke={candleColor}
                        strokeWidth="0.5"
                        rx="1"
                      />
                    </g>
                  );
                })}

              {/* REAL-TIME LIVE MARKET PRICE LINE & AXIS TAG (Always visible) */}
              {latestCoord && (
                <g pointerEvents="none">
                  {/* Horizontal dotted line at the live current spot price */}
                  <line
                    x1={paddingLeft}
                    y1={latestCoord.y}
                    x2={svgWidth - paddingRight}
                    y2={latestCoord.y}
                    stroke={tickDir === "up" ? "#10B981" : tickDir === "down" ? "#EF4444" : "#2563EB"}
                    strokeDasharray="2 3"
                    strokeWidth="1.2"
                    opacity="0.7"
                  />
                  {/* Pulsing live dot at current price head */}
                  <circle
                    cx={latestCoord.x}
                    cy={latestCoord.y}
                    r="4"
                    fill={tickDir === "up" ? "#10B981" : tickDir === "down" ? "#EF4444" : "#2563EB"}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={latestCoord.x}
                    cy={latestCoord.y}
                    r="8.5"
                    fill="none"
                    stroke={tickDir === "up" ? "#10B981" : tickDir === "down" ? "#EF4444" : "#2563EB"}
                    strokeWidth="1.2"
                    opacity="0.4"
                  />
                  {/* Real-time Price Badge on Right Y-Axis */}
                  <rect
                    x={svgWidth - paddingRight + 2}
                    y={latestCoord.y - 8.5}
                    width="52"
                    height="17"
                    rx="3"
                    fill={tickDir === "up" ? "#10B981" : tickDir === "down" ? "#EF4444" : "#2563EB"}
                  />
                  <text
                    x={svgWidth - paddingRight + 28}
                    y={latestCoord.y + 3.8}
                    fill="#FFFFFF"
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    ${currentPriceNum.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </text>
                </g>
              )}

              {/* Interactive Crosshair & Inspection (Shown ONLY when hovering a candle) */}
              {isHovering && activeCoord && (
                <g pointerEvents="none">
                  {/* Vertical Crosshair Line */}
                  <line
                    x1={activeCoord.x}
                    y1={paddingTop}
                    x2={activeCoord.x}
                    y2={paddingTop + chartHeight}
                    stroke="#38BDF8"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                    opacity="0.85"
                  />
                  {/* Horizontal Crosshair Line */}
                  <line
                    x1={paddingLeft}
                    y1={activeCoord.y}
                    x2={svgWidth - paddingRight}
                    y2={activeCoord.y}
                    stroke="#38BDF8"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                    opacity="0.6"
                  />

                  {/* Active Point Highlight Circles */}
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="5"
                    fill="#38BDF8"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="9"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1.2"
                    opacity="0.5"
                  />

                  {/* Hovered Candle Price Pill on Y-Axis */}
                  <rect
                    x={svgWidth - paddingRight + 2}
                    y={activeCoord.y - 8}
                    width="52"
                    height="16"
                    rx="3"
                    fill="#1E293B"
                    stroke="#38BDF8"
                    strokeWidth="0.8"
                  />
                  <text
                    x={svgWidth - paddingRight + 28}
                    y={activeCoord.y + 3.5}
                    fill="#FFFFFF"
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    ${(activePoint?.close || activePoint?.price || 0).toFixed(1)}
                  </text>

                  {/* Hovered Candle Time Pill on X-Axis */}
                  {activePoint?.time && (
                    <>
                      <rect
                        x={Math.max(paddingLeft, Math.min(svgWidth - paddingRight - 44, activeCoord.x - 22))}
                        y={paddingTop + chartHeight + 4}
                        width="44"
                        height="13"
                        rx="2"
                        fill="#1E293B"
                        stroke="#38BDF8"
                        strokeWidth="0.8"
                      />
                      <text
                        x={Math.max(paddingLeft + 22, Math.min(svgWidth - paddingRight - 22, activeCoord.x))}
                        y={paddingTop + chartHeight + 13.5}
                        fill="#FFFFFF"
                        fontSize="7.5"
                        fontWeight="600"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {activePoint.time}
                      </text>
                    </>
                  )}
                </g>
              )}
            </svg>
          </div>
        </div>
      )}

      {/* VIEW 2: CONSTANT-PRODUCT AMM BONDING CURVE ($k = x \times y$) */}
      {chartMode === "bondingCurve" && (
        <div className="curve-display-area">
          <div className="curve-hud-header">
            <div>
              <div className="curve-formula-title">
                Constant Product Invariant:{" "}
                <span className="formula-highlight">k = x × y = {kConst.toLocaleString()}</span>
              </div>
              <div className="curve-subtext">
                Hyperbolic AMM curve determining price based on USDC ({currentX.toLocaleString()}) & WETH ({currentY}) reserves.
                {!hasOnChainLiquidity && (
                  <span style={{ color: "var(--accent-cyan)", marginLeft: "4px" }}>
                    (Calibrated demonstration curve based on live market spot)
                  </span>
                )}
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
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
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
                R0: ({currentX.toLocaleString()}, {currentY} ETH)
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
              <span className="impact-val highlight">{simDy < 0.01 ? simDy.toFixed(6) : simDy.toFixed(4)} {baseSymbol}</span>
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
          {/* Sub-Tabs: Global Stream vs On-Chain DEX Swaps */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", borderBottom: "1px solid var(--border-card)", paddingBottom: "0.5rem" }}>
            <button
              className={`timeframe-pill ${tradesSource === "global" ? "active" : ""}`}
              onClick={() => setTradesSource("global")}
            >
              <Radio size={12} style={{ marginRight: "3px" }} />
              Live Binance Stream ({liveTrades.length})
            </button>
            <button
              className={`timeframe-pill ${tradesSource === "onchain" ? "active" : ""}`}
              onClick={() => setTradesSource("onchain")}
            >
              <Layers size={12} style={{ marginRight: "3px" }} />
              On-Chain Pool Swaps ({events.length})
            </button>
          </div>

          {tradesSource === "global" ? (
            <div>
              <div className="trades-stream-header">
                <span>Side</span>
                <span>Price (USDC)</span>
                <span>Amount ({token1.symbol})</span>
                <span>Total Value</span>
                <span style={{ textAlign: "right" }}>Execution Time</span>
              </div>
              <div className="trades-stream-body">
                {liveTrades.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Connecting to live global trade stream...
                  </div>
                ) : (
                  liveTrades.map((t) => (
                    <div key={t.id} className="trade-stream-row">
                      <span className={`side-badge ${t.type.toLowerCase()}`}>
                        {t.type}
                      </span>
                      <span className="trade-price-text font-mono">${t.price.toFixed(2)}</span>
                      <span className="trade-volume-text">{t.amount.toFixed(4)} {baseSymbol}</span>
                      <span className="trade-address-text">${(t.price * t.amount).toFixed(2)}</span>
                      <span style={{ textAlign: "right", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                        {t.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="trades-stream-header">
                <span>Action</span>
                <span>Input → Output</span>
                <span>Exec Rate</span>
                <span>Trader</span>
                <span style={{ textAlign: "right" }}>Tx Hash</span>
              </div>
              <div className="trades-stream-body">
                {events.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No on-chain trades executed in this session yet. Execute a swap on the right to see transactions broadcast here!
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
        </div>
      )}

      {/* Bottom Compact Pool Reserves & Invariant Strip */}
      <div className="chart-footer-strip">
        <div className="footer-reserve-item">
          <span className="legend-dot usdc-dot" />
          <span>
            {token0.symbol} Reserve: <strong>{currentX.toLocaleString()} (50%)</strong>
          </span>
        </div>
        <div className="footer-reserve-item">
          <span className="legend-dot eth-dot" />
          <span>
            {baseSymbol} Reserve: <strong>{currentY < 1 ? currentY.toFixed(4) : currentY.toFixed(2)} (50%)</strong>
          </span>
        </div>
        <div className="footer-reserve-item hide-on-mobile">
          <Layers size={13} style={{ marginRight: "4px" }} />
          <span>
            k Invariant: <strong>{kConst.toLocaleString()}</strong>
          </span>
        </div>
        <div className="footer-reserve-item hide-on-mobile" style={{ marginLeft: "auto" }}>
          <Zap size={12} color="var(--accent-blue)" style={{ marginRight: "4px" }} />
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            AMM Spot: ${spotRate.toFixed(2)} | Market: ${currentPriceNum.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
