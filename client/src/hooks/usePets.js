import { useState, useEffect } from "react";
import axios from "../api/axios";

export const usePets = () => {
  const [pets, setPets] = useState([]);

  useEffect(() => {
    axios.get("/pets")
      .then(res => setPets(res.data || []))
      .catch(err => console.error("Error al cargar mascotas:", err));
  }, []);

  const getIcon = (specie) => {
    const s = specie?.toLowerCase() || "";
    if (s.includes("gat")) return "🐱";
    if (s.includes("perr") || s.includes("can")) return "🐶";
    if (s.includes("conej") || s.includes("orej")) return "🐰";
    return "🐾";
  };

  return { pets, getIcon };
};