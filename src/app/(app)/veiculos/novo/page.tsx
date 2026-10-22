import { Cabecalho } from "@/components/ui";
import { VeiculoForm } from "../veiculo-form";

export default function NovoVeiculoPage() {
  return (
    <>
      <Cabecalho titulo="Novo veículo" />
      <VeiculoForm />
    </>
  );
}
