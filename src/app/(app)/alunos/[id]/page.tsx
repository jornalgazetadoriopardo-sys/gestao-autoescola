import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Camera,
  BookOpenCheck,
  CalendarPlus,
  CalendarRange,
  CircleCheck,
  ClipboardCheck,
  FileSignature,
  FileText,
  GraduationCap,
  HandCoins,
  IdCard,
  Pencil,
  Plus,
  Printer,
  UserRound,
  Wallet,
} from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { Aviso, BotaoDownload, BotaoLink, Cabecalho, Cartao, Etiqueta, Secao, Tabela, Vazio } from "@/components/ui";
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
import { CURSOS_TEORICOS, TIPOS_PROCESSO } from "@/lib/etapas";
import { AvisoTaxaRecebida } from "../../exames/aviso-taxa";
import { TabelaEtapas } from "../../exames/tabela-etapas";
import { urlFoto } from "@/lib/foto";
import { AcoesAula } from "../../aulas/acoes-aula";
import { estornarParcela, excluirParcela } from "../../pagamentos/actions";
import { excluirAluno } from "../actions";
import { excluirMatricula } from "./matriculas/actions";

export const dynamic = "force-dynamic";

const corSituacao = { pago: "verde", atrasado: "vermelho", pendente: "amarelo" } as const;
const textoSituacao = { pago: "Pago", atrasado: "Atrasado", pendente: "A vencer" };

export default async function FichaAlunoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nova?: string; recebido?: string; agendadas?: string; taxaRecebida?: string }>;
}) {
  const { nova, recebido, agendadas, taxaRecebida } = await searchParams;
  const temContrato = Boolean((await db.configuracao.findFirst({ select: { contratoNome: true } }))?.contratoNome);
  const aluno = await db.aluno.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: {
      matriculas: {
        orderBy: { data: "desc" },
        include: {
          parcelas: { orderBy: { numero: "asc" } },
          etapas: { orderBy: [{ ordem: "asc" }, { id: "asc" }] },
          aulas: { orderBy: { dataHora: "asc" }, include: { instrutor: true, veiculo: true } },
        },
      },
    },
  });
  if (!aluno) notFound();

  const foto = urlFoto(aluno);
  const totalAulas = aluno.matriculas.reduce((s, m) => s + m.aulas.length, 0);
  const totalParcelas = aluno.matriculas.reduce((s, m) => s + m.parcelas.length, 0);
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
            <BotaoConfirmar
              acao={excluirAluno.bind(null, aluno.id)}
              mensagem={`Excluir ${aluno.nome}?\n\nIsso apaga também ${aluno.matriculas.length} matrícula(s), ${totalAulas} aula(s) e ${totalParcelas} parcela(s), inclusive os pagamentos já recebidos. Não dá para desfazer.`}
              icone="excluir"
            >
              Excluir aluno
            </BotaoConfirmar>
          </>
        }
      />

      <AvisoTaxaRecebida id={taxaRecebida} />
      {matriculaNova && (
        <Aviso tipo="sucesso" icone={CircleCheck}>
          <span>Matrícula criada com sucesso! Entregue o guia ao aluno:</span>
          <BotaoLink
            href={`/imprimir/matricula/${matriculaNova.id}`}
            target="_blank"
            tamanho="pequeno"
            icone={BookOpenCheck}
          >
            Guia do aluno
          </BotaoLink>
          {temContrato && (
            <BotaoDownload
              href={`/contrato/${matriculaNova.id}`}
              variante="primario"
              tamanho="pequeno"
              icone={FileSignature}
            >
              Contrato
            </BotaoDownload>
          )}
          {matriculaNova.formaPagamento === "carne" && matriculaNova.parcelas.length > 0 && (
            <BotaoLink href={`/imprimir/carne/${matriculaNova.id}`} target="_blank" tamanho="pequeno" icone={Printer}>
              Imprimir carnê
            </BotaoLink>
          )}
          {matriculaNova.formaPagamento !== "carne" && matriculaNova.parcelas[0] && (
            <BotaoLink
              href={`/imprimir/recibo/${matriculaNova.parcelas[0].id}`}
              target="_blank"
              tamanho="pequeno"
              icone={Printer}
            >
              Imprimir recibo
            </BotaoLink>
          )}
        </Aviso>
      )}
      {Number(agendadas) > 0 && (
        <Aviso tipo="sucesso" icone={CircleCheck}>
          {Number(agendadas) === 1 ? "1 aula agendada!" : `${Number(agendadas)} aulas agendadas!`} Veja a lista abaixo.
          Para mudar uma aula, use o botão Editar.
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

      <Cartao className="flex max-w-4xl flex-wrap items-start gap-6">
        <div className="flex h-40 w-30 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt={`Foto de ${aluno.nome}`} className="h-full w-full object-cover" />
          ) : (
            <BotaoLink href={`/alunos/${aluno.id}/editar`} variante="secundario" tamanho="pequeno" icone={Camera}>
              Pôr foto
            </BotaoLink>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
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
          const resumo = resumoAulas(m, m.aulas);

          return (
            <Cartao key={m.id}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">
                    {TIPOS_PROCESSO[m.tipoProcesso]?.titulo ?? m.tipoProcesso} · categoria {m.categoria} · matrícula em{" "}
                    {formatarDataLocal(m.data)}
                  </div>
                  <div className="text-base text-slate-600">
                    {m.qtdPraticas} aulas práticas ·{" "}
                    {m.cursoTeorico === "autoescola"
                      ? `${m.qtdTeoricas} aulas teóricas`
                      : `curso teórico: ${CURSOS_TEORICOS[m.cursoTeorico]?.titulo.toLowerCase() ?? m.cursoTeorico}`}{" "}
                    · {FORMAS_MATRICULA[m.formaPagamento]?.titulo ?? m.formaPagamento}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <BotaoLink
                    href={`/imprimir/matricula/${m.id}`}
                    target="_blank"
                    variante="secundario"
                    tamanho="pequeno"
                    icone={BookOpenCheck}
                  >
                    Guia do aluno
                  </BotaoLink>
                  <BotaoLink
                    href={`/imprimir/ficha/${m.id}`}
                    target="_blank"
                    variante="secundario"
                    tamanho="pequeno"
                    icone={IdCard}
                  >
                    Ficha
                  </BotaoLink>
                  {temContrato && (
                    <BotaoDownload href={`/contrato/${m.id}`} tamanho="pequeno" icone={FileSignature}>
                      Contrato
                    </BotaoDownload>
                  )}
                  {m.formaPagamento === "carne" && m.parcelas.length > 0 && (
                    <BotaoLink
                      href={`/imprimir/carne/${m.id}`}
                      target="_blank"
                      variante="secundario"
                      tamanho="pequeno"
                      icone={Printer}
                    >
                      Imprimir carnê
                    </BotaoLink>
                  )}
                  <BotaoLink
                    href={`/alunos/${aluno.id}/matriculas/${m.id}/editar`}
                    variante="secundario"
                    tamanho="pequeno"
                    icone={Pencil}
                  >
                    Alterar
                  </BotaoLink>
                  <BotaoConfirmar
                    acao={excluirMatricula.bind(null, m.id)}
                    mensagem={`Excluir esta matrícula?\n\nIsso apaga também ${m.aulas.length} aula(s) e ${m.parcelas.length} parcela(s), inclusive os pagamentos já recebidos. Não dá para desfazer.`}
                    icone="excluir"
                  >
                    Excluir
                  </BotaoConfirmar>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <BookOpen className="size-5 text-slate-500" aria-hidden /> Aulas
                </h3>
                <div className="flex flex-wrap gap-2">
                  <BotaoLink
                    href={`/aulas/nova?matricula=${m.id}`}
                    variante="secundario"
                    tamanho="pequeno"
                    icone={CalendarPlus}
                  >
                    Uma aula
                  </BotaoLink>
                  <BotaoLink href={`/aulas/nova?modo=varias&matricula=${m.id}`} tamanho="pequeno" icone={CalendarRange}>
                    Várias aulas
                  </BotaoLink>
                </div>
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
                          <AcoesAula aula={a} voltar={`/alunos/${aluno.id}`} />
                        </td>
                      </tr>
                    ))}
                  </Tabela>
                </div>
              )}

              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <ClipboardCheck className="size-5 text-slate-500" aria-hidden /> Exames e taxas
                  <span className="text-base font-normal text-slate-600">
                    ({m.etapas.filter((e) => e.resultado === "ok").length} de {m.etapas.length} concluídos)
                  </span>
                </h3>
                <BotaoLink href={`/exames/nova?matricula=${m.id}`} variante="secundario" tamanho="pequeno" icone={Plus}>
                  Adicionar exame ou taxa
                </BotaoLink>
              </div>
              <div className="mb-6">
                {m.etapas.length > 0 ? (
                  <TabelaEtapas etapas={m.etapas} voltar={`/alunos/${aluno.id}`} />
                ) : (
                  <p className="text-base text-slate-500">Nenhum exame ou taxa nesta matrícula.</p>
                )}
              </div>

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
                <Valor
                  rotulo="Em aberto"
                  valor={formatarMoeda(emAberto)}
                  cor={emAberto ? "text-amber-700" : undefined}
                />
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
                          <div className="flex items-center gap-2">
                            {p.pagoEm ? (
                              <>
                                <BotaoLink
                                  href={`/imprimir/recibo/${p.id}`}
                                  target="_blank"
                                  variante="secundario"
                                  tamanho="pequeno"
                                  icone={Printer}
                                >
                                  Recibo
                                </BotaoLink>
                                <BotaoConfirmar
                                  acao={estornarParcela.bind(null, p.id)}
                                  mensagem="Desfazer este pagamento? A parcela volta a ficar em aberto."
                                  icone="desfazer"
                                >
                                  Desfazer
                                </BotaoConfirmar>
                              </>
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
                            <BotaoLink
                              href={`/pagamentos/${p.id}/editar?voltar=/alunos/${aluno.id}`}
                              variante="secundario"
                              tamanho="pequeno"
                              icone={Pencil}
                            >
                              Alterar
                            </BotaoLink>
                            <BotaoConfirmar
                              acao={excluirParcela.bind(null, p.id)}
                              mensagem={`Excluir a parcela ${p.numero}?${p.pagoEm ? " O pagamento registrado nela também será apagado." : ""}`}
                              icone="excluir"
                            >
                              Excluir
                            </BotaoConfirmar>
                          </div>
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
