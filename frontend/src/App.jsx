import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Droplet, User, Coins, BarChart3, TrendingUp, Sparkles, AlertTriangle } from "lucide-react";
import { useWallet } from "./hooks/useWallet";
import { usePoolData } from "./hooks/usePoolData";
import { usePoolEvents } from "./hooks/usePoolEvents";
import { useLiveMarketData } from "./hooks/useLiveMarketData";
import { Header } from "./components/Header";
import { MarketTicker } from "./components/MarketTicker";
import { TradingChart } from "./components/TradingChart";
import { TraderMetrics } from "./components/TraderMetrics";
import { ActivityLedger } from "./components/ActivityLedger";
import { SwapCard } from "./components/SwapCard";
import { LiquidityCard } from "./components/LiquidityCard";
import { FaucetModal } from "./components/FaucetModal";
import { TransactionModal } from "./components/TransactionModal";
import { WalletModal } from "./components/WalletModal";
import { LoginModal } from "./components/LoginModal";
import { TraderProfileModal } from "./components/TraderProfileModal";
import { useTraderAuth } from "./hooks/useTraderAuth";
import { formatTokenAmount } from "./lib/ethereum";

export function App() {
  const {
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    error: walletError,
    clearError: clearWalletError,
    connectWallet,
    connectMetaMask,
    connectLocalDevWallet,
    disconnectWallet,
    switchNetwork,
    isWalletModalOpen,
    setIsWalletModalOpen,
  } = useWallet();

  const { poolState, loading: poolLoading, error: poolError, refresh: refreshPool } = usePoolData(provider, account);
  const { events, volumeStats, loading: eventsLoading, refreshEvents } = usePoolEvents(provider, poolState, account);
  const liveMarket = useLiveMarketData("ETH/USDC");

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
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Web3 Sign-In with Ethereum (SIWE) & Trader Profile State
  const {
    isAuthenticated,
    isSigning,
    authError,
    profile,
    signInWithEthereum,
    updateProfile,
    signOut,
  } = useTraderAuth(account, signer, chainId);

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
    if (liveMarket.refreshMarket) liveMarket.refreshMarket();
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

  // Compute exchange rate: on-chain pool spot if seeded, else real-time live market price!
  const r0 = Number(formatTokenAmount(poolState.reserve0, poolState.token0.decimals, 6));
  const r1 = Number(formatTokenAmount(poolState.reserve1, poolState.token1.decimals, 6));
  const price = r0 > 0 && r1 > 0 ? (r0 / r1).toFixed(2) : (liveMarket.marketData.priceFormatted || "2,370.00");

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
        isAuthenticated={isAuthenticated}
        profile={profile}
        openLogin={() => setLoginModalOpen(true)}
        openProfile={() => setProfileModalOpen(true)}
        signOut={signOut}
        switchNetwork={switchNetwork}
      />

      {/* Wrong Network Alert Banner */}
      {account && chainId && chainId !== 31337 && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.08) 100%)",
            borderBottom: "1px solid rgba(239, 68, 68, 0.35)",
            padding: "0.55rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.82rem",
            color: "var(--accent-rose)",
            zIndex: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Wrong Network:</strong> MetaMask is connected to Chain ID {chainId} (Ethereum Mainnet). PoolPilot contracts are deployed on <strong>Localhost 8545 (Chain ID 31337)</strong>. Switch to Localhost to trade and avoid warnings.
            </span>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => switchNetwork(31337)}
            style={{
              padding: "0.3rem 0.85rem",
              fontSize: "0.76rem",
              background: "var(--accent-rose)",
              borderColor: "var(--accent-rose)",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            Switch to Localhost 8545 (31337)
          </button>
        </div>
      )}

      {/* Realtime On-Chain & Live Binance CEX Market Ticker Bar */}
      <MarketTicker
        poolState={poolState}
        price={price}
        volumeStats={volumeStats}
        chainId={chainId}
        liveMarket={liveMarket}
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
                liveMarket={liveMarket}
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
                  openFaucet={() => setFaucetOpen(true)}
                  onTxStart={handleTxStart}
                  onTxSuccess={handleTxSuccess}
                  onTxError={handleTxError}
                  price={price}
                  onViewAnalytics={() => setActiveTab("analytics")}
                  onSwitchToPool={() => setActiveTab("pool")}
                  liveMarket={liveMarket}
                />
              ) : (
                <LiquidityCard
                  poolState={poolState}
                  signer={signer}
                  account={account}
                  provider={provider}
                  connectWallet={connectWallet}
                  openFaucet={() => setFaucetOpen(true)}
                  onTxStart={handleTxStart}
                  onTxSuccess={handleTxSuccess}
                  onTxError={handleTxError}
                  liveMarket={liveMarket}
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
        chainId={chainId}
        switchNetwork={switchNetwork}
        onMintSuccess={refreshAll}
      />

      {/* Transaction Status Modal */}
      <TransactionModal
        txState={txState}
        onClose={handleCloseTxModal}
        chainId={chainId}
      />

      {/* Wallet Connection Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        connectMetaMask={connectMetaMask}
        connectLocalDevWallet={connectLocalDevWallet}
        disconnectWallet={disconnectWallet}
        account={account}
        chainId={chainId}
        isConnecting={isConnecting}
        error={walletError}
        clearError={clearWalletError}
        switchNetwork={switchNetwork}
      />

      {/* Web3 SIWE Trader Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        account={account}
        connectWallet={connectWallet}
        connectMetaMask={connectMetaMask}
        connectLocalDevWallet={connectLocalDevWallet}
        signInWithEthereum={signInWithEthereum}
        isSigning={isSigning}
        authError={authError}
        price={price}
      />

      {/* Trader Profile & Settings Modal */}
      <TraderProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profile}
        account={account}
        updateProfile={updateProfile}
        signOut={signOut}
        disconnectWallet={disconnectWallet}
      />
    </div>
  );
}

export default App;
