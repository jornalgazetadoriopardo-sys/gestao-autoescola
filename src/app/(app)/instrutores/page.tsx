import Link from "next/link";
import { BotaoLink, Cabecalho, Etiqueta, LinhaVazia, Tabela } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarTelefone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InstrutoresPage() {
  const instrutores = await db.instrutor.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] });

  return (
    <>
      <Cabecalho titulo="Instrutores" acoes={<BotaoLink href="/instrutores/novo">Novo instrutor</BotaoLink>} />
      <Tabela cabecalhos={["Nome", "Telefone", "Categorias", "Situação"]}>
        {instrutores.length === 0 && <LinhaVazia colunas={4} texto="Nenhum instrutor cadastrado." />}
        {instrutores.map((i) => (
          <tr key={i.id} className="hover:bg-slate-50">
            <td className="px-4 py-3">
              <Link href={`/instrutores/${i.id}`} className="font-medium text-blue-700 hover:underline">
                {i.nome}
              </Link>
            </td>
            <td className="px-4 py-3">{formatarTelefone(i.telefone)}</td>
            <td className="px-4 py-3">{i.categorias.replaceAll(",", ", ")}</td>
            <td className="px-4 py-3">
              {i.ativo ? <Etiqueta cor="verde">Ativo</Etiqueta> : <Etiqueta>Inativo</Etiqueta>}
            </td>
          </tr>
        ))}
      </Tabela>
    </>
  );
}
