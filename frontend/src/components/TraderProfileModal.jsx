import React, { useState } from "react";
import { X, Check, Copy, ExternalLink, ShieldCheck, LogOut, Settings, Award } from "lucide-react";
import { AVATAR_OPTIONS } from "../hooks/useTraderAuth";
import { shortenAddress } from "../lib/ethereum";

export function TraderProfileModal({
  isOpen,
  onClose,
  profile,
  account,
  updateProfile,
  signOut,
  disconnectWallet,
}) {
  const [copied, setCopied] = useState(false);
  const [handle, setHandle] = useState(profile?.handle || "");
  const [avatarId, setAvatarId] = useState(profile?.avatarId || "cyber-blue");
  const [slippage, setSlippage] = useState(profile?.slippagePreference || 0.5);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !profile) return null;

  const currentAvatar = AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];

  const handleCopy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    updateProfile({
      handle: handle.trim() || profile.handle,
      avatarId,
      slippagePreference: slippage,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "460px", padding: "1.5rem" }}
      >
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
          <X size={20} />
        </button>

        {/* Profile Card Top */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid var(--border-glass)",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: currentAvatar.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
              border: "2px solid #FFFFFF",
            }}
          >
            {currentAvatar.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.2rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {profile.handle || "Trader"}
              </h3>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.7rem",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10B981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "var(--radius-full)",
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={12} />
                <span>SIWE Verified</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{shortenAddress(account)}</span>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  background: "transparent",
                  border: "none",
                  color: copied ? "var(--accent-emerald)" : "var(--text-muted)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  fontSize: "0.74rem",
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Statistics & Badges */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1.2rem" }}>
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem",
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Trader Tier</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
              <Award size={15} color="var(--accent-cyan)" />
              <span>{profile.tier || "AMM Pioneer"}</span>
            </div>
          </div>
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem",
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Auth Standard</div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--accent-blue)", fontFamily: "monospace" }}>
              EIP-4361 SIWE
            </div>
          </div>
        </div>

        {/* Edit Handle & Avatar Form */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>
            Edit Trader Handle:
          </label>
          <input
            type="text"
            className="token-amount-input"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            style={{
              fontSize: "0.9rem",
              padding: "0.55rem 0.8rem",
              width: "100%",
              background: "var(--bg-input)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Change Avatar Theme */}
        <div style={{ marginBottom: "1.1rem" }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
            Change Avatar Theme:
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAvatarId(a.id)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: a.bg,
                  border: avatarId === a.id ? "2.5px solid #FFFFFF" : "2px solid transparent",
                  boxShadow: avatarId === a.id ? "0 0 10px rgba(37, 99, 235, 0.45)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  transition: "transform 0.15s",
                  transform: avatarId === a.id ? "scale(1.1)" : "scale(1)",
                }}
                title={a.label}
              >
                {a.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Default Slippage Preference */}
        <div style={{ marginBottom: "1.3rem" }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
            Default Slippage Preference:
          </label>
          <div style={{ display: "flex", gap: "0.45rem" }}>
            {[0.1, 0.5, 1.0].map((s) => (
              <button
                key={s}
                type="button"
                className={`timeframe-pill ${slippage === s ? "active" : ""}`}
                style={{ flex: 1, padding: "0.4rem", fontSize: "0.78rem", textAlign: "center" }}
                onClick={() => setSlippage(s)}
              >
                {s}% {s === 0.5 && "(Auto)"}
              </button>
            ))}
          </div>
        </div>

        {savedSuccess && (
          <div className="alert-box alert-info" style={{ marginBottom: "1rem", fontSize: "0.78rem" }}>
            <Check size={14} />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        {/* Modal Buttons */}
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            className="btn-primary"
            style={{ flex: 1, padding: "0.65rem" }}
            onClick={handleSave}
          >
            <span>Save Profile</span>
          </button>
          <button
            className="btn-secondary"
            style={{
              padding: "0.65rem 0.95rem",
              color: "var(--accent-rose)",
              borderColor: "rgba(244, 63, 94, 0.3)",
              background: "rgba(244, 63, 94, 0.08)",
            }}
            onClick={() => {
              signOut();
              if (disconnectWallet) disconnectWallet();
              onClose();
            }}
            title="Sign out of trader session & disconnect wallet"
          >
            <LogOut size={15} style={{ marginRight: "4px" }} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
