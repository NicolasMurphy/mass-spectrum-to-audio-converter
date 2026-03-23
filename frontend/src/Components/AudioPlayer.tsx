import { forwardRef } from "react";
import { type AudioPlayerProps } from "../types";

const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  function AudioPlayer({ audioUrl, downloadName }, ref) {
    return (
      <>
        <div className="flex flex-col items-center gap-6">
          <audio ref={ref} controls src={audioUrl} className="w-full" />
          <a
            href={audioUrl}
            download={downloadName}
            className="btn btn-outline btn-sm"
          >
            Download WAV
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Protip: If you plan to use the .wav in a sampler, download a lower
          pitched sample with a higher sample rate to retain fidelity.
        </p>
      </>
    );
  },
);

export default AudioPlayer;
