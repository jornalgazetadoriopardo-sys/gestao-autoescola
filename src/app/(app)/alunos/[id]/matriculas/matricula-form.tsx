"use client";

import { useState } from "react";
import { Banknote, BookOpen, CreditCard, QrCode, ScrollText, type LucideIcon } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Opcoes } from "@/components/opcoes";
import { Campo, Cartao, Input, Select } from "@/components/ui";
import { CATEGORIAS, formatarData, formatarMoeda, lerMoeda, lerPercentual } from "@/lib/format";
import { FORMAS_ENTRADA, FORMAS_MATRICULA } from "@/lib/pagamentos";
import { CURSOS_TEORICOS, TIPOS_PROCESSO } from "@/lib/etapas";
import { gerarParcelas } from "@/lib/parcelas";
import { criarMatricula } from "./actions";

const ICONES_FORMA: Record<string, LucideIcon> = {
  carne: ScrollText,
  cartao: CreditCard,
  pix: QrCode,
  dinheiro: Banknote,
};

export function MatriculaForm({ alunoId, categoria, hoje }: { alunoId: number; categoria: string; hoje: string }) {
  const [forma, setForma] = useState("carne");
  const [valor, setValor] = useState("");
  const [qtdParcelas, setQtdParcelas] = useState("1");
  const [vencimento, setVencimento] = useState(hoje);
  const [juros, setJuros] = useState("");
  const [processo, setProcesso] = useState("primeira");
  const [temEntrada, setTemEntrada] = useState("nao");
  const [entradaValor, setEntradaValor] = useState("");
  const [entradaForma, setEntradaForma] = useState("dinheiro");
  const [curso, setCurso] = useState("online");

  // Prévia das parcelas com a mesma regra usada ao salvar.
  const total = lerMoeda(valor);
  // Entrada paga na hora; o resto (base) é o que vai para o carnê, cartão, Pix ou dinheiro.
  const entrada = temEntrada === "sim" ? (lerMoeda(entradaValor) ?? 0) : 0;
  const base = total === null ? null : Math.max(total - entrada, 0);
  const n = Number(qtdParcelas);
  const jurosBp = n > 1 ? lerPercentual(juros) : 0;
  const previa =
    forma === "carne" && base && jurosBp !== null && n >= 1 && n <= 24 && /^\d{4}-\d{2}-\d{2}$/.test(vencimento)
      ? gerarParcelas(base, n, new Date(`${vencimento}T00:00:00Z`), jurosBp)
      : [];
  const totalParcelado = previa.reduce((s, p) => s + p.valorCentavos, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,44rem)_minmax(0,1fr)]">
      <Cartao>
        <FormAcao acao={criarMatricula.bind(null, alunoId)} textoBotao="Criar matrícula">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="size-6 text-blue-600" aria-hidden /> 1. O que foi contratado
          </h2>
          <Opcoes
            nome="tipoProcesso"
            legenda="Tipo de processo"
            opcoes={TIPOS_PROCESSO}
            inicial={processo}
            aoMudar={(v) => {
              setProcesso(v);
              if (v === "adicao") setCurso("dispensado");
            }}
          />
          <Opcoes
            key={processo === "adicao" ? "adicao" : "outro"}
            nome="cursoTeorico"
            legenda="Curso teórico"
            opcoes={CURSOS_TEORICOS}
            inicial={curso}
            aoMudar={setCurso}
            colunas="sm:grid-cols-3"
          />
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
            Regras novas (Resolução Contran 1.020/2025): o curso teórico pode ser feito grátis no app CNH do Brasil e o
            mínimo de aulas práticas caiu de 20 para 2. Os exames e taxas do Detran continuam obrigatórios e entram
            sozinhos na lista do aluno.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo label="Categoria">
              <Select name="categoria" defaultValue={categoria}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Campo>
            <Campo label="Aulas práticas">
              <Input name="qtdPraticas" type="number" min={0} required defaultValue={0} />
            </Campo>
            {curso === "autoescola" ? (
              <Campo label="Aulas teóricas">
                <Input name="qtdTeoricas" type="number" min={0} required defaultValue={0} />
              </Campo>
            ) : (
              <input type="hidden" name="qtdTeoricas" value="0" />
            )}
            <Campo label="Valor total (R$)" className="sm:col-span-3">
              <Input
                name="valorTotal"
                inputMode="decimal"
                required
                placeholder="Ex.: 1.500,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="text-lg font-semibold"
              />
            </Campo>
          </div>

          <h2 className="flex items-center gap-2 pt-2 text-lg font-semibold">
            <CreditCard className="size-6 text-blue-600" aria-hidden /> 2. Como o aluno vai pagar?
          </h2>
          <Opcoes
            nome="temEntrada"
            legenda="Vai dar uma entrada?"
            opcoes={{
              nao: { titulo: "Não", descricao: "Paga o valor todo de uma forma só" },
              sim: { titulo: "Sim, dá uma entrada", descricao: "Paga uma parte agora e o restante de outra forma" },
            }}
            inicial={temEntrada}
            aoMudar={setTemEntrada}
          />
          {temEntrada === "sim" && (
            <div className="grid gap-5 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
              <Campo label="Valor da entrada (R$)">
                <Input
                  name="entradaValor"
                  inputMode="decimal"
                  required
                  placeholder="Ex.: 300,00"
                  value={entradaValor}
                  onChange={(e) => setEntradaValor(e.target.value)}
                />
              </Campo>
              <Campo label="Entrada paga em">
                <Select name="entradaForma" value={entradaForma} onChange={(e) => setEntradaForma(e.target.value)}>
                  {Object.entries(FORMAS_ENTRADA).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Campo>
              {entradaForma === "cartao" && (
                <Campo label="No cartão em">
                  <Select name="entradaVezes" defaultValue="1">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((i) => (
                      <option key={i} value={i}>
                        {i === 1 ? "À vista / débito" : `${i}x`}
                      </option>
                    ))}
                  </Select>
                </Campo>
              )}
            </div>
          )}
          {temEntrada === "sim" && (
            <p className="text-base font-medium text-slate-800">
              E o restante{base !== null && entrada > 0 ? ` (${formatarMoeda(base)})` : ""}, como vai ser pago?
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(FORMAS_MATRICULA).map(([id, f]) => {
              const Icone = ICONES_FORMA[id];
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
                <Select name="qtdParcelas" value={qtdParcelas} onChange={(e) => setQtdParcelas(e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => (
                    <option key={i} value={i}>
                      {i === 1 ? "1 parcela" : `${i} parcelas`}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Campo label="Juros ao mês (%)" ajuda="Deixe vazio se não houver.">
                <Input
                  name="jurosMes"
                  inputMode="decimal"
                  placeholder="0"
                  disabled={n === 1}
                  value={n === 1 ? "" : juros}
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
              <Campo
                label="Parcelado no cartão em"
                ajuda="Só para registro. A autoescola recebe pela operadora do cartão."
              >
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
        {entrada > 0 && (
          <div className="mb-3 flex justify-between rounded-lg bg-green-50 px-3 py-2 text-base">
            <span>Entrada ({FORMAS_ENTRADA[entradaForma]}) — paga hoje</span>
            <span className="font-semibold">{formatarMoeda(entrada)}</span>
          </div>
        )}
        {forma !== "carne" ? (
          <p className="text-base text-slate-700">
            {total ? (
              <>
                <span className="font-semibold">{formatarMoeda(base ?? 0)}</span>
                {entrada > 0 ? " de restante" : ""} pago por {FORMAS_MATRICULA[forma].titulo.toLowerCase()}. A matrícula
                já fica <b>quitada</b>.
              </>
            ) : (
              "Informe o valor total."
            )}
          </p>
        ) : previa.length === 0 ? (
          <p className="text-base text-slate-500">
            {jurosBp === null
              ? "Juros inválido. Use o formato 1,99."
              : total === 0
                ? "Matrícula sem valor: nenhuma parcela será gerada."
                : "Informe o valor total para ver as parcelas."}
          </p>
        ) : (
          <>
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
            {base !== null && totalParcelado !== base && (
              <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-base">
                <div className="flex justify-between">
                  <span>Juros</span>
                  <span>{formatarMoeda(totalParcelado - (base ?? 0))}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total a pagar</span>
                  <span>{formatarMoeda(totalParcelado)}</span>
                </div>
              </div>
            )}
            <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              Depois de salvar, use o botão <b>Imprimir carnê</b> na ficha do aluno.
            </p>
          </>
        )}
      </Cartao>
    </div>
  );
}
