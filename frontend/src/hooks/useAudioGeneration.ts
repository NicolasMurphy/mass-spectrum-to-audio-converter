import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { type SpectrumData } from "../types";
import base64ToBlob from "../utils";
import { CUSTOM_ACCESSION } from "../constants";
import { type FormState } from "./useFormParams";

interface UseAudioGenerationOptions {
  onSuccess?: () => void;
}

export function useAudioGeneration({
  onSuccess,
}: UseAudioGenerationOptions = {}) {
  const [audioUrl, setAudioUrl] = useState("");
  const [compoundName, setCompoundName] = useState("");
  const [accession, setAccession] = useState("");
  const [spectrumData, setSpectrumData] = useState<SpectrumData[] | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Use refs to keep generate() stable (no dependency on changing callbacks)
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const previousUrlRef = useRef("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, []);

  const generate = useCallback(async (formState: FormState) => {
    // Validation
    if (formState.inputMode === "massbank" && !formState.compound.trim()) {
      setStatus("Please enter a compound name.");
      return;
    }

    if (formState.inputMode === "custom" && !formState.spectrumText.trim()) {
      setStatus("Please enter spectrum data.");
      return;
    }

    const sampleRateNum = Number(formState.sampleRate);
    if (
      isNaN(sampleRateNum) ||
      sampleRateNum < 3500 ||
      sampleRateNum > 192000
    ) {
      setStatus("Sample rate must be between 3500 and 192000.");
      return;
    }

    const durationNum = Number(formState.duration);
    if (isNaN(durationNum) || durationNum < 0.01 || durationNum > 30) {
      setStatus("Duration must be between 0.01 and 30.");
      return;
    }

    setIsLoading(true);
    setStatus("Fetching audio...");
    setAudioUrl("");
    setCompoundName("");
    setAccession("");

    // Revoke previous object URL to prevent memory leaks
    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current);
      previousUrlRef.current = "";
    }

    try {
      const endpoint =
        formState.inputMode === "massbank"
          ? `${import.meta.env.VITE_API_URL}/massbank/${formState.algorithm}`
          : `${import.meta.env.VITE_API_URL}/custom/${formState.algorithm}`;

      const requestBody: Record<string, string | number | boolean> = {
        duration: durationNum,
        sample_rate: sampleRateNum,
        hq: formState.hq,
      };

      if (formState.inputMode === "massbank") {
        requestBody.compound = formState.compound;
      } else {
        requestBody.spectrum_text = formState.spectrumText;
      }

      if (formState.algorithm === "linear") {
        requestBody.offset = formState.offset;
      } else if (formState.algorithm === "inverse") {
        requestBody.scale = formState.scale;
        requestBody.shift = formState.shift;
      } else if (formState.algorithm === "modulo") {
        requestBody.factor = formState.factor;
        requestBody.modulus = formState.modulus;
        requestBody.base = formState.base;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setStatus(`Error: ${errorData.error}`);
        return;
      }

      const data = await response.json();

      const audioBlob = base64ToBlob(data.audio_base64);
      const url = URL.createObjectURL(audioBlob);

      previousUrlRef.current = url;
      setCompoundName(data.compound);
      setAccession(data.accession);
      setAudioUrl(url);
      setSpectrumData(data.spectrum);
      setStatus("Success!");
      onSuccessRef.current?.();
    } catch (err) {
      if (err instanceof Error) {
        setStatus(`Error: ${err.message}`);
      } else {
        setStatus("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadName = useMemo(() => {
    if (!audioUrl) return "";

    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0") +
      "-" +
      now.getHours().toString().padStart(2, "0") +
      now.getMinutes().toString().padStart(2, "0") +
      now.getSeconds().toString().padStart(2, "0");

    if (accession === CUSTOM_ACCESSION) {
      return `CUSTOM-${timestamp}.wav`;
    }
    return `${compoundName}-${accession}-${timestamp}.wav`;
  }, [audioUrl, accession, compoundName]);

  return {
    audioUrl,
    compoundName,
    accession,
    spectrumData,
    status,
    isLoading,
    downloadName,
    generate,
  };
}
