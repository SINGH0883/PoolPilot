import React from "react";
import { Waves, Wallet, Droplets, RefreshCw, PowerOff, Sun, Moon, ArrowLeftRight, Droplet, BarChart3, ShieldCheck, UserCheck } from "lucide-react";
import { shortenAddress } from "../lib/ethereum";
import { AVATAR_OPTIONS } from "../hooks/useTraderAuth";

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
  isAuthenticated,
  profile,
  openLogin,
  openProfile,
  signOut,
  switchNetwork,
}) {
  const handleFullDisconnect = () => {
    if (signOut) signOut();
    if (disconnectWallet) disconnectWallet();
  };

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


          {/* Network Status Badge */}
          {account && (
            chainId === 31337 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  color: "#10B981",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "0.45rem 0.65rem",
                  borderRadius: "var(--radius-md)",
                }}
                title="Connected to Hardhat / Anvil Local Node (Chain ID 31337)"
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
                <span>Localhost 31337</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => switchNetwork && switchNetwork(31337)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  color: "var(--accent-rose)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "0.45rem 0.65rem",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
                title="Click to switch MetaMask to Localhost 8545 (Chain ID 31337)"
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-rose)" }} />
                <span>Wrong Network (Switch)</span>
              </button>
            )
          )}

          {/* User Trader Profile & Wallet Connection */}
          {account && isAuthenticated && profile ? (
            /* State 1: Fully Authenticated SIWE Trader Profile */
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <button
                type="button"
                onClick={openProfile}
                title="View & Edit Trader Profile"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  background: "var(--pill-bg)",
                  border: "1px solid var(--accent-blue)",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background:
                      (AVATAR_OPTIONS.find((a) => a.id === profile.avatarId) || AVATAR_OPTIONS[0]).bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.72rem",
                  }}
                >
                  {(AVATAR_OPTIONS.find((a) => a.id === profile.avatarId) || AVATAR_OPTIONS[0]).icon}
                </div>
                <span>{profile.handle || shortenAddress(account)}</span>
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--accent-emerald)",
                  }}
                  title="SIWE Session Active"
                />
              </button>
              <button
                className="btn-secondary"
                onClick={handleFullDisconnect}
                title="Disconnect & Sign Out"
                style={{ padding: "0.5rem 0.6rem" }}
              >
                <PowerOff size={14} color="var(--accent-rose)" />
              </button>
            </div>
          ) : account ? (
            /* State 2: Wallet Connected but not SIWE Authenticated */
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={openLogin}
                style={{
                  padding: "0.45rem 0.8rem",
                  fontSize: "0.8rem",
                  background: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                title="Sign in with Ethereum to authenticate your trader profile"
              >
                <ShieldCheck size={14} />
                <span>Complete Sign In</span>
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  background: "var(--pill-bg)",
                  border: "1px solid var(--pill-border)",
                  padding: "0.48rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--pill-text)",
                }}
              >
                {shortenAddress(account)}
              </div>
              <button
                className="btn-secondary"
                onClick={handleFullDisconnect}
                title="Disconnect Wallet"
                style={{ padding: "0.5rem 0.6rem" }}
              >
                <PowerOff size={14} color="var(--accent-rose)" />
              </button>
            </div>
          ) : (
            /* State 3: Disconnected -> Sign In / Connect */
            <button
              className="btn-primary"
              onClick={openLogin || connectWallet}
              disabled={isConnecting}
              style={{
                padding: "0.52rem 1.05rem",
                fontSize: "0.86rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                background: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)",
              }}
            >
              <ShieldCheck size={16} />
              <span>{isConnecting ? "Connecting..." : "Sign In"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
