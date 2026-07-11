import { type InverseParametersProps } from "../../types";

export default function InverseParameters({
  scale,
  shift,
  onScaleChange,
  onShiftChange,
}: InverseParametersProps) {
  return (
    <>
      <div className="form-control mb-4">
        <label className="label" htmlFor="scaleInput">
          <span className="label-text font-semibold">Scale (Inverse only)</span>
        </label>
        <input
          required
          min="-1000000"
          max="1000000"
          id="scaleInput"
          type="number"
          step="any"
          placeholder="e.g. 100000"
          className="input input-bordered w-full"
          value={scale}
          onChange={(e) => onScaleChange(e.target.value)}
        />
      </div>

      <div className="form-control mb-4">
        <label className="label" htmlFor="shiftInput">
          <span className="label-text font-semibold">Shift (Inverse only)</span>
        </label>
        <input
          required
          min="-1000000"
          max="1000000"
          id="shiftInput"
          type="number"
          step="any"
          placeholder="e.g. 1"
          className="input input-bordered w-full"
          value={shift}
          onChange={(e) => onShiftChange(e.target.value)}
        />
      </div>
    </>
  );
}
