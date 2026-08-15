import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
};

export function AppModal({
  open,
  title,
  message,
  confirmLabel = "OK",
  onClose,
  onConfirm,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <button className="absolute inset-0 cursor-default" aria-label="Dismiss" onClick={onClose} />
      <div className="glass relative w-full max-w-md animate-fade-up rounded-3xl p-5 shadow-sheet">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-neutral-300">{message}</p>
        <button
          className={cn(
            "w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white",
            "active:scale-[0.98] transition"
          )}
          onClick={() => {
            onConfirm?.();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
