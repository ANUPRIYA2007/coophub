import React from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "24px",
            background: "#FFF5F5",
            border: "1px solid #FED7D7",
            borderRadius: "16px",
            margin: "16px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "12px",
            color: "#C53030",
            maxWidth: "600px",
            width: "100%",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#FED7D7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#E53E3E"
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700", color: "#9B2C2C" }}>
              Something went wrong displaying this view
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#742A2A" }}>
              {this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              onClick={this.handleReset}
              className="btn btn-primary btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#E53E3E",
                borderColor: "#E53E3E"
              }}
            >
              <RefreshCw size={14} /> Try Again
            </button>
            {this.props.onClose && (
              <button
                onClick={this.props.onClose}
                className="btn btn-outline btn-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#742A2A",
                  borderColor: "#FED7D7"
                }}
              >
                <X size={14} /> Close
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
