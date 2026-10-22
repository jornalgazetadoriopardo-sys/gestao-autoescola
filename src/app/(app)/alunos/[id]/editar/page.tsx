import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/ui";
import { db } from "@/lib/db";
import { AlunoForm } from "../../aluno-form";

export default async function EditarAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const aluno = await db.aluno.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!aluno) notFound();

  return (
    <>
      <Cabecalho titulo={`Editar: ${aluno.nome}`} />
      <AlunoForm aluno={aluno} />
    </>
  );
}
