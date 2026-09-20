import { useEffect, useState } from "react";

/** True when launched from Home Screen / installed PWA. */
export function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const check = () => {
      const display =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        ("standalone" in navigator &&
          (navigator as { standalone?: boolean }).standalone === true);
      setStandalone(display);
      document.documentElement.classList.toggle("is-standalone", display);
      document.body.classList.toggle("is-standalone", display);
    };
    check();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", check);
    return () => mq.removeEventListener?.("change", check);
  }, []);

  return standalone;
}

export function useIsMobileWidth(breakpoint = 1024): boolean {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : true
  );

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < breakpoint);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return mobile;
}
