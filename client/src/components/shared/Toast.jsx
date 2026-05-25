import { useEffect } from "react";

export const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "#52b788" : "#ff8787";

  return (
    <div style={{
      position: "fixed", top: "20px", right: "20px", padding: "15px 25px",
      borderRadius: "12px", color: "white", fontWeight: "bold", zIndex: 1000,
      backgroundColor: bgColor, boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}>
      {message}
    </div>
  );
};