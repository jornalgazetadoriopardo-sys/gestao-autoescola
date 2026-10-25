import { notFound } from "next/navigation";
import { ArrowLeft, HandCoins } from "lucide-react";
import { PagamentoForm } from "@/components/pagamento-form";
import { BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { db } from "@/lib/db";
import { hojeISO, moedaParaInput } from "@/lib/format";
import { receberEtapa } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ReceberEtapaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string }>;
}) {
  const etapa = await db.etapa.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: { matricula: { include: { aluno: true } } },
  });
  if (!etapa) notFound();
  const { voltar = `/alunos/${etapa.matricula.alunoId}` } = await searchParams;
  return (
    <>
      <Cabecalho
        titulo="Receber taxa"
        descricao={`${etapa.matricula.aluno.nome} · ${etapa.descricao}`}
        icone={HandCoins}
        cor="verde"
        acoes={
          <BotaoLink href={voltar} variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      <Cartao className="max-w-3xl">
        <PagamentoForm
          acao={receberEtapa.bind(null, etapa.id)}
          valor={moedaParaInput(etapa.valorCentavos)}
          hoje={hojeISO()}
          voltar={voltar}
          formaInicial="pix"
          comObs={false}
        />
      </Cartao>
    </>
  );
}
