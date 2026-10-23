import React from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, X } from "lucide-react";
import { SUPPORTED_NETWORKS, shortenAddress } from "../lib/ethereum";

export function TransactionModal({ txState, onClose, chainId }) {
  if (!txState || txState.status === "idle") return null;

  const currentNetwork = chainId ? SUPPORTED_NETWORKS[chainId] : null;
  const explorerUrl = currentNetwork?.explorerUrl;

  return (
    <div className="modal-overlay" onClick={txState.status !== "pending" && txState.status !== "waiting" ? onClose : undefined}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button if not in progress */}
        {txState.status !== "pending" && txState.status !== "waiting" && (
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
        )}

        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          {/* Waiting for signature */}
          {txState.status === "waiting" && (
            <div>
              <Loader2 size={52} className="spin-icon" color="var(--accent-cyan)" style={{ margin: "0 auto 1.25rem auto" }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                Confirm in Wallet
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Please review and approve the transaction in your connected Web3 wallet...
              </p>
            </div>
          )}

          {/* Pending on chain */}
          {txState.status === "pending" && (
            <div>
              <Loader2 size={52} className="spin-icon" color="var(--accent-violet)" style={{ margin: "0 auto 1.25rem auto" }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                Transaction Submitted
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Waiting for on-chain block confirmation...
              </p>
              {txState.hash && (
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Tx Hash: {shortenAddress(txState.hash)}
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {txState.status === "success" && (
            <div>
              <CheckCircle2 size={54} color="var(--accent-emerald)" style={{ margin: "0 auto 1.25rem auto" }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                Transaction Successful!
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                {txState.message || "Your operation has been confirmed on-chain."}
              </p>
              {txState.hash && explorerUrl && (
                <a
                  href={`${explorerUrl}/tx/${txState.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "var(--accent-blue)",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    marginBottom: "1.25rem",
                  }}
                >
                  <span>View on Explorer</span>
                  <ExternalLink size={14} />
                </a>
              )}
              <div>
                <button className="btn-primary" style={{ width: "100%" }} onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {txState.status === "error" && (
            <div>
              <XCircle size={54} color="var(--accent-rose)" style={{ margin: "0 auto 1.25rem auto" }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                Transaction Failed
              </h3>
              <div
                style={{
                  background: "rgba(244, 63, 94, 0.1)",
                  border: "1px solid rgba(244, 63, 94, 0.25)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.85rem",
                  color: "#FECDD3",
                  fontSize: "0.84rem",
                  lineHeight: "1.45",
                  marginBottom: "1.25rem",
                  textAlign: "left",
                }}
              >
                {txState.error || "An unknown error occurred while executing the transaction."}
              </div>
              <button className="btn-secondary" style={{ width: "100%" }} onClick={onClose}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
