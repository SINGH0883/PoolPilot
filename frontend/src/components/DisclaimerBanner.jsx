import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div style={{ maxWidth: "1280px", margin: "0.75rem auto 0 auto", padding: "0 1.5rem" }}>
      <div
        className="alert-box alert-warning"
        style={{
          margin: 0,
          padding: "0.55rem 0.9rem",
          fontSize: "0.78rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>
            <strong>Prototype Notice:</strong> PoolPilot is an educational constant-product AMM prototype on local EVM / testnet. Not audited.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            opacity: 0.7,
            display: "flex",
            alignItems: "center",
          }}
          title="Dismiss notice"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
