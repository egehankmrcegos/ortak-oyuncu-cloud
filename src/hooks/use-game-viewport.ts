import { useEffect } from "react";

/** Keep the shared shell and dialogs inside Safari's unobscured visual viewport. */
export function useGameViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    const update = () => {
      // Pinch zoom must remain available without changing the game layout.
      if (viewport && Math.abs(viewport.scale - 1) > 0.05) return;
      const height = viewport?.height ?? window.innerHeight;
      const editing = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
      const keyboardOpen = editing && window.innerHeight - height > 120;
      root.style.setProperty("--app-height", `${height}px`);
      root.style.setProperty("--app-top", `${viewport?.offsetTop ?? 0}px`);
      root.classList.toggle("keyboard-open", keyboardOpen);
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      root.classList.remove("keyboard-open");
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--app-top");
    };
  }, []);
}