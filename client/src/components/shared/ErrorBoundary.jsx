import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Solo recargamos automáticamente si es el error de extensiones de contraseña
    if (error?.message?.includes("removeChild") || error?.message?.includes("NotFoundError")) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", flexDirection: "column", gap: 16,
          background: "#f4faf0", fontFamily: "'Segoe UI', system-ui, sans-serif",
          padding: 24, textAlign: "center",
        }}>
          <div style={{ fontSize: 48 }}>🐾</div>
          <h2 style={{ margin: 0, color: "#1a3d28", fontSize: 20, fontWeight: 700 }}>
            Recargando...
          </h2>
          <p style={{ margin: 0, color: "#6b8f76", fontSize: 14 }}>
            Una extensión del navegador interfirió con la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: "#1f5c38", color: "white", fontWeight: 600,
              fontSize: 14, cursor: "pointer",
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}