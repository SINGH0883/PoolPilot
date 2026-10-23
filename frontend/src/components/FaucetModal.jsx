import React, { useState } from "react";
import { ethers } from "ethers";
import { Droplets, X, Loader2, CheckCircle2 } from "lucide-react";
import { ERC20_ABI } from "../config/abis";
import { parseContractError } from "../lib/ethereum";

export function FaucetModal({ isOpen, onClose, poolState, signer, account, onMintSuccess }) {
  const [minting, setMinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleMintTestTokens = async () => {
    if (!signer || !account) {
      setErrorMessage("Please connect your Web3 wallet first.");
      return;
    }

    try {
      setMinting(true);
      setStatusMessage("Minting 1,000 USDC and 1 WETH to your account...");
      setErrorMessage(null);

      const token0Contract = new ethers.Contract(poolState.token0.address, ERC20_ABI, signer);
      const token1Contract = new ethers.Contract(poolState.token1.address, ERC20_ABI, signer);

      const mintAmount0 = ethers.parseUnits("1000", poolState.token0.decimals);
      const mintAmount1 = ethers.parseUnits("1", poolState.token1.decimals);

      const tx0 = await token0Contract.mint(account, mintAmount0);
      await tx0.wait();

      const tx1 = await token1Contract.mint(account, mintAmount1);
      await tx1.wait();

      setStatusMessage("Tokens minted successfully!");
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-md)",
              background: "var(--pill-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Droplets size={22} color="var(--accent-blue)" />
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
              Testnet Faucet
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Mint free Mock ERC-20 tokens to test swaps and liquidity
            </p>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-glass)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Mock USDC:</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>+ 1,000.00 USDC</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Mock WETH:</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>+ 1.00 WETH</span>
          </div>
        </div>

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
          style={{ width: "100%" }}
          onClick={handleMintTestTokens}
          disabled={minting || !account}
        >
          {minting ? (
            <>
              <Loader2 size={16} className="spin-icon" />
              <span>Minting Tokens...</span>
            </>
          ) : (
            <span>Mint Test Tokens</span>
          )}
        </button>
      </div>
    </div>
  );
}
