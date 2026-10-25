"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Marcação do contrato com botão para copiar e colar no Word.
export function CopiarMarcacao({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(texto).then(() => {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-mono text-sm text-slate-800 hover:bg-blue-50"
      title="Copiar"
    >
      {texto}
      {copiado ? (
        <Check className="size-4 text-green-600" aria-hidden />
      ) : (
        <Copy className="size-4 text-slate-400" aria-hidden />
      )}
    </button>
  );
}
