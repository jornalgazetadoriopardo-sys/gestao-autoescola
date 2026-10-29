import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  CalendarClock,
  CalendarPlus,
  ClipboardCheck,
  ClipboardList,
  Flag,
  HandCoins,
  Hourglass,
  type LucideIcon,
} from "lucide-react";
import { BotaoLink, Cabecalho, Cartao, IconeRedondo, Tabela, Vazio, type CorIcone } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarMoeda, hojeISO } from "@/lib/format";
import { prontosParaExamePratico } from "@/lib/prontos-exame";
import { AvisoTaxaRecebida } from "./aviso-taxa";
import { TabelaEtapas } from "./tabela-etapas";

export const dynamic = "force-dynamic";

const ABAS: { id: string; label: string; icone: LucideIcon; cor: CorIcone; vazio: string }[] = [
  {
    id: "prontos",
    label: "Prontos para o exame prático",
    icone: Flag,
    cor: "roxo",
    vazio: "Nenhum aluno terminou as aulas práticas sem ter a prova marcada.",
  },
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
  const aba = ABAS.find((a) => a.id === pedida) ?? ABAS[1];
  const hoje = new Date(`${hojeISO()}T00:00:00Z`);
  const ativos: Prisma.EtapaWhereInput = { matricula: { aluno: { status: "ativo" } } };
  const filtros: Record<string, Prisma.EtapaWhereInput> = {
    agendados: { ...ativos, resultado: null, data: { gte: hoje } },
    resultado: { ...ativos, resultado: null, data: { lt: hoje } },
    semdata: { ...ativos, resultado: null, data: null },
    receber: { cobranca: "autoescola", pagoEm: null, valorCentavos: { gt: 0 } },
  };
  const abasDeEtapa = ABAS.filter((a) => a.id !== "prontos");

  const [prontos, etapas, contagensEtapas, aReceber] = await Promise.all([
    prontosParaExamePratico(),
    db.etapa.findMany({
      where: filtros[aba.id] ?? { id: -1 },
      orderBy: [{ data: "asc" }, { matriculaId: "asc" }, { ordem: "asc" }],
      take: 300,
      include: { matricula: { select: { aluno: { select: { id: true, nome: true } } } } },
    }),
    Promise.all(abasDeEtapa.map((a) => db.etapa.count({ where: filtros[a.id] }))),
    db.etapa.aggregate({ where: filtros.receber, _sum: { valorCentavos: true } }),
  ]);
  const contagens = [prontos.length, ...contagensEtapas];

  return (
    <>
      <Cabecalho
        titulo="Exames e taxas"
        descricao="Médico, psicológico, toxicológico, provas do Detran e emissão da CNH de todos os alunos."
        icone={ClipboardCheck}
        cor="roxo"
      />
      <AvisoTaxaRecebida id={taxaRecebida} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
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
      {aba.id === "prontos" ? (
        prontos.length === 0 ? (
          <Vazio
            icone={aba.icone}
            titulo={aba.vazio}
            texto="Quando o aluno tiver presença em todas as aulas práticas contratadas, ele aparece aqui."
          />
        ) : (
          <Tabela cabecalhos={["Aluno", "Categoria", "Aulas práticas", "Prova", ""]}>
            {prontos.map((p) => (
              <tr key={p.chave}>
                <td className="px-4 py-3">
                  <Link href={`/alunos/${p.alunoId}`} className="font-medium text-blue-700 hover:underline">
                    {p.alunoNome}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.categoria}</td>
                <td className="px-4 py-3">{p.praticas} feitas (todas)</td>
                <td className="px-4 py-3">{p.prova}</td>
                <td className="px-4 py-3">
                  <BotaoLink
                    href={`${p.agendar}${p.agendar.includes("?") ? "&" : "?"}voltar=${encodeURIComponent("/exames?aba=prontos")}`}
                    tamanho="pequeno"
                    icone={CalendarPlus}
                  >
                    Agendar exame
                  </BotaoLink>
                </td>
              </tr>
            ))}
          </Tabela>
        )
      ) : etapas.length === 0 ? (
        <Vazio icone={aba.icone} titulo={aba.vazio} />
      ) : (
        <TabelaEtapas etapas={etapas} voltar={`/exames?aba=${aba.id}`} receber={aba.id === "receber"} />
      )}
    </>
  );
}
