import { useState } from "react";
import SamplePiano from "./SamplePiano";
import MicrotonalPiano from "./MicrotonalPiano";
import SpectrumAnalyzer from "./SpectrumAnalyzer";

interface AudioResultsPanelProps {
  audioUrl: string;
  analyserNode: AnalyserNode | null;
  compoundName: string;
  accession: string;
}

export default function AudioResultsPanel({
  audioUrl,
  analyserNode,
  compoundName,
  accession,
}: AudioResultsPanelProps) {
  const [isMono, setIsMono] = useState(false);
  const [microtonalOpen, setMicrotonalOpen] = useState(false);
  const [pitchRatios, setPitchRatios] = useState<number[]>(Array(13).fill(1.0));

  if (!audioUrl) return null;

  return (
    <>
      <SpectrumAnalyzer analyserNode={analyserNode} />
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
      {!microtonalOpen && <SamplePiano audioUrl={audioUrl} isMono={isMono} />}
      <div className="collapse collapse-arrow bg-base-200 mt-4 max-w-[440px] mx-auto text-center">
        <input
          type="checkbox"
          checked={microtonalOpen}
          onChange={() => setMicrotonalOpen(!microtonalOpen)}
        />
        <div className="collapse-title font-medium text-center after:!right-[calc(50%-80px)]">
          {microtonalOpen ? "Standard Keyboard" : "Microtonal Keyboard"}
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
  );
}
