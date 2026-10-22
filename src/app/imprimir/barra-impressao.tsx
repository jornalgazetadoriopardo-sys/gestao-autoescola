"use client";

import { Printer, X } from "lucide-react";

export function BarraImpressao() {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-3 bg-slate-900 px-4 py-3 text-white print:hidden">
      <span className="text-base">Confira abaixo e clique em imprimir. No papel, use folha A4.</span>
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
