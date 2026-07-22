import { useEffect } from "react";

export function useGlobalHotkeys() {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;

      if (e.key === "Enter") {
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
        return;
      }

      if (e.key === "r" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        const randomButton = document.querySelector(
          '[data-random-button="true"]'
        ) as HTMLButtonElement | null;
        if (randomButton) {
          randomButton.click();
          if (document.activeElement === randomButton) {
            randomButton.blur();
          }
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);
}
