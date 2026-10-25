import Link from "next/link";
import { Check, HandCoins, Pencil, Printer, Undo2, X } from "lucide-react";
import type { Etapa } from "@prisma/client";
import { Etiqueta, Tabela } from "@/components/ui";
import { formatarData, formatarMoeda } from "@/lib/format";
import { COR_SITUACAO_ETAPA, TIPOS_ETAPA, situacaoEtapa, textoSituacaoEtapa } from "@/lib/etapas";
import { marcarEtapa } from "./actions";

const botao =
  "inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-semibold whitespace-nowrap";

type EtapaComAluno = Etapa & { matricula?: { aluno: { id: number; nome: string } } };

// Exames e taxas: situação, valor/pagamento e botões rápidos de resultado.
// `receber`: lista de cobrança (só os botões Receber e Alterar).
export function TabelaEtapas({
  etapas,
  voltar,
  receber = false,
}: {
  etapas: EtapaComAluno[];
  voltar: string;
  receber?: boolean;
}) {
  const comAluno = etapas.some((e) => e.matricula);
  return (
    <Tabela cabecalhos={[...(comAluno ? ["Aluno"] : []), "Exame / taxa", "Data", "Situação", "Valor", ""]}>
      {etapas.map((e) => {
        const situacao = situacaoEtapa(e);
        const r = TIPOS_ETAPA[e.tipo]?.resultados ?? { ok: "Concluído" };
        return (
          <tr key={e.id}>
            {comAluno && (
              <td className="px-4 py-2.5 whitespace-normal!">
                {e.matricula && (
                  <Link href={`/alunos/${e.matricula.aluno.id}`} className="font-medium text-blue-700 hover:underline">
                    {e.matricula.aluno.nome}
                  </Link>
                )}
              </td>
            )}
            <td className="min-w-48 px-4 py-2.5 whitespace-normal!">
              <div className="font-medium">{e.descricao}</div>
              {e.obs && <div className="text-sm text-slate-600">{e.obs}</div>}
            </td>
            <td className="px-4 py-2.5">
              {formatarData(e.data) || "—"}
              {e.hora && ` às ${e.hora}`}
              {e.local && <div className="text-sm text-slate-600">{e.local}</div>}
            </td>
            <td className="px-4 py-2.5">
              <Etiqueta cor={COR_SITUACAO_ETAPA[situacao]}>{textoSituacaoEtapa(e)}</Etiqueta>
            </td>
            <td className="px-4 py-2.5">
              {e.valorCentavos != null ? <div className="font-semibold">{formatarMoeda(e.valorCentavos)}</div> : "—"}
              <div className="text-sm text-slate-600">
                {e.pagoEm
                  ? `Pago em ${formatarData(e.pagoEm)}`
                  : e.cobranca === "autoescola"
                    ? "Autoescola cobra · a receber"
                    : "Aluno paga direto"}
              </div>
            </td>
            <td className="min-w-64 px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {!e.pagoEm && e.cobranca === "autoescola" && (e.valorCentavos ?? 0) > 0 && (
                  <Link
                    href={`/exames/${e.id}/receber?voltar=${encodeURIComponent(voltar)}`}
                    className={`${botao} border-green-600 text-green-800 hover:bg-green-50`}
                  >
                    <HandCoins className="size-4" aria-hidden /> Receber
                  </Link>
                )}
                {receber ? null : e.resultado ? (
                  <form action={marcarEtapa.bind(null, e.id, null)}>
                    <button className={`${botao} border-slate-300 text-slate-600 hover:bg-slate-50`}>
                      <Undo2 className="size-4" aria-hidden /> Desfazer
                    </button>
                  </form>
                ) : (
                  <>
                    <form action={marcarEtapa.bind(null, e.id, "ok")}>
                      <button className={`${botao} border-green-600 bg-green-600 text-white hover:bg-green-700`}>
                        <Check className="size-4" aria-hidden /> {r.ok}
                      </button>
                    </form>
                    {r.falhou && (
                      <form action={marcarEtapa.bind(null, e.id, "falhou")}>
                        <button className={`${botao} border-red-300 bg-red-50 text-red-800 hover:bg-red-100`}>
                          <X className="size-4" aria-hidden /> {r.falhou}
                        </button>
                      </form>
                    )}
                  </>
                )}
                {e.pagoEm && e.cobranca === "autoescola" && e.valorCentavos != null && (
                  <Link
                    href={`/imprimir/recibo-taxa/${e.id}`}
                    target="_blank"
                    className={`${botao} border-slate-300 text-slate-700 hover:bg-slate-50`}
                  >
                    <Printer className="size-4" aria-hidden /> Recibo
                  </Link>
                )}
                <Link
                  href={`/exames/${e.id}/editar?voltar=${encodeURIComponent(voltar)}`}
                  className={`${botao} border-slate-300 text-slate-700 hover:bg-slate-50`}
                  title="Alterar data, valor, pagamento ou observação"
                  aria-label="Alterar"
                >
                  <Pencil className="size-4" aria-hidden />
                  {receber && " Alterar"}
                </Link>
              </div>
            </td>
          </tr>
        );
      })}
    </Tabela>
  );
}
