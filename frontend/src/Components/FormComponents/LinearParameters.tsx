import { type LinearParametersProps } from "../../types";

export default function LinearParameters({
  offset,
  onChange,
}: LinearParametersProps) {
  return (
    <div className="form-control mb-4">
      <label className="label" htmlFor="offsetInput">
        <span className="label-text font-semibold">
          Offset (m/z) (Linear only)
        </span>
      </label>
      <input
        required
        id="offsetInput"
        type="number"
        step="any"
        min="-1000000"
        max="1000000"
        placeholder="e.g. 300"
        className="input input-bordered w-full"
        value={offset}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
