import { useState, useCallback } from "react";
import API from "../services/api";

export function useLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/logs/me");
      setLogs(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllLogs = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const response = await API.get("/logs", { params: filters });
      setLogs(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching all logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLog = useCallback(async (data) => {
    try {
      const response = await API.post("/logs", data);
      setLogs((prev) => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return { logs, loading, error, fetchLogs, fetchAllLogs, createLog, setLogs };
}