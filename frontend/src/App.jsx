import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Droplet } from "lucide-react";
import { useWallet } from "./hooks/useWallet";
import { usePoolData } from "./hooks/usePoolData";
import { Header } from "./components/Header";
import { DisclaimerBanner } from "./components/DisclaimerBanner";
import { PoolOverview } from "./components/PoolOverview";
import { SwapCard } from "./components/SwapCard";
import { LiquidityCard } from "./components/LiquidityCard";
import { FaucetModal } from "./components/FaucetModal";
import { TransactionModal } from "./components/TransactionModal";

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

  const { poolState, loading, error: poolError, refresh } = usePoolData(provider, account);

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
    refresh();
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
      {/* Top Header */}
      <Header
        account={account}
        chainId={chainId}
        isConnecting={isConnecting}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        openFaucet={() => setFaucetOpen(true)}
        onRefresh={refresh}
        loading={loading}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Mandatory Hackathon Disclaimer */}
      <DisclaimerBanner />

      {/* Main Container */}
      <main style={{ flex: 1, paddingBottom: "3rem" }}>
        {/* Pool Stat Cards */}
        <PoolOverview poolState={poolState} account={account} />

        {/* Trade / Pool Tabs */}
        <div style={{ maxWidth: "480px", margin: "1.5rem auto 1rem auto", padding: "0 1rem" }}>
          <div className="tab-container" style={{ margin: 0 }}>
            <button
              className={`tab-btn ${activeTab === "swap" ? "active" : ""}`}
              onClick={() => setActiveTab("swap")}
            >
              <ArrowLeftRight size={17} />
              <span>Swap</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "pool" ? "active" : ""}`}
              onClick={() => setActiveTab("pool")}
            >
              <Droplet size={17} />
              <span>Pool & Liquidity</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: "0 1rem" }}>
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
        onMintSuccess={refresh}
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
