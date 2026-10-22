import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search, UserPlus, Users } from "lucide-react";
import { BotaoLink, Botao, Cabecalho, Etiqueta, Input, Select, Tabela, Vazio } from "@/components/ui";
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
    where.OR = [{ nome: { contains: busca, mode: "insensitive" } }];
    if (digitos) where.OR.push({ cpf: { contains: digitos } });
  }

  const alunos = await db.aluno.findMany({ where, orderBy: { nome: "asc" }, take: 200 });

  return (
    <>
      <Cabecalho
        titulo="Alunos"
        descricao="Clique no nome do aluno para ver a ficha completa."
        icone={Users}
        acoes={
          <BotaoLink href="/alunos/novo" icone={UserPlus}>
            Novo aluno
          </BotaoLink>
        }
      />

      <form className="mb-5 flex flex-wrap gap-3">
        <Input name="q" placeholder="Buscar por nome ou CPF" defaultValue={q} className="w-72" />
        <Select name="status" defaultValue={status} className="w-44">
          {Object.entries(STATUS_ALUNO).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
          <option value="todos">Todos</option>
        </Select>
        <Botao variante="secundario" icone={Search}>
          Buscar
        </Botao>
      </form>

      {alunos.length === 0 ? (
        <Vazio
          icone={Users}
          titulo={q ? "Nenhum aluno encontrado" : "Nenhum aluno por aqui ainda"}
          texto={q ? "Confira o nome ou o CPF digitado." : "Comece cadastrando o primeiro aluno."}
          acao={
            <BotaoLink href="/alunos/novo" icone={UserPlus}>
              Cadastrar aluno
            </BotaoLink>
          }
        />
      ) : (
        <Tabela cabecalhos={["Nome", "CPF", "Telefone", "Categoria", "Situação"]}>
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
      )}
    </>
  );
}
