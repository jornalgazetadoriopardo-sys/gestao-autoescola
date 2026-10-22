import Link from "next/link";
import { CalendarDays, CalendarPlus, CalendarRange, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Botao, BotaoLink, Cabecalho, Etiqueta, Input, Select, Tabela, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { hojeISO } from "@/lib/format";
import {
  COR_STATUS_AULA,
  STATUS_AULA,
  TIPOS_AULA,
  formatarDiaSemana,
  formatarHora,
  fimDaAula,
  intervaloDoDia,
  somarDias,
} from "@/lib/aulas";
import { AcoesAula } from "./acoes-aula";

export const dynamic = "force-dynamic";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string; instrutor?: string }>;
}) {
  const params = await searchParams;
  const hoje = hojeISO();
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(params.dia ?? "") ? params.dia! : hoje;
  const instrutorId = Number(params.instrutor) || null;
  const { inicio, fim } = intervaloDoDia(dia);

  const [aulas, instrutores] = await Promise.all([
    db.aula.findMany({
      where: { dataHora: { gte: inicio, lt: fim }, ...(instrutorId ? { instrutorId } : {}) },
      orderBy: { dataHora: "asc" },
      include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
    }),
    db.instrutor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const link = (d: string) => `/aulas?dia=${d}${instrutorId ? `&instrutor=${instrutorId}` : ""}`;
  const ativas = aulas.filter((a) => a.status !== "cancelada").length;

  return (
    <>
      <Cabecalho
        titulo="Agenda de aulas"
        descricao="Veja as aulas do dia e marque a presença dos alunos."
        icone={CalendarDays}
        cor="roxo"
        acoes={
          <>
            <BotaoLink href={`/aulas/nova?dia=${dia}`} variante="secundario" icone={CalendarPlus}>
              Uma aula
            </BotaoLink>
            <BotaoLink href="/aulas/nova?modo=varias" icone={CalendarRange}>
              Várias aulas
            </BotaoLink>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
        <BotaoLink
          href={link(somarDias(dia, -1))}
          variante="secundario"
          icone={ChevronLeft}
          aria-label="Dia anterior"
        >
          Anterior
        </BotaoLink>
        <div className="min-w-56 flex-1 text-center">
          <div className="text-xl font-bold">{formatarDiaSemana(dia)}</div>
          <div className="text-base text-slate-600">
            {ativas} {ativas === 1 ? "aula" : "aulas"}
            {dia !== hoje && (
              <>
                {" · "}
                <Link href={link(hoje)} className="font-medium text-blue-700 hover:underline">
                  voltar para hoje
                </Link>
              </>
            )}
          </div>
        </div>
        <BotaoLink href={link(somarDias(dia, 1))} variante="secundario" aria-label="Próximo dia">
          Próximo <ChevronRight className="size-5" aria-hidden />
        </BotaoLink>
      </div>

      <form className="mb-5 flex flex-wrap items-end gap-3">
        <label className="w-48">
          <span className="mb-1 block text-sm font-medium text-slate-700">Ir para o dia</span>
          <Input type="date" name="dia" defaultValue={dia} />
        </label>
        <label className="w-64">
          <span className="mb-1 block text-sm font-medium text-slate-700">Instrutor</span>
          <Select name="instrutor" defaultValue={instrutorId ?? ""}>
            <option value="">Todos os instrutores</option>
            {instrutores.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </Select>
        </label>
        <Botao variante="secundario" icone={Search}>
          Ver
        </Botao>
      </form>

      {aulas.length === 0 ? (
        <Vazio
          icone={CalendarDays}
          titulo="Nenhuma aula neste dia"
          acao={
            <BotaoLink href={`/aulas/nova?dia=${dia}`} icone={CalendarPlus}>
              Agendar aula
            </BotaoLink>
          }
        />
      ) : (
        <Tabela cabecalhos={["Horário", "Aluno", "Aula", "Instrutor", "Veículo", "Situação", "Presença"]}>
          {aulas.map((a) => (
            <tr key={a.id} className={a.status === "cancelada" ? "text-slate-400" : ""}>
              <td className="px-4 py-3 text-lg font-semibold">
                {formatarHora(a.dataHora)}–{formatarHora(fimDaAula(a))}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/alunos/${a.matricula.alunoId}`}
                  className="font-medium text-blue-700 hover:underline"
                >
                  {a.matricula.aluno.nome}
                </Link>
              </td>
              <td className="px-4 py-3">{TIPOS_AULA[a.tipo]}</td>
              <td className="px-4 py-3">{a.instrutor?.nome ?? "—"}</td>
              <td className="px-4 py-3">{a.veiculo ? `${a.veiculo.placa} · ${a.veiculo.modelo}` : "—"}</td>
              <td className="px-4 py-3">
                <Etiqueta cor={COR_STATUS_AULA[a.status as keyof typeof COR_STATUS_AULA] ?? "cinza"}>
                  {STATUS_AULA[a.status] ?? a.status}
                </Etiqueta>
              </td>
              <td className="px-4 py-3">
                <AcoesAula aula={a} voltar={link(dia)} />
              </td>
            </tr>
          ))}
        </Tabela>
      )}
    </>
  );
}
