import { notFound } from "next/navigation";
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
import { FORMAS_MATRICULA } from "@/lib/pagamentos";

export const dynamic = "force-dynamic";

// Ficha de cadastro do aluno (A4), no lugar da ficha de papel: dados, pagamento
// e o andamento dos exames e taxas.
export default async function FichaPage({ params }: { params: Promise<{ id: string }> }) {
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
  const a = matricula.aluno;
  const foto = urlFoto(a);
  const medico = matricula.etapas.find((e) => e.tipo === "medico");
  const rgCompleto = [a.rg, [a.rgOrgao, a.rgUf].filter(Boolean).join("/")].filter(Boolean).join(" ");

  return (
    <div className="folha text-[12px]">
      <div className="flex border-2 border-slate-800">
        <div className="flex-1 border-r-2 border-slate-800 p-3">
          <div className="flex items-start gap-3">
            {config.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logo} alt="" className="h-14 w-auto" />
            )}
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase text-slate-600">{config.nome}</div>
              <div className="text-xl font-bold uppercase">Cadastro do aluno</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-500">Categoria</div>
              <div className="text-2xl font-bold">{matricula.categoria}</div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(TIPOS_PROCESSO).map(([id, t]) => (
              <span key={id} className="flex items-center gap-1">
                <span className="inline-flex size-4 items-center justify-center border border-slate-800 text-[11px] font-bold">
                  {matricula.tipoProcesso === id ? "X" : ""}
                </span>
                {t.titulo}
              </span>
            ))}
          </div>
          <Linha rotulo="E-mail" valor={a.email} />
        </div>
        <div className="flex w-[30mm] items-center justify-center p-1">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt="" className="h-[40mm] w-[28mm] object-cover" />
          ) : (
            <span className="text-center text-sm font-semibold text-slate-500">Foto 3x4</span>
          )}
        </div>
      </div>

      <div className="flex border-x-2 border-b-2 border-slate-800">
        <div className="flex-1 border-r-2 border-slate-800 p-3">
          <Linha rotulo="Nome" valor={a.nome} forte />
          <Linha rotulo="Pai" valor={a.pai} />
          <Linha rotulo="Mãe" valor={a.mae} />
          <Linha rotulo="Endereço" valor={a.endereco} />
          <div className="grid grid-cols-[1fr_30mm] gap-3">
            <Linha rotulo="Bairro" valor={a.bairro} />
            <Linha rotulo="Nº" valor={a.numero} />
          </div>
          <Linha rotulo="Local de atividade" valor={a.localAtividade} />
        </div>
        <div className="w-[45mm] p-3">
          <div className="font-semibold">Fone:</div>
          <Linha valor={formatarTelefone(a.telefone)} />
          <Linha valor={formatarTelefone(a.telefone2)} />
        </div>
      </div>

      <div className="border-x-2 border-b-2 border-slate-800 p-3">
        <div className="grid grid-cols-[1fr_1fr_20mm] gap-3">
          <Linha rotulo="RENACH" valor={a.renach} />
          <Linha rotulo="RG" valor={rgCompleto} />
          <Linha rotulo="UF" valor={a.rgUf} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Linha rotulo="Data de nascimento" valor={formatarData(a.nascimento)} />
          <Linha rotulo="CPF" valor={formatarCpf(a.cpf)} />
        </div>
      </div>

      <div className="grid grid-cols-3 border-x-2 border-b-2 border-slate-800 text-center">
        <Caixa rotulo="Data matrícula" valor={formatarDataLocal(matricula.data)} />
        <Caixa rotulo="Data exame médico" valor={formatarData(medico?.data)} />
        <Caixa rotulo="RG – Expedição" valor={formatarData(a.rgExpedicao)} ultima />
        <Caixa rotulo="Nº registro" valor={a.registroCnh} baixo />
        <Caixa rotulo="Naturalidade" valor={a.naturalidade} baixo />
        <Caixa rotulo="Atualização biométrica" valor={formatarData(a.biometriaEm)} baixo ultima />
      </div>

      <h2 className="mt-5 border-b-2 border-slate-800 pb-1 text-base font-bold uppercase">Pagamento</h2>
      <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1">
        <div>
          Forma: <b>{FORMAS_MATRICULA[matricula.formaPagamento]?.titulo ?? matricula.formaPagamento}</b>
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
          Aulas práticas: <b>{matricula.qtdPraticas}</b>
        </div>
      </div>
      {matricula.parcelas.length > 0 && (
        <table className="mt-2 w-full border-collapse border border-slate-800">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border border-slate-800 px-2 py-1">Vencimento</th>
              <th className="border border-slate-800 px-2 py-1">Parcela</th>
              <th className="border border-slate-800 px-2 py-1">Valor</th>
              <th className="border border-slate-800 px-2 py-1">Pago em</th>
            </tr>
          </thead>
          <tbody>
            {matricula.parcelas.map((p) => (
              <tr key={p.id}>
                <td className="border border-slate-800 px-2 py-1">{formatarData(p.vencimento)}</td>
                <td className="border border-slate-800 px-2 py-1">{p.numero}ª parcela</td>
                <td className="border border-slate-800 px-2 py-1">{formatarMoeda(p.valorCentavos)}</td>
                <td className="border border-slate-800 px-2 py-1">
                  {p.pagoEm ? `${formatarData(p.pagoEm)} · ${FORMAS_PAGAMENTO[p.forma ?? ""] ?? p.forma}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-5 border-b-2 border-slate-800 pb-1 text-base font-bold uppercase">Exames e taxas</h2>
      <table className="mt-2 w-full border-collapse border border-slate-800">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border border-slate-800 px-2 py-1">Exame / taxa</th>
            <th className="border border-slate-800 px-2 py-1">Data</th>
            <th className="border border-slate-800 px-2 py-1">Situação</th>
            <th className="border border-slate-800 px-2 py-1">Valor</th>
            <th className="border border-slate-800 px-2 py-1">Pago em</th>
          </tr>
        </thead>
        <tbody>
          {matricula.etapas.map((e) => (
            <tr key={e.id}>
              <td className="border border-slate-800 px-2 py-1">{e.descricao}</td>
              <td className="border border-slate-800 px-2 py-1">{formatarData(e.data) || "____/____/______"}</td>
              <td className="border border-slate-800 px-2 py-1">{textoSituacaoEtapa(e)}</td>
              <td className="border border-slate-800 px-2 py-1">
                {e.valorCentavos != null ? formatarMoeda(e.valorCentavos) : ""}
                {e.cobranca === "aluno" && e.valorCentavos != null ? (
                  <span className="text-[10px]"> (aluno paga)</span>
                ) : (
                  ""
                )}
              </td>
              <td className="border border-slate-800 px-2 py-1">{formatarData(e.pagoEm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {a.obs && (
        <p className="mt-3">
          <b>Observações:</b> {a.obs}
        </p>
      )}
    </div>
  );
}

function Linha({ rotulo, valor, forte }: { rotulo?: string; valor: string | null | undefined; forte?: boolean }) {
  return (
    <div className="mt-1.5 flex items-end gap-1">
      {rotulo && <span className="shrink-0">{rotulo}:</span>}
      <span className={`min-h-[18px] flex-1 border-b border-slate-500 px-1 ${forte ? "font-bold" : ""}`}>{valor}</span>
    </div>
  );
}

function Caixa({
  rotulo,
  valor,
  baixo,
  ultima,
}: {
  rotulo: string;
  valor: string | null | undefined;
  baixo?: boolean;
  ultima?: boolean;
}) {
  return (
    <div
      className={`px-2 py-1.5 ${ultima ? "" : "border-r-2 border-slate-800"} ${baixo ? "border-t-2 border-slate-800" : ""}`}
    >
      <div className="text-[11px] text-slate-600">{rotulo}</div>
      <div className="min-h-[18px] font-semibold">{valor || ""}</div>
    </div>
  );
}
