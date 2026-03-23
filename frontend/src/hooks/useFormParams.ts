import { useReducer } from "react";
import { type Algorithm, type InputMode } from "../types";

export interface FormState {
  algorithm: Algorithm;
  inputMode: InputMode;
  compound: string;
  spectrumText: string;
  offset: string;
  scale: string;
  shift: string;
  factor: string;
  modulus: string;
  base: string;
  duration: string;
  sampleRate: string;
}

export type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: string }
  | { type: "SET_ALGORITHM"; value: Algorithm }
  | { type: "SET_INPUT_MODE"; value: InputMode }
  | { type: "RESET" };

export const INITIAL_FORM_STATE: FormState = {
  algorithm: "linear",
  inputMode: "massbank",
  compound: "",
  spectrumText: "",
  offset: "300",
  scale: "100000",
  shift: "1",
  factor: "10",
  modulus: "500",
  base: "100",
  duration: "5",
  sampleRate: "44100",
};

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_ALGORITHM":
      return { ...state, algorithm: action.value };
    case "SET_INPUT_MODE":
      return { ...state, inputMode: action.value };
    case "RESET":
      return INITIAL_FORM_STATE;
    default:
      return state;
  }
}

export function useFormParams() {
  return useReducer(formReducer, INITIAL_FORM_STATE);
}
