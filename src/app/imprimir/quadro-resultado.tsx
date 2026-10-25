import { formatarMoeda } from "@/lib/format";
import { tituloCategoria } from "@/lib/despesas";
import type { resumir } from "@/lib/financeiro";

type Resumo = ReturnType<typeof resumir>;

// Saídas aparecem negativas, mas zero continua "R$ 0,00" (e não "-R$ 0,00").
const negativo = (v: number) => (v ? -v : 0);

// Entradas, despesas, lucro, retiradas e o que sobrou no caixa.
export function QuadroResultado({ resumo }: { resumo: Resumo }) {
  const itens = [
    { rotulo: "Entradas (recebido)", valor: resumo.entradas },
    { rotulo: "Despesas", valor: negativo(resumo.despesas) },
    { rotulo: "Lucro", valor: resumo.lucro, destaque: true },
    { rotulo: "Retiradas dos sócios", valor: negativo(resumo.retiradas) },
    { rotulo: "Sobra no caixa", valor: resumo.sobra, destaque: true },
  ];
  return (
    <div className="mt-3 grid grid-cols-5 gap-2">
      {itens.map((i) => (
        <div
          key={i.rotulo}
          className={`rounded p-2 ${i.destaque ? "border-2 border-slate-800" : "border border-slate-300"}`}
        >
          <div className="text-xs uppercase text-slate-500">{i.rotulo}</div>
          <div className={`font-bold ${i.destaque ? "text-base" : ""} ${i.valor < 0 ? "text-red-700" : ""}`}>
            {formatarMoeda(i.valor)}
          </div>
        </div>
      ))}
    </div>
  );
}

// Total pago em cada tipo de despesa (retiradas incluídas), com a porcentagem sobre o total.
export function TabelaPorCategoria({ resumo }: { resumo: Resumo }) {
  const total = resumo.porCategoria.reduce((s, c) => s + c.total, 0);
  if (total === 0) return <p className="mt-1 text-slate-600">Nenhuma despesa paga no período.</p>;
  return (
    <table className="mt-1 w-full border-collapse">
      <thead>
        <tr className="border-b border-slate-400 text-left">
          <th className="py-1">Tipo</th>
          <th className="py-1 text-right">Valor</th>
          <th className="py-1 text-right">%</th>
        </tr>
      </thead>
      <tbody>
        {resumo.porCategoria.map((c) => (
          <tr key={c.categoria} className="border-b border-slate-200">
            <td className="py-1">{tituloCategoria(c.categoria)}</td>
            <td className="py-1 text-right">{formatarMoeda(c.total)}</td>
            <td className="py-1 text-right">{Math.round((c.total / total) * 100)}%</td>
          </tr>
        ))}
        <tr className="font-bold">
          <td className="py-1">Total de saídas</td>
          <td className="py-1 text-right">{formatarMoeda(total)}</td>
          <td />
        </tr>
      </tbody>
    </table>
  );
}
