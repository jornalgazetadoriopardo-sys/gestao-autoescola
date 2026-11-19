"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Botão que copia um texto (chave Pix, Pix copia e cola).
export function CopiarTexto({ texto, rotulo, className = "" }: { texto: string; rotulo: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(texto).then(() => {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2500);
        })
      }
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${className}`}
    >
      {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copiado ? "Copiado!" : rotulo}
    </button>
  );
}
