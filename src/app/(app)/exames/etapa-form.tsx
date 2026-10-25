"use client";

import { useState } from "react";
import { FormAcao } from "@/components/form-acao";
import { Opcoes } from "@/components/opcoes";
import { Campo, Input, Select, Textarea } from "@/components/ui";
import { FORMAS_PAGAMENTO } from "@/lib/format";
import { TIPOS_ETAPA } from "@/lib/etapas";
import { salvarEtapa } from "./actions";

export type EtapaInicial = {
  id: number | null;
  tipo: string;
  descricao: string;
  categoria: string;
  data: string;
  hora: string;
  local: string;
  veiculoId: string;
  instrutorId: string;
  resultado: string;
  valor: string;
  cobranca: string;
  pagoEm: string;
  forma: string;
  obs: string;
};

export type OpcaoSimples = { id: number; nome: string };

const COBRANCA = {
  aluno: { titulo: "Aluno paga direto", descricao: "Na clínica, no laboratório ou na guia do Detran" },
  autoescola: { titulo: "Autoescola cobra do aluno", descricao: "A autoescola recebe e repassa" },
};

export function EtapaForm({
  matriculaId,
  inicial,
  hoje,
  voltar,
  veiculos,
  instrutores,
}: {
  matriculaId: number;
  inicial: EtapaInicial;
  hoje: string;
  voltar: string;
  veiculos: OpcaoSimples[];
  instrutores: OpcaoSimples[];
}) {
  const [tipo, setTipo] = useState(inicial.tipo);
  const [cobranca, setCobranca] = useState(inicial.cobranca);
  const [pago, setPago] = useState(Boolean(inicial.pagoEm));
  const resultados = TIPOS_ETAPA[tipo]?.resultados ?? { ok: "Concluído" };
  const opcoesResultado: Record<string, { titulo: string }> = {
    "": { titulo: "Ainda não" },
    ok: { titulo: resultados.ok },
    ...(resultados.falhou ? { falhou: { titulo: resultados.falhou } } : {}),
  };

  return (
    <FormAcao
      acao={salvarEtapa.bind(null, inicial.id, matriculaId)}
      textoBotao={inicial.id ? "Salvar alterações" : "Adicionar"}
    >
      <input type="hidden" name="voltar" value={voltar} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Tipo">
          <Select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(TIPOS_ETAPA).map(([id, t]) => (
              <option key={id} value={id}>
                {t.titulo}
              </option>
            ))}
          </Select>
        </Campo>
        {tipo === "exame_pratico" ? (
          <Campo label="Categoria da prova">
            <Select name="categoria" defaultValue={inicial.categoria || "B"}>
              {["A", "B", "C", "D", "E"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Campo>
        ) : (
          <div className="hidden sm:block" />
        )}
        <Campo label="Descrição" ajuda="Opcional. Ex.: Taxa da 2ª via, exame de vista na clínica X.">
          <Input name="descricao" defaultValue={inicial.descricao} placeholder={TIPOS_ETAPA[tipo]?.titulo} />
        </Campo>
        <Campo label="Data (agendada ou realizada)">
          <Input name="data" type="date" defaultValue={inicial.data} />
        </Campo>
      </div>

      {(tipo === "exame_pratico" || tipo === "exame_teorico") && (
        <fieldset className="grid gap-5 rounded-xl border border-violet-200 bg-violet-50/50 p-4 sm:grid-cols-2">
          <legend className="px-1 text-base font-semibold text-violet-900">Agendamento da prova</legend>
          <Campo label="Horário" ajuda="Com horário, a prova aparece na agenda e bloqueia aulas nesse horário.">
            <Input name="hora" type="time" defaultValue={inicial.hora} />
          </Campo>
          <Campo label="Local (opcional)">
            <Input name="local" defaultValue={inicial.local} placeholder="Ex.: Pátio do Detran, Ciretran" />
          </Campo>
          <Campo label="Instrutor que acompanha">
            <Select name="instrutorId" defaultValue={inicial.instrutorId}>
              <option value="">Nenhum</option>
              {instrutores.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </Select>
          </Campo>
          {tipo === "exame_pratico" && (
            <Campo label="Veículo da prova">
              <Select name="veiculoId" defaultValue={inicial.veiculoId}>
                <option value="">Nenhum</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </Select>
            </Campo>
          )}
        </fieldset>
      )}

      <Opcoes
        key={tipo}
        nome="resultado"
        legenda="Resultado"
        opcoes={opcoesResultado}
        inicial={inicial.resultado in opcoesResultado ? inicial.resultado : ""}
        colunas="grid-cols-3"
      />

      <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
        <Campo label="Valor (R$)" ajuda="Opcional.">
          <Input name="valor" inputMode="decimal" defaultValue={inicial.valor} placeholder="Ex.: 120,00" />
        </Campo>
        <Opcoes nome="cobranca" legenda="Quem paga" opcoes={COBRANCA} inicial={cobranca} aoMudar={setCobranca} />
      </div>

      <label className="flex items-center gap-3 text-base font-medium">
        <input type="checkbox" checked={pago} onChange={(e) => setPago(e.target.checked)} className="size-5" />
        Já foi pago
      </label>
      {pago && (
        <div className="grid gap-5 rounded-xl border border-green-200 bg-green-50/50 p-4 sm:grid-cols-2">
          <Campo label="Pago em">
            <Input name="pagoEm" type="date" required defaultValue={inicial.pagoEm || hoje} />
          </Campo>
          {cobranca === "autoescola" && (
            <Campo label="Forma de pagamento">
              <Select name="forma" defaultValue={inicial.forma || "pix"}>
                {Object.entries(FORMAS_PAGAMENTO).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </Campo>
          )}
        </div>
      )}

      <Campo label="Observação (opcional)">
        <Textarea name="obs" rows={2} defaultValue={inicial.obs} placeholder="Ex.: horário, local, nº da guia" />
      </Campo>
    </FormAcao>
  );
}
