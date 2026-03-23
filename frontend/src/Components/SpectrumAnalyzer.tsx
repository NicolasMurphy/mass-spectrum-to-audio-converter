import { useRef, useEffect, useCallback } from "react";
import { type SpectrumAnalyzerProps } from "../types";

const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const LOG_MIN = Math.log2(MIN_FREQ);
const LOG_MAX = Math.log2(MAX_FREQ);
const LOG_RANGE = LOG_MAX - LOG_MIN;

// Grid line frequencies and labels
const FREQ_GRID_LINES = [
  { freq: 50, label: "" },
  { freq: 100, label: "100" },
  { freq: 200, label: "" },
  { freq: 500, label: "500" },
  { freq: 1000, label: "1k" },
  { freq: 2000, label: "" },
  { freq: 5000, label: "5k" },
  { freq: 10000, label: "10k" },
  { freq: 20000, label: "20k" },
];

const DB_GRID_LINES = [-80, -60, -40, -20];

function freqToX(freq: number, width: number): number {
  return ((Math.log2(freq) - LOG_MIN) / LOG_RANGE) * width;
}

export default function SpectrumAnalyzer({
  analyserNode,
}: SpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserNode;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get frequency data
    if (
      !dataArrayRef.current ||
      dataArrayRef.current.length !== analyser.frequencyBinCount
    ) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    analyser.getByteFrequencyData(dataArrayRef.current);
    const dataArray = dataArrayRef.current;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;

    // Resize canvas buffer to match CSS size * DPR (retina support)
    if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      ctx.scale(dpr, dpr);
    }

    // Clear
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const sampleRate = analyser.context.sampleRate;
    const binCount = analyser.frequencyBinCount;
    const minDb = analyser.minDecibels;
    const maxDb = analyser.maxDecibels;
    const dbRange = maxDb - minDb;

    // Draw grid lines
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 0.5;
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";

    // Frequency grid lines
    for (const { freq, label } of FREQ_GRID_LINES) {
      const x = freqToX(freq, cssWidth);
      if (x < 0 || x > cssWidth) continue;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssHeight);
      ctx.stroke();

      if (label) {
        // Right-align the last label so it doesn't clip off the edge
        if (freq === MAX_FREQ) {
          ctx.textAlign = "right";
          ctx.fillText(label, x - 2, cssHeight - 3);
          ctx.textAlign = "center";
        } else {
          ctx.fillText(label, x, cssHeight - 3);
        }
      }
    }

    // dB grid lines
    ctx.textAlign = "left";
    for (const db of DB_GRID_LINES) {
      const y = cssHeight * (1 - (db - minDb) / dbRange);
      if (y < 0 || y > cssHeight) continue;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssWidth, y);
      ctx.stroke();

    }

    // Build the frequency curve path
    ctx.beginPath();
    let started = false;

    for (let i = 0; i < binCount; i++) {
      const freq = (i * sampleRate) / (binCount * 2);
      if (freq < MIN_FREQ || freq > MAX_FREQ) continue;

      const x = freqToX(freq, cssWidth);
      const db = (dataArray[i] / 255) * dbRange + minDb;
      const y = cssHeight * (1 - (db - minDb) / dbRange);

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Fill underneath the curve
    if (started) {
      // Save the curve endpoint for closing the fill path
      const fillPath = new Path2D();
      let fillStarted = false;
      let firstX = 0;
      let lastX = 0;

      for (let i = 0; i < binCount; i++) {
        const freq = (i * sampleRate) / (binCount * 2);
        if (freq < MIN_FREQ || freq > MAX_FREQ) continue;

        const x = freqToX(freq, cssWidth);
        const db = (dataArray[i] / 255) * dbRange + minDb;
        const y = cssHeight * (1 - (db - minDb) / dbRange);

        if (!fillStarted) {
          fillPath.moveTo(x, cssHeight);
          fillPath.lineTo(x, y);
          firstX = x;
          fillStarted = true;
        } else {
          fillPath.lineTo(x, y);
        }
        lastX = x;
      }

      fillPath.lineTo(lastX, cssHeight);
      fillPath.lineTo(firstX, cssHeight);
      fillPath.closePath();

      // Gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, cssHeight);
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.2)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0.02)");
      ctx.fillStyle = gradient;
      ctx.fill(fillPath);

      // Stroke the curve
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [analyserNode]);

  useEffect(() => {
    if (!analyserNode) return;

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [analyserNode, draw]);

  return (
    <div ref={containerRef} className="w-full h-20 lg:h-36 mt-4">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded"
        style={{ display: "block" }}
      />
    </div>
  );
}
