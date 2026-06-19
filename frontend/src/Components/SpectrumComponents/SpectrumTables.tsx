import { useState, useMemo } from "react";
import {
  type SpectrumTablesProps,
  type SortField,
  type SortDirection,
} from "../../types";
import "../../App.css";

const SCROLL_THRESHOLD = 9;
const TABLE_MAX_HEIGHT = "max-h-62.5";

const NATURAL_DIRECTION: Record<SortField, SortDirection> = {
  mz: "asc",
  frequency: "asc",
  intensity: "desc",
  amplitude_db: "desc",
};

export default function SpectrumTables({ spectrumData }: SpectrumTablesProps) {
  const [sortField, setSortField] = useState<SortField>("mz");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [audioSortField, setAudioSortField] = useState<SortField>("frequency");
  const [audioSortDirection, setAudioSortDirection] =
    useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(NATURAL_DIRECTION[field]);
    }
  };

  const handleAudioSort = (field: SortField) => {
    if (audioSortField === field) {
      setAudioSortDirection(audioSortDirection === "asc" ? "desc" : "asc");
    } else {
      setAudioSortField(field);
      setAudioSortDirection(NATURAL_DIRECTION[field]);
    }
  };

  const sortedData = useMemo(() => {
    if (!spectrumData) return [];

    const sorted = [...spectrumData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortDirection === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [spectrumData, sortField, sortDirection]);

  const sortedAudioData = useMemo(() => {
    if (!spectrumData) return [];

    const sorted = [...spectrumData].sort((a, b) => {
      const aValue = a[audioSortField];
      const bValue = b[audioSortField];

      if (audioSortDirection === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [spectrumData, audioSortField, audioSortDirection]);

  const getSortIcon = (field: SortField, isAudioTable = false) => {
    const currentField = isAudioTable ? audioSortField : sortField;
    const currentDirection = isAudioTable ? audioSortDirection : sortDirection;

    if (currentField !== field) {
      return <span className="text-xs opacity-40 inline-block w-3 text-center"></span>;
    }
    return currentDirection === "asc" ? (
      <span className="text-xs opacity-80 inline-block w-3 text-center">↑</span>
    ) : (
      <span className="text-xs opacity-80 inline-block w-3 text-center">↓</span>
    );
  };

  if (!spectrumData) return null;

  const needsScrolling = sortedData.length > SCROLL_THRESHOLD;
  const audioNeedsScrolling = sortedAudioData.length > SCROLL_THRESHOLD;

  return (
    <>
      {/* Original Mass Spectrum Data */}
      <h2 className="font-bold text-lg mb-2">
        Mass Spectrum Data
        <span className="text-sm font-scientific text-base-content/50">
          {" "}
          ({spectrumData.length} peaks)
        </span>
      </h2>
      <div
        className={`mb-6 ${
          needsScrolling ? `${TABLE_MAX_HEIGHT} overflow-y-auto` : ""
        }`}
      >
        <table className="table table-compact table-zebra text-xs">
          <thead className={needsScrolling ? "sticky top-0 z-10" : ""}>
            <tr>
              <th
                className="cursor-pointer hover:bg-base-200 select-none px-2 py-1.5 bg-base-100"
                onClick={() => handleSort("mz")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>m/z</span>
                  {getSortIcon("mz")}
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-200 select-none px-2 py-1.5 bg-base-100"
                onClick={() => handleSort("intensity")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Intensity</span>
                  {getSortIcon("intensity")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr key={index}>
                <td className="px-2 py-1 font-scientific text-right">
                  {item.mz.toFixed(4)}
                </td>
                <td className="px-2 py-1 font-scientific text-right">
                  {item.intensity.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transformed Audio Data */}
      <h2 className="font-bold text-lg mb-2">Audio Transformation Data</h2>
      <div
        className={`${
          audioNeedsScrolling ? `${TABLE_MAX_HEIGHT} overflow-y-auto` : ""
        }`}
      >
        <table className="table table-compact table-zebra text-xs">
          <thead className={audioNeedsScrolling ? "sticky top-0 z-10" : ""}>
            <tr>
              <th
                className="cursor-pointer hover:bg-base-200 select-none px-2 py-1.5 bg-base-100"
                onClick={() => handleAudioSort("frequency")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Frequency (Hz)</span>
                  {getSortIcon("frequency", true)}
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-200 select-none px-2 py-1.5 bg-base-100"
                onClick={() => handleAudioSort("amplitude_db")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Amplitude (dB)</span>
                  {getSortIcon("amplitude_db", true)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAudioData.map((item, index) => (
              <tr key={index}>
                <td className="px-2 py-1 font-scientific text-right">
                  {item.frequency.toFixed(4)}
                </td>
                <td className="px-2 py-1 font-scientific text-right">
                  {item.amplitude_db.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
