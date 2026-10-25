import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, Trash2, TriangleAlert } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Aviso, BotaoLink, Cabecalho, Campo, Cartao, Input } from "@/components/ui";
import { exigirSuperadmin } from "@/lib/auth";
import { dbGlobal } from "@/lib/db";
import { excluirAutoescola } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ExcluirAutoescolaPage({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSuperadmin();
  const autoescola = await dbGlobal.autoescola.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: { _count: { select: { usuarios: true, alunos: true, veiculos: true, despesas: true } } },
  });
  if (!autoescola) notFound();
  if (autoescola.ativo || autoescola.id === sessao.autoescolaId) redirect("/plataforma");
  const c = autoescola._count;

  return (
    <>
      <Cabecalho
        titulo="Excluir autoescola"
        descricao={autoescola.nome}
        icone={Trash2}
        cor="vermelho"
        acoes={
          <BotaoLink href="/plataforma" variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      <div className="max-w-2xl space-y-5">
        <Aviso tipo="erro" icone={TriangleAlert}>
          <span>
            Isso apaga <b>para sempre</b> a autoescola e tudo dela: {c.usuarios} usuário(s), {c.alunos} aluno(s) com
            matrículas, aulas e pagamentos, {c.veiculos} veículo(s) e {c.despesas} despesa(s). Não dá para desfazer.
          </span>
        </Aviso>
        <Cartao>
          <p className="mb-4 text-base text-slate-700">
            Se quiser guardar uma cópia, baixe antes:{" "}
            <a
              href={`/plataforma/exportar/${autoescola.id}`}
              download
              className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
            >
              <Download className="size-4" aria-hidden /> Exportar dados
            </a>
          </p>
          <FormAcao acao={excluirAutoescola.bind(null, autoescola.id)} textoBotao="Excluir para sempre">
            <Campo label={`Para confirmar, digite o nome: ${autoescola.nome}`}>
              <Input name="confirmacao" required autoComplete="off" />
            </Campo>
          </FormAcao>
        </Cartao>
      </div>
    </>
  );
}
