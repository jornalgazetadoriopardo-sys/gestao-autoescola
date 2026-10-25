"use client";

import { useState } from "react";

// Escolha única em blocos grandes (mais fácil de ver e tocar que um select).
export function Opcoes({
  nome,
  legenda,
  opcoes,
  inicial,
  aoMudar,
  colunas = "sm:grid-cols-2",
}: {
  nome: string;
  legenda: string;
  opcoes: Record<string, { titulo: string; descricao?: string }>;
  inicial: string;
  aoMudar?: (valor: string) => void;
  colunas?: string;
}) {
  const [valor, setValor] = useState(inicial);
  return (
    <fieldset>
      <legend className="mb-2 text-base font-medium text-slate-800">{legenda}</legend>
      <div className={`grid gap-2 ${colunas}`}>
        {Object.entries(opcoes).map(([id, o]) => {
          const marcado = valor === id;
          return (
            <label
              key={id}
              className={`cursor-pointer rounded-xl border-2 px-3 py-2.5 transition ${
                marcado ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name={nome}
                value={id}
                checked={marcado}
                onChange={() => {
                  setValor(id);
                  aoMudar?.(id);
                }}
                className="sr-only"
              />
              <span className="block text-base font-semibold text-slate-900">{o.titulo}</span>
              {o.descricao && <span className="block text-sm text-slate-600">{o.descricao}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
