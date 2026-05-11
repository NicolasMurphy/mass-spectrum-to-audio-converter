import "./App.css";
import { useSearchHistory } from "./hooks/useSearchHistory";
import { usePopularCompounds } from "./hooks/usePopularCompounds";
import { useFormParams } from "./hooks/useFormParams";
import { useAudioGeneration } from "./hooks/useAudioGeneration";
import { useWebAudio } from "./hooks/useWebAudio";
import { useGlobalEnterSubmit } from "./hooks/useGlobalEnterSubmit";
import { isCustomCompound } from "./constants";
import GeneratorForm from "./Components/GeneratorForm";
import AudioResultsPanel from "./Components/AudioResultsPanel";
import AudioPlayer from "./Components/AudioPlayer";
import NameAndAccession from "./Components/NameAndAccession";
import StatusMessage from "./Components/StatusMessage";
import SpectrumTables from "./Components/SpectrumComponents/SpectrumTables";
import SkeletonSpectrumTables from "./Components/SpectrumComponents/SkeletonSpectrumTables";
import EmptyDataPlaceholder from "./Components/SpectrumComponents/EmptyDataPlaceholder";
import RecentlyGenerated from "./Components/RecentlyGeneratedComponents/RecentlyGenerated";
import MostGenerated from "./Components/MostGeneratedComponents/MostGenerated";
import InfoModal from "./Components/InfoModal";

function App() {
  const [formState, dispatch] = useFormParams();

  const {
    history: searchHistory,
    error: historyError,
    refetchHistory,
  } = useSearchHistory();
  const { popularCompounds, error: popularError } = usePopularCompounds(20);
  const popularCompoundsList = popularCompounds.map((item) => ({
    compound: item.compound,
  }));

  const audio = useAudioGeneration({ onSuccess: refetchHistory });
  const { analyserNode, audioElRef } = useWebAudio(audio.audioUrl);

  useGlobalEnterSubmit();

  const handleSubmit = () => {
    audio.generate(formState);
  };

  const handleCompoundClick = (compound: string) => {
    dispatch({ type: "SET_FIELD", field: "compound", value: compound });
    dispatch({ type: "SET_INPUT_MODE", value: "massbank" });
  };

  return (
    <div data-theme="corporate" className="min-h-screen bg-base-200">
      <div className="justify-items-center p-12 flex-col w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* column 1 - spectrum data tables */}
          <div className="order-2 lg:order-1">
            <div className="card bg-neutral-content w-full max-w-md mx-auto">
              <div className="card-body">
                {audio.isLoading ? (
                  <SkeletonSpectrumTables />
                ) : audio.spectrumData ? (
                  <SpectrumTables spectrumData={audio.spectrumData} />
                ) : (
                  <EmptyDataPlaceholder />
                )}
              </div>
            </div>
          </div>
          {/* column 2 - form, audio player, keyboard */}
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
                <GeneratorForm
                  formState={formState}
                  dispatch={dispatch}
                  isLoading={audio.isLoading}
                  onSubmit={handleSubmit}
                />
                {audio.status && (
                  <StatusMessage
                    status={audio.status}
                    isLoading={audio.isLoading}
                  />
                )}
                {audio.compoundName &&
                  audio.accession &&
                  !isCustomCompound(audio.accession) && (
                    <NameAndAccession
                      compoundName={audio.compoundName}
                      accession={audio.accession}
                    />
                  )}
                {audio.audioUrl && (
                  <AudioPlayer
                    ref={audioElRef}
                    audioUrl={audio.audioUrl}
                    downloadName={audio.downloadName}
                  />
                )}
              </div>
            </div>
            <AudioResultsPanel
              audioUrl={audio.audioUrl}
              analyserNode={analyserNode}
              compoundName={audio.compoundName}
              accession={audio.accession}
            />
          </div>
          {/* column 3 - history */}
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
        </div>
        <InfoModal />
      </div>
      <footer className="text-center py-16 text-sm opacity-40">
        Made by{" "}
        <a
          href="https://nicolasmurphy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          Nicolas Murphy
        </a>
        {" · "}
        <a
          href="/docs.html"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          API Docs
        </a>
      </footer>
    </div>
  );
}

export default App;
