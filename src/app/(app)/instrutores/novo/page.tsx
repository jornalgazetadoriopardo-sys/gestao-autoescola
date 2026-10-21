import { Cabecalho } from "@/components/ui";
import { InstrutorForm } from "../instrutor-form";

export default function NovoInstrutorPage() {
  return (
    <>
      <Cabecalho titulo="Novo instrutor" />
      <InstrutorForm />
    </>
  );
}
