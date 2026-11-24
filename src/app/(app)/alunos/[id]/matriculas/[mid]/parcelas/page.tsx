import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ScrollText } from "lucide-react";
import { BotaoLink, Cabecalho } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarMoeda, hojeISO } from "@/lib/format";
import { valorSemParcelas } from "@/lib/pagamentos";
import { GerarParcelasForm } from "./gerar-parcelas-form";

export const dynamic = "force-dynamic";

// Gera as parcelas do valor da matrícula que ainda não tem parcelas
// (ex.: matrícula criada com valor 0 e corrigida depois).
export default async function GerarParcelasPage({ params }: { params: Promise<{ id: string; mid: string }> }) {
  const { id, mid } = await params;
  const matricula = await db.matricula.findUnique({
    where: { id: Number(mid) || 0 },
    include: { aluno: true, parcelas: true },
  });
  if (!matricula || matricula.alunoId !== Number(id)) notFound();
  const voltar = `/alunos/${matricula.alunoId}`;
  const valor = valorSemParcelas(matricula);
  if (valor <= 0) redirect(voltar);

  return (
    <>
      <Cabecalho
        titulo="Gerar parcelas"
        descricao={`${matricula.aluno.nome} · ${formatarMoeda(valor)} ainda sem parcelas`}
        icone={ScrollText}
        cor="verde"
        acoes={
          <BotaoLink href={voltar} variante="secundario" icone={ArrowLeft}>
            Agora não
          </BotaoLink>
        }
      />
      <GerarParcelasForm
        matriculaId={matricula.id}
        valor={valor}
        hoje={hojeISO()}
        primeira={matricula.parcelas.length === 0}
      />
    </>
  );
}
