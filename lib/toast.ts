/** Notification éphémère en haut de l'écran : toast("Boutique autorisée"). */
export type ToastKind = "ok" | "error" | "info";
export function toast(message: string, kind: ToastKind = "ok") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("nx-toast", { detail: { message, kind } }));
  if (kind === "ok") try { navigator.vibrate?.(10); } catch { /* facultatif */ }
}
