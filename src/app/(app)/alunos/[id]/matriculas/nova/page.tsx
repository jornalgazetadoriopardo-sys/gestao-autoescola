import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/ui";
import { db } from "@/lib/db";
import { hojeISO } from "@/lib/format";
import { MatriculaForm } from "../matricula-form";

export default async function NovaMatriculaPage({ params }: { params: Promise<{ id: string }> }) {
  const aluno = await db.aluno.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!aluno) notFound();

  return (
    <>
      <Cabecalho titulo={`Nova matrícula: ${aluno.nome}`} />
      <MatriculaForm alunoId={aluno.id} categoria={aluno.categoria} hoje={hojeISO()} />
    </>
  );
}
