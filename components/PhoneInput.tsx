"use client";
import { useId, useMemo, useState } from "react";
import { DIAL_COUNTRIES, MOBILE_MONEY, flag, splitPhone } from "@/lib/dial-codes";

/**
 * Numéro de téléphone avec indicatif du pays : les pays Orange Money et Wave en premier, puis tous les pays du monde.
 * La valeur rendue est toujours « +indicatif numéro » (ex. « +223 70 00 00 00 »), comme avant.
 */
export function PhoneInput({ id, value, onChange, required, label, placeholder = "70 00 00 00", className = "", defaultIso = "ML", autoComplete = "tel" }: {
  id?: string; value: string; onChange: (v: string) => void; required?: boolean; label?: string; placeholder?: string; className?: string; defaultIso?: string; autoComplete?: string;
}) {
  const auto = useId();
  const inputId = id ?? `tel-${auto}`;
  const parsed = splitPhone(value, defaultIso);
  // Pays choisi gardé même quand le numéro est encore vide.
  const [iso, setIso] = useState(parsed.iso);
  const current = value.trim().startsWith("+") ? parsed.iso : iso;
  const country = DIAL_COUNTRIES.find((c) => c.iso === current) ?? DIAL_COUNTRIES.find((c) => c.iso === "ML")!;
  const rest = value.trim().startsWith("+") ? parsed.rest : value;

  const [mm, others] = useMemo(() => {
    const order = Object.keys(MOBILE_MONEY);
    return [
      DIAL_COUNTRIES.filter((c) => MOBILE_MONEY[c.iso]).sort((a, b) => order.indexOf(a.iso) - order.indexOf(b.iso)),
      DIAL_COUNTRIES.filter((c) => !MOBILE_MONEY[c.iso]),
    ];
  }, []);

  const emit = (code: string, number: string) => {
    const n = number.replace(/[^\d ]/g, "").replace(/^\s+/, "");
    onChange(n ? `+${code} ${n}` : "");
  };

  return (
    <div className={className}>
      {label && <label className="label" htmlFor={inputId}>{label}</label>}
      <div className="phone-field">
        <span className="phone-code" aria-hidden="true">{flag(country.iso)} +{country.code}</span>
        <select aria-label="Pays (indicatif)" value={country.iso} onChange={(e) => { const c = DIAL_COUNTRIES.find((x) => x.iso === e.target.value)!; setIso(c.iso); emit(c.code, rest); }}>
          <optgroup label="Orange Money et Wave">
            {mm.map((c) => <option key={c.iso} value={c.iso}>{flag(c.iso)} {c.name} (+{c.code}) · {MOBILE_MONEY[c.iso]!.join(", ")}</option>)}
          </optgroup>
          <optgroup label="Tous les pays (paiement par carte)">
            {others.map((c) => <option key={c.iso} value={c.iso}>{flag(c.iso)} {c.name} (+{c.code})</option>)}
          </optgroup>
        </select>
        <input id={inputId} aria-label={label ? undefined : "Numéro de téléphone"} type="tel" inputMode="tel" autoComplete={autoComplete === "tel" ? "tel-national" : autoComplete} required={required} placeholder={placeholder}
          value={rest} onChange={(e) => emit(country.code, e.target.value)} maxLength={18} />
      </div>
    </div>
  );
}
