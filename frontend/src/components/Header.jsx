import React from "react";
import { Waves, Wallet, Droplets, ExternalLink, RefreshCw, PowerOff } from "lucide-react";
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
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Constant-Product Liquidity Protocol
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Refresh Pool Data Button */}
        <button
          className="btn-secondary"
          onClick={onRefresh}
          title="Refresh Pool State"
          style={{ padding: "0.6rem" }}
        >
          <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
        </button>

        {/* Faucet Button */}
        <button className="btn-secondary" onClick={openFaucet} title="Mint test tokens">
          <Droplets size={16} color="var(--accent-cyan)" />
          <span>Faucet</span>
        </button>

        {/* Network Badge */}
        {chainId && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-glass)",
              padding: "0.5rem 0.85rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: currentNetwork ? "var(--accent-emerald)" : "var(--accent-rose)",
                boxShadow: currentNetwork ? "0 0 8px var(--accent-emerald)" : "none",
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
                background: "rgba(6, 182, 212, 0.12)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                padding: "0.55rem 0.95rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#FFFFFF",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--accent-cyan)",
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
