import { Wallet } from "lucide-react";
import { Cartao, Etiqueta, Tabela } from "@/components/ui";
import { dadosPagamento } from "@/components/cobranca/faixa-cobranca";
import { PainelPagamento } from "@/components/cobranca/pagamento";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { formatarData, formatarDataLocal, formatarMoeda } from "@/lib/format";
import { iso, lerPlataforma, situacaoDaCobranca } from "@/lib/mensalidades";

// Aba "Mensalidade" das configurações: a mensalidade do sistema da autoescola.
export async function Mensalidade() {
  const sessao = await exigirSessao();
  const [s, p, historico] = await Promise.all([
    situacaoDaCobranca(sessao.autoescolaId),
    lerPlataforma(),
    db.mensalidade.findMany({ orderBy: { vencimento: "desc" }, take: 24 }),
  ]);
  const aberta = historico.find((m) => !m.pagoEm);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_1fr] [&>*]:min-w-0">
      <Cartao className="h-fit">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Wallet className="size-6 text-blue-600" aria-hidden /> Mensalidade do sistema
        </h2>
        {!aberta ? (
          <p className="mt-3 text-base text-slate-600">
            {historico.length ? "Tudo em dia. Obrigado!" : "Nenhuma mensalidade em aberto."}
          </p>
        ) : s.tipo === "informada" && aberta.informadoEm ? (
          <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
            Você avisou o pagamento de {formatarMoeda(aberta.valorCentavos)} em {formatarDataLocal(aberta.informadoEm)}.
            Estamos conferindo.
          </p>
        ) : (
          <div className="mt-4">
            <PainelPagamento dados={await dadosPagamento(aberta, iso(aberta.vencimento), p)} />
          </div>
        )}
      </Cartao>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Histórico</h2>
        <Tabela cabecalhos={["Mês", "Vencimento", "Valor", "Situação"]}>
          {historico.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                Nenhuma mensalidade ainda.
              </td>
            </tr>
          )}
          {historico.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-3 font-medium">{m.competencia.split("-").reverse().join("/")}</td>
              <td className="px-4 py-3">{formatarData(m.vencimento)}</td>
              <td className="px-4 py-3">{formatarMoeda(m.valorCentavos)}</td>
              <td className="px-4 py-3">
                {m.pagoEm ? (
                  <Etiqueta cor="verde">Paga</Etiqueta>
                ) : m.informadoEm ? (
                  <Etiqueta cor="amarelo">Em conferência</Etiqueta>
                ) : (
                  <Etiqueta cor="vermelho">Em aberto</Etiqueta>
                )}
              </td>
            </tr>
          ))}
        </Tabela>
      </div>
    </div>
  );
}
