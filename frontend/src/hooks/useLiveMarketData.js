import { useState, useEffect, useRef, useCallback } from "react";

// Supported market pairs configuration
export const SUPPORTED_PAIRS = {
  "ETH/USDC": {
    binanceSymbol: "ETHUSDC",
    baseSymbol: "WETH",
    quoteSymbol: "USDC",
    name: "Ethereum",
    decimals: 18,
    defaultPrice: 2370.0,
  },
  "BTC/USDC": {
    binanceSymbol: "BTCUSDC",
    baseSymbol: "WBTC",
    quoteSymbol: "USDC",
    name: "Bitcoin",
    decimals: 8,
    defaultPrice: 67500.0,
  },
  "SOL/USDC": {
    binanceSymbol: "SOLUSDC",
    baseSymbol: "SOL",
    quoteSymbol: "USDC",
    name: "Solana",
    decimals: 9,
    defaultPrice: 172.0,
  },
};

const TIMEFRAME_CONFIG = {
  "1H": { interval: "1m", limit: 60 },
  "24H": { interval: "15m", limit: 96 },
  "7D": { interval: "2h", limit: 84 },
  "30D": { interval: "1d", limit: 30 },
  "1Y": { interval: "1w", limit: 52 },
};

export function useLiveMarketData(initialPair = "ETH/USDC") {
  const [selectedPair, setSelectedPair] = useState(initialPair);
  const [timeframe, setTimeframe] = useState("24H");
  const [marketData, setMarketData] = useState({
    symbol: "ETHUSDC",
    price: 2370.0,
    priceFormatted: "2,370.00",
    priceChange: 0,
    priceChangePercent: 0,
    high24h: 2415.0,
    low24h: 2350.0,
    volume24h: 65400,
    quoteVolume24h: 154000000,
    tickDirection: null, // "up" | "down" | null
    isLive: false,
    connectionType: "Connecting...",
    lastUpdated: Date.now(),
  });

  const [candles, setCandles] = useState([]);
  const [candlesLoading, setCandlesLoading] = useState(true);
  const [liveTrades, setLiveTrades] = useState([]);

  const wsRef = useRef(null);
  const prevPriceRef = useRef(marketData.price);
  const tickTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const pairConfig = SUPPORTED_PAIRS[selectedPair] || SUPPORTED_PAIRS["ETH/USDC"];
  const symbol = pairConfig.binanceSymbol;
  const currentSymbolRef = useRef(symbol);

  useEffect(() => {
    currentSymbolRef.current = symbol;
  }, [symbol]);

  // Format currency with standard commas & precision
  const formatPrice = (val, maxDecimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return "0.00";
    return Number(val).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: val < 1 ? 4 : maxDecimals,
    });
  };

  const handleSelectPair = useCallback((newPair) => {
    if (!SUPPORTED_PAIRS[newPair]) return;
    const cfg = SUPPORTED_PAIRS[newPair];
    currentSymbolRef.current = cfg.binanceSymbol;
    setSelectedPair(newPair);
    setCandles([]);
    setLiveTrades([]);
    prevPriceRef.current = cfg.defaultPrice;

    // Immediately terminate old websocket so no old-pair ticks bleed over
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    clearTimeout(reconnectTimeoutRef.current);
    clearTimeout(tickTimeoutRef.current);

    setMarketData({
      symbol: cfg.binanceSymbol,
      price: cfg.defaultPrice,
      priceFormatted: cfg.defaultPrice.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      priceChange: 0,
      priceChangePercent: 0,
      high24h: cfg.defaultPrice * 1.01,
      low24h: cfg.defaultPrice * 0.99,
      volume24h: 10000,
      quoteVolume24h: 50000000,
      tickDirection: null,
      isLive: true,
      connectionType: "Connecting...",
      lastUpdated: Date.now(),
    });
  }, []);

  // Fetch 24hr Ticker via REST as initial load or backup
  const fetchTickerREST = useCallback(async (targetSymbol = symbol) => {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${targetSymbol}`);
      if (!res.ok) throw new Error("Binance REST response not ok");
      const d = await res.json();
      if (!isMountedRef.current) return;
      // Discard response if user already switched to another pair!
      if (targetSymbol !== currentSymbolRef.current) return;

      const p = parseFloat(d.lastPrice);
      const prev = prevPriceRef.current;
      let tick = null;
      if (p > prev) tick = "up";
      else if (p < prev) tick = "down";
      prevPriceRef.current = p;

      setMarketData((prevM) => ({
        ...prevM,
        symbol: targetSymbol,
        price: p,
        priceFormatted: formatPrice(p),
        priceChange: parseFloat(d.priceChange || 0),
        priceChangePercent: parseFloat(d.priceChangePercent || 0),
        high24h: parseFloat(d.highPrice || 0),
        low24h: parseFloat(d.lowPrice || 0),
        volume24h: parseFloat(d.volume || 0),
        quoteVolume24h: parseFloat(d.quoteVolume || 0),
        tickDirection: tick,
        isLive: true,
        connectionType: wsRef.current && wsRef.current.readyState === WebSocket.OPEN ? "WebSocket" : "REST Live",
        lastUpdated: Date.now(),
      }));

      if (tick) {
        clearTimeout(tickTimeoutRef.current);
        tickTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && targetSymbol === currentSymbolRef.current) {
            setMarketData((m) => ({ ...m, tickDirection: null }));
          }
        }, 1200);
      }
    } catch (err) {
      if (targetSymbol === "ETHUSDC" && currentSymbolRef.current === "ETHUSDC") {
        try {
          const cbRes = await fetch("https://api.exchange.coinbase.com/products/ETH-USD/ticker");
          if (cbRes.ok) {
            const cbData = await cbRes.json();
            const p = parseFloat(cbData.price);
            if (!isNaN(p) && isMountedRef.current && currentSymbolRef.current === "ETHUSDC") {
              setMarketData((prevM) => ({
                ...prevM,
                price: p,
                priceFormatted: formatPrice(p),
                isLive: true,
                connectionType: "Coinbase Feed",
                lastUpdated: Date.now(),
              }));
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }, [symbol]);

  // Fetch Klines (Candlesticks) for active timeframe
  const fetchKlines = useCallback(async (tf = timeframe, targetSymbol = symbol) => {
    const config = TIMEFRAME_CONFIG[tf] || TIMEFRAME_CONFIG["24H"];
    try {
      setCandlesLoading(true);
      const url = `https://api.binance.com/api/v3/klines?symbol=${targetSymbol}&interval=${config.interval}&limit=${config.limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch klines");
      const raw = await res.json();
      if (!isMountedRef.current || !Array.isArray(raw)) return;
      // Stale check: discard if pair changed while fetch was pending
      if (targetSymbol !== currentSymbolRef.current) return;

      const parsed = raw.map((k) => {
        const openTime = k[0];
        const open = parseFloat(k[1]);
        const high = parseFloat(k[2]);
        const low = parseFloat(k[3]);
        const close = parseFloat(k[4]);
        const volume = parseFloat(k[5]);
        const quoteVolume = parseFloat(k[7]);
        const isUp = close >= open;
        const d = new Date(openTime);

        let timeLabel = "";
        if (tf === "1H") {
          timeLabel = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else if (tf === "24H") {
          timeLabel = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else {
          timeLabel = d.toLocaleDateString([], { month: "short", day: "numeric" });
        }

        return {
          timestamp: openTime,
          time: timeLabel,
          fullDate: d.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          open,
          high,
          low,
          close,
          price: close,
          volume,
          quoteVolume,
          isUp,
        };
      });

      // Filter out any corrupted points before setting
      const cfg = SUPPORTED_PAIRS[selectedPair];
      const validPoints = parsed.filter(pt => {
        const p = pt.close || pt.price;
        return p > 0 && Math.abs(p - cfg.defaultPrice) / cfg.defaultPrice < 0.6;
      });

      setCandles(validPoints.length > 5 ? validPoints : parsed);
    } catch (err) {
      console.warn("Failed to fetch live klines:", err);
    } finally {
      if (isMountedRef.current && targetSymbol === currentSymbolRef.current) {
        setCandlesLoading(false);
      }
    }
  }, [symbol, timeframe, selectedPair]);

  // Fetch initial recent trades
  const fetchRecentTrades = useCallback(async (targetSymbol = symbol) => {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/trades?symbol=${targetSymbol}&limit=20`);
      if (!res.ok) return;
      const data = await res.json();
      if (!isMountedRef.current || !Array.isArray(data)) return;
      if (targetSymbol !== currentSymbolRef.current) return;

      const formatted = data.map((t) => {
        const d = new Date(t.time);
        const isSell = t.isBuyerMaker;
        return {
          id: t.id,
          price: parseFloat(t.price),
          amount: parseFloat(t.qty),
          quoteAmount: parseFloat(t.quoteQty),
          time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          fullDate: d.toLocaleString(),
          type: isSell ? "SELL" : "BUY",
          isBuyerMaker: t.isBuyerMaker,
        };
      });
      setLiveTrades(formatted.reverse());
    } catch (err) {
      console.warn("Failed to fetch initial trades:", err);
    }
  }, [symbol]);

  // Set up WebSocket connection for live sub-second ticker, trades & klines stream
  useEffect(() => {
    isMountedRef.current = true;
    let ws = null;
    const activeSymbol = symbol;
    const interval = TIMEFRAME_CONFIG[timeframe]?.interval || "15m";

    const connectWs = () => {
      // Abort if symbol changed before connect
      if (activeSymbol !== currentSymbolRef.current) return;

      try {
        const streamUrl = `wss://stream.binance.com:9443/stream?streams=${activeSymbol.toLowerCase()}@ticker/${activeSymbol.toLowerCase()}@trade/${activeSymbol.toLowerCase()}@kline_${interval}`;
        ws = new WebSocket(streamUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current || activeSymbol !== currentSymbolRef.current) return;
          setMarketData((m) => ({
            ...m,
            isLive: true,
            connectionType: "Binance WebSocket",
          }));
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const msg = JSON.parse(event.data);
            if (!msg || !msg.data || !msg.stream) return;

            // Strict check: only accept events belonging to current symbol!
            const expectedPrefix = currentSymbolRef.current.toLowerCase();
            if (!msg.stream.toLowerCase().startsWith(expectedPrefix)) {
              return;
            }

            // 1. Ticker Stream event (updates spot price & 24h stats sub-second)
            if (msg.stream.endsWith("@ticker")) {
              const d = msg.data;
              const p = parseFloat(d.c);
              const prev = prevPriceRef.current;
              let tick = null;
              if (p > prev) tick = "up";
              else if (p < prev) tick = "down";
              prevPriceRef.current = p;

              setMarketData((prevM) => ({
                ...prevM,
                symbol: activeSymbol,
                price: p,
                priceFormatted: formatPrice(p),
                priceChange: parseFloat(d.p || 0),
                priceChangePercent: parseFloat(d.P || 0),
                high24h: parseFloat(d.h || 0),
                low24h: parseFloat(d.l || 0),
                volume24h: parseFloat(d.v || 0),
                quoteVolume24h: parseFloat(d.q || 0),
                tickDirection: tick,
                isLive: true,
                connectionType: "Binance WebSocket",
                lastUpdated: Date.now(),
              }));

              // Immediately update current candle close & price
              setCandles((prevCandles) => {
                if (!prevCandles || prevCandles.length === 0) return prevCandles;
                const last = prevCandles[prevCandles.length - 1];
                // Sanity check: do not corrupt wick if price differs by > 35% from candle
                if (last.close > 0 && Math.abs(p - last.close) / last.close > 0.35) {
                  return prevCandles;
                }
                const updatedLast = {
                  ...last,
                  close: p,
                  price: p,
                  high: Math.max(last.high, p),
                  low: Math.min(last.low, p),
                  isUp: p >= last.open,
                };
                const next = [...prevCandles];
                next[next.length - 1] = updatedLast;
                return next;
              });

              if (tick) {
                clearTimeout(tickTimeoutRef.current);
                tickTimeoutRef.current = setTimeout(() => {
                  if (isMountedRef.current && activeSymbol === currentSymbolRef.current) {
                    setMarketData((m) => ({ ...m, tickDirection: null }));
                  }
                }, 1200);
              }
            }

            // 2. Live Kline (Candlestick) Stream event
            if (msg.stream.includes("@kline_")) {
              const k = msg.data.k;
              if (!k) return;
              const openTime = k.t;
              const open = parseFloat(k.o);
              const high = parseFloat(k.h);
              const low = parseFloat(k.l);
              const close = parseFloat(k.c);
              const volume = parseFloat(k.v);
              const quoteVolume = parseFloat(k.q);
              const isUp = close >= open;
              const d = new Date(openTime);

              let timeLabel = "";
              if (timeframe === "1H" || timeframe === "24H") {
                timeLabel = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              } else {
                timeLabel = d.toLocaleDateString([], { month: "short", day: "numeric" });
              }

              const candleObj = {
                timestamp: openTime,
                time: timeLabel,
                fullDate: d.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                open,
                high,
                low,
                close,
                price: close,
                volume,
                quoteVolume,
                isUp,
              };

              setCandles((prevCandles) => {
                if (!prevCandles || prevCandles.length === 0) return [candleObj];
                const last = prevCandles[prevCandles.length - 1];

                // If tick belongs to active candle
                if (last.timestamp === openTime) {
                  const next = [...prevCandles];
                  next[next.length - 1] = candleObj;
                  return next;
                }
                // If a new candle has opened
                else if (openTime > last.timestamp) {
                  const config = TIMEFRAME_CONFIG[timeframe] || TIMEFRAME_CONFIG["24H"];
                  const next = [...prevCandles, candleObj];
                  if (next.length > config.limit) {
                    next.shift();
                  }
                  return next;
                }
                return prevCandles;
              });
            }

            // 3. Live Trade Stream event (orderflow execution)
            if (msg.stream.endsWith("@trade")) {
              const t = msg.data;
              const d = new Date(t.T);
              const tradePrice = parseFloat(t.p);
              const tradeQty = parseFloat(t.q);
              const isSell = t.m;

              const newTrade = {
                id: t.t,
                price: tradePrice,
                amount: tradeQty,
                quoteAmount: tradePrice * tradeQty,
                time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                fullDate: d.toLocaleString(),
                type: isSell ? "SELL" : "BUY",
                isBuyerMaker: isSell,
              };

              setLiveTrades((prevTrades) => [newTrade, ...prevTrades.slice(0, 24)]);

              // Update candle volume & latest trade price
              setCandles((prevCandles) => {
                if (!prevCandles || prevCandles.length === 0) return prevCandles;
                const last = prevCandles[prevCandles.length - 1];
                if (last.close > 0 && Math.abs(tradePrice - last.close) / last.close > 0.35) {
                  return prevCandles;
                }
                const updatedLast = {
                  ...last,
                  close: tradePrice,
                  price: tradePrice,
                  high: Math.max(last.high, tradePrice),
                  low: Math.min(last.low, tradePrice),
                  volume: last.volume + tradeQty,
                  isUp: tradePrice >= last.open,
                };
                const next = [...prevCandles];
                next[next.length - 1] = updatedLast;
                return next;
              });
            }
          } catch (e) {
            console.error("WS Parse error", e);
          }
        };

        ws.onerror = (e) => {
          console.warn("WebSocket error, falling back to REST:", e);
        };

        ws.onclose = () => {
          if (!isMountedRef.current || activeSymbol !== currentSymbolRef.current) return;
          setMarketData((m) => ({
            ...m,
            connectionType: "REST Polling",
          }));
          // Attempt reconnection after 4 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && activeSymbol === currentSymbolRef.current) connectWs();
          }, 4000);
        };
      } catch (err) {
        console.warn("Could not create WebSocket:", err);
      }
    };

    // Initial REST load
    fetchTickerREST(activeSymbol);
    fetchRecentTrades(activeSymbol);
    connectWs();

    // Fallback polling every 6s in case WebSocket is throttled or interrupted
    const pollInterval = setInterval(() => {
      if (activeSymbol !== currentSymbolRef.current) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        fetchTickerREST(activeSymbol);
        fetchKlines(timeframe, activeSymbol);
      }
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(tickTimeoutRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
    };
  }, [symbol, timeframe, fetchTickerREST, fetchRecentTrades, fetchKlines]);

  // Fetch Klines when timeframe or symbol changes
  useEffect(() => {
    fetchKlines(timeframe, symbol);
  }, [timeframe, symbol, fetchKlines]);

  return {
    selectedPair,
    setSelectedPair: handleSelectPair,
    pairConfig,
    marketData,
    timeframe,
    setTimeframe,
    candles,
    candlesLoading,
    liveTrades,
    refreshMarket: () => {
      fetchTickerREST(symbol);
      fetchKlines(timeframe, symbol);
      fetchRecentTrades(symbol);
    },
  };
}
