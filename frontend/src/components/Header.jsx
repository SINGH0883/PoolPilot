import React from "react";
import { Waves, Wallet, Droplets, RefreshCw, PowerOff, Sun, Moon, ArrowLeftRight, Droplet, BarChart3 } from "lucide-react";
import { shortenAddress, SUPPORTED_NETWORKS } from "../lib/ethereum";

export function Header({
  account,
  chainId,
  isConnecting,
  connectWallet,
  disconnectWallet,
  openFaucet,
  onRefresh,
  loading,
  theme,
  toggleTheme,
  activeTab,
  setActiveTab,
}) {
  const currentNetwork = chainId ? SUPPORTED_NETWORKS[chainId] : null;

  return (
    <header className="top-navbar-wrapper">
      <div className="top-navbar-inner">
        {/* Brand Left */}
        <div className="brand-badge" onClick={() => setActiveTab && setActiveTab("swap")} style={{ cursor: "pointer" }}>
          <div className="brand-icon">
            <Waves size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="brand-title">PoolPilot</span>
              <span className="brand-tag">AMM v1</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" }}>
              Constant-Product Protocol
            </div>
          </div>
        </div>

        {/* Center Main Navigation Tabs */}
        {setActiveTab && (
          <nav className="header-nav-pills">
            <button
              className={`nav-pill-btn ${activeTab === "swap" ? "active" : ""}`}
              onClick={() => setActiveTab("swap")}
            >
              <ArrowLeftRight size={15} />
              <span>Swap</span>
            </button>
            <button
              className={`nav-pill-btn ${activeTab === "pool" ? "active" : ""}`}
              onClick={() => setActiveTab("pool")}
            >
              <Droplet size={15} />
              <span>Pool</span>
            </button>
            <button
              className={`nav-pill-btn ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart3 size={15} />
              <span>Analytics</span>
            </button>
          </nav>
        )}

        {/* Controls Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          {/* Theme Toggle Button */}
          <button
            className="btn-secondary"
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Minimal White & Blue Theme"}
            style={{ padding: "0.5rem 0.65rem" }}
          >
            {theme === "light" ? <Moon size={16} color="var(--accent-blue)" /> : <Sun size={16} color="var(--accent-cyan)" />}
          </button>

          {/* Refresh Button */}
          <button
            className="btn-secondary"
            onClick={onRefresh}
            title="Refresh pool state & on-chain events"
            style={{ padding: "0.5rem 0.65rem" }}
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} color="var(--text-secondary)" />
          </button>

          {/* Faucet Button */}
          <button className="btn-secondary" onClick={openFaucet} title="Mint free test tokens" style={{ padding: "0.5rem 0.85rem" }}>
            <Droplets size={15} color="var(--accent-blue)" />
            <span style={{ fontWeight: 600 }}>Faucet</span>
          </button>

          {/* Network Badge */}
          {chainId && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                background: "var(--badge-network-bg)",
                border: "1px solid var(--badge-network-border)",
                padding: "0.45rem 0.75rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.8rem",
                color: "var(--badge-network-text)",
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: currentNetwork ? "var(--accent-emerald)" : "var(--accent-rose)",
                  boxShadow: currentNetwork ? "0 0 6px var(--accent-emerald)" : "none",
                }}
              />
              <span>{currentNetwork ? currentNetwork.name : `Chain #${chainId}`}</span>
            </div>
          )}

          {/* Wallet Connection */}
          {account ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  background: "var(--pill-bg)",
                  border: "1px solid var(--pill-border)",
                  padding: "0.48rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--pill-text)",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--accent-blue)",
                  }}
                />
                {shortenAddress(account)}
              </div>
              <button
                className="btn-secondary"
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                style={{ padding: "0.5rem 0.6rem" }}
              >
                <PowerOff size={14} color="var(--accent-rose)" />
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={connectWallet} disabled={isConnecting} style={{ padding: "0.55rem 1.1rem", fontSize: "0.88rem" }}>
              <Wallet size={16} />
              <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
