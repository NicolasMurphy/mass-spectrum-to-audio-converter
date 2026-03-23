import { useEffect } from "react";

export function useGlobalEnterSubmit() {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const activeElement = document.activeElement;
        if (activeElement?.getAttribute("data-random-button") === "true") {
          return;
        }
        if (activeElement?.tagName === "TEXTAREA") {
          return;
        }
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
          (submitButton as HTMLButtonElement).click();
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);
}
