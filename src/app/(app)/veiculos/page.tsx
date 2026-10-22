import Link from "next/link";
import { BellRing, Car, ChevronRight, Plus } from "lucide-react";
import { BotaoLink, Cabecalho, Cartao, Etiqueta, IconeRedondo, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarData } from "@/lib/format";
import { diasAte } from "@/lib/lembretes";

export const dynamic = "force-dynamic";

export default async function VeiculosPage() {
  const veiculos = await db.veiculo.findMany({
    orderBy: [{ ativo: "desc" }, { placa: "asc" }],
    include: {
      manutencoes: {
        where: { lembrarEm: { not: null }, lembreteConcluido: false },
        orderBy: { lembrarEm: "asc" },
        take: 1,
      },
    },
  });

  return (
    <>
      <Cabecalho
        titulo="Veículos"
        descricao="Clique num veículo para ver e registrar manutenções."
        icone={Car}
        acoes={
          <BotaoLink href="/veiculos/novo" icone={Plus}>
            Novo veículo
          </BotaoLink>
        }
      />
      {veiculos.length === 0 ? (
        <Vazio
          icone={Car}
          titulo="Nenhum veículo cadastrado"
          texto="Cadastre os carros e motos usados nas aulas práticas."
          acao={
            <BotaoLink href="/veiculos/novo" icone={Plus}>
              Cadastrar veículo
            </BotaoLink>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {veiculos.map((v) => {
            const lembrete = v.manutencoes[0];
            const vencido = lembrete && diasAte(lembrete.lembrarEm!) <= 0;
            return (
              <Link key={v.id} href={`/veiculos/${v.id}`}>
                <Cartao className={`h-full hover:border-blue-300 ${v.ativo ? "" : "opacity-60"}`}>
                  <div className="flex items-center gap-4">
                    <IconeRedondo icone={Car} cor={v.ativo ? "azul" : "cinza"} />
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-semibold">{v.modelo}</div>
                      <div className="text-base text-slate-600">
                        {v.placa} · Categoria {v.categoria}
                      </div>
                    </div>
                    <ChevronRight className="size-6 text-slate-400" aria-hidden />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    {!v.ativo && <Etiqueta>Inativo</Etiqueta>}
                    {lembrete ? (
                      <span
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium ${
                          vencido ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <BellRing className="size-4" aria-hidden />
                        {lembrete.descricao} · {formatarData(lembrete.lembrarEm)}
                      </span>
                    ) : (
                      <span className="text-slate-500">Nenhum lembrete pendente</span>
                    )}
                  </div>
                </Cartao>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
