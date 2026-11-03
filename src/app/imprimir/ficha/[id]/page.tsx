import { notFound } from "next/navigation";
import type { Aluno, Configuracao, Etapa, Matricula, Parcela } from "@prisma/client";
import { textoPraticas } from "@/lib/aulas";
import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { urlFoto } from "@/lib/foto";
import {
  FORMAS_PAGAMENTO,
  formatarCpf,
  formatarData,
  formatarDataLocal,
  formatarMoeda,
  formatarTelefone,
} from "@/lib/format";
import { CURSOS_TEORICOS, TIPOS_PROCESSO, textoSituacaoEtapa } from "@/lib/etapas";
import { descricaoPagamento } from "@/lib/pagamentos";

export const dynamic = "force-dynamic";

type MatriculaFicha = Matricula & { aluno: Omit<Aluno, "govbrSenha">; parcelas: Parcela[]; etapas: Etapa[] };

// Ficha de cadastro do aluno, no lugar da ficha de papel: dados, pagamento e o
// andamento dos exames e taxas. Dois formatos (Configurações > Impressora, ou
// ?formato= na barra de impressão):
// - "inteira": tudo numa folha A4;
// - "meia": meia folha A4, frente (dados) e verso (pagamento e exames). Cada lado
//   sai na metade de cima de uma página: impressa frente e verso, a folha é
//   cortada ao meio na linha tracejada.
export default async function FichaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ formato?: string }>;
}) {
  const [matricula, config] = await Promise.all([
    db.matricula.findUnique({
      where: { id: Number((await params).id) || 0 },
      include: {
        aluno: true,
        parcelas: { orderBy: { numero: "asc" } },
        etapas: { orderBy: [{ ordem: "asc" }, { id: "asc" }] },
      },
    }),
    obterConfig(),
  ]);
  if (!matricula) notFound();
  const pedido = (await searchParams).formato;
  const meia = (pedido === "meia" || pedido === "inteira" ? pedido : config.formatoFicha) === "meia";

  if (meia) {
    return (
      <>
        <div className="mx-auto mb-1 w-[210mm] text-sm font-semibold text-slate-600 print:hidden">
          Frente — imprima em frente e verso e corte a folha ao meio
        </div>
        {/* A frente cabe no tamanho normal: sobra espaço para preencher à mão. */}
        <div className="meia-folha text-[11px] leading-tight">
          <Frente matricula={matricula} config={config} />
        </div>
        <div className="mx-auto mb-1 w-[210mm] text-sm font-semibold text-slate-600 print:hidden">Verso</div>
        <div className="meia-folha text-[10px] leading-tight">
          <Verso matricula={matricula} compacta />
        </div>
      </>
    );
  }

  return (
    <div className="folha text-[12px]">
      <Frente matricula={matricula} config={config} />
      <Verso matricula={matricula} />
    </div>
  );
}

function Frente({
  matricula,
  config,
  compacta = false,
}: {
  matricula: MatriculaFicha;
  config: Configuracao;
  compacta?: boolean;
}) {
  const a = matricula.aluno;
  const foto = urlFoto(a);
  const medico = matricula.etapas.find((e) => e.tipo === "medico");
  const rgCompleto = [a.rg, [a.rgOrgao, a.rgUf].filter(Boolean).join("/")].filter(Boolean).join(" ");
  const p = compacta ? "p-2" : "p-3";

  return (
    <>
      <div className="flex border-2 border-slate-800">
        <div className={`flex-1 border-r-2 border-slate-800 ${p}`}>
          <div className="flex items-start gap-3">
            {config.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logo} alt="" className={compacta ? "h-9 w-auto" : "h-14 w-auto"} />
            )}
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase text-slate-600">{config.nome}</div>
              <div className={`${compacta ? "text-base" : "text-xl"} font-bold uppercase`}>Cadastro do aluno</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-500">Categoria</div>
              <div className={`${compacta ? "text-xl" : "text-2xl"} font-bold`}>{matricula.categoria}</div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(TIPOS_PROCESSO).map(([id, t]) => (
              <span key={id} className="flex items-center gap-1">
                <span
                  className={`inline-flex items-center justify-center border border-slate-800 font-bold ${compacta ? "size-3 text-[9px]" : "size-4 text-[11px]"}`}
                >
                  {matricula.tipoProcesso === id ? "X" : ""}
                </span>
                {t.titulo}
              </span>
            ))}
          </div>
          <Linha rotulo="E-mail" valor={a.email} compacta={compacta} />
        </div>
        <div className={`flex items-center justify-center p-1 ${compacta ? "w-[24mm]" : "w-[30mm]"}`}>
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foto}
              alt=""
              className={compacta ? "h-[30mm] w-[22mm] object-cover" : "h-[40mm] w-[28mm] object-cover"}
            />
          ) : (
            <span className="text-center text-sm font-semibold text-slate-500">Foto 3x4</span>
          )}
        </div>
      </div>

      <div className="flex border-x-2 border-b-2 border-slate-800">
        <div className={`flex-1 border-r-2 border-slate-800 ${p}`}>
          <Linha rotulo="Nome" valor={a.nome} forte compacta={compacta} />
          <Linha rotulo="Pai" valor={a.pai} compacta={compacta} />
          <Linha rotulo="Mãe" valor={a.mae} compacta={compacta} />
          <Linha rotulo="Endereço" valor={a.endereco} compacta={compacta} />
          <div className="grid grid-cols-[1fr_30mm] gap-3">
            <Linha rotulo="Bairro" valor={a.bairro} compacta={compacta} />
            <Linha rotulo="Nº" valor={a.numero} compacta={compacta} />
          </div>
          <Linha rotulo="Local de atividade" valor={a.localAtividade} compacta={compacta} />
        </div>
        <div className={`w-[45mm] ${p}`}>
          <div className="font-semibold">Fone:</div>
          <Linha valor={formatarTelefone(a.telefone)} compacta={compacta} />
          <Linha valor={formatarTelefone(a.telefone2)} compacta={compacta} />
        </div>
      </div>

      <div className={`border-x-2 border-b-2 border-slate-800 ${p}`}>
        <div className="grid grid-cols-[1fr_1fr_20mm] gap-3">
          <Linha rotulo="RENACH" valor={a.renach} compacta={compacta} />
          <Linha rotulo="RG" valor={rgCompleto} compacta={compacta} />
          <Linha rotulo="UF" valor={a.rgUf} compacta={compacta} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Linha rotulo="Data de nascimento" valor={formatarData(a.nascimento)} compacta={compacta} />
          <Linha rotulo="CPF" valor={formatarCpf(a.cpf)} compacta={compacta} />
        </div>
      </div>

      <div className="grid grid-cols-4 border-x-2 border-b-2 border-slate-800 text-center">
        <Caixa rotulo="Data matrícula" valor={formatarDataLocal(matricula.data)} compacta={compacta} />
        <Caixa rotulo="Data exame médico" valor={formatarData(medico?.data)} compacta={compacta} />
        <Caixa rotulo="RG – Expedição" valor={formatarData(a.rgExpedicao)} compacta={compacta} />
        <Caixa rotulo="Naturalidade" valor={a.naturalidade} ultima compacta={compacta} />
        <Caixa rotulo="Nº registro CNH" valor={a.registroCnh} baixo compacta={compacta} />
        <Caixa rotulo="Emissão CNH" valor={formatarData(a.cnhEmissao)} baixo compacta={compacta} />
        <Caixa rotulo="Validade CNH" valor={formatarData(a.cnhValidade)} baixo compacta={compacta} />
        <Caixa rotulo="Atualização biométrica" valor={formatarData(a.biometriaEm)} baixo ultima compacta={compacta} />
      </div>
    </>
  );
}

function Verso({ matricula, compacta = false }: { matricula: MatriculaFicha; compacta?: boolean }) {
  const titulo = `border-b-2 border-slate-800 pb-1 font-bold uppercase ${compacta ? "mt-0 text-[12px]" : "mt-5 text-base"}`;
  const celula = `border border-slate-800 ${compacta ? "px-1.5 py-0.5" : "px-2 py-1"}`;
  const a = matricula.aluno;

  return (
    <>
      {compacta && (
        <div className="mb-2 flex items-baseline justify-between border-b border-slate-400 pb-1">
          <span className="text-[12px] font-bold">{a.nome}</span>
          <span>
            CPF {formatarCpf(a.cpf)} · Categoria <b>{matricula.categoria}</b>
          </span>
        </div>
      )}
      <h2 className={titulo}>Pagamento</h2>
      <div className={`grid grid-cols-2 gap-x-6 ${compacta ? "mt-0.5 gap-y-0.5" : "mt-1 gap-y-1"}`}>
        <div>
          Forma: <b>{descricaoPagamento(matricula, formatarMoeda)}</b>
        </div>
        <div>
          Valor: <b>{formatarMoeda(matricula.valorTotalCentavos)}</b>
        </div>
        <div>
          Curso teórico:{" "}
          <b>
            {matricula.cursoTeorico === "autoescola"
              ? `na autoescola (${matricula.qtdTeoricas} aulas)`
              : (CURSOS_TEORICOS[matricula.cursoTeorico]?.titulo ?? matricula.cursoTeorico)}
          </b>
        </div>
        <div>
          Aulas práticas: <b>{textoPraticas(matricula)}</b>
        </div>
      </div>
      {matricula.parcelas.length > 0 &&
        (compacta ? (
          // Meia folha: parcelas em quadrinhos, cinco por linha, para caber até 24 e a entrada.
          <div className="mt-1 grid grid-cols-5 gap-0.5 leading-[1.15]">
            {matricula.parcelas.map((p) => (
              <div key={p.id} className="border border-slate-800 px-1 py-px">
                <div className="flex justify-between">
                  <b>{p.numero === 0 ? "Entrada" : `${p.numero}ª`}</b>
                  <span>{formatarData(p.vencimento)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{formatarMoeda(p.valorCentavos)}</span>
                  <span>{p.pagoEm ? `pg ${formatarData(p.pagoEm).slice(0, 5)}` : "pg ___/___"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="mt-2 w-full border-collapse border border-slate-800">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className={celula}>Vencimento</th>
                <th className={celula}>Parcela</th>
                <th className={celula}>Valor</th>
                <th className={celula}>Pago em</th>
              </tr>
            </thead>
            <tbody>
              {matricula.parcelas.map((p) => (
                <tr key={p.id}>
                  <td className={celula}>{formatarData(p.vencimento)}</td>
                  <td className={celula}>{p.numero === 0 ? "Entrada" : `${p.numero}ª parcela`}</td>
                  <td className={celula}>{formatarMoeda(p.valorCentavos)}</td>
                  <td className={celula}>
                    {p.pagoEm ? `${formatarData(p.pagoEm)} · ${FORMAS_PAGAMENTO[p.forma ?? ""] ?? p.forma}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

      <h2 className={`${titulo} ${compacta ? "mt-2!" : ""}`}>Exames e taxas</h2>
      <table className={`w-full border-collapse border border-slate-800 ${compacta ? "mt-1" : "mt-2"}`}>
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className={celula}>Exame / taxa</th>
            <th className={celula}>Data</th>
            <th className={celula}>Situação</th>
            <th className={celula}>Valor</th>
            <th className={celula}>Pago em</th>
          </tr>
        </thead>
        <tbody>
          {matricula.etapas.map((e) => (
            <tr key={e.id}>
              <td className={celula}>{e.descricao}</td>
              <td className={celula}>{formatarData(e.data) || "____/____/______"}</td>
              <td className={celula}>{textoSituacaoEtapa(e)}</td>
              <td className={celula}>
                {e.valorCentavos != null ? formatarMoeda(e.valorCentavos) : ""}
                {e.cobranca === "aluno" && e.valorCentavos != null ? (
                  <span className={compacta ? "text-[8px]" : "text-[10px]"}> (aluno paga)</span>
                ) : (
                  ""
                )}
              </td>
              <td className={celula}>{formatarData(e.pagoEm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {a.obs && (
        <p className={compacta ? "mt-1.5" : "mt-3"}>
          <b>Observações:</b> {a.obs}
        </p>
      )}
    </>
  );
}

function Linha({
  rotulo,
  valor,
  forte,
  compacta,
}: {
  rotulo?: string;
  valor: string | null | undefined;
  forte?: boolean;
  compacta?: boolean;
}) {
  return (
    <div className={`flex items-end gap-1 ${compacta ? "mt-1" : "mt-1.5"}`}>
      {rotulo && <span className="shrink-0">{rotulo}:</span>}
      <span
        className={`flex-1 border-b border-slate-500 px-1 ${compacta ? "min-h-[14px]" : "min-h-[18px]"} ${forte ? "font-bold" : ""}`}
      >
        {valor}
      </span>
    </div>
  );
}

function Caixa({
  rotulo,
  valor,
  baixo,
  ultima,
  compacta,
}: {
  rotulo: string;
  valor: string | null | undefined;
  baixo?: boolean;
  ultima?: boolean;
  compacta?: boolean;
}) {
  return (
    <div
      className={`${compacta ? "px-1 py-1" : "px-2 py-1.5"} ${ultima ? "" : "border-r-2 border-slate-800"} ${baixo ? "border-t-2 border-slate-800" : ""}`}
    >
      <div className={compacta ? "text-[9px] text-slate-600" : "text-[11px] text-slate-600"}>{rotulo}</div>
      <div className={`font-semibold ${compacta ? "min-h-[13px]" : "min-h-[18px]"}`}>{valor || ""}</div>
    </div>
  );
}
