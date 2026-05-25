import { useState } from "react";
import axios from "../api/axios";

export const useClinicalHistory = () => {
  const [history, setHistory] = useState([]);

  const loadHistory = async (pet) => {
    try {
      const res = await axios.get(`/clinical-histories`);
      const allHistories = res.data || [];
      const petHistories = allHistories.filter(h => Number(h.idMascota) === Number(pet.idMascota));
      setHistory(petHistories);
    } catch (e) {
      console.error("Error cargando historial:", e);
      setHistory([]);
    }
  };

  return { history, loadHistory };
};