"use client";

import { useEffect, useState } from "react";

// Seletor de cor completo: a caixa de cores do navegador (com conta-gotas no
// Chrome/Edge) e o código #RRGGBB para colar a cor exata da marca.
export function CorPicker({
  rotulo,
  ajuda,
  valor,
  aoMudar,
}: {
  rotulo: string;
  ajuda?: string;
  valor: string;
  aoMudar: (cor: string) => void;
}) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-800">{rotulo}</span>
      <span className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white p-1.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
        <input
          type="color"
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          aria-label={`${rotulo}: escolher na paleta`}
        />
        <input
          value={texto}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value.trim();
            setTexto(v);
            const hex = v.startsWith("#") ? v : `#${v}`;
            if (/^#[0-9a-f]{6}$/i.test(hex)) aoMudar(hex.toLowerCase());
          }}
          className="w-full min-w-0 bg-transparent font-mono text-sm uppercase outline-none"
          aria-label={`${rotulo}: código da cor`}
        />
      </span>
      {ajuda && <span className="mt-1 block text-xs text-slate-500">{ajuda}</span>}
    </label>
  );
}
