import React from "react";
import { Wallet, X, CheckCircle2, AlertTriangle, ExternalLink, Terminal, Shield, RefreshCw } from "lucide-react";
import { shortenAddress, SUPPORTED_NETWORKS } from "../lib/ethereum";

export function WalletModal({
  isOpen,
  onClose,
  connectMetaMask,
  connectLocalDevWallet,
  disconnectWallet,
  account,
  chainId,
  isConnecting,
  error,
  clearError,
  switchNetwork,
}) {
  if (!isOpen) return null;

  const hasInjectedWallet = typeof window !== "undefined" && !!window.ethereum;
  const currentNetwork = chainId ? SUPPORTED_NETWORKS[chainId] : null;
  const isSupported = !!currentNetwork;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.2rem",
            right: "1.2rem",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <X size={19} />
        </button>

        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-md)",
              background: "var(--pill-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wallet size={22} color="var(--accent-blue)" />
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700 }}>
              {account ? "Wallet Connected" : "Connect Wallet"}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              {account
                ? "Manage your connected Web3 account"
                : "Select your preferred EVM connection method"}
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            className="alert-box alert-error"
            style={{ marginBottom: "1rem", padding: "0.7rem 0.85rem", fontSize: "0.8rem" }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <div>{error}</div>
              {clearError && (
                <button
                  onClick={clearError}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    textDecoration: "underline",
                    fontSize: "0.74rem",
                    cursor: "pointer",
                    padding: 0,
                    marginTop: "4px",
                  }}
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* ALREADY CONNECTED VIEW */}
        {account ? (
          <div>
            <div
              style={{
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-md)",
                padding: "0.95rem 1.1rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                  Active Address
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.72rem",
                    color: "var(--accent-emerald)",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={12} /> Connected
                </span>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "0.98rem", fontWeight: 700, color: "var(--text-primary)", wordBreak: "break-all" }}>
                {account}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", paddingTop: "0.6rem", borderTop: "1px solid var(--border-card)" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Network:</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: isSupported ? "var(--accent-blue)" : "var(--accent-rose)" }}>
                  {currentNetwork?.name || `Chain ID: ${chainId || "Unknown"}`}
                </span>
              </div>
            </div>

            {/* Wrong Network Warning */}
            {!isSupported && chainId && (
              <div className="alert-box alert-warning" style={{ marginBottom: "1rem", fontSize: "0.8rem" }}>
                <AlertTriangle size={16} />
                <div style={{ flex: 1 }}>
                  <div>Connected network ({chainId}) is not supported.</div>
                  {switchNetwork && (
                    <button
                      className="btn-primary"
                      onClick={() => switchNetwork(31337)}
                      style={{ marginTop: "0.5rem", padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
                    >
                      Switch to Localhost (31337)
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              className="btn-secondary"
              onClick={() => {
                disconnectWallet();
                onClose();
              }}
              style={{
                width: "100%",
                padding: "0.75rem",
                color: "var(--accent-rose)",
                borderColor: "rgba(239, 68, 68, 0.3)",
                fontWeight: 600,
              }}
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          /* NOT CONNECTED: SELECTION OPTIONS */
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* Option 1: Browser Extension (MetaMask / Rabby / Brave) */}
            <div
              onClick={() => {
                if (hasInjectedWallet) {
                  connectMetaMask();
                } else {
                  window.open("https://metamask.io/download/", "_blank");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.9rem 1.1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-card)",
                background: "var(--bg-card-subtle)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="wallet-option-item"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(245, 132, 31, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={20} color="#F5841F" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                    MetaMask / Browser Wallet
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    {hasInjectedWallet ? "Injected EVM extension detected" : "Extension not found — click to install"}
                  </div>
                </div>
              </div>

              <div>
                {hasInjectedWallet ? (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#10B981",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    {isConnecting ? "Connecting..." : "Detected"}
                  </span>
                ) : (
                  <ExternalLink size={15} color="var(--text-muted)" />
                )}
              </div>
            </div>

            {/* Option 2: Local Dev Account (Anvil Test Wallet) */}
            <div
              onClick={() => {
                connectLocalDevWallet();
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.9rem 1.1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-card)",
                background: "var(--bg-card-subtle)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="wallet-option-item"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(37, 99, 235, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Terminal size={19} color="var(--accent-blue)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                    Local Anvil Dev Wallet
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    1-Click instant test account (0xf39F...2266)
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  background: "var(--pill-bg)",
                  color: "var(--pill-text)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "var(--radius-full)",
                }}
              >
                Instant
              </span>
            </div>

            <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.5rem" }}>
              PoolPilot connects directly to standard EVM testnets and local Anvil nodes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
