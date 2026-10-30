"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PALETAS } from "@/lib/paletas";

// Amostras de cor. Ao clicar, a tela já muda de cor (prévia); só fica para
// todos depois de "Aplicar cor". Ao sair sem salvar, volta à cor de antes.
export function SeletorPaleta({ atual }: { atual: string }) {
  const [escolhida, setEscolhida] = useState(atual);
  useEffect(() => {
    const html = document.documentElement;
    const antes = html.dataset.paleta;
    html.dataset.paleta = escolhida;
    return () => {
      if (antes) html.dataset.paleta = antes;
    };
  }, [escolhida]);

  return (
    <div role="radiogroup" aria-label="Cor principal" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Object.entries(PALETAS).map(([id, p]) => {
        const marcada = escolhida === id;
        const cor = (l: number, c: number) => `oklch(${l}% ${c * p.croma} ${p.matiz})`;
        return (
          <label
            key={id}
            className={`flex cursor-pointer flex-col gap-2 rounded-2xl border-2 p-3 transition ${
              marcada ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="paleta"
              value={id}
              checked={marcada}
              onChange={() => setEscolhida(id)}
              className="sr-only"
            />
            <span className="flex h-12 overflow-hidden rounded-xl" aria-hidden>
              <span className="flex-1" style={{ background: cor(19, 0.03) }} />
              <span
                className="flex flex-1 items-center justify-center text-white"
                style={{ background: cor(54.6, 0.245) }}
              >
                {marcada && <Check className="size-5" />}
              </span>
              <span className="flex-1" style={{ background: cor(93.2, 0.032) }} />
            </span>
            <span>
              <span className="block text-base font-semibold text-slate-900">{p.nome}</span>
              <span className="block text-sm text-slate-600">{p.descricao}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
