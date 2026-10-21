import { Cabecalho } from "@/components/ui";
import { AlunoForm } from "../aluno-form";

export default function NovoAlunoPage() {
  return (
    <>
      <Cabecalho titulo="Novo aluno" />
      <AlunoForm />
    </>
  );
}
