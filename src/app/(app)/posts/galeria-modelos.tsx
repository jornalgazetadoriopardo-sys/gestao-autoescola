"use client";

import { useState } from "react";
import Link from "next/link";
import { Cartao } from "@/components/ui";
import { CATEGORIAS_POST, MODELOS_POST } from "@/lib/posts";
import type { MarcaInicial } from "./editor-post";
import { MiniaturaModelo } from "./miniatura";

// Galeria de modelos com filtro por assunto.
export function GaleriaModelos({ marca }: { marca: MarcaInicial }) {
  const [categoria, setCategoria] = useState("todos");
  const modelos = Object.entries(MODELOS_POST).filter(([, m]) => categoria === "todos" || m.categoria === categoria);
  const filtro = (id: string, nome: string, n: number) => (
    <button
      key={id}
      type="button"
      aria-pressed={categoria === id}
      onClick={() => setCategoria(id)}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        categoria === id ? "bg-blue-600 text-white" : "bg-white text-slate-700 shadow-xs hover:bg-slate-50"
      }`}
    >
      {nome} <span className={categoria === id ? "text-white/70" : "text-slate-400"}>{n}</span>
    </button>
  );
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Filtrar modelos">
        {filtro("todos", "Todos", Object.keys(MODELOS_POST).length)}
        {Object.entries(CATEGORIAS_POST).map(([id, nome]) =>
          filtro(id, nome, Object.values(MODELOS_POST).filter((m) => m.categoria === id).length),
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {modelos.map(([id, m]) => (
          <Link key={id} href={`/posts/novo?modelo=${id}`} className="group">
            <Cartao className="h-full p-3! transition group-hover:border-blue-300 group-hover:shadow-md sm:p-3!">
              <MiniaturaModelo modelo={id} marca={marca} />
              <div className="px-2 pt-3 pb-1">
                <div className="text-base font-semibold">{m.titulo}</div>
                <div className="text-sm text-slate-600">{m.descricao}</div>
              </div>
            </Cartao>
          </Link>
        ))}
      </div>
    </>
  );
}
