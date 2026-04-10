import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ErrorBoundary catches any unhandled render errors in its child tree and
 * shows a friendly fallback UI instead of crashing the whole page.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            padding: "2rem",
            textAlign: "center",
            color: "var(--text-primary, #e2e8f0)",
          }}
        >
          <AlertTriangle size={48} color="var(--risk-high, #ef4444)" style={{ marginBottom: "1rem" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "var(--text-muted, #94a3b8)", marginBottom: "1.5rem", maxWidth: "400px" }}>
            An unexpected error occurred in this section. You can try refreshing,
            or contact your administrator if the problem persists.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                fontSize: "0.75rem",
                background: "var(--bg-card, #1e293b)",
                padding: "1rem",
                borderRadius: "0.5rem",
                maxWidth: "600px",
                overflowX: "auto",
                marginBottom: "1.5rem",
                textAlign: "left",
                color: "var(--risk-high, #ef4444)",
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            className="btn btn-primary"
            onClick={this.handleReset}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
