import Link from "next/link";
import { Botao, BotaoLink, Cabecalho, Etiqueta, Input, LinhaVazia, Select, Tabela } from "@/components/ui";
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
        acoes={<BotaoLink href={`/aulas/nova?dia=${dia}`}>Agendar aula</BotaoLink>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <BotaoLink href={link(somarDias(dia, -1))} variante="secundario" aria-label="Dia anterior">
          ←
        </BotaoLink>
        <BotaoLink href={link(hoje)} variante="secundario">
          Hoje
        </BotaoLink>
        <BotaoLink href={link(somarDias(dia, 1))} variante="secundario" aria-label="Próximo dia">
          →
        </BotaoLink>
        <form className="flex flex-wrap gap-2">
          <div className="w-44">
            <Input type="date" name="dia" defaultValue={dia} />
          </div>
          <div className="w-56">
            <Select name="instrutor" defaultValue={instrutorId ?? ""}>
              <option value="">Todos os instrutores</option>
              {instrutores.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </Select>
          </div>
          <Botao variante="secundario">Ver</Botao>
        </form>
      </div>

      <p className="mb-3 text-sm text-slate-600">
        <span className="font-medium text-slate-900">{formatarDiaSemana(dia)}</span> · {ativas}{" "}
        {ativas === 1 ? "aula" : "aulas"}
      </p>

      <Tabela cabecalhos={["Horário", "Aluno", "Tipo", "Instrutor", "Veículo", "Situação", ""]}>
        {aulas.length === 0 && <LinhaVazia colunas={7} texto="Nenhuma aula neste dia." />}
        {aulas.map((a) => (
          <tr key={a.id} className={a.status === "cancelada" ? "text-slate-400" : ""}>
            <td className="px-4 py-3 font-medium">
              {formatarHora(a.dataHora)}–{formatarHora(fimDaAula(a))}
            </td>
            <td className="px-4 py-3">
              <Link href={`/alunos/${a.matricula.alunoId}`} className="text-blue-700 hover:underline">
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
              <AcoesAula aula={a} />
            </td>
          </tr>
        ))}
      </Tabela>
    </>
  );
}
