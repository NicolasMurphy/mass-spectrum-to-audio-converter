import { useEffect, useState, useCallback, useRef } from "react";
import { type UseSearchHistoryReturn, type HistoryEntry } from "../types";

export function useSearchHistory(limit: number = 100): UseSearchHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const hasLoadedRef = useRef(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/history?limit=${limit}`
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Unknown error from server.");
      }

      const data = await res.json();

      const seen = new Set<string>();
      const uniqueHistory = [];

      for (const entry of data.history) {
        if (!seen.has(entry.compound)) {
          seen.add(entry.compound);
          uniqueHistory.push(entry);
        }
        if (uniqueHistory.length >= 20) break;
      }

      setHistory(uniqueHistory);
      setError(null);
    } catch (err) {
      if (!hasLoadedRef.current) {
        console.error("Failed to get recently generated compounds:", err);
        setError("Failed to get recently generated compounds");
      }
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [limit]);

  const refetchHistory = () => {
    fetchHistory();
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    error,
    loading,
    refetchHistory,
  };
}
