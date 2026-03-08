import { useState, useRef } from "react";
import * as Tone from "tone";

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

export default function Sequencer({
  buffer,
  pitchRatios,
  microtonalOpen,
  isMono,
}: SequencerProps) {
  const [steps, setSteps] = useState<string[]>(Array(16).fill(""));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const [bpm, setBpm] = useState(180);

  const playerRef = useRef<Tone.Player | null>(null);

  const playNote = (key: string, time?: number) => {
    if (!buffer || !key) return;

    const index = keyLabels.indexOf(key.toUpperCase());
    if (index === -1) return;

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

    if (microtonalOpen) {
      player.playbackRate = pitchRatios[index];
    } else {
      player.playbackRate = Math.pow(2, index / 12);
    }

    player.start(time);
  };

  const togglePlay = async () => {
    Tone.Transport.bpm.value = bpm;
    await Tone.start();

    if (isPlaying) {
      sequenceRef.current?.stop();
      sequenceRef.current?.dispose();
      Tone.Transport.stop();
      setIsPlaying(false);
      setCurrentStep(0);
    } else {
      sequenceRef.current = new Tone.Sequence(
        (time, step) => {
          // Schedule audio precisely
          Tone.Draw.schedule(() => {
            setCurrentStep(step);
          }, time);

          playNote(steps[step], time);
        },
        [...Array(16).keys()],
        "8n",
      );
      sequenceRef.current.start(0);
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {steps.map((step, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            value={step}
            onChange={(e) => {
              const newSteps = [...steps];
              newSteps[index] = e.target.value.toUpperCase();
              setSteps(newSteps);
            }}
            className={`input input-bordered w-10 h-10 text-center p-0 ${
              currentStep === index && isPlaying ? "input-primary" : ""
            }`}
          />
        ))}
      </div>
      <button className="btn btn-sm w-fit" onClick={togglePlay}>
        {isPlaying ? "Stop" : "Play"}
      </button>
      <input
        type="range"
        min={60}
        max={200}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
      />
    </div>
  );
}
