import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { FORMAS_PAGAMENTO, formatarData, formatarMoeda, hojeISO } from "@/lib/format";
import { somarDias } from "@/lib/aulas";
import { CabecalhoDocumento } from "../cabecalho-documento";
import { RodapeDocumento } from "../rodape-documento";

export const dynamic = "force-dynamic";

function lerDia(v: string | undefined, padrao: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v! : padrao;
}

export default async function RelatorioFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const params = await searchParams;
  const hoje = hojeISO();
  const de = lerDia(params.de, `${hoje.slice(0, 7)}-01`);
  const ate = lerDia(params.ate, hoje);
  const inicio = new Date(`${de}T00:00:00Z`);
  const fim = new Date(`${somarDias(ate, 1)}T00:00:00Z`);

  const [config, recebidas, atrasadas] = await Promise.all([
    obterConfig(),
    db.parcela.findMany({
      where: { pagoEm: { gte: inicio, lt: fim } },
      orderBy: { pagoEm: "asc" },
      include: { matricula: { include: { aluno: true, _count: { select: { parcelas: true } } } } },
    }),
    db.parcela.findMany({
      where: { pagoEm: null, vencimento: { lt: new Date(`${hoje}T00:00:00Z`) } },
      orderBy: { vencimento: "asc" },
      include: { matricula: { include: { aluno: true, _count: { select: { parcelas: true } } } } },
    }),
  ]);

  const porForma = Object.entries(FORMAS_PAGAMENTO).map(([id, label]) => ({
    label,
    total: recebidas.filter((p) => p.forma === id).reduce((s, p) => s + (p.valorPagoCentavos ?? 0), 0),
  }));
  const totalRecebido = recebidas.reduce((s, p) => s + (p.valorPagoCentavos ?? 0), 0);
  const totalAtrasado = atrasadas.reduce((s, p) => s + p.valorCentavos, 0);

  return (
    <div className="folha text-sm">
      <CabecalhoDocumento config={config} titulo="Relatório financeiro" />
      <p className="mt-3 text-base">
        Período: <b>{formatarData(inicio)}</b> a <b>{formatarData(new Date(`${ate}T00:00:00Z`))}</b>
      </p>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {porForma.map((f) => (
          <div key={f.label} className="rounded border border-slate-300 p-2">
            <div className="text-xs uppercase text-slate-500">{f.label}</div>
            <div className="font-bold">{formatarMoeda(f.total)}</div>
          </div>
        ))}
        <div className="rounded border-2 border-slate-800 p-2">
          <div className="text-xs uppercase text-slate-500">Total recebido</div>
          <div className="text-base font-bold">{formatarMoeda(totalRecebido)}</div>
        </div>
      </div>

      <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">
        Recebimentos no período ({recebidas.length})
      </h2>
      {recebidas.length === 0 ? (
        <p className="mt-1 text-slate-600">Nenhum recebimento no período.</p>
      ) : (
        <table className="mt-1 w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-400 text-left">
              <th className="py-1">Data</th>
              <th className="py-1">Aluno</th>
              <th className="py-1">Referente</th>
              <th className="py-1">Forma</th>
              <th className="py-1 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {recebidas.map((p) => (
              <tr key={p.id} className="border-b border-slate-200">
                <td className="py-1">{formatarData(p.pagoEm)}</td>
                <td className="py-1">{p.matricula.aluno.nome}</td>
                <td className="py-1">
                  {p.matricula.formaPagamento === "carne"
                    ? `Parcela ${p.numero}/${p.matricula._count.parcelas}`
                    : "Matrícula à vista"}
                </td>
                <td className="py-1">{FORMAS_PAGAMENTO[p.forma ?? ""] ?? p.forma}</td>
                <td className="py-1 text-right">{formatarMoeda(p.valorPagoCentavos ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">
        Parcelas em atraso hoje ({atrasadas.length}) — {formatarMoeda(totalAtrasado)}
      </h2>
      {atrasadas.length === 0 ? (
        <p className="mt-1 text-slate-600">Nenhuma parcela em atraso.</p>
      ) : (
        <table className="mt-1 w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-400 text-left">
              <th className="py-1">Vencimento</th>
              <th className="py-1">Aluno</th>
              <th className="py-1">Telefone</th>
              <th className="py-1">Parcela</th>
              <th className="py-1 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {atrasadas.map((p) => (
              <tr key={p.id} className="border-b border-slate-200">
                <td className="py-1">{formatarData(p.vencimento)}</td>
                <td className="py-1">{p.matricula.aluno.nome}</td>
                <td className="py-1">{p.matricula.aluno.telefone ?? "—"}</td>
                <td className="py-1">
                  {p.numero}/{p.matricula._count.parcelas}
                </td>
                <td className="py-1 text-right">{formatarMoeda(p.valorCentavos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <RodapeDocumento />
    </div>
  );
}
