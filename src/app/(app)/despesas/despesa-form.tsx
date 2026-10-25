"use client";

import { useState } from "react";
import { Banknote, CalendarClock, CircleCheck, CreditCard, Landmark, QrCode, type LucideIcon } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { ICONES_DESPESA } from "@/components/icones-despesa";
import { Campo, Input, Select, Textarea } from "@/components/ui";
import { FORMAS_PAGAMENTO } from "@/lib/format";
import { CATEGORIAS_DESPESA, SUGESTOES_DESPESA } from "@/lib/despesas";
import { salvarDespesa } from "./actions";

const ICONES_FORMA: Record<string, LucideIcon> = {
  dinheiro: Banknote,
  pix: QrCode,
  cartao: CreditCard,
  boleto: Landmark,
};

export type DespesaInicial = {
  id: number | null;
  categoria: string;
  descricao: string;
  favorecido: string;
  valor: string;
  vencimento: string;
  paga: boolean;
  pagoEm: string;
  forma: string;
  veiculoId: string;
  litros: string;
  km: string;
  obs: string;
};

export function DespesaForm({
  inicial,
  hoje,
  pessoas,
  veiculos,
  voltar,
}: {
  inicial: DespesaInicial;
  hoje: string;
  pessoas: string[];
  veiculos: { id: number; texto: string }[];
  voltar: string;
}) {
  const [categoria, setCategoria] = useState(inicial.categoria);
  const [paga, setPaga] = useState(inicial.paga);
  const [forma, setForma] = useState(inicial.forma || "pix");
  const comPessoa = ["folha", "vale", "retirada"].includes(categoria);

  return (
    <FormAcao
      acao={salvarDespesa.bind(null, inicial.id)}
      textoBotao={inicial.id ? "Salvar alterações" : "Lançar despesa"}
    >
      <input type="hidden" name="voltar" value={voltar} />

      <fieldset>
        <legend className="mb-2 text-base font-medium text-slate-800">Tipo de despesa</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(CATEGORIAS_DESPESA).map(([id, c]) => {
            const Icone = ICONES_DESPESA[id];
            const marcado = categoria === id;
            return (
              <label
                key={id}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition ${
                  marcado ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="categoria"
                  value={id}
                  checked={marcado}
                  onChange={() => setCategoria(id)}
                  className="sr-only"
                />
                <Icone className={`size-8 ${marcado ? "text-blue-700" : "text-slate-400"}`} aria-hidden />
                <span className="text-sm font-semibold leading-tight">{c.titulo}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {categoria && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo label="Descrição" ajuda="Opcional. Se ficar vazio, usa o tipo da despesa.">
              <Input
                name="descricao"
                defaultValue={inicial.descricao}
                list="sugestoes-despesa"
                placeholder={`Ex.: ${SUGESTOES_DESPESA[categoria]?.[0] ?? ""}`}
              />
              <datalist id="sugestoes-despesa">
                {(SUGESTOES_DESPESA[categoria] ?? []).map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Campo>
            <Campo
              label={comPessoa ? "Para quem (funcionário ou sócio)" : "Pago a (opcional)"}
              ajuda={comPessoa ? "Aparece no relatório de despesas por pessoa." : "Ex.: posto, imobiliária, empresa."}
            >
              <Input name="favorecido" defaultValue={inicial.favorecido} list="pessoas-despesa" required={comPessoa} />
              <datalist id="pessoas-despesa">
                {pessoas.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </Campo>
            <Campo label="Valor (R$)">
              <Input
                name="valor"
                inputMode="decimal"
                required
                defaultValue={inicial.valor}
                placeholder="Ex.: 150,00"
                className="text-lg font-semibold"
              />
            </Campo>
            <Campo label={paga ? "Data da despesa" : "Vencimento"}>
              <Input name="vencimento" type="date" required defaultValue={inicial.vencimento} />
            </Campo>
          </div>

          {categoria === "combustivel" && (
            <div className="grid gap-5 sm:grid-cols-3">
              <Campo label="Veículo">
                <Select name="veiculoId" defaultValue={inicial.veiculoId}>
                  <option value="">Nenhum / vários</option>
                  {veiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.texto}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Campo label="Litros (opcional)">
                <Input name="litros" inputMode="decimal" defaultValue={inicial.litros} placeholder="Ex.: 35,5" />
              </Campo>
              <Campo label="Km do painel (opcional)">
                <Input name="km" inputMode="numeric" defaultValue={inicial.km} placeholder="Ex.: 45000" />
              </Campo>
            </div>
          )}

          <fieldset>
            <legend className="mb-2 text-base font-medium text-slate-800">Situação</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                { valor: true, titulo: "Já está paga", icone: CircleCheck, cor: "green" },
                { valor: false, titulo: "Ainda vou pagar", icone: CalendarClock, cor: "amber" },
              ].map((o) => {
                const marcado = paga === o.valor;
                return (
                  <label
                    key={o.titulo}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition ${
                      marcado
                        ? o.cor === "green"
                          ? "border-green-600 bg-green-50"
                          : "border-amber-500 bg-amber-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="situacao"
                      value={o.valor ? "paga" : "apagar"}
                      checked={marcado}
                      onChange={() => setPaga(o.valor)}
                      className="sr-only"
                    />
                    <o.icone
                      className={`size-7 ${marcado ? (o.cor === "green" ? "text-green-700" : "text-amber-600") : "text-slate-400"}`}
                      aria-hidden
                    />
                    <span className="text-base font-semibold">{o.titulo}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {paga && (
            <div className="space-y-5 rounded-xl border border-green-200 bg-green-50/50 p-4">
              <fieldset>
                <legend className="mb-2 text-base font-medium text-slate-800">Forma de pagamento</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(FORMAS_PAGAMENTO).map(([id, label]) => {
                    const Icone = ICONES_FORMA[id];
                    const marcado = forma === id;
                    return (
                      <label
                        key={id}
                        className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 bg-white p-3 text-center transition ${
                          marcado ? "border-green-600" : "border-slate-200 hover:border-slate-300"
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
                        <Icone className={`size-7 ${marcado ? "text-green-700" : "text-slate-400"}`} aria-hidden />
                        <span className="text-sm font-semibold">{id === "boleto" ? "Boleto / Transf." : label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <Campo label="Data do pagamento" className="sm:max-w-xs">
                <Input name="pagoEm" type="date" required defaultValue={inicial.pagoEm || hoje} />
              </Campo>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {!inicial.id && (
              <Campo label="Repetir todo mês?" ajuda="Para salário, aluguel, contas fixas. As próximas ficam a pagar.">
                <Select name="repetir" defaultValue="1">
                  <option value="1">Não, só esta vez</option>
                  {[2, 3, 4, 6, 12].map((n) => (
                    <option key={n} value={n}>
                      Sim, por {n} meses
                    </option>
                  ))}
                </Select>
              </Campo>
            )}
            <Campo label="Observação (opcional)" className={inicial.id ? "sm:col-span-2" : ""}>
              <Textarea name="obs" rows={2} defaultValue={inicial.obs} />
            </Campo>
          </div>
        </>
      )}
    </FormAcao>
  );
}
