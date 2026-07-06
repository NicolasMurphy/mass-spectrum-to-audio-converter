import { useReducer } from "react";
import { type Algorithm, type InputMode } from "../types";

type StringField =
  | "compound"
  | "spectrumText"
  | "offset"
  | "scale"
  | "shift"
  | "factor"
  | "modulus"
  | "base"
  | "duration"
  | "sampleRate";

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
  hq: boolean;
}

export type FormAction =
  | { type: "SET_FIELD"; field: StringField; value: string }
  | { type: "SET_ALGORITHM"; value: Algorithm }
  | { type: "SET_INPUT_MODE"; value: InputMode }
  | { type: "SET_HQ"; value: boolean };

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
  hq: false,
};

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_ALGORITHM":
      return { ...state, algorithm: action.value };
    case "SET_INPUT_MODE":
      return { ...state, inputMode: action.value };
    case "SET_HQ":
      return { ...state, hq: action.value };
    default:
      return state;
  }
}

export function useFormParams() {
  return useReducer(formReducer, INITIAL_FORM_STATE);
}
