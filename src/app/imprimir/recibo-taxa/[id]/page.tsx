import { notFound } from "next/navigation";
import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { FORMAS_PAGAMENTO, formatarCpf, formatarData, formatarMoeda } from "@/lib/format";
import { formatoDe } from "@/lib/formato";
import { valorPorExtenso } from "@/lib/pagamentos";
import { CabecalhoDocumento } from "../../cabecalho-documento";
import { Assinatura, CabecalhoCupom, Cupom, LinhaCupom } from "../../cupom";

export const dynamic = "force-dynamic";

// Recibo de exame/taxa que a autoescola cobrou do aluno (A4 ou térmica).
export default async function ReciboTaxaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ formato?: string; vias?: string }>;
}) {
  const [etapa, config] = await Promise.all([
    db.etapa.findUnique({
      where: { id: Number((await params).id) || 0 },
      include: { matricula: { include: { aluno: true } } },
    }),
    obterConfig(),
  ]);
  if (!etapa) notFound();
  if (!etapa.pagoEm || etapa.valorCentavos == null) {
    return (
      <p className="p-10 text-center text-lg">Esta taxa ainda não foi paga. O recibo só sai depois do pagamento.</p>
    );
  }
  const { aluno } = etapa.matricula;
  const valor = etapa.valorCentavos;
  const forma = FORMAS_PAGAMENTO[etapa.forma ?? ""] ?? etapa.forma ?? "";
  const numero = `T${String(etapa.id).padStart(6, "0")}`;
  const { formato, vias } = await searchParams;
  const nomes = vias === "2" ? ["Via do aluno", "Via da autoescola"] : ["Via do aluno"];

  if (formatoDe(formato, config.impressoraRecibo) === "termica") {
    return (
      <>
        {nomes.map((nome) => (
          <Cupom key={nome}>
            <CabecalhoCupom config={config} titulo="Recibo" />
            <div className="text-center">Nº {numero}</div>
            <div className="tracejado" />
            <LinhaCupom rotulo="Data" valor={formatarData(etapa.pagoEm)} />
            <div className="mt-1">
              Aluno: <b>{aluno.nome}</b>
            </div>
            <div>CPF: {formatarCpf(aluno.cpf)}</div>
            <div className="mt-1">Referente: {etapa.descricao}</div>
            <LinhaCupom rotulo="Forma" valor={forma} />
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

  return (
    <div className="folha">
      {["Via do aluno", "Via da autoescola"].map((nome, i) => (
        <div
          key={nome}
          className={`flex h-[132mm] flex-col ${i === 0 ? "border-b-2 border-dashed border-slate-400 pb-[5mm]" : "pt-[5mm]"}`}
        >
          <CabecalhoDocumento config={config} titulo="Recibo" compacto />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span>
              Nº <b>{numero}</b>
            </span>
            <span className="rounded border-2 border-slate-800 px-3 py-1 text-lg font-bold">
              {formatarMoeda(valor)}
            </span>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed">
            Recebemos de <b>{aluno.nome}</b>, CPF {formatarCpf(aluno.cpf)}, a importância de{" "}
            <b>{formatarMoeda(valor)}</b> ({valorPorExtenso(valor)}), referente a <b>{etapa.descricao}</b> do processo
            de habilitação categoria {etapa.matricula.categoria}.
          </p>
          <p className="mt-2 text-sm">
            Forma de pagamento: <b>{forma}</b>
          </p>
          <p className="mt-auto text-sm">
            {config.cidade ? `${config.cidade}, ` : ""}
            {formatarData(etapa.pagoEm)}
          </p>
          <div className="mt-10 flex items-end justify-between">
            <div className="w-80 border-t border-slate-800 pt-1 text-center text-sm">{config.nome}</div>
            <span className="text-xs uppercase text-slate-500">{nome}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
