import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { formatarData, hojeISO } from "@/lib/format";
import { STATUS_AULA, TIPOS_AULA, formatarDataHora, intervaloDoDia, somarDias } from "@/lib/aulas";
import { CabecalhoDocumento } from "../cabecalho-documento";
import { RodapeDocumento } from "../rodape-documento";

export const dynamic = "force-dynamic";

function lerDia(v: string | undefined, padrao: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v! : padrao;
}

export default async function RelatorioAulasPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; instrutor?: string }>;
}) {
  const params = await searchParams;
  const hoje = hojeISO();
  const de = lerDia(params.de, somarDias(hoje, -30));
  const ate = lerDia(params.ate, hoje);
  const instrutorId = Number(params.instrutor) || null;

  const [config, aulas, instrutor] = await Promise.all([
    obterConfig(),
    db.aula.findMany({
      where: {
        dataHora: { gte: intervaloDoDia(de).inicio, lt: intervaloDoDia(ate).fim },
        ...(instrutorId ? { instrutorId } : {}),
      },
      orderBy: { dataHora: "asc" },
      include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
    }),
    instrutorId ? db.instrutor.findUnique({ where: { id: instrutorId } }) : null,
  ]);

  // Totais por instrutor.
  const porInstrutor = new Map<string, Record<string, number>>();
  for (const a of aulas) {
    const nome = a.instrutor?.nome ?? "Sem instrutor";
    const t = porInstrutor.get(nome) ?? { presente: 0, faltou: 0, cancelada: 0, agendada: 0 };
    t[a.status] = (t[a.status] ?? 0) + 1;
    porInstrutor.set(nome, t);
  }

  return (
    <div className="folha text-sm">
      <CabecalhoDocumento config={config} titulo="Relatório de aulas" />
      <p className="mt-3 text-base">
        Período: <b>{formatarData(new Date(`${de}T00:00:00Z`))}</b> a <b>{formatarData(new Date(`${ate}T00:00:00Z`))}</b>
        {instrutor && (
          <>
            {" "}
            · Instrutor: <b>{instrutor.nome}</b>
          </>
        )}
      </p>

      <h2 className="mt-4 border-b border-slate-400 pb-1 text-base font-bold">Resumo por instrutor</h2>
      {porInstrutor.size === 0 ? (
        <p className="mt-1 text-slate-600">Nenhuma aula no período.</p>
      ) : (
        <table className="mt-1 w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-400 text-left">
              <th className="py-1">Instrutor</th>
              <th className="py-1 text-right">Dadas (presença)</th>
              <th className="py-1 text-right">Faltas do aluno</th>
              <th className="py-1 text-right">Canceladas</th>
              <th className="py-1 text-right">Agendadas</th>
            </tr>
          </thead>
          <tbody>
            {[...porInstrutor.entries()].map(([nome, t]) => (
              <tr key={nome} className="border-b border-slate-200">
                <td className="py-1 font-semibold">{nome}</td>
                <td className="py-1 text-right">{t.presente}</td>
                <td className="py-1 text-right">{t.faltou}</td>
                <td className="py-1 text-right">{t.cancelada}</td>
                <td className="py-1 text-right">{t.agendada}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {aulas.length > 0 && (
        <>
          <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">Todas as aulas ({aulas.length})</h2>
          <table className="mt-1 w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-400 text-left">
                <th className="py-1">Data e hora</th>
                <th className="py-1">Aluno</th>
                <th className="py-1">Aula</th>
                <th className="py-1">Instrutor</th>
                <th className="py-1">Veículo</th>
                <th className="py-1">Situação</th>
              </tr>
            </thead>
            <tbody>
              {aulas.map((a) => (
                <tr key={a.id} className="border-b border-slate-200">
                  <td className="py-1">{formatarDataHora(a.dataHora)}</td>
                  <td className="py-1">{a.matricula.aluno.nome}</td>
                  <td className="py-1">{TIPOS_AULA[a.tipo]}</td>
                  <td className="py-1">{a.instrutor?.nome ?? "—"}</td>
                  <td className="py-1">{a.veiculo?.placa ?? "—"}</td>
                  <td className="py-1">{STATUS_AULA[a.status] ?? a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <RodapeDocumento />
    </div>
  );
}
