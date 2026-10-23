import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <div style={{ maxWidth: "1280px", margin: "1rem auto 0 auto", padding: "0 2rem" }}>
      <div className="alert-box alert-warning">
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong>Hackathon AMM Prototype:</strong> PoolPilot demonstrates constant-product liquidity, atomic settlement, slippage protection, and proportional LP accounting on local EVM / testnets. This prototype is for educational and testing demonstrations only.
        </div>
      </div>
    </div>
  );
}
