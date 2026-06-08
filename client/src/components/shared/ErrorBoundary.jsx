import { Component } from "react";

const EXTENSION_ERRORS = [
  "removeChild",
  "NotFoundError",
  "insertBefore",
  "Cannot read properties of null",
  "Extension context invalidated",
  "ResizeObserver loop",
];

const isExtensionError = (error) => {
  const msg = error?.message || "";
  const stack = error?.stack || "";
  return EXTENSION_ERRORS.some(
    (pattern) => msg.includes(pattern) || stack.includes(pattern)
  );
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isExtension: false, errorMsg: "" };
    this._reloadTimer = null;
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      isExtension: isExtensionError(error),
      errorMsg: error?.message || "Error desconocido",
    };
  }

  componentDidCatch(error, info) {
    if (isExtensionError(error)) {
      // Recarga automática solo para errores de extensiones, con un pequeño delay
      this._reloadTimer = setTimeout(() => window.location.reload(), 800);
    } else {
      // Error real de la app — lo logueamos para debugging
      console.error("[ErrorBoundary] Error en la app:", error, info);
    }
  }

  componentWillUnmount() {
    if (this._reloadTimer) clearTimeout(this._reloadTimer);
  }

  render() {
    const { hasError, isExtension, errorMsg } = this.state;

    if (!hasError) return this.props.children;

    if (isExtension) {
      return (
        <div style={styles.container}>
          <div style={{ fontSize: 40 }}>🐾</div>
          <h2 style={styles.title}>Recargando...</h2>
          <p style={styles.subtitle}>
            Una extensión del navegador interfirió con la página.
          </p>
          <button onClick={() => window.location.reload()} style={styles.btn}>
            Recargar página
          </button>
        </div>
      );
    }

    // Error real de la app
    return (
      <div style={styles.container}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <h2 style={{ ...styles.title, color: "#a32d2d" }}>
          Ocurrió un error inesperado
        </h2>
        <p style={styles.subtitle}>
          Algo falló en esta sección. Podés intentar recargar o volver al inicio.
        </p>
        {import.meta.env?.DEV && (
          <pre style={styles.devInfo}>{errorMsg}</pre>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => this.setState({ hasError: false, errorMsg: "" })}
            style={{ ...styles.btn, background: "#6b8f76" }}
          >
            Intentar de nuevo
          </button>
          <button onClick={() => window.location.reload()} style={styles.btn}>
            Recargar página
          </button>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 16,
    background: "#f4faf0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: 24,
    textAlign: "center",
  },
  title: {
    margin: 0,
    color: "#1a3d28",
    fontSize: 20,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    color: "#6b8f76",
    fontSize: 14,
    maxWidth: 360,
    lineHeight: 1.5,
  },
  btn: {
    padding: "10px 24px",
    borderRadius: 10,
    border: "none",
    background: "#1f5c38",
    color: "white",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  devInfo: {
    background: "#fcebeb",
    border: "1px solid #f7c1c1",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "#a32d2d",
    maxWidth: 480,
    textAlign: "left",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};