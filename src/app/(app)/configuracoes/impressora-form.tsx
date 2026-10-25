"use client";

import { useState } from "react";
import { FileText, Receipt } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { salvarImpressora } from "./actions";

const OPCOES = [
  {
    id: "a4",
    titulo: "Impressora comum (folha A4)",
    texto: "Recibo com 2 vias e carnê com 4 parcelas por folha.",
    icone: FileText,
  },
  {
    id: "termica",
    titulo: "Impressora térmica (bobina 80 mm)",
    texto: "Ex.: Elgin i9. Recibo e parcelas do carnê em cupom.",
    icone: Receipt,
  },
];

export function ImpressoraForm({ atual }: { atual: string }) {
  const [escolha, setEscolha] = useState(atual);
  return (
    <FormAcao acao={salvarImpressora} textoBotao="Salvar">
      <fieldset>
        <legend className="mb-2 text-base font-medium text-slate-800">Recibos e carnê saem em:</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {OPCOES.map((o) => {
            const marcado = escolha === o.id;
            return (
              <label
                key={o.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                  marcado ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="impressoraRecibo"
                  value={o.id}
                  checked={marcado}
                  onChange={() => setEscolha(o.id)}
                  className="sr-only"
                />
                <o.icone className={`size-8 shrink-0 ${marcado ? "text-blue-700" : "text-slate-400"}`} aria-hidden />
                <span>
                  <span className="block text-base font-semibold">{o.titulo}</span>
                  <span className="block text-sm text-slate-600">{o.texto}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <p className="text-sm text-slate-600">
        Guia do aluno, relatórios e contrato continuam em folha A4. Na tela de impressão também dá para trocar entre A4
        e térmica a qualquer momento.
      </p>
    </FormAcao>
  );
}
