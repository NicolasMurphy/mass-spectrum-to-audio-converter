# App.tsx Refactor Plan

## Problem

`App.tsx` is 530 lines with 18 `useState` calls. It owns all application state, form logic, API calls, Web Audio graph setup, keyboard event handling, and layout rendering. This makes it hard to read, hard to test, and hard to modify without unintended side effects.

## Goal

Break `App.tsx` into focused custom hooks and components using only React built-ins (no new dependencies). After the refactor, `App.tsx` should be a thin layout shell that wires hooks to components — roughly 100–150 lines.

## Approach

No new libraries. Use `useReducer` for grouped form state, extract custom hooks for logic, and extract layout components for JSX. Every extracted piece should be independently testable.

---

## Phase 1: Extract `useFormParams` hook with `useReducer`

### What moves out

These 8 `useState` calls:

```
offset, scale, shift, factor, modulus, base, duration, sampleRate
```

Plus `algorithm` and `inputMode` (they control which params are visible, so they belong with the form).

### Target file

`frontend/src/hooks/useFormParams.ts`

### Shape

```ts
type Algorithm = "linear" | "inverse" | "modulo";
type InputMode = "massbank" | "custom";

interface FormState {
  algorithm: Algorithm;
  inputMode: InputMode;
  offset: string;
  scale: string;
  shift: string;
  factor: string;
  modulus: string;
  base: string;
  duration: string;
  sampleRate: string;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: string }
  | { type: "SET_ALGORITHM"; value: Algorithm }
  | { type: "SET_INPUT_MODE"; value: InputMode }
  | { type: "RESET" };
```

### Rules

- All values stay as strings (they're form inputs — conversion to numbers happens at submission time only, not in state).
- The reducer is a pure function. Export it separately so it can be unit tested without rendering anything.
- The hook returns `[state, dispatch]` plus convenience setters if ergonomics demand it (e.g., `setAlgorithm(algo)` instead of `dispatch({type: "SET_ALGORITHM", value: algo})`).
- Default values are defined once as `INITIAL_FORM_STATE`, exported for use in tests.

---

## Phase 2: Extract `useAudioGeneration` hook

### What moves out

- `audioUrl` state
- `compoundName` state
- `accession` state
- `status` state
- `spectrumData` state
- The entire `handleFetch` / `handleSubmit` logic
- The `URL.revokeObjectURL` cleanup effect
- The `isLoading` derivation (replaces magic string check)

### Target file

`frontend/src/hooks/useAudioGeneration.ts`

### Shape

```ts
interface AudioGenerationResult {
  audioUrl: string;
  compoundName: string;
  accession: string;
  spectrumData: SpectrumData[] | null;
  status: string;
  isLoading: boolean;
  generate: (params: GenerateParams) => Promise<void>;
}
```

### Rules

- `isLoading` is a derived boolean, not a string comparison. The hook sets it to `true` before the fetch and `false` after, regardless of success/failure. This replaces all `status === "Fetching audio..."` checks in the JSX.
- The hook takes no form state as a parameter to its constructor — `generate()` receives everything it needs as an argument. This keeps the hook decoupled from the form shape.
- `URL.revokeObjectURL` cleanup lives inside this hook, not in `App.tsx`.
- The hook calls `refetchHistory` after a successful generation. Accept it as an option: `useAudioGeneration({ onSuccess: refetchHistory })`.

---

## Phase 3: Extract `useWebAudio` hook

### What moves out

- `analyserNode` state
- `audioElRef` ref
- `mediaSourceCreatedRef` ref
- The `useEffect` that sets up the AnalyserNode and wires the `<audio>` element into the Web Audio graph (lines 67–104 of current App.tsx)

### Target file

`frontend/src/hooks/useWebAudio.ts`

### Shape

```ts
interface WebAudioResult {
  analyserNode: AnalyserNode | null;
  audioElRef: React.RefObject<HTMLAudioElement>;
}
```

### Rules

- The hook accepts `audioUrl` as a parameter — it only runs setup when a URL exists.
- All Tone.js interaction (`Tone.start()`, `Tone.getContext()`, `Tone.getDestination()`) is encapsulated inside this hook. No other file should import from `tone` for analyzer purposes.
- The `try/catch` around `createMediaElementSource` is fine — keep it, but add a comment explaining *why* it can throw (the element can only be connected once).

---

## Phase 4: Extract layout components

### 4a: `AudioResultsPanel`

**Target file:** `frontend/src/Components/AudioResultsPanel.tsx`

**What it contains:** Everything that renders conditionally when `audioUrl` exists:

- `SpectrumAnalyzer`
- Poly/Mono toggle
- `SamplePiano` / `MicrotonalPiano` with the collapse accordion
- Audio player

**Props:** `audioUrl`, `analyserNode`, `audioElRef`, `downloadName`, `compoundName`, `accession`, plus the piano state (`pitchRatios`, `isMono`, `microtonalOpen` and their setters).

**Rules:**

- Piano-related state (`pitchRatios`, `isMono`, `microtonalOpen`) should be owned *inside* this component via local `useState`, not passed down from App. This state has no meaning when there's no audio.
- The component renders `null` when `audioUrl` is falsy.

### 4b: `GeneratorForm`

**Target file:** `frontend/src/Components/GeneratorForm.tsx`

**What it contains:** The `<form>` element and everything inside it:

- Input mode tabs (MassBank / Custom)
- `CompoundSearch` or the custom textarea
- `AlgorithmSelector`
- Algorithm-specific parameter components (`LinearParameters`, etc.)
- `AudioSettings`
- Submit button

**Props:** Form state + dispatch (from `useFormParams`), `compound`, `spectrumText`, `isLoading`, `onSubmit`.

**Rules:**

- `compound` and `spectrumText` stay as separate `useState` in App (or move into the form reducer) — they're text inputs that don't fit the "algorithm params" grouping, but they do fit "form state." Decide at implementation time; either is fine as long as it's consistent.
- The submit button's `disabled` state uses `isLoading` (boolean), not a string check.

---

## Phase 5: Kill magic strings

### Current problem

```tsx
// Loading check via string comparison
status === "Fetching audio..."

// Custom compound check via string prefix
accession.startsWith("CUSTOM-")

// Accession constant
accession === "CUSTOM-001"
```

### Fix

- `isLoading` boolean from `useAudioGeneration` replaces the status string check.
- Define `const CUSTOM_ACCESSION = "CUSTOM-001"` in `types.ts` or a constants file. Use it in both the frontend check and the `generateDownloadName` function.
- The `isCustomCompound` check can be a tiny helper: `const isCustomCompound = (acc: string) => acc === CUSTOM_ACCESSION`.

---

## Phase 6: Clean up `generateDownloadName`

### Current problem

Called on every render (line 271), creates a `Date` object each time, only relevant when audio exists.

### Fix

Move into `useAudioGeneration` as a returned value, memoized with `useMemo` that depends on `compoundName`, `accession`, and `audioUrl`. Only computes when audio state changes.

---

## Phase 7: Move global keydown handler

### Current problem

The `useEffect` on lines 229–251 adds a global `keydown` listener that clicks the submit button via DOM query (`document.querySelector('button[type="submit"]')`). This is brittle — it breaks if the button selector changes and bypasses React's event system.

### Fix

Extract to `useGlobalEnterSubmit` hook in `frontend/src/hooks/useGlobalEnterSubmit.ts`. Pass it a ref to the submit button (or a callback) instead of using `document.querySelector`. The hook should still respect the textarea and random-button exclusions.

---

## Final `App.tsx` structure

After all phases, `App.tsx` should look roughly like this:

```tsx
function App() {
  const [formState, dispatch] = useFormParams();
  const [compound, setCompound] = useState("");
  const [spectrumText, setSpectrumText] = useState("");

  const { history, error: historyError, refetchHistory } = useSearchHistory();
  const { popularCompounds, error: popularError } = usePopularCompounds(20);

  const audio = useAudioGeneration({ onSuccess: refetchHistory });
  const { analyserNode, audioElRef } = useWebAudio(audio.audioUrl);

  const handleSubmit = () => {
    audio.generate({ ...formState, compound, spectrumText });
  };

  const handleCompoundClick = (name: string) => {
    setCompound(name);
    dispatch({ type: "SET_INPUT_MODE", value: "massbank" });
  };

  return (
    <div data-theme="corporate" className="min-h-screen bg-base-200">
      {/* 3-column grid */}
      <SpectrumTablesColumn ... />
      <div>
        <GeneratorForm
          formState={formState}
          dispatch={dispatch}
          compound={compound}
          spectrumText={spectrumText}
          onCompoundChange={setCompound}
          onSpectrumTextChange={setSpectrumText}
          isLoading={audio.isLoading}
          status={audio.status}
          onSubmit={handleSubmit}
        />
        <AudioResultsPanel
          audioUrl={audio.audioUrl}
          analyserNode={analyserNode}
          audioElRef={audioElRef}
          compoundName={audio.compoundName}
          accession={audio.accession}
        />
      </div>
      <HistoryColumn ... />
      <InfoModal />
      <Footer />
    </div>
  );
}
```

---

## File inventory (new files created by this refactor)

| File | Type | Purpose |
|------|------|---------|
| `hooks/useFormParams.ts` | Hook | Form state reducer |
| `hooks/useAudioGeneration.ts` | Hook | API calls, audio URL, status, loading |
| `hooks/useWebAudio.ts` | Hook | AnalyserNode, media element wiring |
| `hooks/useGlobalEnterSubmit.ts` | Hook | Global Enter key handler |
| `Components/AudioResultsPanel.tsx` | Component | Piano, visualizer, playback controls |
| `Components/GeneratorForm.tsx` | Component | Form layout and inputs |

No files are deleted — existing child components (`CompoundSearch`, `AlgorithmSelector`, etc.) stay as-is.

---

## Rules for the entire refactor

1. **No new dependencies.** Everything uses React built-ins (`useState`, `useReducer`, `useCallback`, `useMemo`, `useRef`, `useEffect`).
2. **No behavior changes.** The app must work identically before and after. This is a structural refactor only.
3. **One phase per PR** (recommended). Each phase should leave the app in a working state.
4. **Tests follow code.** When a hook is extracted, add a unit test file for it in a corresponding test directory. At minimum, test the reducer's pure function and the `useAudioGeneration` hook's status transitions.
5. **No prop drilling beyond 2 levels.** If a prop needs to pass through more than 2 components to reach its destination, reconsider the component boundary.
6. **Keep types in `types.ts`.** New interfaces (`FormState`, `AudioGenerationResult`, etc.) go in the existing `types.ts` file, not scattered across hook files.
