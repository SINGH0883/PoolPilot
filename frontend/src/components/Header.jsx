import React from "react";
import { Waves, Wallet, Droplets, RefreshCw, PowerOff, Sun, Moon } from "lucide-react";
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
}) {
  const currentNetwork = chainId ? SUPPORTED_NETWORKS[chainId] : null;

  return (
    <header className="header-container">
      <div className="brand-badge">
        <div className="brand-icon">
          <Waves size={24} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="brand-title">PoolPilot</span>
            <span className="brand-tag">AMM v1</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1px" }}>
            Constant-Product Liquidity Protocol
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        {/* Theme Toggle Button */}
        <button
          className="btn-secondary"
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Theme" : "Switch to Minimal White & Blue Theme"}
          style={{ padding: "0.6rem" }}
        >
          {theme === "light" ? <Moon size={16} color="var(--accent-blue)" /> : <Sun size={16} color="var(--accent-cyan)" />}
        </button>

        {/* Refresh Pool Data Button */}
        <button
          className="btn-secondary"
          onClick={onRefresh}
          title="Refresh Pool State"
          style={{ padding: "0.6rem" }}
        >
          <RefreshCw size={16} className={loading ? "spin-icon" : ""} color="var(--text-secondary)" />
        </button>

        {/* Faucet Button */}
        <button className="btn-secondary" onClick={openFaucet} title="Mint free test tokens">
          <Droplets size={16} color="var(--accent-blue)" />
          <span>Faucet</span>
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
              padding: "0.5rem 0.85rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.82rem",
              color: "var(--badge-network-text)",
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--pill-bg)",
                border: "1px solid var(--pill-border)",
                padding: "0.55rem 0.95rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--pill-text)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
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
              style={{ padding: "0.6rem" }}
            >
              <PowerOff size={15} color="var(--accent-rose)" />
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={connectWallet} disabled={isConnecting}>
            <Wallet size={17} />
            <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
          </button>
        )}
      </div>
    </header>
  );
}
