import { notFound } from "next/navigation";
import { ArrowLeft, Megaphone } from "lucide-react";
import { BotaoLink, Cabecalho } from "@/components/ui";
import { db } from "@/lib/db";
import { urlFoto } from "@/lib/foto";
import { hojeISO } from "@/lib/format";
import { somarDias } from "@/lib/aulas";
import { MODELOS_POST } from "@/lib/posts";
import { EditorPost, type AlunoPost } from "../editor-post";
import { marcaDaAutoescola } from "../marca";

export const dynamic = "force-dynamic";

export default async function NovoPostPage({ searchParams }: { searchParams: Promise<{ modelo?: string }> }) {
  const modelo = (await searchParams).modelo ?? "";
  const def = MODELOS_POST[modelo];
  if (!def) notFound();
  const comAluno = modelo === "aprovado" || modelo === "depoimento";
  const desde = new Date(`${somarDias(hojeISO(), -60)}T00:00:00Z`);

  const [marca, alunos, aprovados] = await Promise.all([
    marcaDaAutoescola(),
    comAluno
      ? db.aluno.findMany({
          where: { status: { in: ["ativo", "concluido"] } },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, categoria: true, fotoEm: true },
        })
      : [],
    comAluno
      ? db.etapa.findMany({
          where: { tipo: "exame_pratico", resultado: "ok", data: { gte: desde } },
          select: { matricula: { select: { alunoId: true } } },
        })
      : [],
  ]);
  const idsAprovados = new Set(aprovados.map((e) => e.matricula.alunoId));
  const lista: AlunoPost[] = alunos.map((a) => ({
    id: a.id,
    nome: a.nome,
    categoria: a.categoria,
    foto: urlFoto(a),
    aprovado: idsAprovados.has(a.id),
  }));

  return (
    <>
      <Cabecalho
        titulo={def.titulo}
        descricao={def.descricao}
        icone={Megaphone}
        cor="roxo"
        acoes={
          <BotaoLink href="/posts" variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      <EditorPost modelo={modelo} marca={marca} alunos={lista} />
    </>
  );
}
