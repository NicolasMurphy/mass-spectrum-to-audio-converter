import { type AudioSettingsProps } from "../../types";

export default function AudioSettings({
  duration,
  sampleRate,
  hq,
  onDurationChange,
  onSampleRateChange,
  onHqChange,
}: AudioSettingsProps) {
  return (
    <>
      <div className="form-control mb-4">
        <label className="label" htmlFor="durationInput">
          <span className="label-text font-semibold">Duration</span>
        </label>
        <input
          required
          id="durationInput"
          type="number"
          step="any"
          placeholder="e.g. 5"
          className="input input-bordered w-full"
          value={duration}
          onChange={(e) => onDurationChange(e.target.value)}
        />
      </div>
      <div className="form-control mb-4">
        <label className="label" htmlFor="sampleRateInput">
          <span className="label-text font-semibold">Sample Rate (Hz)</span>
        </label>
        <input
          required
          id="sampleRateInput"
          type="number"
          placeholder="e.g. 44100"
          className="input input-bordered w-full"
          value={sampleRate}
          onChange={(e) => {
            const value = e.target.value;
            // Only allow empty string or integers (no decimals)
            if (value === "" || /^\d+$/.test(value)) {
              onSampleRateChange(value);
            }
          }}
          min={3500}
          max={192000}
        />
      </div>
      <div className="form-control mb-4">
        <label
          className="label cursor-pointer justify-start gap-3"
          htmlFor="hqInput"
        >
          <input
            id="hqInput"
            type="checkbox"
            className="checkbox"
            checked={hq}
            onChange={(e) => onHqChange(e.target.checked)}
          />
          <span
            className="label-text font-semibold tooltip"
            data-tip="float32 math + int16 WAV → float64 math + float32 WAV"
          >
            HQ
          </span>
        </label>
      </div>
    </>
  );
}
