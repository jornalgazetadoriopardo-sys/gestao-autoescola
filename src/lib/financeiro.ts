import "server-only";
import { db } from "./db";
import { CATEGORIAS_DESPESA, MANUTENCAO } from "./despesas";

// Dinheiro que entrou e saiu do caixa num período (pela data do pagamento).
// Despesas = tudo que foi pago, menos as retiradas dos sócios, que aparecem à parte.
export type Lancamento = { data: Date; valor: number; categoria?: string };

export async function lancamentosDoPeriodo(inicio: Date, fim: Date) {
  const [parcelas, despesas, manutencoes] = await Promise.all([
    db.parcela.findMany({
      where: { pagoEm: { gte: inicio, lt: fim } },
      select: { pagoEm: true, valorPagoCentavos: true },
    }),
    db.despesa.findMany({
      where: { pagoEm: { gte: inicio, lt: fim } },
      select: { pagoEm: true, valorCentavos: true, categoria: true },
    }),
    db.manutencao.findMany({
      where: { data: { gte: inicio, lt: fim }, valorCentavos: { gt: 0 } },
      select: { data: true, valorCentavos: true },
    }),
  ]);
  const entradas: Lancamento[] = parcelas.map((p) => ({ data: p.pagoEm!, valor: p.valorPagoCentavos ?? 0 }));
  const saidas: Lancamento[] = [
    ...despesas.map((d) => ({ data: d.pagoEm!, valor: d.valorCentavos, categoria: d.categoria })),
    ...manutencoes.map((m) => ({ data: m.data!, valor: m.valorCentavos ?? 0, categoria: MANUTENCAO })),
  ];
  return { entradas, saidas };
}

export function resumir(entradas: Lancamento[], saidas: Lancamento[]) {
  const soma = (l: Lancamento[]) => l.reduce((s, x) => s + x.valor, 0);
  const totalEntradas = soma(entradas);
  const retiradas = soma(saidas.filter((s) => s.categoria === "retirada"));
  const despesas = soma(saidas) - retiradas;
  const lucro = totalEntradas - despesas;
  // Ordem fixa dos tipos; a manutenção dos veículos fica logo depois do abastecimento.
  const ordem = Object.keys(CATEGORIAS_DESPESA).flatMap((c) => (c === "combustivel" ? [c, MANUTENCAO] : [c]));
  const porCategoria = ordem
    .map((categoria) => ({ categoria, total: soma(saidas.filter((s) => s.categoria === categoria)) }))
    .filter((c) => c.total > 0);
  return { entradas: totalEntradas, despesas, lucro, retiradas, sobra: lucro - retiradas, porCategoria };
}
