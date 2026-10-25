"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FileText, Printer, Receipt, X } from "lucide-react";

// Recibo e carnê podem sair em folha A4 ou na impressora térmica (80 mm).
const COM_TERMICA = ["/imprimir/recibo/", "/imprimir/carne/"];

export function BarraImpressao() {
  const caminho = usePathname();
  const params = useSearchParams();
  // A página mostra cupons (.cupom) quando está no formato da térmica.
  const [termica, setTermica] = useState(false);
  useEffect(() => setTermica(Boolean(document.querySelector(".cupom"))), [caminho, params]);

  const alternavel = COM_TERMICA.some((c) => caminho.startsWith(c));
  const recibo = caminho.startsWith("/imprimir/recibo/");
  const link = (mudar: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(mudar)) p.set(k, v);
    return `${caminho}?${p}`;
  };
  const opcao = (ativo: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
      ativo ? "bg-white text-slate-900" : "border border-slate-600 hover:bg-slate-800"
    }`;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-3 bg-slate-900 px-4 py-3 text-white print:hidden">
      <span className="text-base">
        {termica
          ? "Térmica: escolha a impressora ELGIN i9, margens Nenhuma e escala 100%."
          : "Confira abaixo e clique em imprimir. No papel, use folha A4."}
      </span>
      {alternavel && (
        <div className="flex gap-1">
          <a href={link({ formato: "a4" })} className={opcao(!termica)}>
            <FileText className="size-4" aria-hidden /> Folha A4
          </a>
          <a href={link({ formato: "termica" })} className={opcao(termica)}>
            <Receipt className="size-4" aria-hidden /> Térmica 80 mm
          </a>
        </div>
      )}
      {termica && recibo && (
        <div className="flex gap-1">
          <a href={link({ formato: "termica", vias: "1" })} className={opcao(params.get("vias") !== "2")}>
            1 via
          </a>
          <a href={link({ formato: "termica", vias: "2" })} className={opcao(params.get("vias") === "2")}>
            2 vias
          </a>
        </div>
      )}
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-base font-semibold hover:bg-blue-700"
      >
        <Printer className="size-5" aria-hidden /> Imprimir
      </button>
      <button
        onClick={() => window.close()}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2.5 text-base hover:bg-slate-800"
      >
        <X className="size-5" aria-hidden /> Fechar
      </button>
    </div>
  );
}
