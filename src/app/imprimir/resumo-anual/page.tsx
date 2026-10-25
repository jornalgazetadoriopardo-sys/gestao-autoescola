import { exigirAdmin } from "@/lib/auth";
import { obterConfig } from "@/lib/config";
import { formatarMoeda, hojeISO } from "@/lib/format";
import { nomeDoMes } from "@/lib/despesas";
import { lancamentosDoPeriodo, resumir } from "@/lib/financeiro";
import { CabecalhoDocumento } from "../cabecalho-documento";
import { QuadroResultado, TabelaPorCategoria } from "../quadro-resultado";
import { RodapeDocumento } from "../rodape-documento";

export const dynamic = "force-dynamic";

// Entradas, despesas e sobra de cada mês do ano.
export default async function ResumoAnualPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await exigirAdmin();
  const atual = Number(hojeISO().slice(0, 4));
  const pedido = Number((await searchParams).ano);
  const ano = Number.isInteger(pedido) && pedido >= 2000 && pedido <= atual + 1 ? pedido : atual;

  const [config, { entradas, saidas }] = await Promise.all([
    obterConfig(),
    lancamentosDoPeriodo(new Date(Date.UTC(ano, 0, 1)), new Date(Date.UTC(ano + 1, 0, 1))),
  ]);
  const doMes = (m: number) => (l: { data: Date }) => l.data.getUTCMonth() === m;
  const meses = Array.from({ length: 12 }, (_, m) => ({
    mes: `${ano}-${String(m + 1).padStart(2, "0")}`,
    ...resumir(entradas.filter(doMes(m)), saidas.filter(doMes(m))),
  }));
  const anoTodo = resumir(entradas, saidas);
  const cor = (v: number) => (v < 0 ? "text-red-700" : "");

  return (
    <div className="folha text-sm">
      <CabecalhoDocumento config={config} titulo={`Resumo de ${ano}`} />
      <p className="mt-3 text-base">Dinheiro que entrou e saiu do caixa em cada mês, pela data do pagamento.</p>

      <QuadroResultado resumo={anoTodo} />

      <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">Mês a mês</h2>
      <table className="mt-1 w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-400 text-left">
            <th className="py-1">Mês</th>
            <th className="py-1 text-right">Entradas</th>
            <th className="py-1 text-right">Despesas</th>
            <th className="py-1 text-right">Lucro</th>
            <th className="py-1 text-right">Retiradas</th>
            <th className="py-1 text-right">Sobra no caixa</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((m) => (
            <tr key={m.mes} className="border-b border-slate-200">
              <td className="py-1">{nomeDoMes(m.mes).split(" ")[0]}</td>
              <td className="py-1 text-right">{formatarMoeda(m.entradas)}</td>
              <td className="py-1 text-right">{formatarMoeda(m.despesas)}</td>
              <td className={`py-1 text-right ${cor(m.lucro)}`}>{formatarMoeda(m.lucro)}</td>
              <td className="py-1 text-right">{formatarMoeda(m.retiradas)}</td>
              <td className={`py-1 text-right font-semibold ${cor(m.sobra)}`}>{formatarMoeda(m.sobra)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-slate-800 font-bold">
            <td className="py-1">Total</td>
            <td className="py-1 text-right">{formatarMoeda(anoTodo.entradas)}</td>
            <td className="py-1 text-right">{formatarMoeda(anoTodo.despesas)}</td>
            <td className={`py-1 text-right ${cor(anoTodo.lucro)}`}>{formatarMoeda(anoTodo.lucro)}</td>
            <td className="py-1 text-right">{formatarMoeda(anoTodo.retiradas)}</td>
            <td className={`py-1 text-right ${cor(anoTodo.sobra)}`}>{formatarMoeda(anoTodo.sobra)}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">Despesas do ano por tipo</h2>
      <TabelaPorCategoria resumo={anoTodo} />
      <RodapeDocumento />
    </div>
  );
}
