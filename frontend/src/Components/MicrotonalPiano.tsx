import { useEffect, useState, useRef } from "react";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import * as Tone from "tone";
import { type MicrotonalPianoProps } from "../types";

const MIDDLE_C_HZ = 261.63;

function buildFilename(compoundName: string, accession: string, ext: string) {
  const base =
    compoundName && accession
      ? `${compoundName}-${accession}`
      : compoundName || accession || "microtonal_piano";
  const safe = base.replace(/[^a-zA-Z0-9_\-]/g, "_");
  return `${safe}.${ext}`;
}

function exportScl(
  pitchRatios: number[],
  compoundName: string,
  accession: string,
) {
  const minRatio = Math.min(...pitchRatios);
  const sorted = [...pitchRatios].sort((a, b) => a - b);

  const intervals = sorted.slice(1).map((ratio) => {
    const cents = 1200 * Math.log2(ratio / minRatio);
    return cents.toFixed(6);
  });

  const filename = buildFilename(compoundName, accession, "scl");
  const lines = [
    `! ${filename}`,
    "!",
    "Microtonal Piano export",
    intervals.length.toString(),
    "!",
    ...intervals,
  ];

  triggerDownload(lines.join("\n"), filename);
}

function exportAscl(
  pitchRatios: number[],
  compoundName: string,
  accession: string,
) {
  const minRatio = Math.min(...pitchRatios);
  const refFreq = MIDDLE_C_HZ * minRatio;
  const sorted = [...pitchRatios].sort((a, b) => a - b);

  const intervals = sorted.slice(1).map((ratio) => {
    const cents = 1200 * Math.log2(ratio / minRatio);
    return cents.toFixed(6);
  });

  const filename = buildFilename(compoundName, accession, "ascl");
  const lines = [
    `! ${filename}`,
    "!",
    "Microtonal Piano export",
    `! Reference: ${refFreq.toFixed(4)} Hz (C4 * lowest ratio)`,
    intervals.length.toString(),
    "!",
    ...intervals,
  ];

  triggerDownload(lines.join("\n"), filename);
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MicrotonalPiano({
  audioUrl,
  pitchRatios,
  setPitchRatios,
  isMono,
  compoundName,
  accession,
}: MicrotonalPianoProps) {
  const [buffer, setBuffer] = useState<Tone.ToneAudioBuffer | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const firstNote = MidiNumbers.fromNote("C4");
  const lastNote = MidiNumbers.fromNote("C5");
  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote,
    lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  });

  const keyLabels = [
    "A",
    "W",
    "S",
    "E",
    "D",
    "F",
    "T",
    "G",
    "Y",
    "H",
    "U",
    "J",
    "K",
  ];

  const playerRef = useRef<Tone.Player | null>(null);

  useEffect(() => {
    if (audioUrl) {
      const buffer = new Tone.ToneAudioBuffer({
        url: audioUrl,
        onload: () => {
          setBuffer(buffer);
        },
        onerror: (err) => {
          console.error("Buffer load error:", err);
        },
      });
    }
  }, [audioUrl]);

  useEffect(() => {
    const compoundInput = document.getElementById("compoundInput");

    const handleFocus = () => setIsInputFocused(true);
    const handleBlur = () => setIsInputFocused(false);

    compoundInput?.addEventListener("focus", handleFocus);
    compoundInput?.addEventListener("blur", handleBlur);

    return () => {
      compoundInput?.removeEventListener("focus", handleFocus);
      compoundInput?.removeEventListener("blur", handleBlur);
    };
  }, []);

  const playNote = (midiNumber: number) => {
    if (!buffer) return;

    if (isMono && playerRef.current) {
      playerRef.current.stop();
    }

    const gain = new Tone.Gain(0.2).toDestination();
    const player = new Tone.Player({
      url: buffer,
      fadeIn: 0.01,
      fadeOut: 0.01,
    }).connect(gain);

    if (isMono) {
      playerRef.current = player;
    }

    const index = midiNumber - 60;
    player.playbackRate = pitchRatios[index];
    player.start();
  };

  return (
    <div className="max-w-[440px] mt-6 mx-auto">
      <Piano
        width="440"
        noteRange={{ first: firstNote, last: lastNote }}
        playNote={playNote}
        stopNote={() => {}}
        keyboardShortcuts={isInputFocused ? undefined : keyboardShortcuts}
      />

      {/* Controls row */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => {
            const randomRatios = Array(13)
              .fill(0)
              .map(() => Math.pow(2, (Math.random() * 4800 - 2400) / 1200));
            setPitchRatios(randomRatios);
          }}
          className="btn btn-ghost btn-square text-xl"
          title="Randomize"
        >
          🎲
        </button>
        <div className="join">
          <button
            onClick={() => exportScl(pitchRatios, compoundName, accession)}
            className="join-item btn btn-sm btn-outline"
          >
            Export .scl
          </button>
          <button
            onClick={() => exportAscl(pitchRatios, compoundName, accession)}
            className="join-item btn btn-sm btn-outline"
          >
            Export .ascl
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="mt-4 flex flex-col gap-2">
        {pitchRatios.map((ratio, index) => {
          const centsExact = 1200 * Math.log2(ratio);
          const centsRounded = Math.round(centsExact);
          const centsLabel =
            centsRounded === 0
              ? "0¢"
              : `${centsRounded > 0 ? "+" : ""}${centsRounded}¢`;
          return (
            <div key={index} className="flex items-center gap-3">
              <span className="w-4 text-center text-sm font-mono opacity-60">
                {keyLabels[index]}
              </span>
              <input
                type="range"
                min={-2400}
                max={2400}
                step={1}
                value={centsExact}
                onChange={(e) => {
                  const newCents = parseFloat(e.target.value);
                  const newRatios = [...pitchRatios];
                  newRatios[index] = Math.pow(2, newCents / 1200);
                  setPitchRatios(newRatios);
                }}
                className="range range-xs flex-1"
              />
              <span className="w-16 text-right text-sm font-mono tabular-nums opacity-80">
                {centsLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
