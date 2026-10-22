import { redirect } from "next/navigation";

// O formulário da tela de relatórios envia ?id=; encaminha para a página do aluno.
export default async function RelatorioAlunoRedirect({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const id = Number((await searchParams).id) || 0;
  redirect(id ? `/imprimir/aluno/${id}` : "/relatorios");
}
