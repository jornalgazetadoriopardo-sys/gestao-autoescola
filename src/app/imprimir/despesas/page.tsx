import { exigirAdmin } from "@/lib/auth";
import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { FORMAS_PAGAMENTO, formatarData, formatarMoeda, hojeISO } from "@/lib/format";
import { somarDias } from "@/lib/aulas";
import { CATEGORIAS_DESPESA, MANUTENCAO, formatarLitros, tituloCategoria } from "@/lib/despesas";
import { CabecalhoDocumento } from "../cabecalho-documento";
import { RodapeDocumento } from "../rodape-documento";

export const dynamic = "force-dynamic";

function lerDia(v: string | undefined, padrao: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v! : padrao;
}

type Linha = {
  chave: string;
  data: Date;
  categoria: string;
  descricao: string;
  favorecido: string | null;
  detalhe: string;
  forma: string;
  valor: number;
};

// Despesas pagas no período, com filtro por tipo e por pessoa (ex.: vales e
// salários de um funcionário). Inclui as manutenções lançadas nos veículos.
export default async function RelatorioDespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; categoria?: string; pessoa?: string }>;
}) {
  await exigirAdmin();
  const params = await searchParams;
  const hoje = hojeISO();
  const de = lerDia(params.de, `${hoje.slice(0, 7)}-01`);
  const ate = lerDia(params.ate, hoje);
  const categoria =
    params.categoria && (params.categoria in CATEGORIAS_DESPESA || params.categoria === MANUTENCAO)
      ? params.categoria
      : "";
  const pessoa = (params.pessoa ?? "").trim();
  const inicio = new Date(`${de}T00:00:00Z`);
  const fim = new Date(`${somarDias(ate, 1)}T00:00:00Z`);
  const comManutencoes = !pessoa && (!categoria || categoria === MANUTENCAO);

  const [config, despesas, manutencoes, emAberto] = await Promise.all([
    obterConfig(),
    categoria === MANUTENCAO
      ? []
      : db.despesa.findMany({
          where: {
            pagoEm: { gte: inicio, lt: fim },
            ...(categoria ? { categoria } : {}),
            ...(pessoa ? { favorecido: { contains: pessoa, mode: "insensitive" } } : {}),
          },
          orderBy: [{ pagoEm: "asc" }, { id: "asc" }],
          include: { veiculo: true },
        }),
    comManutencoes
      ? db.manutencao.findMany({
          where: { data: { gte: inicio, lt: fim }, valorCentavos: { gt: 0 } },
          orderBy: { data: "asc" },
          include: { veiculo: true },
        })
      : [],
    categoria === MANUTENCAO
      ? []
      : db.despesa.findMany({
          where: {
            pagoEm: null,
            vencimento: { gte: inicio, lt: fim },
            ...(categoria ? { categoria } : {}),
            ...(pessoa ? { favorecido: { contains: pessoa, mode: "insensitive" } } : {}),
          },
          orderBy: { vencimento: "asc" },
        }),
  ]);

  const linhas: Linha[] = [
    ...despesas.map((d) => ({
      chave: `d${d.id}`,
      data: d.pagoEm!,
      categoria: d.categoria,
      descricao: d.descricao,
      favorecido: d.favorecido,
      detalhe: [
        d.veiculo?.placa,
        d.litrosCent && formatarLitros(d.litrosCent),
        d.km && `${d.km.toLocaleString("pt-BR")} km`,
      ]
        .filter(Boolean)
        .join(" · "),
      forma: FORMAS_PAGAMENTO[d.forma ?? ""] ?? d.forma ?? "",
      valor: d.valorCentavos,
    })),
    ...manutencoes.map((m) => ({
      chave: `m${m.id}`,
      data: m.data!,
      categoria: MANUTENCAO,
      descricao: m.descricao,
      favorecido: null,
      detalhe: [m.veiculo.placa, m.km && `${m.km.toLocaleString("pt-BR")} km`].filter(Boolean).join(" · "),
      forma: "",
      valor: m.valorCentavos ?? 0,
    })),
  ].sort((a, b) => a.data.getTime() - b.data.getTime());

  const total = linhas.reduce((s, l) => s + l.valor, 0);
  const somarPor = (chave: (l: Linha) => string | null) => {
    const m = new Map<string, number>();
    for (const l of linhas) {
      const k = chave(l);
      if (k) m.set(k, (m.get(k) ?? 0) + l.valor);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const porTipo = somarPor((l) => l.categoria);
  const porPessoa = somarPor((l) => l.favorecido);
  const litros = despesas.reduce((s, d) => s + (d.litrosCent ?? 0), 0);
  const totalAberto = emAberto.reduce((s, d) => s + d.valorCentavos, 0);

  const filtros = [categoria && `Tipo: ${tituloCategoria(categoria)}`, pessoa && `Pessoa: ${pessoa}`].filter(Boolean);

  return (
    <div className="folha text-sm">
      <CabecalhoDocumento config={config} titulo="Despesas" />
      <p className="mt-3 text-base">
        Período: <b>{formatarData(inicio)}</b> a <b>{formatarData(new Date(`${ate}T00:00:00Z`))}</b>
        {filtros.length > 0 && <span> · {filtros.join(" · ")}</span>}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded border-2 border-slate-800 p-2">
          <div className="text-xs uppercase text-slate-500">Total pago</div>
          <div className="text-base font-bold">{formatarMoeda(total)}</div>
        </div>
        <div className="rounded border border-slate-300 p-2">
          <div className="text-xs uppercase text-slate-500">Lançamentos</div>
          <div className="font-bold">{linhas.length}</div>
        </div>
        <div className="rounded border border-slate-300 p-2">
          <div className="text-xs uppercase text-slate-500">A pagar no período</div>
          <div className="font-bold">{formatarMoeda(totalAberto)}</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <h2 className="border-b border-slate-400 pb-1 text-base font-bold">Por tipo</h2>
          <Totais itens={porTipo.map(([k, v]) => [tituloCategoria(k), v])} vazio="Nenhuma despesa paga." />
        </div>
        <div>
          <h2 className="border-b border-slate-400 pb-1 text-base font-bold">Por pessoa</h2>
          <Totais itens={porPessoa} vazio="Nenhuma despesa com pessoa informada." />
        </div>
      </div>
      {litros > 0 && (
        <p className="mt-3">
          Combustível: <b>{formatarLitros(litros)}</b> abastecidos no período.
        </p>
      )}

      <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">Despesas pagas ({linhas.length})</h2>
      {linhas.length === 0 ? (
        <p className="mt-1 text-slate-600">Nenhuma despesa paga no período.</p>
      ) : (
        <table className="mt-1 w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-400 text-left">
              <th className="py-1">Pago em</th>
              <th className="py-1">Tipo</th>
              <th className="py-1">Descrição</th>
              <th className="py-1">Para</th>
              <th className="py-1">Forma</th>
              <th className="py-1 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.chave} className="border-b border-slate-200">
                <td className="py-1">{formatarData(l.data)}</td>
                <td className="py-1">{tituloCategoria(l.categoria)}</td>
                <td className="py-1">
                  {l.descricao}
                  {l.detalhe && <span className="text-slate-600"> · {l.detalhe}</span>}
                </td>
                <td className="py-1">{l.favorecido ?? "—"}</td>
                <td className="py-1">{l.forma || "—"}</td>
                <td className="py-1 text-right">{formatarMoeda(l.valor)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-1" colSpan={5}>
                Total
              </td>
              <td className="py-1 text-right">{formatarMoeda(total)}</td>
            </tr>
          </tbody>
        </table>
      )}

      {emAberto.length > 0 && (
        <>
          <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">
            Ainda a pagar, com vencimento no período ({emAberto.length}) — {formatarMoeda(totalAberto)}
          </h2>
          <table className="mt-1 w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-400 text-left">
                <th className="py-1">Vencimento</th>
                <th className="py-1">Tipo</th>
                <th className="py-1">Descrição</th>
                <th className="py-1">Para</th>
                <th className="py-1 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {emAberto.map((d) => (
                <tr key={d.id} className="border-b border-slate-200">
                  <td className="py-1">{formatarData(d.vencimento)}</td>
                  <td className="py-1">{tituloCategoria(d.categoria)}</td>
                  <td className="py-1">{d.descricao}</td>
                  <td className="py-1">{d.favorecido ?? "—"}</td>
                  <td className="py-1 text-right">{formatarMoeda(d.valorCentavos)}</td>
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

function Totais({ itens, vazio }: { itens: [string, number][]; vazio: string }) {
  if (itens.length === 0) return <p className="mt-1 text-slate-600">{vazio}</p>;
  return (
    <table className="mt-1 w-full border-collapse">
      <tbody>
        {itens.map(([nome, valor]) => (
          <tr key={nome} className="border-b border-slate-200">
            <td className="py-1">{nome}</td>
            <td className="py-1 text-right">{formatarMoeda(valor)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
