import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("davar-install-dismissed") === "1"
  );

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (standalone || dismissed || (!deferred && !isIos)) return null;

  return (
    <div className="mx-5 mb-4 animate-fade-up rounded-2xl border border-accent/30 bg-accent/10 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-accent-soft">
          <Download className="h-4 w-4" />
          <p className="text-sm font-semibold text-white">Install Davar</p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem("davar-install-dismissed", "1");
            setDismissed(true);
          }}
          className="text-neutral-400"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {deferred ? (
        <button
          className="mt-1 w-full rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-white"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
        >
          Add to Home Screen
        </button>
      ) : (
        <p className="text-sm leading-relaxed text-neutral-300">
          On iPhone: tap <Share className="mx-1 inline h-3.5 w-3.5" /> Share, then{" "}
          <span className="font-medium text-white">Add to Home Screen</span>. No TestFlight needed.
        </p>
      )}
    </div>
  );
}
