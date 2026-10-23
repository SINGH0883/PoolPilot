import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Droplet, User, Coins } from "lucide-react";
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

  const [activeTab, setActiveTab] = useState("swap"); // "swap" | "pool"
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

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Navigation */}
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
      />

      {/* Mandatory Hackathon Prototype Disclaimer */}
      <DisclaimerBanner />

      {/* Main Trader Dashboard Container */}
      <main style={{ flex: 1, maxWidth: "1280px", width: "100%", margin: "1rem auto 0 auto", padding: "0 1.5rem 3rem 1.5rem" }}>
        {/* Top 4 KPI Metric Cards & Pool Reserve Depth Meter */}
        <TraderMetrics poolState={poolState} volumeStats={volumeStats} />

        {/* Two-Column Trader Dashboard Grid */}
        <div className="trader-grid">
          {/* Left Column: Live On-Chain Activity Ledger */}
          <div>
            <ActivityLedger
              events={events}
              loading={eventsLoading}
              onRefresh={refreshEvents}
              account={account}
              chainId={chainId}
            />
          </div>

          {/* Right Column: Trading & Liquidity Console */}
          <div>
            {/* Console Action Tabs */}
            <div className="tab-container" style={{ marginBottom: "1rem" }}>
              <button
                className={`tab-btn ${activeTab === "swap" ? "active" : ""}`}
                onClick={() => setActiveTab("swap")}
              >
                <ArrowLeftRight size={16} />
                <span>Swap Tokens</span>
              </button>
              <button
                className={`tab-btn ${activeTab === "pool" ? "active" : ""}`}
                onClick={() => setActiveTab("pool")}
              >
                <Droplet size={16} />
                <span>Liquidity Pool</span>
              </button>
            </div>

            {/* Swap or Liquidity Card */}
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

            {/* Quick Wallet Portfolio Snippet */}
            {account && (
              <div
                className="glass-panel"
                style={{
                  marginTop: "1.25rem",
                  padding: "1rem 1.25rem",
                  fontSize: "0.84rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    <User size={15} color="var(--accent-blue)" />
                    <span>Your Balances</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Connected Account</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>{poolState.token0.symbol}:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {formatTokenAmount(poolState.token0.userBalance, poolState.token0.decimals, 2)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>{poolState.token1.symbol}:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {formatTokenAmount(poolState.token1.userBalance, poolState.token1.decimals, 4)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-card)", paddingTop: "0.4rem", marginTop: "0.4rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>LP Pool Shares:</span>
                  <span style={{ fontWeight: 700, color: "var(--accent-blue)" }}>
                    {formatTokenAmount(poolState.userLpBalance, 18, 4)} PLP
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--header-border)",
          padding: "1.75rem 2rem",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "0.82rem",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          <div>
            <strong>PoolPilot</strong> — Constant-Product Automated Market Maker
          </div>
          <div>
            Built by <strong>Team 404</strong>: Yuvraj Kumar (Data & Reserves) • Yash Singh (UI/UX) • Alwin Mathew (Backend & On-Chain)
          </div>
          <div style={{ color: "var(--text-subtle)", fontSize: "0.75rem" }}>
            Solidity 0.8.24 • OpenZeppelin v5 SafeERC20 • Constant Product x * y = k • 0.30% Fee Tier
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
