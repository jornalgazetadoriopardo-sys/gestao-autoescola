"use client";

import { useState } from "react";
import { FileText, Receipt } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Select } from "@/components/ui";
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

// Larguras úteis comuns: bobina de 80 mm imprime até 72 mm; bobina de 58 mm, até 48 mm.
const LARGURAS = [
  [72, "72 mm (largura máxima da bobina de 80 mm)"],
  [70, "70 mm"],
  [68, "68 mm (recomendado)"],
  [66, "66 mm"],
  [64, "64 mm"],
  [60, "60 mm"],
  [48, "48 mm (bobina de 58 mm)"],
] as const;

export function ImpressoraForm({
  atual,
  largura,
  alinhamento,
}: {
  atual: string;
  largura: number;
  alinhamento: string;
}) {
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
      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-1 text-base font-medium text-slate-800">Ajuste da térmica</legend>
        <p className="mb-3 text-sm text-slate-600">
          Se a impressão estiver cortando um pedaço do lado direito, diminua a largura ou deixe encostado à esquerda.
          Use o <b>cupom de teste</b> (ao lado) para conferir: ele tem uma régua em milímetros.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Largura da impressão">
            <Select name="larguraTermica" defaultValue={String(largura)}>
              {LARGURAS.map(([mm, texto]) => (
                <option key={mm} value={mm}>
                  {texto}
                </option>
              ))}
              {!LARGURAS.some(([mm]) => mm === largura) && <option value={largura}>{largura} mm</option>}
            </Select>
          </Campo>
          <Campo label="Posição no papel">
            <Select name="alinhamentoTermica" defaultValue={alinhamento}>
              <option value="esquerda">Encostado à esquerda (recomendado)</option>
              <option value="centro">Centralizado</option>
            </Select>
          </Campo>
        </div>
      </fieldset>
      <p className="text-sm text-slate-600">
        Guia do aluno, relatórios e contrato continuam em folha A4. Na tela de impressão também dá para trocar entre A4
        e térmica a qualquer momento.
      </p>
    </FormAcao>
  );
}
