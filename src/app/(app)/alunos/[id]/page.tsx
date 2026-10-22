import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarPlus,
  CircleCheck,
  FileText,
  GraduationCap,
  HandCoins,
  Pencil,
  Plus,
  Printer,
  UserRound,
  Wallet,
} from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { Aviso, BotaoLink, Cabecalho, Cartao, Etiqueta, Secao, Tabela, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import {
  FORMAS_PAGAMENTO,
  STATUS_ALUNO,
  formatarCpf,
  formatarData,
  formatarDataLocal,
  formatarMoeda,
  formatarPercentual,
  formatarTelefone,
  situacaoParcela,
} from "@/lib/format";
import { COR_STATUS_AULA, STATUS_AULA, TIPOS_AULA, formatarDataHora, resumoAulas } from "@/lib/aulas";
import { FORMAS_MATRICULA } from "@/lib/pagamentos";
import { AcoesAula } from "../../aulas/acoes-aula";
import { estornarParcela } from "../../pagamentos/actions";
import { excluirMatricula } from "./matriculas/actions";

export const dynamic = "force-dynamic";

const corSituacao = { pago: "verde", atrasado: "vermelho", pendente: "amarelo" } as const;
const textoSituacao = { pago: "Pago", atrasado: "Atrasado", pendente: "A vencer" };

export default async function FichaAlunoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nova?: string; recebido?: string }>;
}) {
  const { nova, recebido } = await searchParams;
  const aluno = await db.aluno.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: {
      matriculas: {
        orderBy: { data: "desc" },
        include: {
          parcelas: { orderBy: { numero: "asc" } },
          aulas: { orderBy: { dataHora: "asc" }, include: { instrutor: true, veiculo: true } },
        },
      },
    },
  });
  if (!aluno) notFound();

  const matriculaNova = aluno.matriculas.find((m) => String(m.id) === nova);
  const parcelaRecebida = aluno.matriculas.flatMap((m) => m.parcelas).find((p) => String(p.id) === recebido);

  const dados = [
    ["CPF", formatarCpf(aluno.cpf)],
    ["Nascimento", formatarData(aluno.nascimento)],
    ["Telefone", formatarTelefone(aluno.telefone)],
    ["E-mail", aluno.email],
    ["Endereço", aluno.endereco],
    ["Categoria", aluno.categoria],
    ["Situação", STATUS_ALUNO[aluno.status] ?? aluno.status],
    ["Cadastrado em", formatarDataLocal(aluno.criadoEm)],
  ];

  return (
    <>
      <Cabecalho
        titulo={aluno.nome}
        descricao={`Categoria ${aluno.categoria} · ${STATUS_ALUNO[aluno.status] ?? aluno.status}`}
        icone={UserRound}
        acoes={
          <>
            <BotaoLink href="/alunos" variante="secundario" icone={ArrowLeft}>
              Voltar
            </BotaoLink>
            <BotaoLink href={`/imprimir/aluno/${aluno.id}`} target="_blank" variante="secundario" icone={FileText}>
              Relatório
            </BotaoLink>
            <BotaoLink href={`/alunos/${aluno.id}/editar`} variante="secundario" icone={Pencil}>
              Editar
            </BotaoLink>
            <BotaoLink href={`/alunos/${aluno.id}/matriculas/nova`} icone={Plus}>
              Nova matrícula
            </BotaoLink>
          </>
        }
      />

      {matriculaNova && (
        <Aviso tipo="sucesso" icone={CircleCheck}>
          <span>Matrícula criada com sucesso!</span>
          {matriculaNova.formaPagamento === "carne" && matriculaNova.parcelas.length > 0 && (
            <BotaoLink href={`/imprimir/carne/${matriculaNova.id}`} target="_blank" tamanho="pequeno" icone={Printer}>
              Imprimir carnê
            </BotaoLink>
          )}
          {matriculaNova.formaPagamento !== "carne" && matriculaNova.parcelas[0] && (
            <BotaoLink href={`/imprimir/recibo/${matriculaNova.parcelas[0].id}`} target="_blank" tamanho="pequeno" icone={Printer}>
              Imprimir recibo
            </BotaoLink>
          )}
        </Aviso>
      )}
      {parcelaRecebida?.pagoEm && (
        <Aviso tipo="sucesso" icone={CircleCheck}>
          <span>Pagamento da parcela {parcelaRecebida.numero} registrado!</span>
          <BotaoLink href={`/imprimir/recibo/${parcelaRecebida.id}`} target="_blank" tamanho="pequeno" icone={Printer}>
            Imprimir recibo
          </BotaoLink>
        </Aviso>
      )}

      <Cartao className="max-w-4xl">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {dados.map(([label, valor]) => (
            <div key={label}>
              <dt className="text-sm font-medium uppercase text-slate-500">{label}</dt>
              <dd className="text-base">{valor || "—"}</dd>
            </div>
          ))}
        </dl>
        {aluno.obs && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3">
            <div className="text-sm font-medium uppercase text-amber-800">Observações</div>
            <p className="whitespace-pre-line text-base">{aluno.obs}</p>
          </div>
        )}
      </Cartao>

      <Secao titulo="Matrículas" icone={GraduationCap} />
      {aluno.matriculas.length === 0 && (
        <Vazio
          icone={GraduationCap}
          titulo="Este aluno ainda não tem matrícula"
          texto="Crie a matrícula com as aulas contratadas e a forma de pagamento."
          acao={
            <BotaoLink href={`/alunos/${aluno.id}/matriculas/nova`} icone={Plus}>
              Nova matrícula
            </BotaoLink>
          }
        />
      )}

      <div className="space-y-6">
        {aluno.matriculas.map((m) => {
          const pago = m.parcelas.reduce((s, p) => s + (p.valorPagoCentavos ?? 0), 0);
          const emAberto = m.parcelas.filter((p) => !p.pagoEm).reduce((s, p) => s + p.valorCentavos, 0);
          const totalParcelado = m.parcelas.reduce((s, p) => s + p.valorCentavos, 0);
          const pagaNaHora = m.formaPagamento !== "carne";
          const podeExcluir = m.aulas.length === 0 && (pagaNaHora || m.parcelas.every((p) => !p.pagoEm));
          const resumo = resumoAulas(m, m.aulas);

          return (
            <Cartao key={m.id}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">
                    Categoria {m.categoria} · matrícula em {formatarDataLocal(m.data)}
                  </div>
                  <div className="text-base text-slate-600">
                    {m.qtdPraticas} aulas práticas · {m.qtdTeoricas} aulas teóricas ·{" "}
                    {FORMAS_MATRICULA[m.formaPagamento]?.titulo ?? m.formaPagamento}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.formaPagamento === "carne" && m.parcelas.length > 0 && (
                    <BotaoLink href={`/imprimir/carne/${m.id}`} target="_blank" variante="secundario" tamanho="pequeno" icone={Printer}>
                      Imprimir carnê
                    </BotaoLink>
                  )}
                  {podeExcluir && (
                    <BotaoConfirmar
                      acao={excluirMatricula.bind(null, m.id)}
                      mensagem="Excluir esta matrícula e todas as suas parcelas?"
                      icone="excluir"
                    >
                      Excluir
                    </BotaoConfirmar>
                  )}
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <BookOpen className="size-5 text-slate-500" aria-hidden /> Aulas
                </h3>
                <BotaoLink href={`/aulas/nova?matricula=${m.id}`} tamanho="pequeno" icone={CalendarPlus}>
                  Agendar aula
                </BotaoLink>
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {(["pratica", "teorica"] as const)
                  .filter((tipo) => resumo[tipo].contratadas > 0)
                  .map((tipo) => {
                    const r = resumo[tipo];
                    const faltam = Math.max(r.contratadas - r.feitas, 0);
                    return (
                      <div key={tipo} className="rounded-xl bg-slate-50 p-4">
                        <div className="mb-2 flex justify-between text-base">
                          <span className="font-semibold">{tipo === "pratica" ? "Práticas" : "Teóricas"}</span>
                          <span>
                            {r.feitas} de {r.contratadas} feitas
                          </span>
                        </div>
                        <div className="mb-2 h-3 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-green-600"
                            style={{ width: `${Math.min((r.feitas / r.contratadas) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-sm text-slate-600">
                          {faltam === 0 ? (
                            <b className="text-green-700">Concluídas!</b>
                          ) : (
                            <>
                              Faltam <b>{faltam}</b> para concluir · {r.agendadas}{" "}
                              {r.agendadas === 1 ? "agendada" : "agendadas"} · {r.faltas}{" "}
                              {r.faltas === 1 ? "falta" : "faltas"}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {m.aulas.length > 0 && (
                <div className="mb-6">
                  <Tabela cabecalhos={["Data", "Tipo", "Instrutor", "Veículo", "Situação", ""]}>
                    {m.aulas.map((a) => (
                      <tr key={a.id} className={a.status === "cancelada" ? "text-slate-400" : ""}>
                        <td className="px-4 py-2.5">{formatarDataHora(a.dataHora)}</td>
                        <td className="px-4 py-2.5">{TIPOS_AULA[a.tipo]}</td>
                        <td className="px-4 py-2.5">{a.instrutor?.nome ?? "—"}</td>
                        <td className="px-4 py-2.5">{a.veiculo?.placa ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <Etiqueta cor={COR_STATUS_AULA[a.status as keyof typeof COR_STATUS_AULA] ?? "cinza"}>
                            {STATUS_AULA[a.status] ?? a.status}
                          </Etiqueta>
                        </td>
                        <td className="px-4 py-2.5">
                          <AcoesAula aula={a} />
                        </td>
                      </tr>
                    ))}
                  </Tabela>
                </div>
              )}

              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Wallet className="size-5 text-slate-500" aria-hidden /> Financeiro
              </h3>
              <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Valor rotulo="Valor contratado" valor={formatarMoeda(m.valorTotalCentavos)} />
                <Valor
                  rotulo={`Total${m.jurosMesBp > 0 ? ` (${formatarPercentual(m.jurosMesBp)} a.m.)` : ""}`}
                  valor={formatarMoeda(totalParcelado)}
                />
                <Valor rotulo="Pago" valor={formatarMoeda(pago)} cor="text-green-700" />
                <Valor rotulo="Em aberto" valor={formatarMoeda(emAberto)} cor={emAberto ? "text-amber-700" : undefined} />
              </div>

              {m.parcelas.length > 0 && (
                <Tabela cabecalhos={["Parcela", "Vencimento", "Valor", "Situação", "Pagamento", ""]}>
                  {m.parcelas.map((p) => {
                    const situacao = situacaoParcela(p);
                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-2.5">
                          {p.numero}/{m.parcelas.length}
                        </td>
                        <td className="px-4 py-2.5">{formatarData(p.vencimento)}</td>
                        <td className="px-4 py-2.5 font-semibold">{formatarMoeda(p.valorCentavos)}</td>
                        <td className="px-4 py-2.5">
                          <Etiqueta cor={corSituacao[situacao]}>{textoSituacao[situacao]}</Etiqueta>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {p.pagoEm
                            ? `${formatarData(p.pagoEm)} · ${FORMAS_PAGAMENTO[p.forma ?? ""] ?? p.forma ?? ""}${p.obs ? ` · ${p.obs}` : ""}`
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {p.pagoEm ? (
                            <div className="flex items-center gap-2">
                              <BotaoLink
                                href={`/imprimir/recibo/${p.id}`}
                                target="_blank"
                                variante="secundario"
                                tamanho="pequeno"
                                icone={Printer}
                              >
                                Recibo
                              </BotaoLink>
                              {!pagaNaHora && (
                                <BotaoConfirmar
                                  acao={estornarParcela.bind(null, p.id)}
                                  mensagem="Desfazer este pagamento? A parcela volta a ficar em aberto."
                                  icone="desfazer"
                                >
                                  Desfazer
                                </BotaoConfirmar>
                              )}
                            </div>
                          ) : (
                            <BotaoLink
                              href={`/pagamentos/${p.id}/receber?voltar=/alunos/${aluno.id}`}
                              variante="sucesso"
                              tamanho="pequeno"
                              icone={HandCoins}
                            >
                              Receber
                            </BotaoLink>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </Tabela>
              )}
            </Cartao>
          );
        })}
      </div>
    </>
  );
}

function Valor({ rotulo, valor, cor }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div>
      <div className="text-sm font-medium uppercase text-slate-500">{rotulo}</div>
      <div className={`text-lg font-semibold ${cor ?? ""}`}>{valor}</div>
    </div>
  );
}
