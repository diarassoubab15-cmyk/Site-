import { paymentMethods, type PaymentMethodId } from "@/lib/payments";

export function PaymentMethods({ methods, compact = false }: { methods: PaymentMethodId[]; compact?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Moyens de paiement acceptés">
      {methods.map((m) => (
        <li key={m} className="inline-flex items-center gap-2 rounded-[6px] border border-line px-2.5 py-1.5 text-xs text-bone">
          <span className="h-2 w-2 rounded-full ring-1 ring-black/15" style={{ background: paymentMethods[m].color }} aria-hidden="true" />
          {compact ? paymentMethods[m].label.replace("Paiement à la livraison", "À la livraison") : paymentMethods[m].label}
        </li>
      ))}
    </ul>
  );
}
