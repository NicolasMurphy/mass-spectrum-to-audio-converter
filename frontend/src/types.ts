// =====================================
// Algorithm
// =====================================

export type Algorithm = "linear" | "inverse" | "modulo";

export interface AlgorithmSelectorProps {
  algorithm: Algorithm;
  onChange: (algorithm: Algorithm) => void;
}

export interface InverseParametersProps {
  scale: string;
  shift: string;
  onScaleChange: (value: string) => void;
  onShiftChange: (value: string) => void;
}

export interface LinearParametersProps {
  offset: string;
  onChange: (value: string) => void;
}

export interface ModuloParametersProps {
  factor: string;
  modulus: string;
  base: string;
  onFactorChange: (value: string) => void;
  onModulusChange: (value: string) => void;
  onBaseChange: (value: string) => void;
}

// =====================================
// Spectrum Tables
// =====================================

export interface SpectrumData {
  mz: number;
  frequency: number;
  intensity: number;
  amplitude_linear: number;
  amplitude_db: number;
}

export interface SpectrumTablesProps {
  spectrumData: SpectrumData[] | null;
}

export type SortField = "mz" | "intensity" | "frequency" | "amplitude_db";
export type SortDirection = "asc" | "desc";

// =====================================
// Lists
// =====================================

export interface HistoryEntry {
  compound: string;
  accession: string;
  created_at: string;
}

export interface UseSearchHistoryReturn {
  history: HistoryEntry[];
  error: string | null;
  loading: boolean;
  refetchHistory: () => void;
}

export interface RecentlyGeneratedProps {
  searchHistory: Array<{ compound: string }>;
  historyError: string | null;
  onCompoundClick: (compound: string) => void;
}

export interface PopularCompound {
  compound: string;
  search_count: number;
}

export interface MostGeneratedProps {
  popularCompounds: Array<{ compound: string }>;
  popularError: string | null;
  onCompoundClick: (compound: string) => void;
}

// =====================================
// Audio
// =====================================

export interface AudioPlayerProps {
  audioUrl: string;
  downloadName: string;
}

export interface AudioSettingsProps {
  duration: string;
  sampleRate: string;
  onDurationChange: (value: string) => void;
  onSampleRateChange: (value: string) => void;
}

export type SamplePianoProps = {
  audioUrl: string;
  isMono: boolean;
};

export interface MicrotonalPianoProps {
  audioUrl: string;
  pitchRatios: number[];
  setPitchRatios: React.Dispatch<React.SetStateAction<number[]>>;
  isMono: boolean;
  compoundName: string;
  accession: string;
}

// =====================================
// Display
// =====================================

export interface CompoundSearchProps {
  compound: string;
  onCompoundChange: (value: string) => void;
}

export interface NameAndAccessionProps {
  compoundName: string;
  accession: string;
}

export interface StatusMessageProps {
  status: string;
}
