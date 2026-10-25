import { notFound } from "next/navigation";
import { Scissors } from "lucide-react";
import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { FORMAS_PAGAMENTO, formatarCpf, formatarData, formatarMoeda } from "@/lib/format";
import { valorPorExtenso } from "@/lib/pagamentos";
import { formatoDe } from "@/lib/formato";
import { CabecalhoDocumento } from "../../cabecalho-documento";
import { Assinatura, CabecalhoCupom, Cupom, LinhaCupom } from "../../cupom";

export const dynamic = "force-dynamic";

export default async function ReciboPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ formato?: string; vias?: string }>;
}) {
  const [parcela, config] = await Promise.all([
    db.parcela.findUnique({
      where: { id: Number((await params).id) || 0 },
      include: { matricula: { include: { aluno: true, _count: { select: { parcelas: true } } } } },
    }),
    obterConfig(),
  ]);
  if (!parcela) notFound();
  if (!parcela.pagoEm) {
    return (
      <p className="p-10 text-center text-lg">
        Esta parcela ainda não foi paga. O recibo só pode ser emitido após o pagamento.
      </p>
    );
  }

  const { formato, vias } = await searchParams;
  if (formatoDe(formato, config.impressoraRecibo) === "termica") {
    const nomes = vias === "2" ? ["Via do aluno", "Via da autoescola"] : ["Via do aluno"];
    const valor = parcela.valorPagoCentavos ?? parcela.valorCentavos;
    const { aluno } = parcela.matricula;
    return (
      <>
        {nomes.map((nome) => (
          <Cupom key={nome}>
            <CabecalhoCupom config={config} titulo="Recibo" />
            <div className="text-center">Nº {String(parcela.id).padStart(6, "0")}</div>
            <div className="tracejado" />
            <LinhaCupom rotulo="Data" valor={formatarData(parcela.pagoEm)} />
            <div className="mt-1">
              Aluno: <b>{aluno.nome}</b>
            </div>
            <div>CPF: {formatarCpf(aluno.cpf)}</div>
            <div className="mt-1">
              Referente:{" "}
              {parcela.matricula.formaPagamento === "carne"
                ? `parcela ${parcela.numero}/${parcela.matricula._count.parcelas} (venc. ${formatarData(parcela.vencimento)})`
                : "matrícula"}{" "}
              · Categoria {parcela.matricula.categoria}
            </div>
            <LinhaCupom rotulo="Forma" valor={FORMAS_PAGAMENTO[parcela.forma ?? ""] ?? parcela.forma} />
            {parcela.obs && <div>{parcela.obs}</div>}
            <div className="tracejado" />
            <LinhaCupom rotulo="VALOR PAGO" valor={formatarMoeda(valor)} forte />
            <div className="text-[11px]">({valorPorExtenso(valor)})</div>
            <div className="tracejado" />
            <Assinatura texto={config.nome} />
            <div className="mt-2 text-center text-[11px] uppercase">{nome}</div>
          </Cupom>
        ))}
      </>
    );
  }

  const via = (nome: string) => (
    <div className="flex h-[132mm] flex-col">
      <CabecalhoDocumento config={config} titulo="Recibo" compacto />
      <div className="mt-3 flex items-center justify-between text-sm">
        <span>
          Nº <b>{String(parcela.id).padStart(6, "0")}</b>
        </span>
        <span className="rounded border-2 border-slate-800 px-3 py-1 text-lg font-bold">
          {formatarMoeda(parcela.valorPagoCentavos ?? parcela.valorCentavos)}
        </span>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed">
        Recebemos de <b>{parcela.matricula.aluno.nome}</b>, CPF {formatarCpf(parcela.matricula.aluno.cpf)}, a
        importância de <b>{formatarMoeda(parcela.valorPagoCentavos ?? parcela.valorCentavos)}</b> (
        {valorPorExtenso(parcela.valorPagoCentavos ?? parcela.valorCentavos)}), referente à{" "}
        {parcela.matricula.formaPagamento === "carne"
          ? `parcela ${parcela.numero} de ${parcela.matricula._count.parcelas}`
          : "matrícula"}{" "}
        do curso de habilitação categoria {parcela.matricula.categoria}
        {parcela.matricula.formaPagamento === "carne" && `, com vencimento em ${formatarData(parcela.vencimento)}`}.
      </p>
      <p className="mt-2 text-sm">
        Forma de pagamento: <b>{FORMAS_PAGAMENTO[parcela.forma ?? ""] ?? parcela.forma}</b>
        {parcela.obs && ` — ${parcela.obs}`}
      </p>
      <p className="mt-auto text-sm">
        {config.cidade ? `${config.cidade}, ` : ""}
        {formatarData(parcela.pagoEm)}
      </p>
      <div className="mt-10 flex items-end justify-between">
        <div className="w-80 border-t border-slate-800 pt-1 text-center text-sm">{config.nome}</div>
        <span className="text-xs uppercase text-slate-500">{nome}</span>
      </div>
    </div>
  );

  return (
    <div className="folha">
      {via("Via do aluno")}
      <div className="my-[5mm] flex items-center gap-2 text-slate-400">
        <Scissors className="size-4" aria-hidden />
        <div className="flex-1 border-t-2 border-dashed border-slate-400" />
      </div>
      {via("Via da autoescola")}
    </div>
  );
}
