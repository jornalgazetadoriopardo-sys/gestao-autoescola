import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, HandCoins } from "lucide-react";
import { Aviso, BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatarData, formatarMoeda, hojeISO, moedaParaInput } from "@/lib/format";
import { situacaoDespesa, tituloCategoria } from "@/lib/despesas";
import { pagarDespesa } from "../../actions";
import { PagamentoForm } from "@/components/pagamento-form";

export const dynamic = "force-dynamic";

export default async function PagarDespesaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string }>;
}) {
  await exigirAdmin();
  const despesa = await db.despesa.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!despesa) notFound();
  const voltar = (await searchParams).voltar ?? "/despesas";
  const atrasada = situacaoDespesa(despesa) === "atrasada";

  return (
    <>
      <Cabecalho
        titulo="Pagar despesa"
        descricao="Confira os dados e confirme o pagamento."
        icone={HandCoins}
        cor="vermelho"
        acoes={
          <BotaoLink href={voltar.startsWith("/") ? voltar : "/despesas"} variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      {despesa.pagoEm ? (
        <Aviso tipo="sucesso" icone={CircleCheck}>
          Esta despesa já foi paga em {formatarData(despesa.pagoEm)}.
        </Aviso>
      ) : (
        <div className="grid max-w-4xl gap-6">
          <Cartao className="grid gap-4 bg-slate-50 sm:grid-cols-4">
            <Info rotulo="Despesa" valor={despesa.descricao} extra={tituloCategoria(despesa.categoria)} />
            <Info rotulo="Para" valor={despesa.favorecido ?? "—"} />
            <Info
              rotulo="Vencimento"
              valor={formatarData(despesa.vencimento)}
              extra={atrasada ? "Em atraso" : undefined}
              alerta={atrasada}
            />
            <Info rotulo="Valor" valor={formatarMoeda(despesa.valorCentavos)} />
          </Cartao>
          <Cartao>
            <PagamentoForm
              acao={pagarDespesa.bind(null, despesa.id)}
              valor={moedaParaInput(despesa.valorCentavos)}
              hoje={hojeISO()}
              voltar={voltar}
              rotuloValor="Valor pago (R$)"
              formaInicial="pix"
              comObs={false}
            />
          </Cartao>
        </div>
      )}
    </>
  );
}

function Info({ rotulo, valor, extra, alerta }: { rotulo: string; valor: string; extra?: string; alerta?: boolean }) {
  return (
    <div>
      <div className="text-sm font-medium uppercase text-slate-500">{rotulo}</div>
      <div className="text-lg font-semibold">{valor}</div>
      {extra && <div className={`text-sm ${alerta ? "font-semibold text-red-700" : "text-slate-600"}`}>{extra}</div>}
    </div>
  );
}
