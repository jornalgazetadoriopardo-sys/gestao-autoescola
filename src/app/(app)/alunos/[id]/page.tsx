import { notFound } from "next/navigation";
import { BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { db } from "@/lib/db";
import { STATUS_ALUNO, formatarCpf, formatarData, formatarTelefone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FichaAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const aluno = await db.aluno.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!aluno) notFound();

  const dados = [
    ["CPF", formatarCpf(aluno.cpf)],
    ["Nascimento", formatarData(aluno.nascimento)],
    ["Telefone", formatarTelefone(aluno.telefone)],
    ["E-mail", aluno.email],
    ["Endereço", aluno.endereco],
    ["Categoria", aluno.categoria],
    ["Status", STATUS_ALUNO[aluno.status] ?? aluno.status],
    ["Cadastrado em", formatarData(aluno.criadoEm)],
  ];

  return (
    <>
      <Cabecalho
        titulo={aluno.nome}
        acoes={
          <>
            <BotaoLink href="/alunos" variante="secundario">
              Voltar
            </BotaoLink>
            <BotaoLink href={`/alunos/${aluno.id}/editar`}>Editar</BotaoLink>
          </>
        }
      />

      <Cartao className="max-w-3xl">
        <h2 className="mb-4 font-semibold">Dados pessoais</h2>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {dados.map(([label, valor]) => (
            <div key={label}>
              <dt className="text-xs uppercase text-slate-500">{label}</dt>
              <dd className="text-sm">{valor || "—"}</dd>
            </div>
          ))}
        </dl>
        {aluno.obs && (
          <div className="mt-4">
            <div className="text-xs uppercase text-slate-500">Observações</div>
            <p className="whitespace-pre-line text-sm">{aluno.obs}</p>
          </div>
        )}
      </Cartao>
    </>
  );
}
