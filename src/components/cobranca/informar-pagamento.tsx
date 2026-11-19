"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Input } from "@/components/ui";
import { informarPagamento } from "@/app/(app)/mensalidade-actions";

// "Já paguei": abre o formulário para anexar o comprovante (opcional) e avisar.
export function InformarPagamento({ mensalidadeId, aberto = false }: { mensalidadeId: number; aberto?: boolean }) {
  const [mostrar, setMostrar] = useState(aberto);
  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-current/30 bg-white/70 px-3 py-1.5 text-sm font-semibold hover:bg-white"
      >
        <BadgeCheck className="size-4" aria-hidden /> Já paguei
      </button>
    );
  }
  return (
    <div className="w-full max-w-md rounded-xl bg-white p-4 text-slate-900 shadow-sm">
      <FormAcao acao={informarPagamento.bind(null, mensalidadeId)} textoBotao="Avisar que paguei">
        <Campo label="Comprovante (opcional)" ajuda="Foto ou PDF do comprovante. Ajuda a confirmar mais rápido.">
          <Input name="comprovante" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
        </Campo>
        <Campo label="Observação (opcional)">
          <Input name="obs" maxLength={300} placeholder="Ex.: paguei pelo Pix hoje às 10h" />
        </Campo>
      </FormAcao>
    </div>
  );
}
