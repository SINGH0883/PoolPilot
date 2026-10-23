import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Droplet, User, Coins, BarChart3, TrendingUp, Sparkles } from "lucide-react";
import { useWallet } from "./hooks/useWallet";
import { usePoolData } from "./hooks/usePoolData";
import { usePoolEvents } from "./hooks/usePoolEvents";
import { Header } from "./components/Header";
import { DisclaimerBanner } from "./components/DisclaimerBanner";
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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

      {/* Dismissable Hackathon Disclaimer */}
      <DisclaimerBanner />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "1.25rem 1.5rem 3rem 1.5rem" }}>
        {/* VIEW 1: SWAP INTERFACE */}
        {activeTab === "swap" && (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            {/* Live Exchange Rate Pill */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--pill-bg)",
                border: "1px solid var(--pill-border)",
                borderRadius: "var(--radius-full)",
                padding: "0.45rem 1rem",
                marginBottom: "1rem",
                fontSize: "0.82rem",
                color: "var(--pill-text)",
                fontWeight: 600,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <TrendingUp size={14} />
                <span>1 {poolState.token1.symbol} ≈ ${price} {poolState.token0.symbol}</span>
              </div>
              <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>0.30% Fee Tier</span>
            </div>

            {/* Core Swap Card */}
            <SwapCard
              poolState={poolState}
              signer={signer}
              account={account}
              provider={provider}
              connectWallet={connectWallet}
              onTxStart={handleTxStart}
              onTxSuccess={handleTxSuccess}
              onTxError={handleTxError}
            />

            {/* Compact Pool Depth & Quick Health Strip */}
            <div
              className="glass-panel"
              style={{
                marginTop: "1.25rem",
                padding: "1rem 1.25rem",
                fontSize: "0.82rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Pool Reserves</span>
                <button
                  onClick={() => setActiveTab("analytics")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent-blue)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View Full Analytics →
                </button>
              </div>

              {/* Progress Depth Bar */}
              <div
                style={{
                  height: "8px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--tab-container-bg)",
                  overflow: "hidden",
                  display: "flex",
                  margin: "0.45rem 0",
                }}
              >
                <div style={{ width: "50%", background: "#2563EB" }} />
                <div style={{ width: "50%", background: "#8B5CF6" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                <span>{formatTokenAmount(poolState.reserve0, poolState.token0.decimals, 0)} {poolState.token0.symbol} (50%)</span>
                <span>{formatTokenAmount(poolState.reserve1, poolState.token1.decimals, 1)} {poolState.token1.symbol} (50%)</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LIQUIDITY PROVISION INTERFACE */}
        {activeTab === "pool" && (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
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
          </div>
        )}

        {/* VIEW 3: FULL TRADER ANALYTICS & ACTIVITY LEDGER */}
        {activeTab === "analytics" && (
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
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

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--header-border)",
          padding: "1.5rem 2rem",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "0.82rem",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div>
            <strong>PoolPilot</strong> — Constant-Product Automated Market Maker
          </div>
          <div>
            Built by <strong>Team 404</strong>: Yuvraj Kumar • Yash Singh • Alwin Mathew
          </div>
          <div style={{ color: "var(--text-subtle)", fontSize: "0.75rem" }}>
            Solidity 0.8.24 • OpenZeppelin v5 SafeERC20 • Constant Product k = x × y • 0.30% Fee Tier
          </div>
        </div>
      </footer>

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
