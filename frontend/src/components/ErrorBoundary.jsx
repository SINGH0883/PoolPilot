import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[PoolPilot] Unhandled component error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-page)",
            padding: "2rem",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              background: "var(--bg-card)",
              border: "1px solid var(--alert-error-border)",
              borderRadius: "var(--radius-lg)",
              padding: "2.5rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.4rem",
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
              }}
            >
              Something went wrong
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
              PoolPilot encountered an unexpected error. This is likely a network or wallet connectivity issue.
            </p>
            <div
              style={{
                background: "var(--alert-error-bg)",
                border: "1px solid var(--alert-error-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem",
                fontSize: "0.78rem",
                color: "var(--alert-error-text)",
                fontFamily: "monospace",
                textAlign: "left",
                marginBottom: "1.5rem",
                wordBreak: "break-all",
              }}
            >
              {this.state.error?.message || "Unknown error"}
            </div>
            <button
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={() => window.location.reload()}
            >
              Reload PoolPilot
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
