import { notFound } from "next/navigation";
import { obterConfig } from "@/lib/config";
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
import { STATUS_AULA, TIPOS_AULA, formatarDataHora, resumoAulas } from "@/lib/aulas";
import { FORMAS_MATRICULA } from "@/lib/pagamentos";
import { urlFoto } from "@/lib/foto";
import { CabecalhoDocumento } from "../../cabecalho-documento";
import { RodapeDocumento } from "../../rodape-documento";

export const dynamic = "force-dynamic";

// Como cada situação aparece no relatório.
const SITUACAO_RELATORIO: Record<string, string> = {
  presente: "Presença",
  faltou: "Faltou",
  cancelada: "Cancelada",
  agendada: "Agendada",
};
const COR_SITUACAO: Record<string, string> = {
  presente: "text-green-700",
  faltou: "text-red-700",
  cancelada: "text-slate-500",
  agendada: "text-blue-700",
};

export default async function RelatorioAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const [aluno, config] = await Promise.all([
    db.aluno.findUnique({
      where: { id: Number((await params).id) || 0 },
      include: {
        matriculas: {
          orderBy: { data: "asc" },
          include: {
            parcelas: { orderBy: { numero: "asc" } },
            aulas: { orderBy: { dataHora: "asc" }, include: { instrutor: true, veiculo: true } },
          },
        },
      },
    }),
    obterConfig(),
  ]);
  if (!aluno) notFound();

  return (
    <div className="folha text-sm">
      <CabecalhoDocumento config={config} titulo="Relatório do aluno" />

      <div className="mt-4 flex gap-4 rounded border border-slate-300 p-3">
        {urlFoto(aluno) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlFoto(aluno)!}
            alt=""
            className="h-24 w-18 shrink-0 rounded border border-slate-300 object-cover"
          />
        )}
        <div className="grid flex-1 grid-cols-3 gap-x-6 gap-y-1">
          <Dado rotulo="Aluno" valor={aluno.nome} />
          <Dado rotulo="CPF" valor={formatarCpf(aluno.cpf)} />
          <Dado rotulo="Telefone" valor={formatarTelefone(aluno.telefone) || "—"} />
          <Dado rotulo="Categoria" valor={aluno.categoria} />
          <Dado rotulo="Situação" valor={STATUS_ALUNO[aluno.status] ?? aluno.status} />
          <Dado rotulo="Cadastro" valor={formatarDataLocal(aluno.criadoEm)} />
        </div>
      </div>

      {aluno.matriculas.length === 0 && <p className="mt-6">Este aluno não possui matrículas.</p>}

      {aluno.matriculas.map((m) => {
        const r = resumoAulas(m, m.aulas);
        const faltamPraticas = Math.max(r.pratica.contratadas - r.pratica.feitas, 0);
        const faltamTeoricas = Math.max(r.teorica.contratadas - r.teorica.feitas, 0);
        const pago = m.parcelas.reduce((s, p) => s + (p.valorPagoCentavos ?? 0), 0);
        const aberto = m.parcelas.filter((p) => !p.pagoEm).reduce((s, p) => s + p.valorCentavos, 0);

        return (
          <div key={m.id} className="mt-6 break-inside-avoid-page">
            <h2 className="border-b border-slate-400 pb-1 text-base font-bold">
              Matrícula categoria {m.categoria} — {formatarDataLocal(m.data)}
            </h2>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Resumo
                titulo="Aulas práticas"
                linhas={[
                  `Contratadas: ${r.pratica.contratadas}`,
                  `Presenças: ${r.pratica.feitas} · Faltas: ${r.pratica.faltas}`,
                  `Agendadas: ${r.pratica.agendadas}`,
                ]}
                destaque={
                  r.pratica.contratadas === 0
                    ? "Não contratadas"
                    : faltamPraticas === 0
                      ? "Concluídas"
                      : faltamTexto(faltamPraticas)
                }
              />
              <Resumo
                titulo="Aulas teóricas"
                linhas={[
                  `Contratadas: ${r.teorica.contratadas}`,
                  `Presenças: ${r.teorica.feitas} · Faltas: ${r.teorica.faltas}`,
                  `Agendadas: ${r.teorica.agendadas}`,
                ]}
                destaque={
                  r.teorica.contratadas === 0
                    ? "Não contratadas"
                    : faltamTeoricas === 0
                      ? "Concluídas"
                      : faltamTexto(faltamTeoricas)
                }
              />
            </div>

            <h3 className="mt-4 font-bold">Histórico de aulas</h3>
            {m.aulas.length === 0 ? (
              <p className="text-slate-600">Nenhuma aula agendada.</p>
            ) : (
              <table className="mt-1 w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-400 text-left">
                    <th className="py-1">Data e hora</th>
                    <th className="py-1">Aula</th>
                    <th className="py-1">Instrutor</th>
                    <th className="py-1">Veículo</th>
                    <th className="py-1">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {m.aulas.map((a) => (
                    <tr key={a.id} className="border-b border-slate-200">
                      <td className="py-1">{formatarDataHora(a.dataHora)}</td>
                      <td className="py-1">{TIPOS_AULA[a.tipo]}</td>
                      <td className="py-1">{a.instrutor?.nome ?? "—"}</td>
                      <td className="py-1">{a.veiculo?.placa ?? "—"}</td>
                      <td className={`py-1 font-semibold ${COR_SITUACAO[a.status] ?? ""}`}>
                        {SITUACAO_RELATORIO[a.status] ?? STATUS_AULA[a.status] ?? a.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3 className="mt-4 font-bold">
              Pagamentos — {FORMAS_MATRICULA[m.formaPagamento]?.titulo ?? m.formaPagamento}
            </h3>
            <p>
              Valor contratado: <b>{formatarMoeda(m.valorTotalCentavos)}</b> · Pago: <b>{formatarMoeda(pago)}</b> · Em
              aberto: <b>{formatarMoeda(aberto)}</b>
            </p>
            {m.parcelas.length > 0 && (
              <table className="mt-1 w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-400 text-left">
                    <th className="py-1">Parcela</th>
                    <th className="py-1">Vencimento</th>
                    <th className="py-1">Valor</th>
                    <th className="py-1">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {m.parcelas.map((p) => {
                    const s = situacaoParcela(p);
                    return (
                      <tr key={p.id} className="border-b border-slate-200">
                        <td className="py-1">
                          {p.numero}/{m.parcelas.length}
                        </td>
                        <td className="py-1">{formatarData(p.vencimento)}</td>
                        <td className="py-1">{formatarMoeda(p.valorCentavos)}</td>
                        <td
                          className={`py-1 font-semibold ${s === "atrasado" ? "text-red-700" : s === "pago" ? "text-green-700" : ""}`}
                        >
                          {s === "pago"
                            ? `Pago em ${formatarData(p.pagoEm)} (${FORMAS_PAGAMENTO[p.forma ?? ""] ?? p.forma})`
                            : s === "atrasado"
                              ? "Em atraso"
                              : "A vencer"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
      <RodapeDocumento />
    </div>
  );
}

function faltamTexto(n: number) {
  return n === 1 ? "Falta 1 aula para concluir" : `Faltam ${n} aulas para concluir`;
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <span className="text-xs uppercase text-slate-500">{rotulo}: </span>
      <b>{valor}</b>
    </div>
  );
}

function Resumo({ titulo, linhas, destaque }: { titulo: string; linhas: string[]; destaque: string }) {
  return (
    <div className="rounded border border-slate-300 p-2">
      <div className="font-bold">{titulo}</div>
      {linhas.map((l) => (
        <div key={l}>{l}</div>
      ))}
      <div className="mt-1 font-bold">{destaque}</div>
    </div>
  );
}
