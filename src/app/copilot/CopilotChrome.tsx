"use client";

import { useEffect } from "react";

/**
 * Applies smooth scrolling on the document root when motion is allowed.
 */
export function CopilotChrome({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (mq.matches) {
        root.classList.remove("scroll-smooth");
      } else {
        root.classList.add("scroll-smooth");
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      root.classList.remove("scroll-smooth");
    };
  }, []);

  return <>{children}</>;
}
