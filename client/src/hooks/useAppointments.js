import { useState, useEffect } from "react";
import axios from "../api/axios";

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/appointments")
      .then(res => setAppointments(res.data || []))
      .catch(err => console.error("Error appts:", err))
      .finally(() => setLoading(false));
  }, []);

  const getNextAppointment = () => {
    return appointments
      .filter(a => new Date(a.fecha) >= new Date())
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('es-AR', { timeZone: 'UTC' });
  };

  return { appointments, loading, getNextAppointment, formatDate };
};