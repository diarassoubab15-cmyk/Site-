"use client";
import { useEffect, useState } from "react";
import type { ToastKind } from "@/lib/toast";

type Item = { id: number; message: string; kind: ToastKind; leaving?: boolean };
const dot: Record<ToastKind, string> = { ok: "bg-pulse", error: "bg-alarm", info: "bg-iris-glow" };

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let n = 0;
    const onToast = (e: Event) => {
      const { message, kind } = (e as CustomEvent<{ message: string; kind: ToastKind }>).detail;
      const id = ++n;
      setItems((l) => [...l.slice(-2), { id, message, kind }]);
      setTimeout(() => setItems((l) => l.map((x) => (x.id === id ? { ...x, leaving: true } : x))), 3200);
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 3450);
    };
    window.addEventListener("nx-toast", onToast);
    return () => window.removeEventListener("nx-toast", onToast);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {items.map((t) => (
        <p key={t.id} className={`toast ${t.leaving ? "is-leaving" : ""} pointer-events-auto flex items-center gap-2.5 rounded-[6px] border border-line bg-black/95 px-4 py-2.5 text-sm text-white backdrop-blur-[25px]`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot[t.kind]}`} aria-hidden="true" />
          {t.message}
        </p>
      ))}
    </div>
  );
}
