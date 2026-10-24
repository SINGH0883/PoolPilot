import React, { useState } from "react";
import { ethers } from "ethers";
import { Droplets, X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { ERC20_ABI } from "../config/abis";
import { parseContractError } from "../lib/ethereum";

export function FaucetModal({
  isOpen,
  onClose,
  poolState,
  signer,
  account,
  chainId,
  switchNetwork,
  onMintSuccess,
}) {
  const [tier, setTier] = useState("pro"); // "starter" | "pro" | "whale"
  const [minting, setMinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const isWrongNetwork = chainId && chainId !== 31337;

  const TIERS = {
    starter: { usdc: "1000", weth: "1", label: "Starter Pack" },
    pro: { usdc: "10000", weth: "5", label: "Pro Trader (Recommended)" },
    whale: { usdc: "50000", weth: "25", label: "Whale / LP Pack" },
  };

  const selectedTier = TIERS[tier] || TIERS.pro;

  const handleMintTestTokens = async () => {
    if (!signer || !account) {
      setErrorMessage("Please connect your Web3 wallet first.");
      return;
    }

    if (isWrongNetwork) {
      if (switchNetwork) {
        await switchNetwork(31337);
        return;
      }
      setErrorMessage("Please switch your wallet to Localhost 8545 (Chain ID 31337) before minting.");
      return;
    }

    try {
      setMinting(true);
      setStatusMessage(`Minting ${Number(selectedTier.usdc).toLocaleString()} USDC and ${selectedTier.weth} WETH to your account...`);
      setErrorMessage(null);

      const token0Contract = new ethers.Contract(poolState.token0.address, ERC20_ABI, signer);
      const token1Contract = new ethers.Contract(poolState.token1.address, ERC20_ABI, signer);

      const mintAmount0 = ethers.parseUnits(selectedTier.usdc, poolState.token0.decimals);
      const mintAmount1 = ethers.parseUnits(selectedTier.weth, poolState.token1.decimals);

      const tx0 = await token0Contract.mint(account, mintAmount0);
      await tx0.wait();

      const tx1 = await token1Contract.mint(account, mintAmount1);
      await tx1.wait();

      setStatusMessage("Tokens minted successfully to your wallet!");
      if (onMintSuccess) onMintSuccess();
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1500);
    } catch (err) {
      setErrorMessage(parseContractError(err));
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-md)",
              background: "rgba(2, 132, 199, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(2, 132, 199, 0.3)",
            }}
          >
            <Droplets size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
              Testnet Faucet
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Mint free Mock ERC-20 tokens directly to your connected wallet
            </p>
          </div>
        </div>

        {/* Amount Tier Selector */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
            Select Faucet Allocation:
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
            {Object.entries(TIERS).map(([key, t]) => (
              <button
                key={key}
                type="button"
                className={`timeframe-pill ${tier === key ? "active" : ""}`}
                style={{ padding: "0.45rem 0.2rem", textAlign: "center", width: "100%", fontSize: "0.76rem" }}
                onClick={() => setTier(key)}
              >
                <div>{t.usdc >= 1000 ? `${Number(t.usdc) / 1000}k` : t.usdc} USDC</div>
                <div style={{ opacity: 0.8, fontSize: "0.7rem" }}>{t.weth} WETH</div>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-glass)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem 1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{poolState.token0.symbol || "USDC"} Allocation:</span>
            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>+ {Number(selectedTier.usdc).toLocaleString()}.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{poolState.token1.symbol || "WETH"} Allocation:</span>
            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>+ {selectedTier.weth}.00</span>
          </div>
        </div>

        {isWrongNetwork && (
          <div className="alert-box alert-error" style={{ marginBottom: "1rem", flexDirection: "column", alignItems: "flex-start", gap: "0.45rem", fontSize: "0.78rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontWeight: 700 }}>
              <AlertTriangle size={16} />
              <span>Wrong Network: Connected to Chain ID {chainId}</span>
            </div>
            <div style={{ lineHeight: 1.4 }}>
              PoolPilot mock tokens are deployed on <strong>Localhost 8545 (Chain ID 31337)</strong>. Minting on Mainnet triggers MetaMask's Blockaid warning because local test contracts do not exist on Mainnet.
            </div>
            {switchNetwork && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => switchNetwork(31337)}
                style={{ padding: "0.35rem 0.8rem", fontSize: "0.76rem", marginTop: "0.25rem", background: "var(--accent-rose)", borderColor: "var(--accent-rose)" }}
              >
                Switch to Localhost 8545 (31337)
              </button>
            )}
          </div>
        )}

        {statusMessage && (
          <div className="alert-box alert-info" style={{ marginBottom: "1rem" }}>
            <CheckCircle2 size={16} />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="alert-box alert-error" style={{ marginBottom: "1rem" }}>
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          className="btn-primary"
          style={{ width: "100%", background: isWrongNetwork ? "var(--accent-rose)" : "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)" }}
          onClick={handleMintTestTokens}
          disabled={minting || !account}
        >
          {minting ? (
            <>
              <Loader2 size={16} className="spin-icon" />
              <span>Minting Tokens...</span>
            </>
          ) : !account ? (
            <span>Connect Wallet First</span>
          ) : isWrongNetwork ? (
            <span>Switch to Localhost 8545 (31337) to Mint</span>
          ) : (
            <span>Mint {Number(selectedTier.usdc).toLocaleString()} USDC & {selectedTier.weth} WETH</span>
          )}
        </button>
      </div>
    </div>
  );
}
