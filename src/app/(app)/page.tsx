import Link from "next/link";
import { BotaoLink, Cabecalho, Cartao, Etiqueta, LinhaVazia, Tabela } from "@/components/ui";
import { db } from "@/lib/db";
import { hojeISO } from "@/lib/format";
import { COR_STATUS_AULA, STATUS_AULA, TIPOS_AULA, formatarHora, intervaloDoDia } from "@/lib/aulas";
import { AcoesAula } from "./aulas/acoes-aula";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const { inicio, fim } = intervaloDoDia(hojeISO());
  const [alunosAtivos, instrutores, veiculos, aulasHoje] = await Promise.all([
    db.aluno.count({ where: { status: "ativo" } }),
    db.instrutor.count({ where: { ativo: true } }),
    db.veiculo.count({ where: { ativo: true } }),
    db.aula.findMany({
      where: { dataHora: { gte: inicio, lt: fim }, status: { not: "cancelada" } },
      orderBy: { dataHora: "asc" },
      include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
    }),
  ]);

  const indicadores = [
    { label: "Aulas hoje", valor: aulasHoje.length, href: "/aulas" },
    { label: "Alunos ativos", valor: alunosAtivos, href: "/alunos" },
    { label: "Instrutores ativos", valor: instrutores, href: "/instrutores" },
    { label: "Veículos ativos", valor: veiculos, href: "/veiculos" },
  ];

  return (
    <>
      <Cabecalho titulo="Painel" acoes={<BotaoLink href="/aulas/nova">Agendar aula</BotaoLink>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {indicadores.map((i) => (
          <Link key={i.label} href={i.href}>
            <Cartao className="hover:border-blue-300">
              <div className="text-sm text-slate-500">{i.label}</div>
              <div className="mt-1 text-3xl font-semibold">{i.valor}</div>
            </Cartao>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Aulas de hoje</h2>
      <Tabela cabecalhos={["Horário", "Aluno", "Tipo", "Instrutor", "Veículo", "Situação", ""]}>
        {aulasHoje.length === 0 && <LinhaVazia colunas={7} texto="Nenhuma aula agendada para hoje." />}
        {aulasHoje.map((a) => (
          <tr key={a.id}>
            <td className="px-4 py-3 font-medium">{formatarHora(a.dataHora)}</td>
            <td className="px-4 py-3">
              <Link href={`/alunos/${a.matricula.alunoId}`} className="text-blue-700 hover:underline">
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
              <AcoesAula aula={a} />
            </td>
          </tr>
        ))}
      </Tabela>
    </>
  );
}
