import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  CalendarClock,
  CircleCheck,
  HandCoins,
  Pencil,
  Printer,
  Search,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import {
  Aviso,
  Botao,
  BotaoLink,
  Cabecalho,
  Cartao,
  Etiqueta,
  IconeRedondo,
  Input,
  Tabela,
  Vazio,
  type CorIcone,
} from "@/components/ui";
import { db } from "@/lib/db";
import { FORMAS_PAGAMENTO, formatarData, formatarMoeda, hojeISO, situacaoParcela } from "@/lib/format";
import { somarDias } from "@/lib/aulas";
import { SO_PARCELAS, rotuloParcela } from "@/lib/pagamentos";
import { estornarParcela } from "./actions";

export const dynamic = "force-dynamic";

const ABAS: { id: string; label: string; icone: LucideIcon }[] = [
  { id: "atrasadas", label: "Atrasadas", icone: TriangleAlert },
  { id: "avencer", label: "A vencer (30 dias)", icone: CalendarClock },
  { id: "pagas", label: "Pagas este mês", icone: CircleCheck },
  { id: "todas", label: "Todas em aberto", icone: Wallet },
];

const corSituacao = { pago: "verde", atrasado: "vermelho", pendente: "amarelo" } as const;
const textoSituacao = { pago: "Pago", atrasado: "Atrasado", pendente: "A vencer" };

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; q?: string; recebido?: string }>;
}) {
  const params = await searchParams;
  const aba = ABAS.some((a) => a.id === params.aba) ? params.aba! : "atrasadas";
  const busca = (params.q ?? "").trim();

  const hoje = new Date(`${hojeISO()}T00:00:00Z`);
  const em30 = new Date(`${somarDias(hojeISO(), 30)}T00:00:00Z`);
  const inicioMes = new Date(`${hojeISO().slice(0, 7)}-01T00:00:00Z`);

  const filtros: Record<string, Prisma.ParcelaWhereInput> = {
    atrasadas: { pagoEm: null, vencimento: { lt: hoje } },
    avencer: { pagoEm: null, vencimento: { gte: hoje, lt: em30 } },
    pagas: { pagoEm: { gte: inicioMes } },
    todas: { pagoEm: null },
  };
  const where: Prisma.ParcelaWhereInput = {
    ...filtros[aba],
    ...(busca ? { matricula: { aluno: { nome: { contains: busca, mode: "insensitive" } } } } : {}),
  };

  const [parcelas, atrasado, aVencer, recebido, recebida] = await Promise.all([
    db.parcela.findMany({
      where,
      orderBy: aba === "pagas" ? { pagoEm: "desc" } : { vencimento: "asc" },
      take: 300,
      include: { matricula: { include: { aluno: true, _count: { select: { parcelas: { where: SO_PARCELAS } } } } } },
    }),
    db.parcela.aggregate({ where: filtros.atrasadas, _sum: { valorCentavos: true }, _count: true }),
    db.parcela.aggregate({ where: filtros.avencer, _sum: { valorCentavos: true }, _count: true }),
    db.parcela.aggregate({ where: filtros.pagas, _sum: { valorPagoCentavos: true }, _count: true }),
    params.recebido
      ? db.parcela.findUnique({
          where: { id: Number(params.recebido) || 0 },
          include: { matricula: { include: { aluno: true } } },
        })
      : null,
  ]);

  const resumo: { label: string; valor: number; qtd: number; cor: CorIcone; icone: LucideIcon; aba: string }[] = [
    {
      label: "Em atraso",
      valor: atrasado._sum.valorCentavos ?? 0,
      qtd: atrasado._count,
      cor: "vermelho",
      icone: TriangleAlert,
      aba: "atrasadas",
    },
    {
      label: "A receber em 30 dias",
      valor: aVencer._sum.valorCentavos ?? 0,
      qtd: aVencer._count,
      cor: "amarelo",
      icone: CalendarClock,
      aba: "avencer",
    },
    {
      label: "Recebido este mês",
      valor: recebido._sum.valorPagoCentavos ?? 0,
      qtd: recebido._count,
      cor: "verde",
      icone: CircleCheck,
      aba: "pagas",
    },
  ];
  const voltar = `/pagamentos?aba=${aba}${busca ? `&q=${encodeURIComponent(busca)}` : ""}`;

  return (
    <>
      <Cabecalho
        titulo="Pagamentos"
        descricao="Receba parcelas, veja quem está em atraso e imprima recibos."
        icone={Wallet}
        cor="verde"
      />

      {recebida?.pagoEm && (
        <Aviso tipo="sucesso" icone={CircleCheck}>
          <span>
            Pagamento de <b>{recebida.matricula.aluno.nome}</b> registrado!
          </span>
          <BotaoLink href={`/imprimir/recibo/${recebida.id}`} target="_blank" tamanho="pequeno" icone={Printer}>
            Imprimir recibo
          </BotaoLink>
        </Aviso>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {resumo.map((r) => (
          <Link key={r.label} href={`/pagamentos?aba=${r.aba}`}>
            <Cartao
              className={`flex items-center gap-4 hover:border-blue-300 ${aba === r.aba ? "ring-2 ring-blue-500" : ""}`}
            >
              <IconeRedondo icone={r.icone} cor={r.cor} />
              <div>
                <div className="text-sm text-slate-600">{r.label}</div>
                <div className="text-2xl font-bold">{formatarMoeda(r.valor)}</div>
                <div className="text-sm text-slate-500">
                  {r.qtd} {r.qtd === 1 ? "parcela" : "parcelas"}
                </div>
              </div>
            </Cartao>
          </Link>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ABAS.map(({ id, label, icone: Icone }) => (
          <Link
            key={id}
            href={`/pagamentos?aba=${id}${busca ? `&q=${encodeURIComponent(busca)}` : ""}`}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium ${
              aba === id ? "bg-blue-600 text-white" : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            }`}
          >
            <Icone className="size-5" aria-hidden /> {label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          <input type="hidden" name="aba" value={aba} />
          <Input name="q" placeholder="Nome do aluno" defaultValue={busca} className="w-56" />
          <Botao variante="secundario" icone={Search}>
            Buscar
          </Botao>
        </form>
      </div>

      {parcelas.length === 0 ? (
        <Vazio
          icone={aba === "atrasadas" ? CircleCheck : Wallet}
          titulo={aba === "atrasadas" ? "Nenhuma parcela em atraso" : "Nenhuma parcela encontrada"}
          texto={aba === "atrasadas" ? "Ótimo! Todos os alunos estão em dia." : undefined}
        />
      ) : (
        <Tabela cabecalhos={["Aluno", "Parcela", "Vencimento", "Valor", "Situação", ""]}>
          {parcelas.map((p) => {
            const situacao = situacaoParcela(p);
            return (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/alunos/${p.matricula.alunoId}`} className="font-medium text-blue-700 hover:underline">
                    {p.matricula.aluno.nome}
                  </Link>
                </td>
                <td className="px-4 py-3">{rotuloParcela(p.numero, p.matricula._count.parcelas)}</td>
                <td className="px-4 py-3">{formatarData(p.vencimento)}</td>
                <td className="px-4 py-3 font-semibold">{formatarMoeda(p.valorPagoCentavos ?? p.valorCentavos)}</td>
                <td className="px-4 py-3">
                  <Etiqueta cor={corSituacao[situacao]}>{textoSituacao[situacao]}</Etiqueta>
                  {p.pagoEm && (
                    <span className="ml-2 text-sm text-slate-600">
                      {formatarData(p.pagoEm)} · {FORMAS_PAGAMENTO[p.forma ?? ""] ?? p.forma}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.pagoEm ? (
                    <div className="flex items-center gap-2">
                      <BotaoLink
                        href={`/imprimir/recibo/${p.id}`}
                        target="_blank"
                        variante="secundario"
                        tamanho="pequeno"
                        icone={Printer}
                      >
                        Recibo
                      </BotaoLink>
                      <BotaoConfirmar
                        acao={estornarParcela.bind(null, p.id)}
                        mensagem="Desfazer este pagamento? A parcela volta a ficar em aberto."
                        icone="desfazer"
                      >
                        Desfazer
                      </BotaoConfirmar>
                      <LinkAlterar id={p.id} voltar={voltar} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <BotaoLink
                        href={`/pagamentos/${p.id}/receber?voltar=${encodeURIComponent(voltar)}`}
                        variante="sucesso"
                        tamanho="pequeno"
                        icone={HandCoins}
                      >
                        Receber
                      </BotaoLink>
                      <LinkAlterar id={p.id} voltar={voltar} />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </Tabela>
      )}
    </>
  );
}

function LinkAlterar({ id, voltar }: { id: number; voltar: string }) {
  return (
    <BotaoLink
      href={`/pagamentos/${id}/editar?voltar=${encodeURIComponent(voltar)}`}
      variante="secundario"
      tamanho="pequeno"
      icone={Pencil}
    >
      Alterar
    </BotaoLink>
  );
}
