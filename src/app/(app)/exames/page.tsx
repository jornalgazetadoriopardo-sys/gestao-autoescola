import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { CalendarClock, ClipboardCheck, ClipboardList, HandCoins, Hourglass, type LucideIcon } from "lucide-react";
import { Cabecalho, Cartao, IconeRedondo, Vazio, type CorIcone } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarMoeda, hojeISO } from "@/lib/format";
import { AvisoTaxaRecebida } from "./aviso-taxa";
import { TabelaEtapas } from "./tabela-etapas";

export const dynamic = "force-dynamic";

const ABAS: { id: string; label: string; icone: LucideIcon; cor: CorIcone; vazio: string }[] = [
  { id: "agendados", label: "Exames agendados", icone: CalendarClock, cor: "azul", vazio: "Nenhum exame agendado." },
  {
    id: "resultado",
    label: "Aguardando resultado",
    icone: Hourglass,
    cor: "amarelo",
    vazio: "Nenhum resultado pendente.",
  },
  { id: "semdata", label: "Ainda sem data", icone: ClipboardList, cor: "cinza", vazio: "Todos os exames têm data." },
  { id: "receber", label: "Taxas a receber", icone: HandCoins, cor: "verde", vazio: "Nenhuma taxa a receber." },
];

// Visão geral do processo de todos os alunos ativos: o que está marcado,
// o que falta lançar o resultado, o que ainda não tem data e o que cobrar.
export default async function ExamesPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; taxaRecebida?: string }>;
}) {
  const { aba: pedida, taxaRecebida } = await searchParams;
  const aba = ABAS.find((a) => a.id === pedida) ?? ABAS[0];
  const hoje = new Date(`${hojeISO()}T00:00:00Z`);
  const ativos: Prisma.EtapaWhereInput = { matricula: { aluno: { status: "ativo" } } };
  const filtros: Record<string, Prisma.EtapaWhereInput> = {
    agendados: { ...ativos, resultado: null, data: { gte: hoje } },
    resultado: { ...ativos, resultado: null, data: { lt: hoje } },
    semdata: { ...ativos, resultado: null, data: null },
    receber: { cobranca: "autoescola", pagoEm: null, valorCentavos: { gt: 0 } },
  };

  const [etapas, contagens, aReceber] = await Promise.all([
    db.etapa.findMany({
      where: filtros[aba.id],
      orderBy: [{ data: "asc" }, { matriculaId: "asc" }, { ordem: "asc" }],
      take: 300,
      include: { matricula: { select: { aluno: { select: { id: true, nome: true } } } } },
    }),
    Promise.all(ABAS.map((a) => db.etapa.count({ where: filtros[a.id] }))),
    db.etapa.aggregate({ where: filtros.receber, _sum: { valorCentavos: true } }),
  ]);

  return (
    <>
      <Cabecalho
        titulo="Exames e taxas"
        descricao="Médico, psicológico, toxicológico, provas do Detran e emissão da CNH de todos os alunos."
        icone={ClipboardCheck}
        cor="roxo"
      />
      <AvisoTaxaRecebida id={taxaRecebida} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ABAS.map((a, i) => (
          <Link key={a.id} href={`/exames?aba=${a.id}`}>
            <Cartao
              className={`flex h-full items-center gap-4 hover:border-blue-300 ${aba.id === a.id ? "ring-2 ring-blue-500" : ""}`}
            >
              <IconeRedondo icone={a.icone} cor={a.cor} />
              <div>
                <div className="text-sm text-slate-600">{a.label}</div>
                <div className="text-2xl font-bold">{contagens[i]}</div>
                {a.id === "receber" && (
                  <div className="text-sm text-slate-500">{formatarMoeda(aReceber._sum.valorCentavos ?? 0)}</div>
                )}
              </div>
            </Cartao>
          </Link>
        ))}
      </div>
      {etapas.length === 0 ? (
        <Vazio icone={aba.icone} titulo={aba.vazio} />
      ) : (
        <TabelaEtapas etapas={etapas} voltar={`/exames?aba=${aba.id}`} receber={aba.id === "receber"} />
      )}
    </>
  );
}
