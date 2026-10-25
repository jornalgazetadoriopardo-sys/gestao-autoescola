import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { Cabecalho } from "@/components/ui";
import { db } from "@/lib/db";
import { excluirVeiculo } from "../../actions";
import { VeiculoForm } from "../../veiculo-form";

export default async function EditarVeiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const veiculo = await db.veiculo.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: { _count: { select: { aulas: true, manutencoes: true } } },
  });
  if (!veiculo) notFound();
  const { aulas, manutencoes } = veiculo._count;

  return (
    <>
      <Cabecalho
        titulo="Editar veículo"
        descricao={`${veiculo.modelo} · ${veiculo.placa}`}
        icone={Pencil}
        acoes={
          <BotaoConfirmar
            acao={excluirVeiculo.bind(null, veiculo.id)}
            mensagem={`Excluir o veículo ${veiculo.placa}?\n\nO histórico de ${manutencoes} manutenção(ões) será apagado. ${aulas} aula(s) e os abastecimentos continuam registrados, sem veículo. Se ele só saiu de uso, prefira desmarcar "Ativo".`}
            icone="excluir"
          >
            Excluir veículo
          </BotaoConfirmar>
        }
      />
      <VeiculoForm veiculo={veiculo} />
    </>
  );
}
