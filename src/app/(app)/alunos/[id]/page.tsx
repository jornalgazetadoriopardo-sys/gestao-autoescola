import { notFound } from "next/navigation";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { BotaoLink, Cabecalho, Cartao, Etiqueta, LinhaVazia, Tabela } from "@/components/ui";
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
import {
  COR_STATUS_AULA,
  STATUS_AULA,
  TIPOS_AULA,
  formatarDataHora,
  resumoAulas,
} from "@/lib/aulas";
import { AcoesAula } from "../../aulas/acoes-aula";
import { excluirMatricula } from "./matriculas/actions";

export const dynamic = "force-dynamic";

const corSituacao = { pago: "verde", atrasado: "vermelho", pendente: "amarelo" } as const;
const textoSituacao = { pago: "Pago", atrasado: "Atrasado", pendente: "Pendente" };

export default async function FichaAlunoPage({ params }: { params: Promise<{ id: string }> }) {
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

  const dados = [
    ["CPF", formatarCpf(aluno.cpf)],
    ["Nascimento", formatarData(aluno.nascimento)],
    ["Telefone", formatarTelefone(aluno.telefone)],
    ["E-mail", aluno.email],
    ["Endereço", aluno.endereco],
    ["Categoria", aluno.categoria],
    ["Status", STATUS_ALUNO[aluno.status] ?? aluno.status],
    ["Cadastrado em", formatarDataLocal(aluno.criadoEm)],
  ];

  return (
    <>
      <Cabecalho
        titulo={aluno.nome}
        acoes={
          <>
            <BotaoLink href="/alunos" variante="secundario">
              Voltar
            </BotaoLink>
            <BotaoLink href={`/alunos/${aluno.id}/editar`} variante="secundario">
              Editar
            </BotaoLink>
            <BotaoLink href={`/alunos/${aluno.id}/matriculas/nova`}>Nova matrícula</BotaoLink>
          </>
        }
      />

      <Cartao className="max-w-3xl">
        <h2 className="mb-4 font-semibold">Dados pessoais</h2>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {dados.map(([label, valor]) => (
            <div key={label}>
              <dt className="text-xs uppercase text-slate-500">{label}</dt>
              <dd className="text-sm">{valor || "—"}</dd>
            </div>
          ))}
        </dl>
        {aluno.obs && (
          <div className="mt-4">
            <div className="text-xs uppercase text-slate-500">Observações</div>
            <p className="whitespace-pre-line text-sm">{aluno.obs}</p>
          </div>
        )}
      </Cartao>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Matrículas</h2>
      {aluno.matriculas.length === 0 && (
        <p className="text-sm text-slate-500">Nenhuma matrícula. Clique em &quot;Nova matrícula&quot; para criar.</p>
      )}

      <div className="space-y-6">
        {aluno.matriculas.map((m) => {
          const pago = m.parcelas.reduce((s, p) => s + (p.valorPagoCentavos ?? 0), 0);
          const emAberto = m.parcelas.filter((p) => !p.pagoEm).reduce((s, p) => s + p.valorCentavos, 0);
          const totalParcelado = m.parcelas.reduce((s, p) => s + p.valorCentavos, 0);
          const podeExcluir = m.aulas.length === 0 && m.parcelas.every((p) => !p.pagoEm);
          const resumo = resumoAulas(m, m.aulas);

          return (
            <Cartao key={m.id}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    Categoria {m.categoria} · matrícula em {formatarDataLocal(m.data)}
                  </div>
                  <div className="text-sm text-slate-600">
                    {m.qtdPraticas} aulas práticas · {m.qtdTeoricas} aulas teóricas
                  </div>
                </div>
                {podeExcluir && (
                  <BotaoConfirmar
                    acao={excluirMatricula.bind(null, m.id)}
                    mensagem="Excluir esta matrícula e todas as suas parcelas?"
                  >
                    Excluir
                  </BotaoConfirmar>
                )}
              </div>

              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold">Aulas</h3>
                <BotaoLink href={`/aulas/nova?matricula=${m.id}`} tamanho="pequeno">
                  Agendar aula
                </BotaoLink>
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {(["pratica", "teorica"] as const)
                  .filter((tipo) => resumo[tipo].contratadas > 0)
                  .map((tipo) => {
                    const r = resumo[tipo];
                    return (
                      <div key={tipo} className="rounded-md bg-slate-50 p-3 text-sm">
                        <div className="mb-1 flex justify-between">
                          <span className="font-medium">{tipo === "pratica" ? "Práticas" : "Teóricas"}</span>
                          <span>
                            {r.feitas} de {r.contratadas} feitas
                          </span>
                        </div>
                        <div className="mb-1 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full bg-green-600"
                            style={{ width: `${Math.min((r.feitas / r.contratadas) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-600">
                          {r.agendadas} {r.agendadas === 1 ? "agendada" : "agendadas"} · {r.faltas}{" "}
                          {r.faltas === 1 ? "falta" : "faltas"} · {r.restantes} para agendar
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
                        <td className="px-4 py-2">{formatarDataHora(a.dataHora)}</td>
                        <td className="px-4 py-2">{TIPOS_AULA[a.tipo]}</td>
                        <td className="px-4 py-2">{a.instrutor?.nome ?? "—"}</td>
                        <td className="px-4 py-2">{a.veiculo?.placa ?? "—"}</td>
                        <td className="px-4 py-2">
                          <Etiqueta cor={COR_STATUS_AULA[a.status as keyof typeof COR_STATUS_AULA] ?? "cinza"}>
                            {STATUS_AULA[a.status] ?? a.status}
                          </Etiqueta>
                        </td>
                        <td className="px-4 py-2">
                          <AcoesAula aula={a} />
                        </td>
                      </tr>
                    ))}
                  </Tabela>
                </div>
              )}

              <h3 className="mb-3 font-semibold">Financeiro</h3>
              <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <div className="text-xs uppercase text-slate-500">Valor contratado</div>
                  <div className="font-medium">{formatarMoeda(m.valorTotalCentavos)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Total parcelado{m.jurosMesBp > 0 && ` (${formatarPercentual(m.jurosMesBp)} a.m.)`}
                  </div>
                  <div className="font-medium">{formatarMoeda(totalParcelado)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Pago</div>
                  <div className="font-medium text-green-700">{formatarMoeda(pago)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Em aberto</div>
                  <div className="font-medium text-amber-700">{formatarMoeda(emAberto)}</div>
                </div>
              </div>

              <Tabela cabecalhos={["Parcela", "Vencimento", "Valor", "Situação", "Pagamento"]}>
                {m.parcelas.length === 0 && <LinhaVazia colunas={5} texto="Sem parcelas." />}
                {m.parcelas.map((p) => {
                  const situacao = situacaoParcela(p);
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-2">
                        {p.numero}/{m.parcelas.length}
                      </td>
                      <td className="px-4 py-2">{formatarData(p.vencimento)}</td>
                      <td className="px-4 py-2">{formatarMoeda(p.valorCentavos)}</td>
                      <td className="px-4 py-2">
                        <Etiqueta cor={corSituacao[situacao]}>{textoSituacao[situacao]}</Etiqueta>
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {p.pagoEm
                          ? `${formatarData(p.pagoEm)} · ${FORMAS_PAGAMENTO[p.forma ?? ""] ?? p.forma ?? ""}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </Tabela>
            </Cartao>
          );
        })}
      </div>
    </>
  );
}
