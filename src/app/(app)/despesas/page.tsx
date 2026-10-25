import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  HandCoins,
  ListFilter,
  Pencil,
  Plus,
  Receipt,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { ICONES_DESPESA } from "@/components/icones-despesa";
import {
  Botao,
  BotaoLink,
  Cabecalho,
  Cartao,
  Etiqueta,
  IconeRedondo,
  Secao,
  Select,
  Tabela,
  Vazio,
  type CorIcone,
} from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { FORMAS_PAGAMENTO, formatarData, formatarMoeda, hojeISO } from "@/lib/format";
import {
  CATEGORIAS_DESPESA,
  formatarLitros,
  intervaloDoMes,
  nomeDoMes,
  situacaoDespesa,
  somarMeses,
  tituloCategoria,
} from "@/lib/despesas";
import { desfazerPagamento, excluirDespesa } from "./actions";

export const dynamic = "force-dynamic";

const VISOES: { id: string; label: string; icone: LucideIcon }[] = [
  { id: "todas", label: "Todas do mês", icone: Receipt },
  { id: "apagar", label: "A pagar no mês", icone: CalendarClock },
  { id: "pagas", label: "Pagas no mês", icone: CircleCheck },
  { id: "atrasadas", label: "Em atraso", icone: TriangleAlert },
];

const corSituacao = { paga: "verde", atrasada: "vermelho", apagar: "amarelo" } as const;
const textoSituacao = { paga: "Paga", atrasada: "Atrasada", apagar: "A pagar" };

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ver?: string; categoria?: string }>;
}) {
  await exigirAdmin();
  const params = await searchParams;
  const hojeTexto = hojeISO();
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.mes ?? "") ? params.mes! : hojeTexto.slice(0, 7);
  const ver = VISOES.some((v) => v.id === params.ver) ? params.ver! : "todas";
  const categoria = params.categoria && params.categoria in CATEGORIAS_DESPESA ? params.categoria : "";
  const { inicio, fim } = intervaloDoMes(mes);
  const hoje = new Date(`${hojeTexto}T00:00:00Z`);

  const filtros: Record<string, Prisma.DespesaWhereInput> = {
    todas: { OR: [{ vencimento: { gte: inicio, lt: fim } }, { pagoEm: { gte: inicio, lt: fim } }] },
    apagar: { pagoEm: null, vencimento: { gte: inicio, lt: fim } },
    pagas: { pagoEm: { gte: inicio, lt: fim } },
    atrasadas: { pagoEm: null, vencimento: { lt: hoje } },
  };

  const [despesas, pago, aPagar, atrasadas, manutencoes] = await Promise.all([
    db.despesa.findMany({
      where: { ...filtros[ver], ...(categoria ? { categoria } : {}) },
      orderBy: [{ vencimento: "asc" }, { id: "asc" }],
      include: { veiculo: true },
    }),
    db.despesa.aggregate({ where: filtros.pagas, _sum: { valorCentavos: true }, _count: true }),
    db.despesa.aggregate({ where: filtros.apagar, _sum: { valorCentavos: true }, _count: true }),
    db.despesa.aggregate({ where: filtros.atrasadas, _sum: { valorCentavos: true }, _count: true }),
    db.manutencao.findMany({
      where: { data: { gte: inicio, lt: fim }, valorCentavos: { gt: 0 } },
      orderBy: { data: "asc" },
      include: { veiculo: true },
    }),
  ]);
  const totalManutencoes = manutencoes.reduce((s, m) => s + (m.valorCentavos ?? 0), 0);

  const link = (mudar: { mes?: string; ver?: string; categoria?: string }) => {
    const p = new URLSearchParams({ mes, ver, ...(categoria ? { categoria } : {}), ...mudar });
    if (!p.get("categoria")) p.delete("categoria");
    return `/despesas?${p}`;
  };
  const voltar = link({});

  const resumo: { label: string; valor: number; extra: string; cor: CorIcone; icone: LucideIcon; ver: string }[] = [
    {
      label: `Pago em ${nomeDoMes(mes).toLowerCase()}`,
      valor: pago._sum.valorCentavos ?? 0,
      extra: `${pago._count} ${pago._count === 1 ? "despesa" : "despesas"}`,
      cor: "verde",
      icone: CircleCheck,
      ver: "pagas",
    },
    {
      label: "A pagar no mês",
      valor: aPagar._sum.valorCentavos ?? 0,
      extra: `${aPagar._count} ${aPagar._count === 1 ? "conta" : "contas"}`,
      cor: "amarelo",
      icone: CalendarClock,
      ver: "apagar",
    },
    {
      label: "Em atraso (todas)",
      valor: atrasadas._sum.valorCentavos ?? 0,
      extra: `${atrasadas._count} ${atrasadas._count === 1 ? "conta" : "contas"}`,
      cor: "vermelho",
      icone: TriangleAlert,
      ver: "atrasadas",
    },
  ];

  return (
    <>
      <Cabecalho
        titulo="Despesas"
        descricao="Folha, vales, abastecimento, contas e retiradas. Tudo o que sai do caixa."
        icone={Receipt}
        cor="vermelho"
        acoes={
          <BotaoLink href={`/despesas/nova?voltar=${encodeURIComponent(voltar)}`} icone={Plus}>
            Nova despesa
          </BotaoLink>
        }
      />

      <div className="mb-6 flex items-center gap-2">
        <BotaoLink
          href={link({ mes: somarMeses(mes, -1) })}
          variante="secundario"
          icone={ChevronLeft}
          aria-label="Mês anterior"
        >
          <span className="sr-only">Mês anterior</span>
        </BotaoLink>
        <h2 className="min-w-48 text-center text-2xl font-bold">{nomeDoMes(mes)}</h2>
        <BotaoLink href={link({ mes: somarMeses(mes, 1) })} variante="secundario" aria-label="Próximo mês">
          <ChevronRight className="size-5" aria-hidden />
          <span className="sr-only">Próximo mês</span>
        </BotaoLink>
        {mes !== hojeTexto.slice(0, 7) && (
          <Link
            href={link({ mes: hojeTexto.slice(0, 7) })}
            className="ml-2 text-base font-medium text-blue-700 hover:underline"
          >
            Voltar para o mês atual
          </Link>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {resumo.map((r) => (
          <Link key={r.ver} href={link({ ver: r.ver })}>
            <Cartao
              className={`flex h-full items-center gap-4 hover:border-blue-300 ${ver === r.ver ? "ring-2 ring-blue-500" : ""}`}
            >
              <IconeRedondo icone={r.icone} cor={r.cor} />
              <div>
                <div className="text-sm text-slate-600">{r.label}</div>
                <div className="text-2xl font-bold">{formatarMoeda(r.valor)}</div>
                <div className="text-sm text-slate-500">{r.extra}</div>
              </div>
            </Cartao>
          </Link>
        ))}
      </div>

      <Secao titulo="Lançar despesa" icone={Plus} />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {Object.entries(CATEGORIAS_DESPESA).map(([id, c]) => {
          const Icone = ICONES_DESPESA[id];
          return (
            <Link
              key={id}
              href={`/despesas/nova?categoria=${id}&voltar=${encodeURIComponent(voltar)}`}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <Icone className="size-8 text-red-600" aria-hidden />
              <span className="text-sm font-semibold leading-tight">{c.titulo}</span>
            </Link>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {VISOES.map(({ id, label, icone: Icone }) => (
          <Link
            key={id}
            href={link({ ver: id })}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium ${
              ver === id ? "bg-blue-600 text-white" : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            }`}
          >
            <Icone className="size-5" aria-hidden /> {label}
          </Link>
        ))}
        <form className="flex gap-2 sm:ml-auto">
          <input type="hidden" name="mes" value={mes} />
          <input type="hidden" name="ver" value={ver} />
          <div className="w-52">
            <Select name="categoria" defaultValue={categoria} aria-label="Tipo de despesa">
              <option value="">Todos os tipos</option>
              {Object.entries(CATEGORIAS_DESPESA).map(([id, c]) => (
                <option key={id} value={id}>
                  {c.titulo}
                </option>
              ))}
            </Select>
          </div>
          <Botao variante="secundario" icone={ListFilter}>
            Filtrar
          </Botao>
        </form>
      </div>

      {despesas.length === 0 ? (
        <Vazio
          icone={ver === "atrasadas" ? CircleCheck : Receipt}
          titulo={ver === "atrasadas" ? "Nenhuma conta em atraso" : "Nenhuma despesa encontrada"}
          texto={ver === "atrasadas" ? "Tudo em dia!" : "Use os botões acima para lançar uma despesa."}
        />
      ) : (
        <Tabela cabecalhos={["Data", "Despesa", "Valor", "Situação", ""]}>
          {despesas.map((d) => {
            const situacao = situacaoDespesa(d, hojeTexto);
            const Icone = ICONES_DESPESA[d.categoria] ?? Receipt;
            const tipo = tituloCategoria(d.categoria);
            const detalhes = [
              d.descricao !== tipo && tipo,
              d.favorecido,
              d.veiculo && `${d.veiculo.placa}`,
              d.litrosCent && formatarLitros(d.litrosCent),
              d.km && `${d.km.toLocaleString("pt-BR")} km`,
            ].filter(Boolean);
            return (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 whitespace-nowrap">{formatarData(d.vencimento)}</td>
                <td className="min-w-56 px-4 py-3 whitespace-normal!">
                  <div className="flex items-center gap-3">
                    <Icone className="size-6 shrink-0 text-slate-500" aria-hidden />
                    <div>
                      <div className="font-medium">{d.descricao}</div>
                      {detalhes.length > 0 && <div className="text-sm text-slate-600">{detalhes.join(" · ")}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatarMoeda(d.valorCentavos)}</td>
                <td className="px-4 py-3">
                  <Etiqueta cor={corSituacao[situacao]}>{textoSituacao[situacao]}</Etiqueta>
                  {d.pagoEm && (
                    <div className="mt-1 text-sm text-slate-600">
                      {formatarData(d.pagoEm)} · {FORMAS_PAGAMENTO[d.forma ?? ""] ?? d.forma}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {!d.pagoEm && (
                      <BotaoLink
                        href={`/despesas/${d.id}/pagar?voltar=${encodeURIComponent(voltar)}`}
                        variante="sucesso"
                        tamanho="pequeno"
                        icone={HandCoins}
                      >
                        Pagar
                      </BotaoLink>
                    )}
                    <BotaoLink
                      href={`/despesas/${d.id}/editar?voltar=${encodeURIComponent(voltar)}`}
                      variante="secundario"
                      tamanho="pequeno"
                      icone={Pencil}
                    >
                      Alterar
                    </BotaoLink>
                    {d.pagoEm ? (
                      <BotaoConfirmar
                        acao={desfazerPagamento.bind(null, d.id)}
                        mensagem="Desfazer este pagamento? A despesa volta a ficar a pagar."
                        icone="desfazer"
                      >
                        Desfazer
                      </BotaoConfirmar>
                    ) : (
                      <BotaoConfirmar
                        acao={excluirDespesa.bind(null, d.id)}
                        mensagem={`Excluir a despesa "${d.descricao}"?`}
                        icone="excluir"
                      >
                        Excluir
                      </BotaoConfirmar>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Tabela>
      )}

      {manutencoes.length > 0 && !categoria && (ver === "todas" || ver === "pagas") && (
        <>
          <Secao titulo={`Manutenções de veículos no mês — ${formatarMoeda(totalManutencoes)}`} icone={Wrench} />
          <p className="-mt-2 mb-3 text-base text-slate-600">
            Lançadas na tela de cada veículo. Também entram nos relatórios de despesas.
          </p>
          <Tabela cabecalhos={["Data", "Veículo", "Serviço", "Valor"]}>
            {manutencoes.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3">{formatarData(m.data)}</td>
                <td className="px-4 py-3">
                  <Link href={`/veiculos/${m.veiculoId}`} className="font-medium text-blue-700 hover:underline">
                    {m.veiculo.placa} · {m.veiculo.modelo}
                  </Link>
                </td>
                <td className="px-4 py-3">{m.descricao}</td>
                <td className="px-4 py-3 font-semibold">{formatarMoeda(m.valorCentavos ?? 0)}</td>
              </tr>
            ))}
          </Tabela>
        </>
      )}
    </>
  );
}
