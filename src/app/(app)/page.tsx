import Link from "next/link";
import {
  BellRing,
  CalendarDays,
  CalendarOff,
  CalendarPlus,
  Check,
  ChevronRight,
  CircleCheck,
  FileBadge,
  ClipboardCheck,
  Flag,
  HandCoins,
  Receipt,
  TriangleAlert,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Botao, Cartao, Etiqueta, IconeRedondo, Secao, Tabela, Vazio, type CorIcone } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatarData, formatarMoeda, hojeISO } from "@/lib/format";
import {
  COR_STATUS_AULA,
  STATUS_AULA,
  TIPOS_AULA,
  formatarDiaSemana,
  formatarHora,
  intervaloDoDia,
  somarDias,
} from "@/lib/aulas";
import { diasAte, quandoLembrar } from "@/lib/lembretes";
import { AcoesAula } from "./aulas/acoes-aula";
import { concluirLembrete, marcarLicenciamento } from "./veiculos/actions";
import { textoLicenciamento } from "./veiculos/etiqueta-licenciamento";
import { carregarFeriados } from "@/lib/feriados-servidor";
import { prontosParaExamePratico } from "@/lib/prontos-exame";
import { DIAS_AVISO_LICENCIAMENTO, lerCalendario, situacaoLicenciamento } from "@/lib/licenciamento";

export const dynamic = "force-dynamic";

// Lembretes aparecem a partir de alguns dias antes da data marcada.
const DIAS_ANTECEDENCIA = 7;

const ATALHOS: { href: string; titulo: string; texto: string; icone: LucideIcon; cor: CorIcone }[] = [
  { href: "/alunos/novo", titulo: "Cadastrar aluno", texto: "Novo aluno na autoescola", icone: UserPlus, cor: "azul" },
  {
    href: "/aulas/nova",
    titulo: "Agendar aula",
    texto: "Marcar aula prática ou teórica",
    icone: CalendarPlus,
    cor: "roxo",
  },
  { href: "/pagamentos", titulo: "Receber pagamento", texto: "Dar baixa numa parcela", icone: HandCoins, cor: "verde" },
  { href: "/aulas", titulo: "Ver agenda", texto: "Aulas do dia e presença", icone: CalendarDays, cor: "amarelo" },
];

export default async function InicioPage() {
  const sessao = await exigirSessao();
  const hojeTexto = hojeISO();
  const hoje = new Date(`${hojeTexto}T00:00:00Z`);
  const { inicio, fim } = intervaloDoDia(hojeTexto);
  const inicioMes = new Date(`${hojeTexto.slice(0, 7)}-01T00:00:00Z`);

  // Contas a pagar e despesas do mês: só para o administrador.
  const admin = sessao.papel === "admin";
  const em3dias = new Date(`${somarDias(hojeTexto, 3)}T00:00:00Z`);
  const [contasAtrasadas, contasAVencer, pagoMes] = admin
    ? await Promise.all([
        db.despesa.aggregate({
          where: { pagoEm: null, vencimento: { lt: hoje } },
          _sum: { valorCentavos: true },
          _count: true,
        }),
        db.despesa.aggregate({
          where: { pagoEm: null, vencimento: { gte: hoje, lte: em3dias } },
          _sum: { valorCentavos: true },
          _count: true,
        }),
        db.despesa.aggregate({ where: { pagoEm: { gte: inicioMes } }, _sum: { valorCentavos: true } }),
      ])
    : [null, null, null];

  // Licenciamento: veículos ativos com o pagamento do ano vencendo em até 30 dias ou vencido.
  const configLic = await db.configuracao.findFirst({ select: { calendarioLicenciamento: true } });
  const calendario = lerCalendario(configLic?.calendarioLicenciamento);
  const licenciamentos = (await db.veiculo.findMany({ where: { ativo: true }, orderBy: { placa: "asc" } }))
    .map((v) => ({ v, s: situacaoLicenciamento(v, calendario, hojeTexto) }))
    .filter(({ s }) => !s.pago && s.dias !== null && s.dias <= DIAS_AVISO_LICENCIAMENTO);

  // Exames do Detran/clínicas marcados para hoje e amanhã.
  const examesProximos = await db.etapa.findMany({
    where: { resultado: null, data: { gte: hoje, lte: new Date(`${somarDias(hojeTexto, 1)}T00:00:00Z`) } },
    orderBy: { data: "asc" },
    include: { matricula: { select: { aluno: { select: { nome: true } } } } },
  });

  // Alunos que terminaram as aulas práticas e feriados da próxima semana.
  const [prontos, feriados] = await Promise.all([
    prontosParaExamePratico(),
    carregarFeriados(hojeTexto, somarDias(hojeTexto, 7)),
  ]);

  const [aulasHoje, lembretes, atrasadas, vencemHoje, recebidoMes, alunosAtivos] = await Promise.all([
    db.aula.findMany({
      where: { dataHora: { gte: inicio, lt: fim }, status: { not: "cancelada" } },
      orderBy: { dataHora: "asc" },
      include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
    }),
    db.manutencao.findMany({
      where: {
        lembreteConcluido: false,
        lembrarEm: { lte: new Date(`${somarDias(hojeTexto, DIAS_ANTECEDENCIA)}T00:00:00Z`) },
      },
      orderBy: { lembrarEm: "asc" },
      include: { veiculo: true },
    }),
    db.parcela.aggregate({
      where: { pagoEm: null, vencimento: { lt: hoje } },
      _sum: { valorCentavos: true },
      _count: true,
    }),
    db.parcela.aggregate({ where: { pagoEm: null, vencimento: hoje }, _sum: { valorCentavos: true }, _count: true }),
    db.parcela.aggregate({ where: { pagoEm: { gte: inicioMes } }, _sum: { valorPagoCentavos: true } }),
    db.aluno.count({ where: { status: "ativo" } }),
  ]);

  const primeiroNome = sessao.nome.split(" ")[0];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Olá, {primeiroNome}!</h1>
        <p className="mt-1 text-lg text-slate-600">{formatarDiaSemana(hojeTexto)}. O que você quer fazer?</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ATALHOS.map((a) => (
          <Link key={a.href} href={a.href}>
            <Cartao className="flex h-full flex-col items-start gap-3 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
              <IconeRedondo icone={a.icone} cor={a.cor} />
              <div>
                <div className="text-lg font-semibold">{a.titulo}</div>
                <div className="text-sm text-slate-600">{a.texto}</div>
              </div>
            </Cartao>
          </Link>
        ))}
      </div>

      {(lembretes.length > 0 ||
        atrasadas._count > 0 ||
        vencemHoje._count > 0 ||
        examesProximos.length > 0 ||
        prontos.length > 0 ||
        feriados.size > 0 ||
        licenciamentos.length > 0 ||
        Boolean(contasAtrasadas?._count) ||
        Boolean(contasAVencer?._count)) && (
        <>
          <Secao titulo="Avisos" icone={BellRing} />
          <div className="space-y-3">
            {atrasadas._count > 0 && (
              <AvisoLinha
                cor="vermelho"
                icone={TriangleAlert}
                titulo={`${atrasadas._count} ${atrasadas._count === 1 ? "parcela em atraso" : "parcelas em atraso"}`}
                texto={`Total de ${formatarMoeda(atrasadas._sum.valorCentavos ?? 0)} para cobrar.`}
                acao={<LinkAcao href="/pagamentos?aba=atrasadas">Ver quem está devendo</LinkAcao>}
              />
            )}
            {vencemHoje._count > 0 && (
              <AvisoLinha
                cor="amarelo"
                icone={Wallet}
                titulo={`${vencemHoje._count} ${vencemHoje._count === 1 ? "parcela vence" : "parcelas vencem"} hoje`}
                texto={`Total de ${formatarMoeda(vencemHoje._sum.valorCentavos ?? 0)}.`}
                acao={<LinkAcao href="/pagamentos?aba=avencer">Ver parcelas</LinkAcao>}
              />
            )}
            {licenciamentos.map(({ v, s }) => (
              <AvisoLinha
                key={`lic-${v.id}`}
                cor={s.dias! < 0 ? "vermelho" : "amarelo"}
                icone={FileBadge}
                titulo={`Licenciamento — ${v.modelo} (${v.placa})`}
                texto={textoLicenciamento(s).texto}
                acao={
                  <div className="flex flex-wrap gap-2">
                    <LinkAcao href={`/veiculos/${v.id}`}>Ver veículo</LinkAcao>
                    <form action={marcarLicenciamento.bind(null, v.id, true)}>
                      <Botao variante="sucesso" tamanho="pequeno" icone={Check}>
                        Já paguei
                      </Botao>
                    </form>
                  </div>
                }
              />
            ))}
            {examesProximos.length > 0 && (
              <AvisoLinha
                cor="amarelo"
                icone={ClipboardCheck}
                titulo={`${examesProximos.length} ${examesProximos.length === 1 ? "exame" : "exames"} hoje ou amanhã`}
                texto={examesProximos
                  .slice(0, 3)
                  .map(
                    (e) =>
                      `${e.matricula.aluno.nome} – ${e.descricao} (${formatarData(e.data)}${e.hora ? ` às ${e.hora}` : ""})`,
                  )
                  .join(" · ")}
                acao={<LinkAcao href="/exames">Ver exames</LinkAcao>}
              />
            )}
            {prontos.length > 0 && (
              <AvisoLinha
                cor="azul"
                icone={Flag}
                titulo={`${prontos.length} ${prontos.length === 1 ? "aluno pronto" : "alunos prontos"} para o exame prático`}
                texto={`Já fizeram todas as aulas práticas: ${prontos
                  .slice(0, 3)
                  .map((p) => p.alunoNome)
                  .join(", ")}${prontos.length > 3 ? "…" : ""}`}
                acao={<LinkAcao href="/exames?aba=prontos">Agendar exame</LinkAcao>}
              />
            )}
            {feriados.size > 0 && (
              <AvisoLinha
                cor="azul"
                icone={CalendarOff}
                titulo={feriados.size === 1 ? "Feriado nos próximos dias" : "Feriados nos próximos dias"}
                texto={`${[...feriados]
                  .map(([d, nome]) => `${d.split("-").reverse().slice(0, 2).join("/")} – ${nome}`)
                  .join(" · ")}. Não é possível marcar aulas nesses dias.`}
                acao={<LinkAcao href="/configuracoes?aba=feriados">Ver feriados</LinkAcao>}
              />
            )}
            {contasAtrasadas && contasAtrasadas._count > 0 && (
              <AvisoLinha
                cor="vermelho"
                icone={Receipt}
                titulo={`${contasAtrasadas._count} ${contasAtrasadas._count === 1 ? "conta a pagar atrasada" : "contas a pagar atrasadas"}`}
                texto={`Total de ${formatarMoeda(contasAtrasadas._sum.valorCentavos ?? 0)}.`}
                acao={<LinkAcao href="/despesas?ver=atrasadas">Ver contas</LinkAcao>}
              />
            )}
            {contasAVencer && contasAVencer._count > 0 && (
              <AvisoLinha
                cor="amarelo"
                icone={Receipt}
                titulo={`${contasAVencer._count} ${contasAVencer._count === 1 ? "conta vence" : "contas vencem"} nos próximos 3 dias`}
                texto={`Total de ${formatarMoeda(contasAVencer._sum.valorCentavos ?? 0)}.`}
                acao={<LinkAcao href="/despesas?ver=apagar">Ver contas</LinkAcao>}
              />
            )}
            {lembretes.map((m) => {
              const dias = diasAte(m.lembrarEm!);
              return (
                <AvisoLinha
                  key={m.id}
                  cor={dias <= 0 ? "vermelho" : "amarelo"}
                  icone={Wrench}
                  titulo={`${m.descricao} — ${m.veiculo.modelo} (${m.veiculo.placa})`}
                  texto={`Lembrete para ${formatarData(m.lembrarEm)} (${quandoLembrar(m.lembrarEm!)}).`}
                  acao={
                    <div className="flex flex-wrap gap-2">
                      <LinkAcao href={`/veiculos/${m.veiculoId}`}>Ver veículo</LinkAcao>
                      <form action={concluirLembrete.bind(null, m.id)}>
                        <Botao variante="sucesso" tamanho="pequeno" icone={Check}>
                          Já resolvi
                        </Botao>
                      </form>
                    </div>
                  }
                />
              );
            })}
          </div>
        </>
      )}

      <Secao titulo="Aulas de hoje" icone={CalendarDays} acoes={<LinkAcao href="/aulas">Abrir agenda</LinkAcao>} />
      {aulasHoje.length === 0 ? (
        <Vazio icone={CalendarDays} titulo="Nenhuma aula marcada para hoje" />
      ) : (
        <Tabela cabecalhos={["Horário", "Aluno", "Aula", "Instrutor", "Veículo", "Situação", "Presença"]}>
          {aulasHoje.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 text-lg font-semibold">{formatarHora(a.dataHora)}</td>
              <td className="px-4 py-3">
                <Link href={`/alunos/${a.matricula.alunoId}`} className="font-medium text-blue-700 hover:underline">
                  {a.matricula.aluno.nome}
                </Link>
              </td>
              <td className="px-4 py-3">{TIPOS_AULA[a.tipo]}</td>
              <td className="px-4 py-3">{a.instrutor?.nome ?? "—"}</td>
              <td className="px-4 py-3">{a.veiculo?.placa ?? "—"}</td>
              <td className="px-4 py-3">
                <Etiqueta cor={COR_STATUS_AULA[a.status as keyof typeof COR_STATUS_AULA] ?? "cinza"}>
                  {STATUS_AULA[a.status] ?? a.status}
                </Etiqueta>
              </td>
              <td className="px-4 py-3">
                <AcoesAula aula={a} voltar="/" />
              </td>
            </tr>
          ))}
        </Tabela>
      )}

      <Secao titulo="Resumo" icone={CircleCheck} />
      <div className={`grid gap-4 sm:grid-cols-2 ${pagoMes ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}>
        <Indicador icone={Users} cor="azul" rotulo="Alunos ativos" valor={String(alunosAtivos)} href="/alunos" />
        <Indicador icone={CalendarDays} cor="roxo" rotulo="Aulas hoje" valor={String(aulasHoje.length)} href="/aulas" />
        <Indicador
          icone={HandCoins}
          cor="verde"
          rotulo="Recebido este mês"
          valor={formatarMoeda(recebidoMes._sum.valorPagoCentavos ?? 0)}
          href="/pagamentos?aba=pagas"
        />
        {pagoMes && (
          <Indicador
            icone={Receipt}
            cor="vermelho"
            rotulo="Despesas pagas este mês"
            valor={formatarMoeda(pagoMes._sum.valorCentavos ?? 0)}
            href="/despesas?ver=pagas"
          />
        )}
      </div>
    </>
  );
}

function AvisoLinha({
  cor,
  icone,
  titulo,
  texto,
  acao,
}: {
  cor: "vermelho" | "amarelo" | "azul";
  icone: LucideIcon;
  titulo: string;
  texto: string;
  acao: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 ${
        {
          vermelho: "border-red-200 bg-red-50",
          amarelo: "border-amber-200 bg-amber-50",
          azul: "border-blue-200 bg-blue-50",
        }[cor]
      }`}
    >
      <IconeRedondo icone={icone} cor={cor} />
      <div className="min-w-48 flex-1">
        <div className="text-base font-semibold text-slate-900">{titulo}</div>
        <div className="text-base text-slate-700">{texto}</div>
      </div>
      {acao}
    </div>
  );
}

function LinkAcao({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50"
    >
      {children} <ChevronRight className="size-4" aria-hidden />
    </Link>
  );
}

function Indicador({
  icone,
  cor,
  rotulo,
  valor,
  href,
}: {
  icone: LucideIcon;
  cor: CorIcone;
  rotulo: string;
  valor: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Cartao className="flex items-center gap-4 hover:border-blue-300">
        <IconeRedondo icone={icone} cor={cor} />
        <div>
          <div className="text-sm text-slate-600">{rotulo}</div>
          <div className="text-2xl font-bold">{valor}</div>
        </div>
      </Cartao>
    </Link>
  );
}
