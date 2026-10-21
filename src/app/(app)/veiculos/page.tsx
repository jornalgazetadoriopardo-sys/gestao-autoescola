import Link from "next/link";
import { BotaoLink, Cabecalho, Etiqueta, LinhaVazia, Tabela } from "@/components/ui";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VeiculosPage() {
  const veiculos = await db.veiculo.findMany({ orderBy: [{ ativo: "desc" }, { placa: "asc" }] });

  return (
    <>
      <Cabecalho titulo="Veículos" acoes={<BotaoLink href="/veiculos/novo">Novo veículo</BotaoLink>} />
      <Tabela cabecalhos={["Placa", "Modelo", "Categoria", "Situação"]}>
        {veiculos.length === 0 && <LinhaVazia colunas={4} texto="Nenhum veículo cadastrado." />}
        {veiculos.map((v) => (
          <tr key={v.id} className="hover:bg-slate-50">
            <td className="px-4 py-3">
              <Link href={`/veiculos/${v.id}`} className="font-medium text-blue-700 hover:underline">
                {v.placa}
              </Link>
            </td>
            <td className="px-4 py-3">{v.modelo}</td>
            <td className="px-4 py-3">{v.categoria}</td>
            <td className="px-4 py-3">
              {v.ativo ? <Etiqueta cor="verde">Ativo</Etiqueta> : <Etiqueta>Inativo</Etiqueta>}
            </td>
          </tr>
        ))}
      </Tabela>
    </>
  );
}
