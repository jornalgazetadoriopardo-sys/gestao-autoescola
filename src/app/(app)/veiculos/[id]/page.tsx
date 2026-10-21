import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/ui";
import { db } from "@/lib/db";
import { VeiculoForm } from "../veiculo-form";

export default async function EditarVeiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const veiculo = await db.veiculo.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!veiculo) notFound();

  return (
    <>
      <Cabecalho titulo={`Editar: ${veiculo.placa}`} />
      <VeiculoForm veiculo={veiculo} />
    </>
  );
}
