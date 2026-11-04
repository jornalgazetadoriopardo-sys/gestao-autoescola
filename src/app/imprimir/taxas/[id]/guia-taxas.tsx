"use client";

import { useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { formatarMoeda } from "@/lib/format";
import type { GrupoGuia } from "@/lib/guia-taxas";

// Na tela, a atendente escolhe quantas de cada taxa o aluno vai pagar agora
// (começa com as que faltam pagar). No papel, sai como a guia de balcão:
// "( 2 ) Exame de Habilitação Prático R$ 52,83", com o CPF em destaque.
export function GuiaTaxas({
  grupos,
  aluno,
  cpf,
  categoria,
  obs,
  termica,
  cabecalho,
}: {
  grupos: GrupoGuia[];
  aluno: string;
  cpf: string;
  categoria: string;
  obs: string;
  termica: boolean;
  cabecalho: ReactNode;
}) {
  const [qtd, setQtd] = useState<Record<string, number>>(() =>
    Object.fromEntries(grupos.map((g) => [g.chave, g.pendentes])),
  );
  const total = grupos.reduce((s, g) => s + (qtd[g.chave] ?? 0) * g.valorCentavos, 0);
  const mudar = (chave: string, delta: number) =>
    setQtd((q) => ({ ...q, [chave]: Math.min(Math.max((q[chave] ?? 0) + delta, 0), 9) }));

  const linhas = (
    <div className={termica ? "space-y-1" : "space-y-1.5 text-[15px]"}>
      {grupos.map((g) => {
        const n = qtd[g.chave] ?? 0;
        return (
          <div key={g.chave} className="flex items-baseline gap-2">
            <span className="w-[9mm] shrink-0 text-center font-bold">( {n > 0 ? n : " "} )</span>
            <span className="flex-1">
              {g.nome}
              {n === 0 && g.pagas > 0 && g.pendentes === 0 && <span className="text-[11px]"> — já pago</span>}
            </span>
            <span className="shrink-0 font-semibold">{formatarMoeda(g.valorCentavos)}</span>
          </div>
        );
      })}
    </div>
  );

  const guia = (
    <>
      {cabecalho}
      <div className={termica ? "mt-1" : "mt-4"}>
        Aluno: <b>{aluno}</b> · categoria {categoria}
      </div>
      <div className={`border-2 border-black ${termica ? "my-2 p-1.5" : "my-3 p-3"}`}>
        <div className={termica ? "text-[11px] font-bold uppercase" : "text-sm font-bold uppercase"}>
          Recolher pelo número do CPF:
        </div>
        <div className={`font-bold tracking-wide ${termica ? "text-[19px]" : "text-3xl"}`}>{cpf}</div>
      </div>
      {linhas}
      <div className={termica ? "tracejado" : "my-3 border-t border-slate-400"} />
      <div className={`flex justify-between font-bold ${termica ? "text-[14px]" : "text-lg"}`}>
        <span>Total a pagar</span>
        <span>{formatarMoeda(total)}</span>
      </div>
      <p className={termica ? "mt-2 text-[11px]" : "mt-3 text-sm"}>
        <b>Obs.:</b> {obs}
      </p>
      <p className={termica ? "mt-1 text-[11px]" : "mt-1 text-sm"}>
        Depois de pagar, traga o comprovante para a autoescola.
      </p>
    </>
  );

  return (
    <>
      <div className="mx-auto mb-5 max-w-[150mm] rounded-xl bg-white p-4 shadow print:hidden">
        <div className="mb-2 text-base font-semibold text-slate-800">O que o aluno vai pagar agora?</div>
        <p className="mb-3 text-sm text-slate-600">
          Já vem marcado o que falta pagar. Ajuste a quantidade de cada taxa antes de imprimir.
        </p>
        <div className="space-y-2">
          {grupos.map((g) => (
            <div key={g.chave} className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border border-slate-300">
                <button
                  type="button"
                  onClick={() => mudar(g.chave, -1)}
                  className="p-2 hover:bg-slate-100"
                  aria-label={`Diminuir ${g.nome}`}
                >
                  <Minus className="size-4" aria-hidden />
                </button>
                <span className="w-8 text-center font-semibold" aria-live="polite">
                  {qtd[g.chave] ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => mudar(g.chave, 1)}
                  className="p-2 hover:bg-slate-100"
                  aria-label={`Aumentar ${g.nome}`}
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>
              <span className="flex-1 text-base">
                {g.nome} <span className="text-slate-500">· {formatarMoeda(g.valorCentavos)}</span>
              </span>
              <span className="text-sm text-slate-500">
                {g.pendentes > 0 ? `${g.pendentes} a pagar` : ""}
                {g.pendentes > 0 && g.pagas > 0 ? " · " : ""}
                {g.pagas > 0 ? `${g.pagas} já ${g.pagas === 1 ? "paga" : "pagas"}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {termica ? (
        <div className="cupom">{guia}</div>
      ) : (
        <div className="folha">
          <div className="w-[130mm] border-2 border-dashed border-slate-400 p-[6mm]">{guia}</div>
        </div>
      )}
    </>
  );
}
