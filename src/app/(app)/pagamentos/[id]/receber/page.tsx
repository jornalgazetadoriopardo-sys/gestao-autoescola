import { notFound } from "next/navigation";
import { CircleCheck, HandCoins, Printer } from "lucide-react";
import { Aviso, BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarCpf, formatarData, formatarMoeda, hojeISO, moedaParaInput, situacaoParcela } from "@/lib/format";
import { receberParcela } from "../../actions";
import { PagamentoForm } from "@/components/pagamento-form";

export const dynamic = "force-dynamic";

export default async function ReceberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string }>;
}) {
  const parcela = await db.parcela.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: { matricula: { include: { aluno: true, _count: { select: { parcelas: true } } } } },
  });
  if (!parcela) notFound();
  const { aluno } = parcela.matricula;
  const voltar = (await searchParams).voltar ?? `/alunos/${aluno.id}`;
  const atrasada = situacaoParcela(parcela) === "atrasado";

  return (
    <>
      <Cabecalho
        titulo="Receber pagamento"
        descricao="Confira os dados e confirme o recebimento."
        icone={HandCoins}
        cor="verde"
      />

      {parcela.pagoEm ? (
        <Aviso tipo="sucesso" icone={CircleCheck}>
          Esta parcela já foi paga em {formatarData(parcela.pagoEm)}.
          <BotaoLink href={`/imprimir/recibo/${parcela.id}`} target="_blank" tamanho="pequeno" icone={Printer}>
            Imprimir recibo
          </BotaoLink>
        </Aviso>
      ) : (
        <div className="grid max-w-4xl gap-6">
          <Cartao className="grid gap-4 bg-slate-50 sm:grid-cols-4">
            <Info rotulo="Aluno" valor={aluno.nome} extra={formatarCpf(aluno.cpf)} />
            <Info
              rotulo="Parcela"
              valor={`${parcela.numero} de ${parcela.matricula._count.parcelas}`}
              extra={`Categoria ${parcela.matricula.categoria}`}
            />
            <Info
              rotulo="Vencimento"
              valor={formatarData(parcela.vencimento)}
              extra={atrasada ? "Em atraso" : undefined}
              alerta={atrasada}
            />
            <Info rotulo="Valor" valor={formatarMoeda(parcela.valorCentavos)} />
          </Cartao>
          <Cartao>
            <PagamentoForm
              acao={receberParcela.bind(null, parcela.id)}
              valor={moedaParaInput(parcela.valorCentavos)}
              hoje={hojeISO()}
              voltar={voltar}
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
