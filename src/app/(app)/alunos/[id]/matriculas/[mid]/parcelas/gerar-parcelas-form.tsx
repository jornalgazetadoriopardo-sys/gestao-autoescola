"use client";

import { useState } from "react";
import { Banknote, CreditCard, QrCode, ScrollText, type LucideIcon } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input, Select } from "@/components/ui";
import { formatarData, formatarMoeda, lerPercentual } from "@/lib/format";
import { FORMAS_MATRICULA } from "@/lib/pagamentos";
import { gerarParcelas } from "@/lib/parcelas";
import { gerarParcelasMatricula } from "../../actions";

const ICONES: Record<string, LucideIcon> = { carne: ScrollText, cartao: CreditCard, pix: QrCode, dinheiro: Banknote };

export function GerarParcelasForm({
  matriculaId,
  valor,
  hoje,
  primeira,
}: {
  matriculaId: number;
  valor: number;
  hoje: string;
  // A matrícula ainda não tem nenhuma parcela (só então pode ter juros).
  primeira: boolean;
}) {
  const [forma, setForma] = useState("carne");
  const [qtd, setQtd] = useState("1");
  const [vencimento, setVencimento] = useState(hoje);
  const [juros, setJuros] = useState("");
  const n = Number(qtd);
  const jurosBp = n > 1 && primeira ? lerPercentual(juros) : 0;
  const previa =
    forma === "carne" && jurosBp !== null && /^\d{4}-\d{2}-\d{2}$/.test(vencimento)
      ? gerarParcelas(valor, n, new Date(`${vencimento}T00:00:00Z`), jurosBp)
      : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,40rem)_minmax(0,26rem)]">
      <Cartao>
        <FormAcao acao={gerarParcelasMatricula.bind(null, matriculaId)} textoBotao="Gerar parcelas">
          <p className="text-base text-slate-700">
            O valor contratado tem <b>{formatarMoeda(valor)}</b> sem parcelas. Escolha como o aluno vai pagar:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(FORMAS_MATRICULA).map(([id, f]) => {
              const Icone = ICONES[id];
              const marcado = forma === id;
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                    marcado ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="formaPagamento"
                    value={id}
                    checked={marcado}
                    onChange={() => setForma(id)}
                    className="sr-only"
                  />
                  <Icone className={`size-8 shrink-0 ${marcado ? "text-blue-600" : "text-slate-400"}`} aria-hidden />
                  <span>
                    <span className="block text-base font-semibold text-slate-900">{f.titulo}</span>
                    <span className="block text-sm text-slate-600">{f.descricao}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {forma === "carne" && (
            <div className="grid gap-5 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
              <Campo label="Parcelas">
                <Select name="qtdParcelas" value={qtd} onChange={(e) => setQtd(e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => (
                    <option key={i} value={i}>
                      {i === 1 ? "1 parcela" : `${i} parcelas`}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Campo label="Juros ao mês (%)" ajuda={primeira ? "Deixe vazio se não houver." : "Sem juros."}>
                <Input
                  name="jurosMes"
                  inputMode="decimal"
                  placeholder="0"
                  disabled={n === 1 || !primeira}
                  value={n === 1 || !primeira ? "" : juros}
                  onChange={(e) => setJuros(e.target.value)}
                />
              </Campo>
              <Campo label="1º vencimento">
                <Input
                  name="primeiroVencimento"
                  type="date"
                  required
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                />
              </Campo>
            </div>
          )}

          {forma === "cartao" && (
            <div className="rounded-xl bg-slate-50 p-4">
              <Campo label="Parcelado no cartão em" ajuda="Só para registro.">
                <Select name="vezesCartao" defaultValue="1" className="max-w-56">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((i) => (
                    <option key={i} value={i}>
                      {i === 1 ? "À vista / débito" : `${i}x`}
                    </option>
                  ))}
                </Select>
              </Campo>
            </div>
          )}
        </FormAcao>
      </Cartao>

      <Cartao className="h-fit">
        <h2 className="mb-3 text-lg font-semibold">Resumo</h2>
        {forma !== "carne" ? (
          <p className="text-base text-slate-700">
            <b>{formatarMoeda(valor)}</b> pago por {FORMAS_MATRICULA[forma].titulo.toLowerCase()}. Fica <b>quitado</b>{" "}
            hoje.
          </p>
        ) : previa.length === 0 ? (
          <p className="text-base text-slate-500">Juros inválido. Use o formato 1,99.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-base">
            {previa.map((p) => (
              <li key={p.numero} className="flex justify-between py-2">
                <span>
                  {p.numero}ª parcela — {formatarData(p.vencimento)}
                </span>
                <span className="font-semibold">{formatarMoeda(p.valorCentavos)}</span>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
