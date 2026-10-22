import { UserPlus } from "lucide-react";
import { Cabecalho } from "@/components/ui";
import { AlunoForm } from "../aluno-form";

export default function NovoAlunoPage() {
  return (
    <>
      <Cabecalho
        titulo="Novo aluno"
        descricao="Preencha os dados. Os campos com * são obrigatórios."
        icone={UserPlus}
      />
      <AlunoForm />
    </>
  );
}
