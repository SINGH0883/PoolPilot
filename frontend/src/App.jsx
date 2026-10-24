import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Droplet, User, Coins, BarChart3, TrendingUp, Sparkles } from "lucide-react";
import { useWallet } from "./hooks/useWallet";
import { usePoolData } from "./hooks/usePoolData";
import { usePoolEvents } from "./hooks/usePoolEvents";
import { Header } from "./components/Header";
import { MarketTicker } from "./components/MarketTicker";
import { TradingChart } from "./components/TradingChart";
import { TraderMetrics } from "./components/TraderMetrics";
import { ActivityLedger } from "./components/ActivityLedger";
import { SwapCard } from "./components/SwapCard";
import { LiquidityCard } from "./components/LiquidityCard";
import { FaucetModal } from "./components/FaucetModal";
import { TransactionModal } from "./components/TransactionModal";
import { formatTokenAmount } from "./lib/ethereum";

export function App() {
  const {
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    error: walletError,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const { poolState, loading: poolLoading, error: poolError, refresh: refreshPool } = usePoolData(provider, account);
  const { events, volumeStats, loading: eventsLoading, refreshEvents } = usePoolEvents(provider, poolState, account);

  // Minimal White & Blue theme as default
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("poolpilot_theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("poolpilot_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const [activeTab, setActiveTab] = useState("swap"); // "swap" | "pool" | "analytics"
  const [faucetOpen, setFaucetOpen] = useState(false);
  const [txState, setTxState] = useState({
    status: "idle", // "idle" | "waiting" | "pending" | "success" | "error"
    title: "",
    message: "",
    hash: null,
    error: null,
  });

  const refreshAll = () => {
    refreshPool();
    refreshEvents();
  };

  const handleTxStart = (status, title, message, hash = null) => {
    setTxState({ status, title, message, hash, error: null });
  };

  const handleTxSuccess = (message, hash) => {
    setTxState({
      status: "success",
      title: "Success",
      message,
      hash,
      error: null,
    });
    refreshAll();
  };

  const handleTxError = (errorMessage) => {
    setTxState({
      status: "error",
      title: "Error",
      message: "",
      hash: null,
      error: errorMessage,
    });
  };

  const handleCloseTxModal = () => {
    setTxState({ status: "idle", title: "", message: "", hash: null, error: null });
  };

  // Compute exchange rate for top pill
  const r0 = Number(formatTokenAmount(poolState.reserve0, poolState.token0.decimals, 6));
  const r1 = Number(formatTokenAmount(poolState.reserve1, poolState.token1.decimals, 6));
  const price = r0 > 0 && r1 > 0 ? (r0 / r1).toFixed(2) : "2,500.00";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxHeight: "100vh", overflow: "hidden" }}>
      {/* Full-Bleed Top Navigation Bar */}
      <Header
        account={account}
        chainId={chainId}
        isConnecting={isConnecting}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        openFaucet={() => setFaucetOpen(true)}
        onRefresh={refreshAll}
        loading={poolLoading || eventsLoading}
        theme={theme}
        toggleTheme={toggleTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Realtime On-Chain Market Ticker Bar */}
      <MarketTicker
        poolState={poolState}
        price={price}
        volumeStats={volumeStats}
        chainId={chainId}
      />

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "0.6rem 1rem",
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {/* VIEW 1 & 2: ON-CHAIN DEX TRADING STATION (SWAP & LIQUIDITY) */}
        {(activeTab === "swap" || activeTab === "pool") && (
          <div className="trading-desk-layout">
            {/* Left 65%: Pro Trading Chart & AMM Math Curve */}
            <div className="trading-desk-main">
              <TradingChart
                poolState={poolState}
                events={events}
                price={price}
                volumeStats={volumeStats}
              />
            </div>

            {/* Right 35%: Execution Terminal */}
            <div className="trading-desk-sidebar">
              {/* Terminal Quick Switcher */}
              <div
                style={{
                  display: "flex",
                  background: "var(--tab-container-bg)",
                  border: "1px solid var(--tab-container-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.2rem",
                  marginBottom: "0.55rem",
                  gap: "0.2rem",
                }}
              >
                <button
                  className={`tab-btn ${activeTab === "swap" ? "active" : ""}`}
                  onClick={() => setActiveTab("swap")}
                  style={{
                    padding: "0.42rem",
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  <ArrowLeftRight size={13} />
                  <span>Swap</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === "pool" ? "active" : ""}`}
                  onClick={() => setActiveTab("pool")}
                  style={{
                    padding: "0.42rem",
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Droplet size={13} />
                  <span>Liquidity Pool</span>
                </button>
              </div>

              {activeTab === "swap" ? (
                <SwapCard
                  poolState={poolState}
                  signer={signer}
                  account={account}
                  provider={provider}
                  connectWallet={connectWallet}
                  onTxStart={handleTxStart}
                  onTxSuccess={handleTxSuccess}
                  onTxError={handleTxError}
                  price={price}
                  onViewAnalytics={() => setActiveTab("analytics")}
                />
              ) : (
                <LiquidityCard
                  poolState={poolState}
                  signer={signer}
                  account={account}
                  provider={provider}
                  connectWallet={connectWallet}
                  onTxStart={handleTxStart}
                  onTxSuccess={handleTxSuccess}
                  onTxError={handleTxError}
                />
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: FULL TRADER ANALYTICS & ACTIVITY LEDGER */}
        {activeTab === "analytics" && (
          <div style={{ width: "100%", maxWidth: "1440px", margin: "0 auto", paddingBottom: "1rem" }}>
            <TraderMetrics poolState={poolState} volumeStats={volumeStats} />
            <ActivityLedger
              events={events}
              loading={eventsLoading}
              onRefresh={refreshEvents}
              account={account}
              chainId={chainId}
            />
          </div>
        )}
      </main>

      {/* Faucet Modal */}
      <FaucetModal
        isOpen={faucetOpen}
        onClose={() => setFaucetOpen(false)}
        poolState={poolState}
        signer={signer}
        account={account}
        onMintSuccess={refreshAll}
      />

      {/* Transaction Status Modal */}
      <TransactionModal
        txState={txState}
        onClose={handleCloseTxModal}
        chainId={chainId}
      />
    </div>
  );
}

export default App;
