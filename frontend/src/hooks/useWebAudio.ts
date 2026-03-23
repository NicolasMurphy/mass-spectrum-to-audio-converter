import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

export function useWebAudio(audioUrl: string) {
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement>(null);
  const mediaSourceCreatedRef = useRef(false);

  useEffect(() => {
    if (!audioUrl) return;

    const setupAnalyser = async () => {
      // Ensure the audio context is running (requires user gesture)
      await Tone.start();

      const rawCtx = Tone.getContext().rawContext as AudioContext;

      // Create analyser if we haven't yet
      if (!analyserNode) {
        const analyser = rawCtx.createAnalyser();
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0.8;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -25;

        // Tap the analyser off Tone's destination
        Tone.getDestination().connect(analyser);

        setAnalyserNode(analyser);
      }

      // Connect the <audio> element to the Web Audio graph (once only).
      // createMediaElementSource can only be called once per element —
      // subsequent calls throw, so we guard with a ref.
      const audioEl = audioElRef.current;
      if (audioEl && !mediaSourceCreatedRef.current) {
        try {
          const source = rawCtx.createMediaElementSource(audioEl);
          source.connect(rawCtx.destination);
          mediaSourceCreatedRef.current = true;
        } catch {
          // Already connected — ignore
        }
      }
    };

    setupAnalyser();
  }, [audioUrl, analyserNode]);

  return { analyserNode, audioElRef };
}
