import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Wallet,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Shield,
  Terminal,
  Waves,
  TrendingUp,
  Droplets,
  Lock,
  ArrowRight,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";
import { AVATAR_OPTIONS } from "../hooks/useTraderAuth";
import { shortenAddress } from "../lib/ethereum";

export function LoginModal({
  isOpen,
  onClose,
  account,
  connectWallet,
  connectMetaMask,
  connectLocalDevWallet,
  signInWithEthereum,
  isSigning,
  authError,
  price = "2,367.85",
}) {
  const [handle, setHandle] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("cyber-blue");
  const [justAuthenticated, setJustAuthenticated] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatar) || AVATAR_OPTIONS[0];

  const handleCopy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignIn = async () => {
    const success = await signInWithEthereum(handle, selectedAvatar);
    if (success) {
      setJustAuthenticated(true);
      setTimeout(() => {
        setJustAuthenticated(false);
        onClose();
      }, 1300);
    }
  };

  return (
    <div className="login-fullscreen-overlay">
      {/* ======================================================== */}
      {/* FULL-SCREEN TOP NAVIGATION BAR                           */}
      {/* ======================================================== */}
      <header className="login-fullscreen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 14px rgba(37, 99, 235, 0.3)",
            }}
          >
            <Waves size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
              PoolPilot
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Constant-Product Protocol
            </div>
          </div>
        </div>

        {/* Center Live Protocol Ticker Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="header-nav-pills login-header-ticker hide-on-mobile">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              background: "var(--pill-bg)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-full)",
              padding: "0.3rem 0.85rem",
              fontSize: "0.78rem",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>Live ETH:</span>
            <span style={{ fontWeight: 700, color: "var(--accent-blue)" }}>${price}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              background: "var(--pill-bg)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-full)",
              padding: "0.3rem 0.85rem",
              fontSize: "0.78rem",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>Pool TVL:</span>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>$1,828,886</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              background: "var(--pill-bg)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-full)",
              padding: "0.3rem 0.85rem",
              fontSize: "0.78rem",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>Fee:</span>
            <span style={{ fontWeight: 700, color: "var(--accent-emerald)" }}>0.30%</span>
          </div>
        </div>

        {/* Right Corner: Return / Close Button */}
        <div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.5rem 0.95rem",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
            title="Return to Trading Desk"
          >
            <ArrowLeft size={15} />
            <span>Return to Trading Desk</span>
            <X size={15} style={{ marginLeft: "4px" }} />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN FULL-SCREEN BODY: LEFT HERO + RIGHT SIGN IN FORM    */}
      {/* ======================================================== */}
      <div className="login-fullscreen-body">
        {/* ======================================================== */}
        {/* LEFT SIDE: VECTOR ILLUSTRATION & HERO BRANDING           */}
        {/* ======================================================== */}
        <div className="login-fullscreen-left">
          <div style={{ maxWidth: "560px", margin: "0 auto", width: "100%" }}>

            {/* Main Welcome Heading */}
            <h1
              className="login-hero-title"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.35rem",
                fontWeight: 800,
                lineHeight: 1.15,
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
                letterSpacing: "-0.025em",
              }}
            >
              Welcome to{" "}
              <span style={{ background: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                PoolPilot
              </span>
            </h1>

            <p className="login-hero-subtitle" style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: "1.5rem" }}>
              A high-performance automated market maker with transparent on-chain liquidity pools, sub-second orderflow, and non-custodial cryptographic authentication.
            </p>

            {/* Vector Illustration Container */}
            <div className="login-hero-img-card">
              <img
                src="/login_hero.jpg"
                alt="PoolPilot Decentralized Trading Concept"
                className="login-hero-img"
              />
            </div>

            {/* 3 Feature Pills at Bottom */}
            <div className="login-feature-pills" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.65rem 0.75rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  ⚡ Zero Gas SIWE
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Free cryptographic sign-in
                </div>
              </div>

              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.65rem 0.75rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  💧 Constant Product
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  x · y = k AMM math
                </div>
              </div>

              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.65rem 0.75rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  🔒 Non-Custodial
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Your keys, your crypto
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT SIDE: AUTHENTICATION & TRADER PORTAL CARD          */}
        {/* ======================================================== */}
        <div className="login-fullscreen-right">
          <div className="login-form-card">
            {/* Header of Form Card */}
            <div style={{ marginBottom: "1.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: "rgba(37, 99, 235, 0.12)",
                    color: "var(--accent-blue)",
                    padding: "0.22rem 0.6rem",
                    borderRadius: "var(--radius-full)",
                  }}
                >
                  Trader Sign-In
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {account ? "Step 2 of 2" : "Step 1 of 2"}
                </span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {account ? "Activate Trader Profile" : "Connect Your Wallet"}
              </h2>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: "3px", lineHeight: 1.45 }}>
                {account
                  ? "Customize your on-chain handle and sign with 0 gas to complete login."
                  : "Select an EVM wallet provider to authenticate and trade on PoolPilot."}
              </p>
            </div>

            {/* Success View */}
            {justAuthenticated ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <CheckCircle2 size={56} color="var(--accent-emerald)" style={{ margin: "0 auto 1rem auto" }} />
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                  Authenticated Successfully!
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.2rem" }}>
                  Welcome back, <strong>{handle || "Trader"}</strong>!
                </p>
                <div style={{ fontSize: "0.8rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                  Launching PoolPilot Trading Desk...
                </div>
              </div>
            ) : !account ? (
              /* ======================================================== */
              /* STEP 1: WALLET CONNECTION CHOICES                        */
              /* ======================================================== */
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.4rem" }}>
                  {/* Option 1: MetaMask / Browser Extension */}
                  <button
                    type="button"
                    className="wallet-option-item"
                    onClick={async () => {
                      if (typeof window !== "undefined" && window.ethereum) {
                        if (connectMetaMask) await connectMetaMask();
                      } else {
                        window.open("https://metamask.io/download/", "_blank");
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem 1.15rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-card)",
                      background: "var(--bg-card-subtle)",
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
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
                        <div style={{ fontWeight: 700, fontSize: "0.94rem", color: "var(--text-primary)" }}>
                          MetaMask / Browser Extension
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Connect via injected Web3 extension
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        background: "rgba(37, 99, 235, 0.12)",
                        color: "var(--accent-blue)",
                        padding: "0.25rem 0.65rem",
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      Connect
                    </span>
                  </button>
                </div>

                {/* Explanatory Bottom Note */}
                <div
                  style={{
                    background: "var(--pill-bg)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.85rem 1rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    fontSize: "0.78rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.45,
                  }}
                >
                  <Lock size={16} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>
                    No private keys or passwords are ever requested. Connecting gives PoolPilot read-only access to your token balances.
                  </span>
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* STEP 2: PROFILE SETUP & SIGN WITH ETHEREUM (SIWE)        */
              /* ======================================================== */
              <div>
                {/* Connected Account Pill */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "var(--tab-container-bg)",
                    border: "1px solid var(--tab-container-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.65rem 0.95rem",
                    marginBottom: "1.1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: currentAvatar.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                      }}
                    >
                      {currentAvatar.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Connected Address</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "monospace" }}>
                        {shortenAddress(account)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-secondary"
                    style={{ padding: "0.3rem 0.55rem", fontSize: "0.72rem" }}
                    title="Copy wallet address"
                  >
                    {copied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* Trader Handle Input */}
                <div style={{ marginBottom: "1.1rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "0.4rem" }}>
                    Trader Alias / Handle:
                  </label>
                  <input
                    type="text"
                    className="token-amount-input"
                    placeholder={`@pilot_${account.slice(2, 6).toLowerCase()}`}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    style={{
                      fontSize: "0.95rem",
                      padding: "0.65rem 0.85rem",
                      width: "100%",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                    }}
                  />
                </div>

                {/* Avatar Selection */}
                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>
                    Choose Trader Avatar:
                  </label>
                  <div style={{ display: "flex", gap: "0.55rem" }}>
                    {AVATAR_OPTIONS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAvatar(a.id)}
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          background: a.bg,
                          border: selectedAvatar === a.id ? "3px solid #FFFFFF" : "2px solid transparent",
                          boxShadow: selectedAvatar === a.id ? "0 0 14px rgba(37, 99, 235, 0.5)" : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.05rem",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          transform: selectedAvatar === a.id ? "scale(1.12)" : "scale(1)",
                        }}
                        title={a.label}
                      >
                        {a.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zero-Gas Security Note */}
                <div
                  style={{
                    background: "rgba(37, 99, 235, 0.08)",
                    border: "1px solid rgba(37, 99, 235, 0.2)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.75rem 0.95rem",
                    fontSize: "0.76rem",
                    color: "var(--text-secondary)",
                    marginBottom: "1.3rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.55rem",
                    lineHeight: 1.45,
                  }}
                >
                  <Sparkles size={17} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>
                    <strong>Zero Gas Fee:</strong> Off-chain cryptographic signature verifies ownership without sending an on-chain transaction or paying gas.
                  </span>
                </div>

                {/* Error Box */}
                {authError && (
                  <div className="alert-box alert-error" style={{ marginBottom: "1rem", fontSize: "0.78rem" }}>
                    <AlertCircle size={15} />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Sign In Primary Action Button */}
                <button
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "0.85rem",
                    fontSize: "0.98rem",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)",
                    boxShadow: "0 4px 18px rgba(37, 99, 235, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                  onClick={handleSignIn}
                  disabled={isSigning}
                >
                  {isSigning ? (
                    <>
                      <Loader2 size={18} className="spin-icon" />
                      <span>Confirm Signature in Wallet...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={19} />
                      <span>Sign In with Wallet (SIWE)</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                {/* Skip Link */}
                <div style={{ textAlign: "center", marginTop: "0.85rem" }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "0.76rem",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: "0.3rem",
                      transition: "color 0.2s",
                    }}
                  >
                    Skip for now & enter trading desk as guest
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
