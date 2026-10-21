import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { BotaoLink, Botao, Cabecalho, Etiqueta, Input, LinhaVazia, Select, Tabela } from "@/components/ui";
import { db } from "@/lib/db";
import { STATUS_ALUNO, formatarCpf, formatarTelefone, somenteDigitos } from "@/lib/format";

export const dynamic = "force-dynamic";

const corStatus = { ativo: "verde", concluido: "azul", desistente: "cinza" } as const;

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "ativo" } = await searchParams;
  const busca = q.trim();
  const digitos = somenteDigitos(busca);

  const where: Prisma.AlunoWhereInput = {};
  if (status !== "todos") where.status = status;
  if (busca) {
    where.OR = [{ nome: { contains: busca } }];
    if (digitos) where.OR.push({ cpf: { contains: digitos } });
  }

  const alunos = await db.aluno.findMany({ where, orderBy: { nome: "asc" }, take: 200 });

  return (
    <>
      <Cabecalho titulo="Alunos" acoes={<BotaoLink href="/alunos/novo">Novo aluno</BotaoLink>} />

      <form className="mb-4 flex flex-wrap gap-2">
        <Input name="q" placeholder="Buscar por nome ou CPF" defaultValue={q} className="max-w-xs" />
        <Select name="status" defaultValue={status} className="max-w-40">
          {Object.entries(STATUS_ALUNO).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
          <option value="todos">Todos</option>
        </Select>
        <Botao variante="secundario">Filtrar</Botao>
      </form>

      <Tabela cabecalhos={["Nome", "CPF", "Telefone", "Categoria", "Status"]}>
        {alunos.length === 0 && <LinhaVazia colunas={5} texto="Nenhum aluno encontrado." />}
        {alunos.map((a) => (
          <tr key={a.id} className="hover:bg-slate-50">
            <td className="px-4 py-3">
              <Link href={`/alunos/${a.id}`} className="font-medium text-blue-700 hover:underline">
                {a.nome}
              </Link>
            </td>
            <td className="px-4 py-3">{formatarCpf(a.cpf)}</td>
            <td className="px-4 py-3">{formatarTelefone(a.telefone)}</td>
            <td className="px-4 py-3">{a.categoria}</td>
            <td className="px-4 py-3">
              <Etiqueta cor={corStatus[a.status as keyof typeof corStatus] ?? "cinza"}>
                {STATUS_ALUNO[a.status] ?? a.status}
              </Etiqueta>
            </td>
          </tr>
        ))}
      </Tabela>
    </>
  );
}
