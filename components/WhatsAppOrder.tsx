"use client";
import { logWhatsAppLead } from "@/app/actions";

/**
 * « Commander sur WhatsApp » : ouvre la discussion avec le vendeur, message déjà rédigé (produit, prix, lien),
 * et compte la demande pour le vendeur (« Demandes WhatsApp » dans son tableau de bord). Aucune donnée du client.
 */
export function WhatsAppOrder({ phone, shopSlug, productSlug, text, label = "Commander sur WhatsApp", className = "btn w-full" }: {
  phone: string; shopSlug: string; productSlug?: string; text: string; label?: string; className?: string;
}) {
  const href = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-haptic
      onClick={() => { void logWhatsAppLead(shopSlug, productSlug); }}>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#25d366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.4.1.1.1.7-.1 1.3Z" /></svg>
      {label}
    </a>
  );
}
