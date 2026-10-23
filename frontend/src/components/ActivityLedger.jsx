import React, { useState } from "react";
import { ArrowLeftRight, PlusCircle, MinusCircle, ExternalLink, RefreshCw, Filter, UserCheck, Inbox } from "lucide-react";
import { shortenAddress, SUPPORTED_NETWORKS } from "../lib/ethereum";

export function ActivityLedger({ events, loading, onRefresh, account, chainId }) {
  const [filterType, setFilterType] = useState("all"); // "all" | "swaps" | "liquidity" | "mine"

  const currentNetwork = chainId ? SUPPORTED_NETWORKS[chainId] : null;
  const explorerUrl = currentNetwork?.explorerUrl;

  // Filter events according to active tab
  const filteredEvents = events.filter((ev) => {
    if (filterType === "swaps") return ev.type === "SWAP";
    if (filterType === "liquidity") return ev.type === "ADD_LIQUIDITY" || ev.type === "REMOVE_LIQUIDITY";
    if (filterType === "mine") return ev.isUserTx;
    return true;
  });

  return (
    <div className="glass-panel" style={{ padding: "0.85rem 1.15rem" }}>
      {/* Header and Filter Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700 }}>
            Pool Activity Ledger
          </h3>
          <span
            style={{
              fontSize: "0.75rem",
              background: "var(--pill-bg)",
              color: "var(--pill-text)",
              border: "1px solid var(--pill-border)",
              padding: "0.15rem 0.55rem",
              borderRadius: "var(--radius-full)",
              fontWeight: 600,
            }}
          >
            {events.length} Events
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Filter Pills */}
          <div
            style={{
              display: "flex",
              background: "var(--tab-container-bg)",
              padding: "0.2rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--tab-container-border)",
              gap: "0.2rem",
            }}
          >
            {[
              { id: "all", label: "All" },
              { id: "swaps", label: "Swaps" },
              { id: "liquidity", label: "Liquidity" },
              { id: "mine", label: "My Trades" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                style={{
                  background: filterType === tab.id ? "var(--tab-btn-active-bg)" : "transparent",
                  color: filterType === tab.id ? "var(--tab-btn-active-text)" : "var(--tab-btn-text)",
                  border: filterType === tab.id ? "1px solid var(--tab-btn-active-border)" : "none",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  padding: "0.3rem 0.65rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: filterType === tab.id ? "var(--tab-btn-active-shadow)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            className="btn-secondary"
            onClick={onRefresh}
            title="Refresh on-chain activity"
            style={{ padding: "0.45rem 0.65rem" }}
          >
            <RefreshCw size={14} className={loading ? "spin-icon" : ""} />
          </button>
        </div>
      </div>

      {/* Events Table / List */}
      {filteredEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
          <Inbox size={38} style={{ margin: "0 auto 0.75rem auto", opacity: 0.5 }} />
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
            No activity found
          </div>
          <div style={{ fontSize: "0.82rem" }}>
            {filterType === "mine"
              ? "You haven't performed any trades on this pool yet. Try executing a swap!"
              : "No transactions recorded for this filter."}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 2 }}>
              <tr style={{ borderBottom: "1px solid var(--border-card)", color: "var(--text-muted)", fontSize: "0.74rem", textTransform: "uppercase", textAlign: "left" }}>
                <th style={{ padding: "0.5rem 0.7rem" }}>Action</th>
                <th style={{ padding: "0.5rem 0.7rem" }}>Amount / Trade Details</th>
                <th style={{ padding: "0.5rem 0.7rem" }}>Execution Rate</th>
                <th style={{ padding: "0.5rem 0.7rem" }}>Account</th>
                <th style={{ padding: "0.5rem 0.7rem", textAlign: "right" }}>Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev, idx) => (
                <tr
                  key={`${ev.txHash}-${idx}`}
                  style={{
                    borderBottom: "1px solid var(--border-card)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Action Badge */}
                  <td style={{ padding: "0.75rem" }}>
                    {ev.type === "SWAP" && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          background: "var(--pill-bg)",
                          color: "var(--pill-text)",
                          border: "1px solid var(--pill-border)",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                        }}
                      >
                        <ArrowLeftRight size={12} />
                        <span>SWAP</span>
                      </span>
                    )}

                    {ev.type === "ADD_LIQUIDITY" && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          background: "rgba(16, 185, 129, 0.12)",
                          color: "var(--accent-emerald)",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                        }}
                      >
                        <PlusCircle size={12} />
                        <span>SUPPLY</span>
                      </span>
                    )}

                    {ev.type === "REMOVE_LIQUIDITY" && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          background: "rgba(239, 68, 68, 0.12)",
                          color: "var(--accent-rose)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                        }}
                      >
                        <MinusCircle size={12} />
                        <span>WITHDRAW</span>
                      </span>
                    )}
                  </td>

                  {/* Trade Details */}
                  <td style={{ padding: "0.75rem", color: "var(--text-primary)", fontWeight: 500 }}>
                    {ev.type === "SWAP" && (
                      <div>
                        <span>{ev.amountInFormatted} {ev.tokenInSymbol}</span>
                        <span style={{ color: "var(--text-muted)", margin: "0 0.4rem" }}>→</span>
                        <span style={{ color: "var(--accent-blue)", fontWeight: 600 }}>{ev.amountOutFormatted} {ev.tokenOutSymbol}</span>
                      </div>
                    )}
                    {ev.type === "ADD_LIQUIDITY" && (
                      <div>
                        <span>+{ev.amount0Formatted} {ev.token0Symbol}</span>
                        <span style={{ color: "var(--text-muted)", margin: "0 0.35rem" }}>&</span>
                        <span>+{ev.amount1Formatted} {ev.token1Symbol}</span>
                      </div>
                    )}
                    {ev.type === "REMOVE_LIQUIDITY" && (
                      <div>
                        <span>-{ev.amount0Formatted} {ev.token0Symbol}</span>
                        <span style={{ color: "var(--text-muted)", margin: "0 0.35rem" }}>&</span>
                        <span>-{ev.amount1Formatted} {ev.token1Symbol}</span>
                      </div>
                    )}
                  </td>

                  {/* Rate */}
                  <td style={{ padding: "0.75rem", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                    {ev.type === "SWAP" ? ev.execPrice : "Proportional"}
                  </td>

                  {/* Account */}
                  <td style={{ padding: "0.75rem" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.82rem", color: ev.isUserTx ? "var(--accent-blue)" : "var(--text-secondary)" }}>
                        {shortenAddress(ev.sender)}
                      </span>
                      {ev.isUserTx && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            background: "var(--pill-bg)",
                            color: "var(--pill-text)",
                            padding: "0.1rem 0.4rem",
                            borderRadius: "var(--radius-sm)",
                            fontWeight: 700,
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Tx Hash */}
                  <td style={{ padding: "0.75rem", textAlign: "right" }}>
                    {explorerUrl ? (
                      <a
                        href={`${explorerUrl}/tx/${ev.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          color: "var(--accent-blue)",
                          textDecoration: "none",
                          fontSize: "0.82rem",
                          fontFamily: "monospace",
                        }}
                      >
                        <span>{shortenAddress(ev.txHash)}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.82rem" }}>
                        {shortenAddress(ev.txHash)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
