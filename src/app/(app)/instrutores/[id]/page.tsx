import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { Cabecalho } from "@/components/ui";
import { db } from "@/lib/db";
import { excluirInstrutor } from "../actions";
import { InstrutorForm } from "../instrutor-form";

export default async function EditarInstrutorPage({ params }: { params: Promise<{ id: string }> }) {
  const instrutor = await db.instrutor.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: { _count: { select: { aulas: true } } },
  });
  if (!instrutor) notFound();
  const aulas = instrutor._count.aulas;

  return (
    <>
      <Cabecalho
        titulo="Editar instrutor"
        descricao={instrutor.nome}
        icone={Pencil}
        acoes={
          <BotaoConfirmar
            acao={excluirInstrutor.bind(null, instrutor.id)}
            mensagem={
              aulas > 0
                ? `Excluir ${instrutor.nome}?\n\nAs ${aulas} aula(s) dele continuam na agenda, mas ficam sem instrutor. Se ele só parou de trabalhar, prefira desmarcar "Ativo".`
                : `Excluir ${instrutor.nome}?`
            }
            icone="excluir"
          >
            Excluir instrutor
          </BotaoConfirmar>
        }
      />
      <InstrutorForm instrutor={instrutor} />
    </>
  );
}
