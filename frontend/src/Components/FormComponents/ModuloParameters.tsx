import { type ModuloParametersProps } from "../../types";

export default function ModuloParameters({
  factor,
  modulus,
  base,
  onFactorChange,
  onModulusChange,
  onBaseChange,
}: ModuloParametersProps) {
  return (
    <>
      <div className="form-control mb-4">
        <label className="label" htmlFor="factorInput">
          <span className="label-text font-semibold">Factor (Modulo only)</span>
        </label>
        <input
          required
          id="factorInput"
          type="number"
          step="any"
          min="-1000000"
          max="1000000"
          placeholder="e.g. 10"
          className="input input-bordered w-full"
          value={factor}
          onChange={(e) => onFactorChange(e.target.value)}
        />
      </div>

      <div className="form-control mb-4">
        <label className="label" htmlFor="modulusInput">
          <span className="label-text font-semibold">
            Modulus (Modulo only)
          </span>
        </label>
        <input
          required
          id="modulusInput"
          type="number"
          step="any"
          min="-1000000"
          max="1000000"
          placeholder="e.g. 500"
          className="input input-bordered w-full"
          value={modulus}
          onChange={(e) => onModulusChange(e.target.value)}
        />
      </div>
      <div className="form-control mb-4">
        <label className="label" htmlFor="baseInput">
          <span className="label-text font-semibold">Base (Modulo only)</span>
        </label>
        <input
          required
          id="baseInput"
          type="number"
          step="any"
          min="-1000000"
          max="1000000"
          placeholder="e.g. 100"
          className="input input-bordered w-full"
          value={base}
          onChange={(e) => onBaseChange(e.target.value)}
        />
      </div>
    </>
  );
}
