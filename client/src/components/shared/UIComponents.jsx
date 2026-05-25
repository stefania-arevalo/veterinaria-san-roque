export const Label = ({ children }) => (
    <label style={{ display: "block", fontSize: "12px", color: "#888", marginBottom: "5px", fontWeight: "bold" }}>
      {children}
    </label>
  );
  
  export const Input = ({ isEditing, ...props }) => (
    <input 
      {...props}
      style={{
        width: "100%", padding: "12px", borderRadius: "10px", 
        border: isEditing ? "2px solid #52b788" : "1px solid #eee",
        backgroundColor: isEditing ? "white" : "#f5f5f5",
        color: isEditing ? "#000" : "#555",
        fontSize: "15px", outline: "none", transition: "all 0.3s ease",
        marginBottom: "15px"
      }} 
    />
  );