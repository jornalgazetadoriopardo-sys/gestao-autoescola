"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

// Modo de cores: claro, escuro ou automático (segue o computador/celular).
// Fica salvo neste navegador; o script em src/app/layout.tsx aplica ao abrir.
const OPCOES = [
  { id: "claro", label: "Claro", icone: Sun },
  { id: "escuro", label: "Escuro", icone: Moon },
  { id: "auto", label: "Automático", icone: Monitor },
] as const;

type Tema = (typeof OPCOES)[number]["id"];

function aplicar(tema: Tema) {
  const escuro = tema === "escuro" || (tema === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", escuro);
}

export function SeletorTema() {
  const [tema, setTema] = useState<Tema>("claro");
  useEffect(() => {
    try {
      const salvo = localStorage.getItem("tema");
      if (salvo === "escuro" || salvo === "auto") setTema(salvo);
    } catch {}
  }, []);

  const escolher = (t: Tema) => {
    setTema(t);
    try {
      localStorage.setItem("tema", t);
    } catch {}
    aplicar(t);
  };

  return (
    <div role="radiogroup" aria-label="Modo de cores" className="mb-3">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1">
        {OPCOES.map(({ id, label, icone: Icone }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={tema === id}
            title={id === "auto" ? "Segue o modo do computador ou celular" : `Modo ${label.toLowerCase()}`}
            onClick={() => escolher(id)}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition ${
              tema === id ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icone className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
