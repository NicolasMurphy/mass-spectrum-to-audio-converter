import CompoundSearch from "./FormComponents/CompoundSearch";
import AlgorithmSelector from "./FormComponents/AlgorithmSelector";
import LinearParameters from "./FormComponents/LinearParameters";
import InverseParameters from "./FormComponents/InverseParameters";
import ModuloParameters from "./FormComponents/ModuloParameters";
import AudioSettings from "./FormComponents/AudioSettings";
import { type FormState, type FormAction } from "../hooks/useFormParams";

interface GeneratorFormProps {
  formState: FormState;
  dispatch: React.Dispatch<FormAction>;
  isLoading: boolean;
  onSubmit: () => void;
}

export default function GeneratorForm({
  formState,
  dispatch,
  isLoading,
  onSubmit,
}: GeneratorFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <>
      <div className="tabs tabs-lift tabs-sm mb-4">
        <button
          className={`tab ${formState.inputMode === "massbank" ? "tab-active" : ""}`}
          onClick={() =>
            dispatch({ type: "SET_INPUT_MODE", value: "massbank" })
          }
        >
          MassBank
        </button>
        <button
          className={`tab ${formState.inputMode === "custom" ? "tab-active" : ""}`}
          onClick={() =>
            dispatch({ type: "SET_INPUT_MODE", value: "custom" })
          }
        >
          Custom
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {formState.inputMode === "massbank" ? (
          <CompoundSearch
            compound={formState.compound}
            onCompoundChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "compound", value })
            }
          />
        ) : (
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Spectrum Data</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-32 w-full"
              placeholder={
                "Enter spectrum data (m/z intensity pairs)\nExample:\n73.04018778 16.07433749\n75.05583784 2.042927662"
              }
              value={formState.spectrumText}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "spectrumText",
                  value: e.target.value,
                })
              }
            />
          </div>
        )}
        <AlgorithmSelector
          algorithm={formState.algorithm}
          onChange={(value) => dispatch({ type: "SET_ALGORITHM", value })}
        />
        {formState.algorithm === "linear" && (
          <LinearParameters
            offset={formState.offset}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "offset", value })
            }
          />
        )}
        {formState.algorithm === "inverse" && (
          <InverseParameters
            scale={formState.scale}
            shift={formState.shift}
            onScaleChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "scale", value })
            }
            onShiftChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "shift", value })
            }
          />
        )}
        {formState.algorithm === "modulo" && (
          <ModuloParameters
            factor={formState.factor}
            modulus={formState.modulus}
            base={formState.base}
            onFactorChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "factor", value })
            }
            onModulusChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "modulus", value })
            }
            onBaseChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "base", value })
            }
          />
        )}
        <AudioSettings
          duration={formState.duration}
          sampleRate={formState.sampleRate}
          hq={formState.hq}
          onDurationChange={(value) =>
            dispatch({ type: "SET_FIELD", field: "duration", value })
          }
          onSampleRateChange={(value) =>
            dispatch({ type: "SET_FIELD", field: "sampleRate", value })
          }
          onHqChange={(value) => dispatch({ type: "SET_HQ", value })}
        />
        <button
          type="submit"
          className="btn btn-primary mb-4 w-full"
          disabled={isLoading}
        >
          Generate Audio
        </button>
      </form>
    </>
  );
}
