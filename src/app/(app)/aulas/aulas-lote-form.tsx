"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Repeat,
  Sparkles,
  Trash2,
  TriangleAlert,
  Users,
  Wand2,
} from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Botao, Campo, Cartao, Input, Select, Textarea } from "@/components/ui";
import { DURACOES, somarDias } from "@/lib/aulas";
import {
  horariosDoExpediente,
  instante,
  opcoesDeHorario,
  type Expediente,
  type Ocupado,
  type Pedido,
} from "@/lib/disponibilidade";
import { agendarVarias } from "./actions";
import type { OpcaoMatricula } from "./aula-form";
import { useOcupados } from "./use-ocupados";

type Opcao = { id: number; nome: string; categorias: string };
type Item = { chave: number; data: string; hora: string; instrutorId: string };

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function diaDaSemana(iso: string) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

function formatarCurto(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${SEMANA[diaDaSemana(iso)]}, ${d}/${m}/${a}`;
}

let proximaChave = 1;

export function AulasLoteForm({
  matriculas,
  instrutores,
  veiculos,
  matriculaInicial,
  hoje,
  expediente,
}: {
  matriculas: OpcaoMatricula[];
  instrutores: Opcao[];
  veiculos: Opcao[];
  matriculaInicial?: number;
  hoje: string;
  expediente: Expediente;
}) {
  const [matriculaId, setMatriculaId] = useState(String(matriculaInicial ?? ""));
  const matricula = matriculas.find((m) => String(m.id) === matriculaId);
  const [tipo, setTipo] = useState(matricula && matricula.restantes.pratica === 0 ? "teorica" : "pratica");
  const [duracao, setDuracao] = useState("50");
  const [horaPadrao, setHoraPadrao] = useState(expediente.horaInicio);
  const [instrutorPadrao, setInstrutorPadrao] = useState("");
  const [veiculoId, setVeiculoId] = useState("");
  const [itens, setItens] = useState<Item[]>([]);
  const [mes, setMes] = useState(hoje.slice(0, 7));

  // Preenchimento rápido: dias da semana a partir de uma data.
  const [diasRep, setDiasRep] = useState<number[]>([]);
  const [aPartir, setAPartir] = useState(hoje);
  const [qtdRep, setQtdRep] = useState("");

  const veiculosCompativeis = matricula
    ? veiculos.filter((v) => matricula.categoria.includes(v.categorias))
    : veiculos;
  const restantes = matricula ? matricula.restantes[tipo as "pratica" | "teorica"] : null;
  const ordenados = useMemo(
    () => [...itens].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)),
    [itens],
  );

  // Dias do mês visível, começando no domingo.
  const [ano, mesNum] = mes.split("-").map(Number);
  const primeiro = `${mes}-01`;
  const diasNoMes = new Date(Date.UTC(ano, mesNum, 0)).getUTCDate();
  const vazios = diaDaSemana(primeiro);
  const dias = Array.from({ length: diasNoMes }, (_, i) => somarDias(primeiro, i));

  function mudarMes(delta: number) {
    const d = new Date(Date.UTC(ano, mesNum - 1 + delta, 1));
    setMes(d.toISOString().slice(0, 7));
  }

  function alternarDia(iso: string) {
    setItens((atual) =>
      atual.some((i) => i.data === iso)
        ? atual.filter((i) => i.data !== iso)
        : [...atual, { chave: proximaChave++, data: iso, hora: horaPadrao, instrutorId: instrutorPadrao }],
    );
  }

  function preencher() {
    const qtd = Number(qtdRep) || restantes || 0;
    if (diasRep.length === 0 || qtd <= 0) return;
    const novos: Item[] = [];
    const existentes = new Set(itens.map((i) => `${i.data} ${i.hora}`));
    for (let i = 0; i < 400 && novos.length < qtd; i++) {
      const iso = somarDias(aPartir, i);
      if (!diasRep.includes(diaDaSemana(iso)) || existentes.has(`${iso} ${horaPadrao}`)) continue;
      novos.push({ chave: proximaChave++, data: iso, hora: horaPadrao, instrutorId: instrutorPadrao });
    }
    setItens((atual) => [...atual, ...novos]);
    if (novos[0]) setMes(novos[0].data.slice(0, 7));
  }

  const excede = restantes !== null && itens.length > restantes;
  const semInstrutor = itens.filter((i) => !i.instrutorId).length;

  // Disponibilidade: aulas já marcadas nos dias escolhidos + as outras aulas desta lista.
  const { ocupados, carregando } = useOcupados(itens.map((i) => i.data));
  const pedido = (item: Item): Pedido => ({
    data: item.data,
    duracaoMin: Number(duracao),
    tipo,
    instrutorId: Number(item.instrutorId) || null,
    veiculoId: tipo === "pratica" ? Number(veiculoId) || null : null,
    alunoId: matricula?.alunoId ?? null,
  });
  const comoOcupado = (item: Item): Ocupado => {
    const inicio = instante(item.data, item.hora);
    return {
      id: -item.chave,
      inicio,
      fim: inicio + Number(duracao) * 60_000,
      instrutorId: Number(item.instrutorId) || null,
      veiculoId: tipo === "pratica" ? Number(veiculoId) || null : null,
      alunoId: matricula?.alunoId ?? 0,
      tipo,
      descricao: "outra aula desta lista",
    };
  };
  const ocupadosPara = (item: Item, lista: Item[] = itens) => [
    ...ocupados,
    ...lista.filter((i) => i.chave !== item.chave).map(comoOcupado),
  ];
  const opcoesDo = (item: Item, lista: Item[] = itens) =>
    opcoesDeHorario(pedido(item), ocupadosPara(item, lista), expediente, item.hora);
  const motivoDo = (item: Item) => opcoesDo(item).find((o) => o.hora === item.hora)?.motivo ?? null;
  const prontoParaConferir = Boolean(matricula) && (tipo !== "pratica" || Boolean(veiculoId));
  const conflitos =
    prontoParaConferir && !carregando ? itens.filter((i) => i.instrutorId && motivoDo(i)) : [];

  // Move cada aula com horário ocupado para o primeiro horário livre do mesmo dia
  // (de preferência depois do horário escolhido).
  function ajustarOcupados() {
    let lista = [...itens];
    for (const item of [...lista].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))) {
      const atual = lista.find((i) => i.chave === item.chave)!;
      const opcoes = opcoesDo(atual, lista);
      if (!opcoes.find((o) => o.hora === atual.hora)?.motivo) continue;
      const livre = opcoes.find((o) => !o.motivo && o.hora > atual.hora) ?? opcoes.find((o) => !o.motivo);
      if (livre) lista = lista.map((i) => (i.chave === atual.chave ? { ...i, hora: livre.hora } : i));
    }
    setItens(lista);
  }

  // "+ Horário": outra aula no mesmo dia, no próximo horário livre.
  function outroHorario(item: Item) {
    const novo: Item = {
      chave: proximaChave++,
      data: item.data,
      hora: item.hora,
      instrutorId: item.instrutorId,
    };
    const lista = [...itens, novo];
    const opcoes = opcoesDo(novo, lista);
    const livre = opcoes.find((o) => !o.motivo && o.hora > item.hora) ?? opcoes.find((o) => !o.motivo);
    setItens([...itens, { ...novo, hora: livre?.hora ?? item.hora }]);
  }

  function alterarItem(chave: number, mudanca: Partial<Item>) {
    setItens((atual) => atual.map((i) => (i.chave === chave ? { ...i, ...mudanca } : i)));
  }

  // Trocar o instrutor padrão preenche as aulas que ainda estão sem instrutor.
  function mudarInstrutorPadrao(id: string) {
    setInstrutorPadrao(id);
    if (id) setItens((atual) => atual.map((i) => (i.instrutorId ? i : { ...i, instrutorId: id })));
  }

  return (
    <FormAcao
      acao={agendarVarias}
      textoBotao={itens.length > 1 ? `Agendar as ${itens.length} aulas` : "Agendar aula"}
    >
      <input
        type="hidden"
        name="itens"
        value={JSON.stringify(
          ordenados.map(({ data, hora, instrutorId }) => ({
            data,
            hora,
            instrutorId: Number(instrutorId) || null,
          })),
        )}
      />

      <Cartao>
        <h2 className="mb-4 text-lg font-semibold">1. Aluno, instrutor e veículo</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo label="Aluno / matrícula *" className="sm:col-span-2">
            <Select
              name="matriculaId"
              required
              value={matriculaId}
              onChange={(e) => setMatriculaId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {matriculas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.rotulo}
                </option>
              ))}
            </Select>
            {matricula && (
              <span className="mt-1.5 block text-sm font-medium text-blue-800">
                Restam {matricula.restantes.pratica} aulas práticas e {matricula.restantes.teorica} teóricas
                para agendar.
              </span>
            )}
          </Campo>
          <Campo label="Tipo *">
            <Select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="pratica">Prática</option>
              <option value="teorica">Teórica</option>
            </Select>
          </Campo>
          <Campo
            label="Instrutor padrão"
            ajuda="Vem preenchido em cada aula. Você pode trocar aula por aula na lista."
          >
            <div className="flex gap-2">
              <Select value={instrutorPadrao} onChange={(e) => mudarInstrutorPadrao(e.target.value)}>
                <option value="">Selecione...</option>
                {instrutores.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome} ({i.categorias.replaceAll(",", ", ")})
                  </option>
                ))}
              </Select>
              {instrutorPadrao && itens.some((i) => i.instrutorId !== instrutorPadrao) && (
                <Botao
                  type="button"
                  variante="secundario"
                  tamanho="pequeno"
                  icone={Users}
                  onClick={() =>
                    setItens((atual) => atual.map((i) => ({ ...i, instrutorId: instrutorPadrao })))
                  }
                >
                  Aplicar a todas
                </Botao>
              )}
            </div>
          </Campo>
          {tipo === "pratica" && (
            <Campo label="Veículo *">
              <Select
                name="veiculoId"
                required
                value={veiculoId}
                onChange={(e) => setVeiculoId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {veiculosCompativeis.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </Select>
            </Campo>
          )}
          <Campo label="Duração de cada aula">
            <Select name="duracaoMin" value={duracao} onChange={(e) => setDuracao(e.target.value)}>
              {DURACOES.map((d) => (
                <option key={d} value={d}>
                  {d} minutos
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Horário padrão" ajuda="Usado em cada dia que você clicar no calendário.">
            <Select value={horaPadrao} onChange={(e) => setHoraPadrao(e.target.value)}>
              {horariosDoExpediente(expediente, Number(duracao)).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          </Campo>
        </div>
      </Cartao>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Cartao>
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-6 text-blue-600" aria-hidden /> 2. Clique nos dias das aulas
          </h2>
          <p className="mb-4 text-sm text-slate-600">Clique de novo para desmarcar.</p>

          <div className="mb-3 flex items-center justify-between">
            <Botao
              type="button"
              variante="secundario"
              tamanho="pequeno"
              icone={ChevronLeft}
              onClick={() => mudarMes(-1)}
            >
              Anterior
            </Botao>
            <span className="text-lg font-semibold">
              {MESES[mesNum - 1]} de {ano}
            </span>
            <Botao type="button" variante="secundario" tamanho="pequeno" onClick={() => mudarMes(1)}>
              Próximo <ChevronRight className="size-4" aria-hidden />
            </Botao>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {SEMANA.map((s, i) => (
              <div
                key={s}
                className={`py-1 text-sm font-semibold ${i === 0 ? "text-red-600" : "text-slate-500"}`}
              >
                {s}
              </div>
            ))}
            {Array.from({ length: vazios }, (_, i) => (
              <div key={`v${i}`} />
            ))}
            {dias.map((iso) => {
              const qtd = itens.filter((i) => i.data === iso).length;
              const passado = iso < hoje;
              const domingo = diaDaSemana(iso) === 0;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={passado}
                  onClick={() => alternarDia(iso)}
                  aria-pressed={qtd > 0}
                  aria-label={formatarCurto(iso)}
                  className={`relative aspect-square rounded-lg border-2 text-base font-semibold transition sm:text-lg ${
                    qtd > 0
                      ? "border-blue-600 bg-blue-600 text-white"
                      : passado
                        ? "cursor-not-allowed border-transparent text-slate-300"
                        : `border-slate-200 bg-white hover:border-blue-400 ${domingo ? "text-red-600" : "text-slate-800"}`
                  } ${iso === hoje && qtd === 0 ? "ring-2 ring-amber-400" : ""}`}
                >
                  {Number(iso.slice(8))}
                  {qtd > 1 && (
                    <span className="absolute right-0.5 top-0.5 rounded-full bg-white px-1 text-xs text-blue-700">
                      {qtd}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <summary className="flex cursor-pointer items-center gap-2 text-base font-semibold text-slate-800">
              <Wand2 className="size-5 text-violet-600" aria-hidden /> Preencher automático (repetir toda
              semana)
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <span className="mb-1.5 block text-base font-medium text-slate-800">Nos dias</span>
                <div className="flex flex-wrap gap-2">
                  {SEMANA.map((s, i) => {
                    const marcado = diasRep.includes(i);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={marcado}
                        onClick={() => setDiasRep(marcado ? diasRep.filter((d) => d !== i) : [...diasRep, i])}
                        className={`rounded-lg border-2 px-3 py-2 text-base font-semibold ${
                          marcado ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="A partir de">
                  <Input
                    type="date"
                    value={aPartir}
                    min={hoje}
                    onChange={(e) => setAPartir(e.target.value)}
                  />
                </Campo>
                <Campo label="Quantas aulas">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    placeholder={restantes ? String(restantes) : "10"}
                    value={qtdRep}
                    onChange={(e) => setQtdRep(e.target.value)}
                  />
                </Campo>
              </div>
              <p className="text-sm text-slate-600">
                Usa o horário padrão ({horaPadrao}). Depois você pode ajustar cada dia.
              </p>
              <Botao type="button" variante="secundario" icone={Repeat} onClick={preencher}>
                Preencher datas
              </Botao>
            </div>
          </details>
        </Cartao>

        <Cartao>
          <h2 className="mb-1 text-lg font-semibold">3. Confira os horários</h2>
          <p className={`mb-4 text-base ${excede ? "font-semibold text-red-700" : "text-slate-600"}`}>
            {itens.length === 0
              ? "Nenhuma data escolhida ainda."
              : `${itens.length} ${itens.length === 1 ? "aula escolhida" : "aulas escolhidas"}`}
            {restantes !== null && ` · restam ${restantes} para agendar`}
            {excede && " — tire algumas datas"}
            {semInstrutor > 0 && (
              <span className="block font-semibold text-red-700">
                {semInstrutor === 1 ? "1 aula está" : `${semInstrutor} aulas estão`} sem instrutor.
              </span>
            )}
            {carregando && <span className="block text-sm text-slate-500">Conferindo a agenda...</span>}
            {!prontoParaConferir && itens.length > 0 && (
              <span className="block text-sm text-slate-500">
                Escolha o aluno{tipo === "pratica" ? " e o veículo" : ""} para conferir os horários livres.
              </span>
            )}
          </p>
          {conflitos.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
              <TriangleAlert className="size-6 shrink-0" aria-hidden />
              <span className="flex-1 text-base font-semibold">
                {conflitos.length === 1 ? "1 aula está" : `${conflitos.length} aulas estão`} em horário
                ocupado.
              </span>
              <Botao
                type="button"
                variante="secundario"
                tamanho="pequeno"
                icone={Sparkles}
                onClick={ajustarOcupados}
              >
                Mudar para horários livres
              </Botao>
            </div>
          )}
          {ordenados.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {ordenados.map((item) => {
                const opcoes = prontoParaConferir ? opcoesDo(item) : [];
                const motivo = prontoParaConferir && !carregando && item.instrutorId ? motivoDo(item) : null;
                return (
                  <li key={item.chave} className="space-y-2 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-base font-semibold">{formatarCurto(item.data)}</span>
                      <Botao
                        type="button"
                        variante="secundario"
                        tamanho="pequeno"
                        icone={Plus}
                        title="Outra aula no mesmo dia"
                        onClick={() => outroHorario(item)}
                      >
                        Horário
                      </Botao>
                      <button
                        type="button"
                        onClick={() => setItens((atual) => atual.filter((i) => i.chave !== item.chave))}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        aria-label={`Remover ${formatarCurto(item.data)} ${item.hora}`}
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-[11.5rem_minmax(0,1fr)] gap-2">
                      <Select
                        value={item.hora}
                        aria-label={`Horário de ${formatarCurto(item.data)}`}
                        onChange={(e) => alterarItem(item.chave, { hora: e.target.value })}
                        className={`py-2! ${motivo ? "border-red-400 bg-red-50" : ""}`}
                      >
                        {(opcoes.length > 0
                          ? opcoes
                          : horariosDoExpediente(expediente, Number(duracao))
                              .concat(item.hora)
                              .filter((h, i, l) => l.indexOf(h) === i)
                              .sort()
                              .map((hora) => ({ hora, motivo: null as string | null }))
                        ).map((o) => (
                          <option
                            key={o.hora}
                            value={o.hora}
                            disabled={Boolean(o.motivo) && o.hora !== item.hora}
                          >
                            {o.hora}
                            {o.motivo ? " (ocupado)" : ""}
                          </option>
                        ))}
                      </Select>
                      <Select
                        value={item.instrutorId}
                        aria-label={`Instrutor de ${formatarCurto(item.data)} ${item.hora}`}
                        onChange={(e) => alterarItem(item.chave, { instrutorId: e.target.value })}
                        className={`py-2! ${item.instrutorId ? "" : "border-red-400 bg-red-50"}`}
                      >
                        <option value="">Escolha o instrutor...</option>
                        {instrutores.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nome}
                          </option>
                        ))}
                      </Select>
                    </div>
                    {motivo && (
                      <p className="text-sm font-medium text-red-700">
                        {item.hora} não está disponível: {motivo}. Escolha outro horário.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4">
            <Campo label="Observação (vale para todas)">
              <Textarea name="obs" rows={2} />
            </Campo>
          </div>
        </Cartao>
      </div>
    </FormAcao>
  );
}
