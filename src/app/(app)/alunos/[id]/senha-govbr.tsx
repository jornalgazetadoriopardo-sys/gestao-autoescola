"use client";

import { useState, useTransition } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { Botao } from "@/components/ui";
import { verSenhaGovbr } from "../actions";

// A senha só vem do servidor quando alguém clica em "Mostrar".
export function SenhaGovbr({ alunoId }: { alunoId: number }) {
  const [senha, setSenha] = useState<string | null>(null);
  const [copiada, setCopiada] = useState(false);
  const [carregando, iniciar] = useTransition();

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-base">{senha ?? "••••••••"}</span>
      <Botao
        type="button"
        variante="secundario"
        tamanho="pequeno"
        icone={senha ? EyeOff : Eye}
        disabled={carregando}
        onClick={() => (senha ? setSenha(null) : iniciar(async () => setSenha(await verSenhaGovbr(alunoId))))}
      >
        {senha ? "Esconder" : "Mostrar"}
      </Botao>
      {senha && (
        <Botao
          type="button"
          variante="secundario"
          tamanho="pequeno"
          icone={Copy}
          onClick={() => navigator.clipboard?.writeText(senha).then(() => setCopiada(true))}
        >
          {copiada ? "Copiada!" : "Copiar"}
        </Botao>
      )}
    </span>
  );
}
