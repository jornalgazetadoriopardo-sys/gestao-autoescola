"use client";

import { useState } from "react";
import { Banknote, CreditCard, Landmark, QrCode, type LucideIcon } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Input, Textarea } from "@/components/ui";
import { FORMAS_PAGAMENTO } from "@/lib/format";
import { receberParcela } from "../../actions";

const ICONES: Record<string, LucideIcon> = { dinheiro: Banknote, pix: QrCode, cartao: CreditCard, boleto: Landmark };

export function ReceberForm({
  parcelaId,
  valor,
  hoje,
  voltar,
}: {
  parcelaId: number;
  valor: string;
  hoje: string;
  voltar: string;
}) {
  const [forma, setForma] = useState("dinheiro");
  return (
    <FormAcao acao={receberParcela.bind(null, parcelaId)} textoBotao="Confirmar pagamento" varianteBotao="sucesso">
      <input type="hidden" name="voltar" value={voltar} />
      <fieldset>
        <legend className="mb-2 text-base font-medium text-slate-800">Forma de pagamento</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(FORMAS_PAGAMENTO).map(([id, label]) => {
            const Icone = ICONES[id];
            const marcado = forma === id;
            return (
              <label
                key={id}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition ${
                  marcado ? "border-green-600 bg-green-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="forma"
                  value={id}
                  checked={marcado}
                  onChange={() => setForma(id)}
                  className="sr-only"
                />
                <Icone className={`size-9 ${marcado ? "text-green-700" : "text-slate-400"}`} aria-hidden />
                <span className="text-base font-semibold">{id === "boleto" ? "Boleto / Transf." : label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Data do pagamento">
          <Input name="data" type="date" required defaultValue={hoje} />
        </Campo>
        <Campo label="Valor recebido (R$)" ajuda="Altere se houve multa ou desconto.">
          <Input name="valor" inputMode="decimal" required defaultValue={valor} className="text-lg font-semibold" />
        </Campo>
        <Campo label="Observação (opcional)" className="sm:col-span-2">
          <Textarea name="obs" rows={2} />
        </Campo>
      </div>
    </FormAcao>
  );
}
