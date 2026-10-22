import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/ui";
import { db } from "@/lib/db";
import { InstrutorForm } from "../instrutor-form";

export default async function EditarInstrutorPage({ params }: { params: Promise<{ id: string }> }) {
  const instrutor = await db.instrutor.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!instrutor) notFound();

  return (
    <>
      <Cabecalho titulo={`Editar: ${instrutor.nome}`} />
      <InstrutorForm instrutor={instrutor} />
    </>
  );
}
