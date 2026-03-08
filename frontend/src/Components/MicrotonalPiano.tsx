import { useEffect, useState } from "react";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import * as Tone from "tone";
import { type MicrotonalPianoProps } from "../types";

export default function MicrotonalPiano({
  audioUrl,
  pitchRatios,
  setPitchRatios
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

    const gain = new Tone.Gain(0.2).toDestination();

    const player = new Tone.Player({
      url: buffer,
      fadeIn: 0.01,
      fadeOut: 0.01,
    }).connect(gain);

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
        stopNote={() => { }}
        keyboardShortcuts={isInputFocused ? undefined : keyboardShortcuts}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        {pitchRatios.map((ratio, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.01}
              value={ratio}
              onChange={(e) => {
                const newRatios = [...pitchRatios];
                newRatios[index] = parseFloat(e.target.value);
                setPitchRatios(newRatios);
              }}
              style={{ flex: 1 }}
            />
            <span style={{ width: '60px', textAlign: 'right' }}>
              {Math.round(1200 * Math.log2(ratio))}¢
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
