import Link from "next/link";
import {
  CalendarDays,
  CalendarOff,
  CalendarPlus,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Search,
} from "lucide-react";
import { Aviso, Botao, BotaoLink, Cabecalho, Etiqueta, Input, Secao, Select, Tabela, Vazio } from "@/components/ui";
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
import { carregarFeriados } from "@/lib/feriados-servidor";
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

  const [aulas, instrutores, exames, feriados] = await Promise.all([
    db.aula.findMany({
      where: { dataHora: { gte: inicio, lt: fim }, ...(instrutorId ? { instrutorId } : {}) },
      orderBy: { dataHora: "asc" },
      include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
    }),
    db.instrutor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    // Exames do Detran marcados para o dia (com ou sem horário).
    db.etapa.findMany({
      where: {
        data: new Date(`${dia}T00:00:00Z`),
        tipo: { in: ["exame_pratico", "exame_teorico"] },
        ...(instrutorId ? { instrutorId } : {}),
      },
      orderBy: [{ hora: "asc" }, { id: "asc" }],
      include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
    }),
    carregarFeriados(dia, dia),
  ]);
  const feriado = feriados.get(dia);

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

      {feriado && (
        <Aviso tipo="alerta" icone={CalendarOff}>
          <span>
            <strong>Feriado: {feriado}.</strong> Não é possível marcar aulas neste dia. Para trabalhar mesmo assim,
            desmarque o feriado em{" "}
            <Link href="/configuracoes?aba=feriados" className="font-medium underline">
              Configurações › Feriados
            </Link>
            .
          </span>
        </Aviso>
      )}

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
          icone={feriado ? CalendarOff : CalendarDays}
          titulo={feriado ? `Feriado – ${feriado}` : "Nenhuma aula neste dia"}
          acao={
            !feriado && (
              <BotaoLink href={`/aulas/nova?dia=${dia}`} icone={CalendarPlus}>
                Agendar aula
              </BotaoLink>
            )
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

      {exames.length > 0 && (
        <>
          <Secao titulo="Exames do Detran neste dia" icone={ClipboardCheck} />
          <Tabela cabecalhos={["Horário", "Aluno", "Exame", "Local", "Instrutor", "Veículo", ""]}>
            {exames.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-lg font-semibold">{e.hora ?? "—"}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/alunos/${e.matricula.alunoId}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {e.matricula.aluno.nome}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {e.descricao}{" "}
                  {e.resultado && (
                    <Etiqueta cor={e.resultado === "ok" ? "verde" : "vermelho"}>
                      {e.resultado === "ok" ? "Aprovado" : "Reprovado"}
                    </Etiqueta>
                  )}
                </td>
                <td className="px-4 py-3">{e.local ?? "—"}</td>
                <td className="px-4 py-3">{e.instrutor?.nome ?? "—"}</td>
                <td className="px-4 py-3">{e.veiculo ? `${e.veiculo.placa} · ${e.veiculo.modelo}` : "—"}</td>
                <td className="px-4 py-3">
                  <BotaoLink
                    href={`/exames/${e.id}/editar?voltar=${encodeURIComponent(link(dia))}`}
                    variante="secundario"
                    tamanho="pequeno"
                  >
                    Abrir
                  </BotaoLink>
                </td>
              </tr>
            ))}
          </Tabela>
        </>
      )}
    </>
  );
}
