import { useEffect, useState } from "react";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import * as Tone from "tone";
import { type SamplePianoProps } from "../types";

export default function SamplePiano({ audioUrl }: SamplePianoProps) {
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

    const baseMidi = 60; // Middle C
    const semitoneShift = midiNumber - baseMidi;
    player.playbackRate = Math.pow(2, semitoneShift / 12);
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
    </div>
  );
}
