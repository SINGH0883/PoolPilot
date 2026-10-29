import React, { useState, useMemo } from "react";
import {
  ArrowLeftRight,
  PlusCircle,
  MinusCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Copy,
  Check,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Inbox,
  Clock,
  DollarSign,
} from "lucide-react";
import { shortenAddress, SUPPORTED_NETWORKS } from "../lib/ethereum";

function formatRelativeTime(timestamp) {
  if (!timestamp) return "Recent";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export function ActivityLedger({ events = [], loading, onRefresh, account, chainId }) {
  const [filterType, setFilterType] = useState("all"); // "all" | "swaps" | "liquidity" | "mine"
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const currentNetwork = chainId ? SUPPORTED_NETWORKS[chainId] : null;
  const explorerUrl = currentNetwork?.explorerUrl;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 1800);
  };

  // Tab counts
  const counts = useMemo(() => {
    let swaps = 0;
    let liquidity = 0;
    let mine = 0;
    events.forEach((ev) => {
      if (ev.type === "SWAP") swaps++;
      if (ev.type === "ADD_LIQUIDITY" || ev.type === "REMOVE_LIQUIDITY") liquidity++;
      if (ev.isUserTx) mine++;
    });
    return { all: events.length, swaps, liquidity, mine };
  }, [events]);

  // Filter events according to active tab & search query
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Tab filter
      if (filterType === "swaps" && ev.type !== "SWAP") return false;
      if (filterType === "liquidity" && ev.type !== "ADD_LIQUIDITY" && ev.type !== "REMOVE_LIQUIDITY") return false;
      if (filterType === "mine" && !ev.isUserTx) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hashMatch = ev.txHash && ev.txHash.toLowerCase().includes(q);
        const senderMatch = ev.sender && ev.sender.toLowerCase().includes(q);
        const recipientMatch = ev.recipient && ev.recipient.toLowerCase().includes(q);
        const tokenMatch =
          (ev.tokenInSymbol && ev.tokenInSymbol.toLowerCase().includes(q)) ||
          (ev.tokenOutSymbol && ev.tokenOutSymbol.toLowerCase().includes(q)) ||
          (ev.token0Symbol && ev.token0Symbol.toLowerCase().includes(q)) ||
          (ev.token1Symbol && ev.token1Symbol.toLowerCase().includes(q));
        if (!hashMatch && !senderMatch && !recipientMatch && !tokenMatch) return false;
      }
      return true;
    });
  }, [events, filterType, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;
    const headers = ["Type", "TxHash", "BlockNumber", "Timestamp", "Sender", "Details", "ExecPrice", "USD_Value"];
    const rows = filteredEvents.map((ev) => {
      const details =
        ev.type === "SWAP"
          ? `${ev.amountInFormatted} ${ev.tokenInSymbol} -> ${ev.amountOutFormatted} ${ev.tokenOutSymbol}`
          : `${ev.amount0Formatted} ${ev.token0Symbol} + ${ev.amount1Formatted} ${ev.token1Symbol}`;
      return [
        ev.type,
        ev.txHash,
        ev.blockNumber || "",
        ev.timestamp ? new Date(ev.timestamp).toISOString() : "",
        ev.sender,
        `"${details}"`,
        `"${ev.execPrice || ""}"`,
        ev.usdValue || 0,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `poolpilot-ledger-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel" style={{ padding: "1.1rem 1.35rem" }}>
      {/* Header and Controls */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
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
            {events.length} Total Events
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-input)",
              border: "1px solid var(--border-input)",
              borderRadius: "var(--radius-sm)",
              padding: "0.3rem 0.65rem",
              gap: "0.4rem",
            }}
          >
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search tx hash, address, token..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "0.78rem",
                color: "var(--text-primary)",
                width: "180px",
              }}
            />
          </div>

          {/* Filter Pills with Badge Counts */}
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
              { id: "all", label: "All", count: counts.all },
              { id: "swaps", label: "Swaps", count: counts.swaps },
              { id: "liquidity", label: "Liquidity", count: counts.liquidity },
              { id: "mine", label: "My Trades", count: counts.mine },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterType(tab.id);
                  setCurrentPage(1);
                }}
                style={{
                  background: filterType === tab.id ? "var(--tab-btn-active-bg)" : "transparent",
                  color: filterType === tab.id ? "var(--tab-btn-active-text)" : "var(--tab-btn-text)",
                  border: filterType === tab.id ? "1px solid var(--tab-btn-active-border)" : "none",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  padding: "0.28rem 0.65rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  boxShadow: filterType === tab.id ? "var(--tab-btn-active-shadow)" : "none",
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    opacity: 0.8,
                    background: filterType === tab.id ? "var(--pill-bg)" : "rgba(128,128,128,0.15)",
                    padding: "0.05rem 0.35rem",
                    borderRadius: "10px",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            className="btn-secondary"
            onClick={handleExportCSV}
            title="Export Ledger to CSV"
            style={{ padding: "0.42rem 0.65rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Download size={13} />
            <span className="hide-on-mobile">Export CSV</span>
          </button>

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
        <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "var(--text-muted)" }}>
          <Inbox size={40} style={{ margin: "0 auto 0.75rem auto", opacity: 0.4 }} />
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
            No activity matches this criteria
          </div>
          <div style={{ fontSize: "0.82rem" }}>
            {filterType === "mine"
              ? "You haven't performed any trades on this pool yet. Execute a swap on the trade desk!"
              : searchQuery
              ? "No transactions found matching your search query. Try clearing the search."
              : "No transactions recorded for this filter."}
          </div>
          {searchQuery && (
            <button
              className="btn-secondary"
              onClick={() => setSearchQuery("")}
              style={{ marginTop: "0.85rem", padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-card)",
                  color: "var(--text-muted)",
                  fontSize: "0.74rem",
                  textTransform: "uppercase",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "0.6rem 0.75rem" }}>Action</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Trade Details</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Execution Rate</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Total Value</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Trader Address</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Time</th>
                <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>Status / Tx</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.map((ev, idx) => {
                const rowKey = `${ev.txHash}-${idx}`;
                const copyTxKey = `tx-${rowKey}`;
                const copySenderKey = `sender-${rowKey}`;

                return (
                  <tr
                    key={rowKey}
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
                            padding: "0.22rem 0.55rem",
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
                            padding: "0.22rem 0.55rem",
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
                            padding: "0.22rem 0.55rem",
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
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <span>{ev.amountInFormatted} {ev.tokenInSymbol}</span>
                          <span style={{ color: "var(--text-muted)" }}>→</span>
                          <span style={{ color: "var(--accent-blue)", fontWeight: 600 }}>
                            {ev.amountOutFormatted} {ev.tokenOutSymbol}
                          </span>
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

                    {/* Execution Rate */}
                    <td style={{ padding: "0.75rem", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      {ev.type === "SWAP" ? (
                        <span style={{ fontFamily: "var(--font-mono, monospace)" }}>{ev.execPrice}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>{ev.execPrice || "Proportional"}</span>
                      )}
                    </td>

                    {/* Total USD Value */}
                    <td style={{ padding: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {ev.usdValue ? (
                        <span>${Number(ev.usdValue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>

                    {/* Account / Trader */}
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.82rem",
                            color: ev.isUserTx ? "var(--accent-blue)" : "var(--text-secondary)",
                          }}
                        >
                          {shortenAddress(ev.sender)}
                        </span>
                        {/* Copy button */}
                        <button
                          onClick={() => handleCopy(ev.sender, copySenderKey)}
                          title="Copy address"
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "0.15rem",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {copiedKey === copySenderKey ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                        </button>
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

                    {/* Time */}
                    <td style={{ padding: "0.75rem", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                      <div
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                        title={ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ""}
                      >
                        <Clock size={11} color="var(--text-muted)" />
                        <span>{formatRelativeTime(ev.timestamp)}</span>
                      </div>
                    </td>

                    {/* Tx Hash & Confirmed Status */}
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", justifyContent: "flex-end" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.72rem",
                            color: "var(--accent-emerald)",
                            background: "rgba(16, 185, 129, 0.1)",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "var(--radius-full)",
                            fontWeight: 600,
                          }}
                        >
                          <ShieldCheck size={11} />
                          <span>Finalized</span>
                        </span>

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
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.82rem" }}>
                            {shortenAddress(ev.txHash)}
                          </span>
                        )}

                        {/* Copy Tx Hash button */}
                        <button
                          onClick={() => handleCopy(ev.txHash, copyTxKey)}
                          title="Copy Transaction Hash"
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "0.15rem",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {copiedKey === copyTxKey ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 0.25rem 0.25rem 0.25rem",
                borderTop: "1px solid var(--border-card)",
                marginTop: "0.5rem",
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
              }}
            >
              <div>
                Showing {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length} transactions
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <button
                  className="btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{ padding: "0.3rem 0.55rem" }}
                >
                  <ChevronLeft size={13} />
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: "0.3rem 0.55rem" }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
