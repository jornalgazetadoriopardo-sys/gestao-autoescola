import { notFound } from "next/navigation";
import { Scissors } from "lucide-react";
import type { Configuracao, Parcela } from "@prisma/client";
import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { formatarCpf, formatarData, formatarMoeda } from "@/lib/format";
import { formatoDe } from "@/lib/formato";
import { SO_PARCELAS } from "@/lib/pagamentos";
import { CabecalhoCupom, Cupom, LinhaCupom } from "../../cupom";
import { QrPix } from "../../qr-pix";

export const dynamic = "force-dynamic";

const POR_FOLHA = 4;

// Carnê: 4 parcelas por folha A4. Cada parcela tem a via do aluno (fica no
// carnê) e a via da autoescola (destacada e guardada quando o aluno paga).
export default async function CarnePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ formato?: string }>;
}) {
  const [matricula, config] = await Promise.all([
    db.matricula.findUnique({
      where: { id: Number((await params).id) || 0 },
      include: { aluno: true, parcelas: { where: SO_PARCELAS, orderBy: { numero: "asc" } } },
    }),
    obterConfig(),
  ]);
  if (!matricula) notFound();
  if (matricula.parcelas.length === 0) {
    return <p className="p-10 text-center text-lg">Esta matrícula não tem parcelas para imprimir.</p>;
  }

  // Térmica: um cupom por parcela (o aluno guarda e traz no dia de pagar).
  if (formatoDe((await searchParams).formato, config.impressoraRecibo) === "termica") {
    const total = matricula.parcelas.length;
    return (
      <>
        {matricula.parcelas.map((p) => (
          <Cupom key={p.id}>
            <CabecalhoCupom config={config} titulo={`Parcela ${p.numero}/${total}`} />
            <div className="tracejado" />
            <div>
              Aluno: <b>{matricula.aluno.nome}</b>
            </div>
            <div>CPF: {formatarCpf(matricula.aluno.cpf)}</div>
            <div>Categoria {matricula.categoria}</div>
            <div className="tracejado" />
            <LinhaCupom rotulo="VENCIMENTO" valor={formatarData(p.vencimento)} forte />
            <LinhaCupom rotulo="VALOR" valor={formatarMoeda(p.valorCentavos)} forte />
            {p.pagoEm && <div className="mt-1 text-center font-bold">PAGA EM {formatarData(p.pagoEm)}</div>}
            {config.chavePix && (
              <>
                <div className="tracejado" />
                <div>
                  Pague com Pix: <b className="break-all">{config.chavePix}</b>
                </div>
                {!p.pagoEm && (
                  <div className="mt-1 flex flex-col items-center">
                    <QrPix
                      config={config}
                      valorCentavos={p.valorCentavos}
                      identificador={`PARC${p.id}`}
                      className="size-[34mm]"
                    />
                    <div className="mt-0.5 text-[11px]">Aponte a câmera do app do banco</div>
                  </div>
                )}
              </>
            )}
            {config.avisoCarne && <div className="mt-1 text-[11px]">{config.avisoCarne}</div>}
            <div className="tracejado" />
            <div className="mt-5 flex gap-3 text-[11px]">
              <div className="flex-1 border-t border-black pt-0.5 text-center">Pago em</div>
              <div className="flex-1 border-t border-black pt-0.5 text-center">Recebido por</div>
            </div>
          </Cupom>
        ))}
      </>
    );
  }

  const folhas: Parcela[][] = [];
  for (let i = 0; i < matricula.parcelas.length; i += POR_FOLHA) {
    folhas.push(matricula.parcelas.slice(i, i + POR_FOLHA));
  }
  const aluno = { nome: matricula.aluno.nome, cpf: formatarCpf(matricula.aluno.cpf) };

  return (
    <>
      {folhas.map((parcelas, i) => (
        <div key={i} className={`folha ${i < folhas.length - 1 ? "quebra" : ""}`}>
          {parcelas.map((p) => (
            <Lamina
              key={p.id}
              parcela={p}
              total={matricula.parcelas.length}
              categoria={matricula.categoria}
              aluno={aluno}
              config={config}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function Lamina({
  parcela,
  total,
  categoria,
  aluno,
  config,
}: {
  parcela: Parcela;
  total: number;
  categoria: string;
  aluno: { nome: string; cpf: string };
  config: Configuracao;
}) {
  const valor = formatarMoeda(parcela.valorCentavos);
  const numero = `${String(parcela.numero).padStart(2, "0")}/${String(total).padStart(2, "0")}`;

  return (
    <div className="relative flex h-[68.5mm] border-b-2 border-dashed border-slate-400 text-[11px] leading-tight last:border-b-0">
      <Scissors className="absolute -bottom-2 left-0 size-3.5 bg-white text-slate-400 print:hidden" aria-hidden />

      {/* Via do aluno: fica no carnê */}
      <div className="flex w-[52mm] shrink-0 flex-col gap-1 border-r-2 border-dotted border-slate-400 py-2 pr-3">
        <div className="truncate text-xs font-bold">{config.nome}</div>
        <Campo rotulo="Parcela" valor={numero} />
        <Campo rotulo="Vencimento" valor={formatarData(parcela.vencimento)} destaque />
        <Campo rotulo="Valor" valor={valor} destaque />
        <Campo rotulo="Aluno" valor={aluno.nome} />
        <div className="mt-auto space-y-2 pt-1">
          <Linha rotulo="Pago em" />
          <Linha rotulo="Visto" />
        </div>
        <div className="text-center text-[9px] uppercase text-slate-500">Via do aluno</div>
      </div>

      {/* Via da autoescola: destacar no pagamento */}
      <div className="flex flex-1 flex-col gap-1.5 py-2 pl-3">
        <div className="flex items-center gap-2 border-b border-slate-300 pb-1.5">
          {config.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logo} alt="" className="h-9 w-auto" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{config.nome}</div>
            <div className="text-[10px] leading-tight text-slate-700">
              {[
                config.cnpj && `CNPJ ${config.cnpj}`,
                config.telefone && `Tel. ${config.telefone}`,
                config.whatsapp && `WhatsApp ${config.whatsapp}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <div className="text-right text-[10px] uppercase text-slate-500">Carnê de pagamento</div>
        </div>

        <div className="flex gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-1">
              <Campo rotulo="Aluno" valor={aluno.nome} />
              <Campo rotulo="Parcela" valor={numero} />
              <Campo rotulo="Vencimento" valor={formatarData(parcela.vencimento)} destaque />
              <Campo rotulo="Valor" valor={valor} destaque />
              <Campo rotulo="CPF" valor={aluno.cpf} />
              <Campo rotulo="Categoria" valor={categoria} />
            </div>

            {config.chavePix && (
              <div className="text-[10px]">
                <b>Pague com Pix:</b> {config.chavePix}
                {!parcela.pagoEm && " (ou leia o QR Code ao lado, já com o valor)"}
              </div>
            )}
            {config.avisoCarne && <div className="text-[10px] italic text-slate-700">{config.avisoCarne}</div>}
          </div>
          {!parcela.pagoEm && (
            <QrPix
              config={config}
              valorCentavos={parcela.valorCentavos}
              identificador={`PARC${parcela.id}`}
              className="size-[24mm]"
            />
          )}
        </div>

        <div className="mt-auto grid grid-cols-3 gap-4 pt-1">
          <Linha rotulo="Valor pago" />
          <Linha rotulo="Pago em" />
          <Linha rotulo="Recebido por" />
        </div>
        <div className="text-right text-[9px] uppercase text-slate-500">Via da autoescola</div>
      </div>
    </div>
  );
}

function Campo({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase text-slate-500">{rotulo}</div>
      <div className={`truncate ${destaque ? "text-sm font-bold" : "font-semibold"}`}>{valor}</div>
    </div>
  );
}

function Linha({ rotulo }: { rotulo: string }) {
  return (
    <div>
      <div className="h-4 border-b border-slate-500" />
      <div className="text-[9px] uppercase text-slate-500">{rotulo}</div>
    </div>
  );
}
