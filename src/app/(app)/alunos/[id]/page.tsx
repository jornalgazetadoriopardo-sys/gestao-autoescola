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
  formatarTelefone,
  situacaoParcela,
} from "@/lib/format";
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
        include: { parcelas: { orderBy: { numero: "asc" } }, _count: { select: { aulas: true } } },
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
          const podeExcluir = m._count.aulas === 0 && m.parcelas.every((p) => !p.pagoEm);

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

              <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase text-slate-500">Valor total</div>
                  <div className="font-medium">{formatarMoeda(m.valorTotalCentavos)}</div>
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
