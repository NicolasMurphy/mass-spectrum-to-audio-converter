import { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";
import SamplePiano from "./Components/SamplePiano";
import MicrotonalPiano from "./Components/MicrotonalPiano";
import { useSearchHistory } from "./hooks/useSearchHistory";
import RecentlyGenerated from "./Components/RecentlyGeneratedComponents/RecentlyGenerated";
import CompoundSearch from "./Components/FormComponents/CompoundSearch";
import AudioPlayer from "./Components/AudioPlayer";
import NameAndAccession from "./Components/NameAndAccession";
import StatusMessage from "./Components/StatusMessage";
import base64ToBlob from "./utils";
import SpectrumTables from "./Components/SpectrumComponents/SpectrumTables";
import AlgorithmSelector from "./Components/FormComponents/AlgorithmSelector";
import LinearParameters from "./Components/FormComponents/LinearParameters";
import InverseParameters from "./Components/FormComponents/InverseParameters";
import AudioSettings from "./Components/FormComponents/AudioSettings";
import SkeletonSpectrumTables from "./Components/SpectrumComponents/SkeletonSpectrumTables";
import { usePopularCompounds } from "./hooks/usePopularCompounds";
import MostGenerated from "./Components/MostGeneratedComponents/MostGenerated";
import InfoModal from "./Components/InfoModal";
import ModuloParameters from "./Components/FormComponents/ModuloParameters";
import { type Algorithm, type SpectrumData } from "./types";
import EmptyDataPlaceholder from "./Components/SpectrumComponents/EmptyDataPlaceholder";

function App() {
  const [compound, setCompound] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [compoundName, setCompoundName] = useState<string>("");
  const [accession, setAccession] = useState<string>("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("linear");
  const [offset, setOffset] = useState<string>("300");
  const [scale, setScale] = useState<string>("100000");
  const [shift, setShift] = useState<string>("1");
  const [factor, setFactor] = useState<string>("10");
  const [modulus, setModulus] = useState<string>("500");
  const [base, setBase] = useState<string>("100");
  const [duration, setDuration] = useState<string>("5");
  const [sampleRate, setSampleRate] = useState<string>("44100");
  const {
    history: searchHistory,
    error: historyError,
    refetchHistory,
  } = useSearchHistory();
  const { popularCompounds, error: popularError } = usePopularCompounds(20);
  const popularCompoundsList = popularCompounds.map((item) => ({
    compound: item.compound,
  }));
  const [spectrumData, setSpectrumData] = useState<Array<SpectrumData> | null>(
    null,
  );
  const [inputMode, setInputMode] = useState<"massbank" | "custom">("massbank");
  const [spectrumText, setSpectrumText] = useState<string>("");

  const [pitchRatios, setPitchRatios] = useState<number[]>(Array(13).fill(1.0));
  const [microtonalOpen, setMicrotonalOpen] = useState(false);

  const [isMono, setIsMono] = useState(false);

  const handleFetch = useCallback(async () => {
    // Validation based on input mode
    if (inputMode === "massbank" && !compound.trim()) {
      setStatus("Please enter a compound name.");
      return;
    }

    if (inputMode === "custom" && !spectrumText.trim()) {
      setStatus("Please enter spectrum data.");
      return;
    }

    const sampleRateNum = Number(sampleRate);
    if (
      isNaN(sampleRateNum) ||
      sampleRateNum < 3500 ||
      sampleRateNum > 192000
    ) {
      setStatus("Sample rate must be between 3500 and 192000.");
      return;
    }

    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum < 0.01 || durationNum > 30) {
      setStatus("Duration must be between 0.01 and 30.");
      return;
    }

    setStatus("Fetching audio...");
    setAudioUrl("");
    setCompoundName("");
    setAccession("");

    // Cleanup previous URL before setting new one
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    try {
      // Choose endpoint based on mode
      const endpoint =
        inputMode === "massbank"
          ? `${import.meta.env.VITE_API_URL}/massbank/${algorithm}`
          : `${import.meta.env.VITE_API_URL}/custom/${algorithm}`;

      // Build request body based on mode
      const requestBody: Record<string, string | number> = {
        duration: durationNum,
        sample_rate: sampleRateNum,
      };

      // Add mode-specific data
      if (inputMode === "massbank") {
        requestBody.compound = compound;
      } else {
        requestBody.spectrum_text = spectrumText;
      }

      // Add algorithm-specific parameters
      if (algorithm === "linear") {
        requestBody.offset = offset;
      } else if (algorithm === "inverse") {
        requestBody.scale = scale;
        requestBody.shift = shift;
      } else if (algorithm === "modulo") {
        requestBody.factor = factor;
        requestBody.modulus = modulus;
        requestBody.base = base;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setStatus(`Error: ${errorData.error}`);
        return;
      }

      const data = await response.json();

      // Convert base64 audio to blob
      const audioBlob = base64ToBlob(data.audio_base64);
      const url = URL.createObjectURL(audioBlob);

      setCompoundName(data.compound);
      setAccession(data.accession);
      setAudioUrl(url);
      setSpectrumData(data.spectrum);
      setStatus("Success!");
      refetchHistory();
    } catch (err) {
      if (err instanceof Error) {
        setStatus(`Error: ${err.message}`);
      } else {
        setStatus("An unknown error occurred.");
      }
    }
  }, [
    compound,
    spectrumText,
    inputMode,
    algorithm,
    offset,
    scale,
    shift,
    factor,
    modulus,
    base,
    duration,
    sampleRate,
    audioUrl,
    refetchHistory,
  ]);

  const handleFetchRef = useRef(handleFetch);
  handleFetchRef.current = handleFetch;

  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") {
        const activeElement = document.activeElement;
        if (activeElement?.getAttribute("data-random-button") === "true") {
          return;
        }
        if (activeElement?.tagName === "TEXTAREA") {
          return;
        }
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
          (submitButton as HTMLButtonElement).click();
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const generateDownloadName = () => {
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0") +
      "-" +
      now.getHours().toString().padStart(2, "0") +
      now.getMinutes().toString().padStart(2, "0") +
      now.getSeconds().toString().padStart(2, "0");

    if (accession === "CUSTOM-001") {
      return `CUSTOM-${timestamp}.wav`;
    } else {
      return `${compoundName}-${accession}-${timestamp}.wav`;
    }
  };

  const downloadName = generateDownloadName();

  useEffect(() => {
    // Cleanup function to revoke object URLs and prevent memory leaks
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleCompoundClick = (compound: string) => {
    setCompound(compound);
    setInputMode("massbank");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetch();
  };

  return (
    <div data-theme="corporate" className="min-h-screen bg-base-200">
      <div className="justify-items-center p-12 flex-col w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* column 1 - spectrum data tables */}
          <div className="order-2 lg:order-1">
            <div className="card bg-neutral-content w-full max-w-md mx-auto">
              <div className="card-body">
                {status === "Fetching audio..." ? (
                  <SkeletonSpectrumTables />
                ) : spectrumData ? (
                  <SpectrumTables spectrumData={spectrumData} />
                ) : (
                  <EmptyDataPlaceholder />
                )}
              </div>
            </div>
          </div>
          {/* column 2 - form, audio player, keyboard - "app core" */}
          <div className="order-1 lg:order-2">
            <div className="card bg-neutral-content w-full max-w-md mx-auto">
              <div className="card-body">
                <button
                  type="button"
                  className="btn btn-circle btn-ghost btn-xs text-info absolute top-2 right-2"
                  title="How to use this app"
                  onClick={() =>
                    (
                      document.getElementById("info_modal") as HTMLDialogElement
                    )?.showModal()
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="w-5 h-5 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-center mb-4">
                  Mass Spectrum to Audio Converter
                </h1>

                <div className="tabs tabs-lift tabs-sm mb-4">
                  <button
                    className={`tab ${
                      inputMode === "massbank" ? "tab-active" : ""
                    }`}
                    onClick={() => setInputMode("massbank")}
                  >
                    MassBank
                  </button>
                  <button
                    className={`tab ${
                      inputMode === "custom" ? "tab-active" : ""
                    }`}
                    onClick={() => setInputMode("custom")}
                  >
                    Custom
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  {inputMode === "massbank" ? (
                    <CompoundSearch
                      compound={compound}
                      onCompoundChange={setCompound}
                    />
                  ) : (
                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Spectrum Data
                        </span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-32 w-full"
                        placeholder="Enter spectrum data (m/z intensity pairs)&#10;Example:&#10;73.04018778 16.07433749&#10;75.05583784 2.042927662"
                        value={spectrumText}
                        onChange={(e) => setSpectrumText(e.target.value)}
                      />
                    </div>
                  )}
                  <AlgorithmSelector
                    algorithm={algorithm}
                    onChange={setAlgorithm}
                  />
                  {algorithm === "linear" && (
                    <LinearParameters offset={offset} onChange={setOffset} />
                  )}
                  {algorithm === "inverse" && (
                    <InverseParameters
                      scale={scale}
                      shift={shift}
                      onScaleChange={setScale}
                      onShiftChange={setShift}
                    />
                  )}
                  {algorithm === "modulo" && (
                    <ModuloParameters
                      factor={factor}
                      modulus={modulus}
                      base={base}
                      onFactorChange={setFactor}
                      onModulusChange={setModulus}
                      onBaseChange={setBase}
                    />
                  )}
                  <AudioSettings
                    duration={duration}
                    sampleRate={sampleRate}
                    onDurationChange={setDuration}
                    onSampleRateChange={setSampleRate}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary mb-4 w-full"
                    disabled={status === "Fetching audio..."}
                  >
                    Generate Audio
                  </button>
                </form>
                {status && <StatusMessage status={status} />}
                {compoundName &&
                  accession &&
                  !accession.startsWith("CUSTOM-") && (
                    <NameAndAccession
                      compoundName={compoundName}
                      accession={accession}
                    />
                  )}
                {audioUrl && (
                  <AudioPlayer
                    audioUrl={audioUrl}
                    downloadName={downloadName}
                  />
                )}
              </div>
            </div>
            {audioUrl && (
              <>
                <div className="flex justify-center my-4">
                  <div className="join">
                    <button
                      className={`join-item btn btn-sm ${!isMono ? "btn-active" : ""}`}
                      onClick={() => setIsMono(false)}
                    >
                      Poly
                    </button>
                    <button
                      className={`join-item btn btn-sm ${isMono ? "btn-active" : ""}`}
                      onClick={() => setIsMono(true)}
                    >
                      Mono
                    </button>
                  </div>
                </div>
                {!microtonalOpen && (
                  <SamplePiano audioUrl={audioUrl} isMono={isMono} />
                )}
                <div className="collapse collapse-arrow bg-base-200 mt-4 max-w-[440px] mx-auto text-center">
                  <input
                    type="checkbox"
                    checked={microtonalOpen}
                    onChange={() => setMicrotonalOpen(!microtonalOpen)}
                  />
                  <div className="collapse-title font-medium text-center after:!right-[calc(50%-80px)]">
                    {microtonalOpen
                      ? "Standard Keyboard"
                      : "Microtonal Keyboard"}
                  </div>
                  <div className="collapse-content">
                    {microtonalOpen && (
                      <MicrotonalPiano
                        audioUrl={audioUrl}
                        pitchRatios={pitchRatios}
                        setPitchRatios={setPitchRatios}
                        isMono={isMono}
                        compoundName={compoundName}
                        accession={accession}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* column 3 - Search history */}
          <div className="order-3 lg:order-3">
            <div className="card bg-neutral-content w-full max-w-md mx-auto mb-12">
              <div className="card-body">
                <MostGenerated
                  popularCompounds={popularCompoundsList}
                  popularError={popularError}
                  onCompoundClick={handleCompoundClick}
                />
              </div>
            </div>
            <div className="card bg-neutral-content w-full max-w-md mx-auto">
              <div className="card-body">
                <RecentlyGenerated
                  searchHistory={searchHistory}
                  historyError={historyError}
                  onCompoundClick={handleCompoundClick}
                />
              </div>
            </div>
          </div>
          {/* end column 3 */}
        </div>
        <InfoModal />
      </div>
    </div>
  );
}

export default App;
