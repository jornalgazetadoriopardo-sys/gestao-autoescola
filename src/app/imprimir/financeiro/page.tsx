import { exigirSessao } from "@/lib/auth";
import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { FORMAS_PAGAMENTO, formatarData, formatarMoeda, hojeISO } from "@/lib/format";
import { somarDias } from "@/lib/aulas";
import { situacaoDespesa, tituloCategoria } from "@/lib/despesas";
import { lancamentosDoPeriodo, resumir } from "@/lib/financeiro";
import { CabecalhoDocumento } from "../cabecalho-documento";
import { QuadroResultado, TabelaPorCategoria } from "../quadro-resultado";
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
  // Despesas e lucro só para o administrador; a secretaria vê os recebimentos.
  const admin = (await exigirSessao()).papel === "admin";
  const hoje = hojeISO();
  const de = lerDia(params.de, `${hoje.slice(0, 7)}-01`);
  const ate = lerDia(params.ate, hoje);
  const inicio = new Date(`${de}T00:00:00Z`);
  const fim = new Date(`${somarDias(ate, 1)}T00:00:00Z`);

  const [config, recebidas, atrasadas, movimento, contas, taxas] = await Promise.all([
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
    admin ? lancamentosDoPeriodo(inicio, fim) : null,
    // Contas a pagar em aberto que vencem até o fim do período (inclui as atrasadas).
    admin
      ? db.despesa.findMany({ where: { pagoEm: null, vencimento: { lt: fim } }, orderBy: { vencimento: "asc" } })
      : [],
    // Exames e taxas que a autoescola cobrou do aluno e recebeu no período (repasse).
    db.etapa.findMany({
      where: { cobranca: "autoescola", pagoEm: { gte: inicio, lt: fim }, valorCentavos: { gt: 0 } },
      orderBy: { pagoEm: "asc" },
      include: { matricula: { include: { aluno: true } } },
    }),
  ]);
  const totalTaxas = taxas.reduce((s, e) => s + (e.valorCentavos ?? 0), 0);
  const resumo = movimento && resumir(movimento.entradas, movimento.saidas);
  const totalContas = contas.reduce((s, d) => s + d.valorCentavos, 0);

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

      {resumo && (
        <>
          <h2 className="mt-4 border-b border-slate-400 pb-1 text-base font-bold">Entradas e saídas do caixa</h2>
          <QuadroResultado resumo={resumo} />
          <h2 className="mt-5 border-b border-slate-400 pb-1 text-base font-bold">Despesas por tipo</h2>
          <TabelaPorCategoria resumo={resumo} />
          <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">
            Recebimentos por forma de pagamento
          </h2>
        </>
      )}

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

      {taxas.length > 0 && (
        <>
          <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">
            Taxas e exames cobrados dos alunos ({taxas.length}) — {formatarMoeda(totalTaxas)}
          </h2>
          <p className="mt-1 text-slate-600">
            Valores repassados ao Detran, clínicas e laboratórios. Não entram nas entradas nem no lucro acima.
          </p>
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
              {taxas.map((e) => (
                <tr key={e.id} className="border-b border-slate-200">
                  <td className="py-1">{formatarData(e.pagoEm)}</td>
                  <td className="py-1">{e.matricula.aluno.nome}</td>
                  <td className="py-1">{e.descricao}</td>
                  <td className="py-1">{FORMAS_PAGAMENTO[e.forma ?? ""] ?? e.forma}</td>
                  <td className="py-1 text-right">{formatarMoeda(e.valorCentavos ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
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
      {admin && (
        <>
          <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">
            Contas a pagar em aberto até {formatarData(new Date(`${ate}T00:00:00Z`))} ({contas.length}) —{" "}
            {formatarMoeda(totalContas)}
          </h2>
          {contas.length === 0 ? (
            <p className="mt-1 text-slate-600">Nenhuma conta em aberto.</p>
          ) : (
            <table className="mt-1 w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-400 text-left">
                  <th className="py-1">Vencimento</th>
                  <th className="py-1">Tipo</th>
                  <th className="py-1">Descrição</th>
                  <th className="py-1">Situação</th>
                  <th className="py-1 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {contas.map((d) => (
                  <tr key={d.id} className="border-b border-slate-200">
                    <td className="py-1">{formatarData(d.vencimento)}</td>
                    <td className="py-1">{tituloCategoria(d.categoria)}</td>
                    <td className="py-1">
                      {d.descricao}
                      {d.favorecido ? ` · ${d.favorecido}` : ""}
                    </td>
                    <td className="py-1">{situacaoDespesa(d, hoje) === "atrasada" ? "Atrasada" : "A pagar"}</td>
                    <td className="py-1 text-right">{formatarMoeda(d.valorCentavos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      <RodapeDocumento />
    </div>
  );
}
