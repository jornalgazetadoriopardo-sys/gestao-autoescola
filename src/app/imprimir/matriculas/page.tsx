import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { CATEGORIAS, formatarCpf, formatarData, formatarMoeda, hojeISO } from "@/lib/format";
import { intervaloDoDia } from "@/lib/aulas";
import { TIPOS_PROCESSO } from "@/lib/etapas";
import { FORMAS_MATRICULA } from "@/lib/pagamentos";
import { CabecalhoDocumento } from "../cabecalho-documento";
import { RodapeDocumento } from "../rodape-documento";

export const dynamic = "force-dynamic";

function lerDia(v: string | undefined, padrao: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v! : padrao;
}

// Nome curto da forma de pagamento, para caber na tabela.
const FORMA_CURTA: Record<string, string> = { carne: "Carnê", pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

const dataLocal = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

// Matrículas feitas no período: totais por categoria, processo e forma de
// pagamento, e a lista com o valor contratado, o que já foi pago e o que falta.
export default async function RelatorioMatriculasPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; categoria?: string; processo?: string }>;
}) {
  const params = await searchParams;
  const hoje = hojeISO();
  const de = lerDia(params.de, `${hoje.slice(0, 7)}-01`);
  const ate = lerDia(params.ate, hoje);
  const categoria = (CATEGORIAS as readonly string[]).includes(params.categoria ?? "") ? params.categoria! : null;
  const processo = params.processo && params.processo in TIPOS_PROCESSO ? params.processo : null;

  const [config, matriculas] = await Promise.all([
    obterConfig(),
    db.matricula.findMany({
      where: {
        data: { gte: intervaloDoDia(de).inicio, lt: intervaloDoDia(ate).fim },
        ...(categoria ? { categoria } : {}),
        ...(processo ? { tipoProcesso: processo } : {}),
      },
      orderBy: { data: "asc" },
      include: { aluno: true, parcelas: { select: { valorCentavos: true, valorPagoCentavos: true, pagoEm: true } } },
    }),
  ]);

  const linhas = matriculas.map((m) => {
    const pago = m.parcelas.reduce((s, p) => s + (p.valorPagoCentavos ?? 0), 0);
    const aberto = m.parcelas.filter((p) => !p.pagoEm).reduce((s, p) => s + p.valorCentavos, 0);
    return { m, pago, aberto };
  });
  const soma = (f: (l: (typeof linhas)[number]) => number) => linhas.reduce((s, l) => s + f(l), 0);
  const total = {
    contratado: soma((l) => l.m.valorTotalCentavos),
    pago: soma((l) => l.pago),
    aberto: soma((l) => l.aberto),
  };

  // Quantidade e valor contratado agrupados (por categoria, processo e forma de pagamento).
  function agrupar(chave: (l: (typeof linhas)[number]) => string) {
    const mapa = new Map<string, { qtd: number; valor: number }>();
    for (const l of linhas) {
      const g = mapa.get(chave(l)) ?? { qtd: 0, valor: 0 };
      g.qtd++;
      g.valor += l.m.valorTotalCentavos;
      mapa.set(chave(l), g);
    }
    return [...mapa.entries()].sort((a, b) => b[1].qtd - a[1].qtd);
  }
  const grupos = [
    { titulo: "Por categoria", itens: agrupar((l) => `Categoria ${l.m.categoria}`) },
    {
      titulo: "Por tipo de processo",
      itens: agrupar((l) => TIPOS_PROCESSO[l.m.tipoProcesso]?.titulo ?? l.m.tipoProcesso),
    },
    {
      titulo: "Por forma de pagamento",
      itens: agrupar((l) => FORMAS_MATRICULA[l.m.formaPagamento]?.titulo ?? l.m.formaPagamento),
    },
  ];

  return (
    <div className="folha text-sm">
      <CabecalhoDocumento config={config} titulo="Relatório de matrículas" />
      <p className="mt-3 text-base">
        Período: <b>{formatarData(new Date(`${de}T00:00:00Z`))}</b> a{" "}
        <b>{formatarData(new Date(`${ate}T00:00:00Z`))}</b>
        {categoria && (
          <>
            {" "}
            · Categoria: <b>{categoria}</b>
          </>
        )}
        {processo && (
          <>
            {" "}
            · Processo: <b>{TIPOS_PROCESSO[processo].titulo}</b>
          </>
        )}
      </p>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {[
          ["Matrículas", String(linhas.length)],
          ["Valor contratado", formatarMoeda(total.contratado)],
          ["Já recebido", formatarMoeda(total.pago)],
          ["Em aberto", formatarMoeda(total.aberto)],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded border border-slate-300 p-2">
            <div className="text-xs uppercase text-slate-600">{rotulo}</div>
            <div className="text-lg font-bold">{valor}</div>
          </div>
        ))}
      </div>

      {linhas.length === 0 ? (
        <p className="mt-6 text-base text-slate-600">Nenhuma matrícula no período.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-6">
            {grupos.map((g) => (
              <div key={g.titulo}>
                <h2 className="border-b border-slate-400 pb-1 text-base font-bold">{g.titulo}</h2>
                <table className="mt-1 w-full border-collapse [&_td]:px-1.5 [&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th]:px-1.5 [&_th:first-child]:pl-0 [&_th:last-child]:pr-0">
                  <tbody>
                    {g.itens.map(([nome, v]) => (
                      <tr key={nome} className="border-b border-slate-200">
                        <td className="py-1">{nome}</td>
                        <td className="py-1 text-right font-semibold whitespace-nowrap">{v.qtd}</td>
                        <td className="py-1 text-right whitespace-nowrap">{formatarMoeda(v.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-bold">
            Todas as matrículas ({linhas.length})
          </h2>
          <table className="mt-1 w-full border-collapse text-[13px] [&_td]:px-1.5 [&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th]:px-1.5 [&_th:first-child]:pl-0 [&_th:last-child]:pr-0">
            <thead>
              <tr className="border-b border-slate-400 text-left">
                <th className="py-1">Data</th>
                <th className="py-1">Aluno</th>
                <th className="py-1">Cat.</th>
                <th className="py-1">Processo</th>
                <th className="py-1">Pagamento</th>
                <th className="py-1 text-right whitespace-nowrap">Contratado</th>
                <th className="py-1 text-right whitespace-nowrap">Recebido</th>
                <th className="py-1 text-right whitespace-nowrap">Em aberto</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ m, pago, aberto }) => (
                <tr key={m.id} className="border-b border-slate-200 align-top">
                  <td className="py-1 whitespace-nowrap">{dataLocal(m.data)}</td>
                  <td className="py-1">
                    {m.aluno.nome}
                    <div className="text-xs whitespace-nowrap text-slate-600">CPF {formatarCpf(m.aluno.cpf)}</div>
                  </td>
                  <td className="py-1">{m.categoria}</td>
                  <td className="py-1">{TIPOS_PROCESSO[m.tipoProcesso]?.titulo ?? m.tipoProcesso}</td>
                  <td className="py-1">{FORMA_CURTA[m.formaPagamento] ?? m.formaPagamento}</td>
                  <td className="py-1 text-right whitespace-nowrap">{formatarMoeda(m.valorTotalCentavos)}</td>
                  <td className="py-1 text-right whitespace-nowrap">{formatarMoeda(pago)}</td>
                  <td className="py-1 text-right whitespace-nowrap">{formatarMoeda(aberto)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-400 font-bold">
                <td className="py-1" colSpan={5}>
                  Total
                </td>
                <td className="py-1 text-right whitespace-nowrap">{formatarMoeda(total.contratado)}</td>
                <td className="py-1 text-right whitespace-nowrap">{formatarMoeda(total.pago)}</td>
                <td className="py-1 text-right whitespace-nowrap">{formatarMoeda(total.aberto)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
      <RodapeDocumento />
    </div>
  );
}
