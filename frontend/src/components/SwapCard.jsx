import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ArrowDownUp, Settings, AlertCircle, Check, Loader2 } from "lucide-react";
import { POOL_ABI, ERC20_ABI } from "../config/abis";
import {
  formatTokenAmount,
  parseTokenAmount,
  calculateSlippageMin,
  parseContractError,
} from "../lib/ethereum";

export function SwapCard({
  poolState,
  signer,
  account,
  provider,
  connectWallet,
  onTxStart,
  onTxSuccess,
  onTxError,
}) {
  const { token0, token1, reserve0, reserve1, poolAddress } = poolState;

  // Direction: true = token0 -> token1, false = token1 -> token0
  const [isToken0In, setIsToken0In] = useState(true);
  const [amountInStr, setAmountInStr] = useState("");
  const [estimatedOut, setEstimatedOut] = useState(0n);
  const [slippage, setSlippage] = useState(0.5); // 0.5% default
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const inputToken = isToken0In ? token0 : token1;
  const outputToken = isToken0In ? token1 : token0;
  const inputReserve = isToken0In ? reserve0 : reserve1;
  const outputReserve = isToken0In ? reserve1 : reserve0;

  const amountInBigInt = parseTokenAmount(amountInStr, inputToken.decimals);
  const hasInsufficientBalance = account && amountInBigInt > inputToken.userBalance;
  const needsApproval = account && amountInBigInt > 0n && amountInBigInt > inputToken.allowance;

  // Calculate live quote via pool contract or local math fallback
  const fetchQuote = useCallback(async (amountIn) => {
    if (!amountIn || amountIn <= 0n || !provider || inputReserve === 0n || outputReserve === 0n) {
      setEstimatedOut(0n);
      return;
    }

    try {
      setQuoting(true);
      const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
      const quote = await poolContract.getAmountOut(inputToken.address, amountIn);
      setEstimatedOut(quote);
    } catch {
      // Constant-product math fallback: (amountIn * 9970 * resOut) / (resIn * 10000 + amountIn * 9970)
      try {
        const amountWithFee = amountIn * 9970n;
        const numerator = amountWithFee * outputReserve;
        const denominator = (inputReserve * 10000n) + amountWithFee;
        setEstimatedOut(numerator / denominator);
      } catch {
        setEstimatedOut(0n);
      }
    } finally {
      setQuoting(false);
    }
  }, [provider, poolAddress, inputToken.address, inputReserve, outputReserve]);

  useEffect(() => {
    fetchQuote(amountInBigInt);
  }, [amountInBigInt, fetchQuote]);

  // Flip tokens direction
  const handleFlip = () => {
    setIsToken0In(!isToken0In);
    setAmountInStr("");
    setEstimatedOut(0n);
  };

  // Quick percent buttons (25%, 50%, 75%, MAX)
  const handleQuickPercent = (pct) => {
    if (!inputToken.userBalance || inputToken.userBalance === 0n) return;
    const calculated = (inputToken.userBalance * BigInt(pct)) / 100n;
    setAmountInStr(ethers.formatUnits(calculated, inputToken.decimals));
  };

  // Execute Token Approval
  const handleApprove = async () => {
    if (!signer || !account) return;

    try {
      setApproving(true);
      if (onTxStart) onTxStart("waiting", "Approval Requested", "Please approve token allowance in your wallet...");

      const tokenContract = new ethers.Contract(inputToken.address, ERC20_ABI, signer);
      // Approve exact or MaxUint256 for smoother experience
      const tx = await tokenContract.approve(poolAddress, ethers.MaxUint256);
      if (onTxStart) onTxStart("pending", "Approval Pending", `Waiting for confirmation: ${tx.hash}`, tx.hash);

      const receipt = await tx.wait();
      if (onTxSuccess) onTxSuccess(`Successfully approved ${inputToken.symbol} for trading!`, receipt.hash);
    } catch (err) {
      console.error(err);
      if (onTxError) onTxError(parseContractError(err));
    } finally {
      setApproving(false);
    }
  };

  // Execute Swap
  const handleSwap = async () => {
    if (!signer || !account || amountInBigInt <= 0n || estimatedOut <= 0n) return;

    const effectiveSlippage = customSlippage !== "" ? Number(customSlippage) : slippage;
    const amountOutMin = calculateSlippageMin(estimatedOut, effectiveSlippage);
    const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

    try {
      setSwapping(true);
      if (onTxStart) onTxStart("waiting", "Confirm Swap", "Please confirm swap transaction in your wallet...");

      const poolContract = new ethers.Contract(poolAddress, POOL_ABI, signer);
      const tx = await poolContract.swap(
        inputToken.address,
        amountInBigInt,
        amountOutMin,
        account,
        deadline
      );

      if (onTxStart) onTxStart("pending", "Swap Pending", `Broadcasting swap transaction: ${tx.hash}`, tx.hash);

      const receipt = await tx.wait();
      if (onTxSuccess) onTxSuccess(`Swapped ${amountInStr} ${inputToken.symbol} for ${formatTokenAmount(estimatedOut, outputToken.decimals, 4)} ${outputToken.symbol}!`, receipt.hash);
      setAmountInStr("");
      setEstimatedOut(0n);
    } catch (err) {
      console.error(err);
      if (onTxError) onTxError(parseContractError(err));
    } finally {
      setSwapping(false);
    }
  };

  // Slippage calculations
  const effectiveSlippage = customSlippage !== "" ? Number(customSlippage) : slippage;
  const minReceived = calculateSlippageMin(estimatedOut, effectiveSlippage);

  // Price impact calculation
  let priceImpact = "0.00%";
  if (amountInBigInt > 0n && inputReserve > 0n) {
    const impact = (Number(amountInBigInt) / (Number(inputReserve) + Number(amountInBigInt))) * 100;
    priceImpact = impact < 0.01 ? "< 0.01%" : `${impact.toFixed(2)}%`;
  }

  return (
    <div className="glass-panel" style={{ padding: "1.75rem", width: "100%", maxWidth: "480px", margin: "0 auto" }}>
      {/* Swap Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700 }}>
          Swap Tokens
        </h2>
        <button
          className="btn-secondary"
          style={{ padding: "0.5rem" }}
          onClick={() => setShowSettings(!showSettings)}
          title="Slippage Settings"
        >
          <Settings size={17} color={showSettings ? "var(--accent-blue)" : "var(--text-secondary)"} />
        </button>
      </div>

      {/* Slippage Settings Drawer */}
      {showSettings && (
        <div
          style={{
            background: "var(--details-box-bg)",
            border: "1px solid var(--details-box-border)",
            borderRadius: "var(--radius-md)",
            padding: "0.9rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            <span>Slippage Tolerance</span>
            <span>Current: {effectiveSlippage}%</span>
          </div>
          <div className="slippage-bar">
            {[0.1, 0.5, 1.0].map((val) => (
              <button
                key={val}
                className={`slippage-btn ${slippage === val && customSlippage === "" ? "active" : ""}`}
                onClick={() => {
                  setSlippage(val);
                  setCustomSlippage("");
                }}
              >
                {val}%
              </button>
            ))}
            <input
              type="number"
              placeholder="Custom"
              value={customSlippage}
              onChange={(e) => setCustomSlippage(e.target.value)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontSize: "0.8rem",
                padding: "0.3rem 0.5rem",
                width: "70px",
                outline: "none",
              }}
            />
          </div>
        </div>
      )}

      {/* Pay Token Input Box */}
      <div className="token-input-card">
        <div className="token-input-header">
          <span>You Pay</span>
          <span
            className="balance-pill"
            onClick={() => handleQuickPercent(100)}
            title="Click to use max balance"
          >
            Balance: {formatTokenAmount(inputToken.userBalance, inputToken.decimals, 4)} {inputToken.symbol}
          </span>
        </div>
        <div className="token-input-body">
          <input
            type="number"
            className="token-amount-input"
            placeholder="0.0"
            value={amountInStr}
            onChange={(e) => setAmountInStr(e.target.value)}
          />
          <div className="token-badge">
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: isToken0In ? "var(--accent-cyan)" : "var(--accent-violet)",
              }}
            />
            <span>{inputToken.symbol}</span>
          </div>
        </div>
        {/* Quick Percent Buttons */}
        <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.6rem" }}>
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              onClick={() => handleQuickPercent(pct)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                borderRadius: "4px",
                color: "var(--accent-blue)",
                fontWeight: 600,
                fontSize: "0.72rem",
                padding: "0.2rem 0.45rem",
                cursor: "pointer",
              }}
            >
              {pct === 100 ? "MAX" : `${pct}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Flip Button */}
      <div className="flip-btn-wrap">
        <button className="flip-btn" onClick={handleFlip} title="Switch swap direction">
          <ArrowDownUp size={16} />
        </button>
      </div>

      {/* Receive Token Box */}
      <div className="token-input-card">
        <div className="token-input-header">
          <span>You Receive (Estimated)</span>
          <span style={{ color: "var(--text-muted)" }}>
            Balance: {formatTokenAmount(outputToken.userBalance, outputToken.decimals, 4)} {outputToken.symbol}
          </span>
        </div>
        <div className="token-input-body">
          <input
            type="text"
            className="token-amount-input"
            placeholder="0.0"
            readOnly
            value={quoting ? "Quoting..." : formatTokenAmount(estimatedOut, outputToken.decimals, 6)}
          />
          <div className="token-badge">
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: !isToken0In ? "var(--accent-cyan)" : "var(--accent-violet)",
              }}
            />
            <span>{outputToken.symbol}</span>
          </div>
        </div>
      </div>

      {/* Swap Details Summary */}
      {amountInBigInt > 0n && estimatedOut > 0n && (
        <div className="swap-details-box">
          <div className="detail-row">
            <span>Minimum Received (after slippage)</span>
            <span className="detail-value">
              {formatTokenAmount(minReceived, outputToken.decimals, 4)} {outputToken.symbol}
            </span>
          </div>
          <div className="detail-row">
            <span>Price Impact</span>
            <span className="detail-value" style={{ color: Number(priceImpact.replace("%", "")) > 5 ? "var(--accent-rose)" : "var(--accent-emerald)" }}>
              {priceImpact}
            </span>
          </div>
          <div className="detail-row">
            <span>AMM Fee (0.30%)</span>
            <span className="detail-value">
              {(Number(amountInStr || 0) * 0.003).toFixed(5)} {inputToken.symbol}
            </span>
          </div>
          <div className="detail-row">
            <span>Routing</span>
            <span className="detail-value">PoolPilot Direct Pool</span>
          </div>
        </div>
      )}

      {/* Insufficient balance warning */}
      {hasInsufficientBalance && (
        <div className="alert-box alert-error" style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
          <AlertCircle size={16} />
          <span>Insufficient {inputToken.symbol} balance. Mint free tokens using the Faucet!</span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginTop: "1.25rem" }}>
        {!account ? (
          <button className="btn-primary" style={{ width: "100%" }} onClick={connectWallet}>
            Connect Wallet to Trade
          </button>
        ) : hasInsufficientBalance ? (
          <button className="btn-primary" style={{ width: "100%" }} disabled>
            Insufficient {inputToken.symbol} Balance
          </button>
        ) : needsApproval ? (
          <button
            className="btn-primary"
            style={{ width: "100%", background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
            onClick={handleApprove}
            disabled={approving}
          >
            {approving ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Approving {inputToken.symbol}...</span>
              </>
            ) : (
              <span>Approve {inputToken.symbol}</span>
            )}
          </button>
        ) : (
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={handleSwap}
            disabled={swapping || amountInBigInt <= 0n || estimatedOut <= 0n}
          >
            {swapping ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Swapping...</span>
              </>
            ) : amountInBigInt <= 0n ? (
              <span>Enter an Amount</span>
            ) : (
              <span>Swap Now</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
