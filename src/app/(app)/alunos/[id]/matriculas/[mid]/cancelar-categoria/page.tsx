import { notFound } from "next/navigation";
import { ArrowLeft, CircleMinus } from "lucide-react";
import { BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { db } from "@/lib/db";
import { praticasPorCategoria, resumoPorCategoria } from "@/lib/aulas";
import { semCategoria } from "@/lib/categorias";
import { CancelarCategoriaForm } from "./cancelar-categoria-form";

export const dynamic = "force-dynamic";

export default async function CancelarCategoriaPage({ params }: { params: Promise<{ id: string; mid: string }> }) {
  const { id, mid } = await params;
  const matricula = await db.matricula.findUnique({
    where: { id: Number(mid) || 0 },
    include: {
      aluno: true,
      aulas: { select: { tipo: true, status: true, categoria: true } },
      etapas: { where: { tipo: "exame_pratico" } },
    },
  });
  if (!matricula || matricula.alunoId !== Number(id)) notFound();
  const voltar = `/alunos/${matricula.alunoId}`;
  const letras = [...new Set(matricula.categoria.split(""))];
  const mapa = praticasPorCategoria(matricula);
  const resumo = resumoPorCategoria(matricula, matricula.aulas);

  // O que acontece ao deixar cada categoria.
  const opcoes = letras.map((letra) => {
    const r = resumo.find((x) => x.categoria === letra);
    const fica = semCategoria(matricula.categoria, letra);
    return {
      letra,
      fica,
      aulasAgendadas: matricula.aulas.filter(
        (a) => a.tipo === "pratica" && a.status === "agendada" && a.categoria === letra,
      ).length,
      aulasFeitas: r?.feitas ?? null,
      provaSai: matricula.etapas.some((e) => e.categoria === letra && e.resultado === null && !e.pagoEm),
      praticasQueFicam: mapa?.[fica] ?? matricula.qtdPraticas,
    };
  });

  return (
    <>
      <Cabecalho
        titulo="Cancelar uma categoria"
        descricao={`${matricula.aluno.nome} · matrícula categoria ${matricula.categoria}`}
        icone={CircleMinus}
        cor="vermelho"
        acoes={
          <BotaoLink href={voltar} variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      {letras.length < 2 ? (
        <Cartao className="max-w-2xl">
          <p className="text-base">
            Esta matrícula tem uma categoria só. Se o aluno desistiu de tudo, exclua a matrícula ou mude a situação do
            aluno para &quot;Desistente&quot;.
          </p>
        </Cartao>
      ) : (
        <Cartao className="max-w-2xl">
          <CancelarCategoriaForm matriculaId={matricula.id} opcoes={opcoes} />
        </Cartao>
      )}
    </>
  );
}
