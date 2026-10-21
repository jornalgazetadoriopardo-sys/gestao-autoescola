"use client";

import { useState } from "react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input, Select } from "@/components/ui";
import { CATEGORIAS, formatarData, formatarMoeda, lerMoeda } from "@/lib/format";
import { gerarParcelas } from "@/lib/parcelas";
import { criarMatricula } from "./actions";

export function MatriculaForm({ alunoId, categoria, hoje }: { alunoId: number; categoria: string; hoje: string }) {
  const [valor, setValor] = useState("");
  const [qtdParcelas, setQtdParcelas] = useState("1");
  const [vencimento, setVencimento] = useState(hoje);

  // Prévia das parcelas com a mesma regra usada ao salvar.
  const total = lerMoeda(valor);
  const n = Number(qtdParcelas);
  const previa =
    total && n >= 1 && n <= 24 && /^\d{4}-\d{2}-\d{2}$/.test(vencimento)
      ? gerarParcelas(total, n, new Date(`${vencimento}T00:00:00Z`))
      : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,40rem)_1fr]">
      <Cartao>
        <FormAcao acao={criarMatricula.bind(null, alunoId)} textoBotao="Criar matrícula">
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label="Categoria *">
              <Select name="categoria" defaultValue={categoria}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Campo>
            <Campo label="Aulas práticas *">
              <Input name="qtdPraticas" type="number" min={0} required defaultValue={0} />
            </Campo>
            <Campo label="Aulas teóricas *">
              <Input name="qtdTeoricas" type="number" min={0} required defaultValue={0} />
            </Campo>
            <Campo label="Valor total (R$) *">
              <Input
                name="valorTotal"
                inputMode="decimal"
                required
                placeholder="1.500,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </Campo>
            <Campo label="Parcelas *">
              <Select name="qtdParcelas" value={qtdParcelas} onChange={(e) => setQtdParcelas(e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => (
                  <option key={i} value={i}>
                    {i === 1 ? "À vista" : `${i}x`}
                  </option>
                ))}
              </Select>
            </Campo>
            <Campo label="1º vencimento *">
              <Input
                name="primeiroVencimento"
                type="date"
                required
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
              />
            </Campo>
          </div>
        </FormAcao>
      </Cartao>

      <Cartao>
        <h2 className="mb-3 font-semibold">Parcelas que serão geradas</h2>
        {previa.length === 0 ? (
          <p className="text-sm text-slate-500">
            {total === 0 ? "Matrícula sem valor: nenhuma parcela será gerada." : "Informe o valor total."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {previa.map((p) => (
              <li key={p.numero} className="flex justify-between py-1.5">
                <span>
                  {p.numero}ª — {formatarData(p.vencimento)}
                </span>
                <span className="font-medium">{formatarMoeda(p.valorCentavos)}</span>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
