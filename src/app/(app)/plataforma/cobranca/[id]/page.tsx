import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileText, Undo2, Wallet } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Botao, BotaoLink, Cabecalho, Campo, Cartao, Etiqueta, Input, Select, Tabela } from "@/components/ui";
import { exigirSuperadmin } from "@/lib/auth";
import { dbGlobal } from "@/lib/db";
import { dataParaInput, formatarData, formatarDataLocal, formatarMoeda, moedaParaInput } from "@/lib/format";
import { FORMAS_COBRANCA, condicoes, lerPlataforma, situacaoDaCobranca } from "@/lib/mensalidades";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { confirmarMensalidade, excluirMensalidade, salvarCobrancaAutoescola } from "../../actions";
import { EtiquetaSituacao } from "../../mensalidades";

export const dynamic = "force-dynamic";

// Cobrança de uma autoescola: condições próprias e histórico das mensalidades.
export default async function CobrancaAutoescolaPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirSuperadmin();
  const id = Number((await params).id) || 0;
  const [a, p] = await Promise.all([dbGlobal.autoescola.findUnique({ where: { id } }), lerPlataforma()]);
  if (!a) notFound();
  const c = condicoes(a, p);
  const [s, historico] = await Promise.all([
    c ? situacaoDaCobranca(a.id) : Promise.resolve({ tipo: "isenta" as const }),
    dbGlobal.mensalidade.findMany({ where: { autoescolaId: id }, orderBy: { vencimento: "desc" }, take: 36 }),
  ]);

  return (
    <>
      <Cabecalho
        titulo={a.nome}
        descricao="Mensalidade do sistema: condições e histórico de pagamentos."
        icone={Wallet}
        cor="roxo"
        acoes={
          <BotaoLink href="/plataforma?aba=mensalidades" variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,30rem)_1fr] [&>*]:min-w-0">
        <Cartao className="h-fit">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Condições</h2>
            <EtiquetaSituacao s={s} />
          </div>
          <FormAcao acao={salvarCobrancaAutoescola.bind(null, a.id)} textoBotao="Salvar">
            <Campo
              label="Mensalidade (R$)"
              ajuda={`Em branco: usa o padrão (${p.mensalidadeCentavos ? formatarMoeda(p.mensalidadeCentavos) : "não definido"}).`}
            >
              <Input name="valor" inputMode="decimal" defaultValue={moedaParaInput(a.mensalidadeCentavos)} />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Dia do vencimento">
                <Select name="diaVencimento" defaultValue={a.diaVencimento ? String(a.diaVencimento) : ""}>
                  <option value="">Padrão (dia {p.diaVencimento})</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Dia {d}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Campo label="Forma de pagamento">
                <Select name="formaCobranca" defaultValue={a.formaCobranca ?? ""}>
                  <option value="">Padrão ({FORMAS_COBRANCA[p.formaPadrao]})</option>
                  {Object.entries(FORMAS_COBRANCA).map(([f, nome]) => (
                    <option key={f} value={f}>
                      {nome}
                    </option>
                  ))}
                </Select>
              </Campo>
            </div>
            <Campo label="Cobrar a partir de" ajuda="Para dar um período de teste grátis. Em branco: já cobra.">
              <Input name="cobrancaInicio" type="date" defaultValue={dataParaInput(a.cobrancaInicio)} />
            </Campo>
            <label className="flex items-center gap-3 text-base font-medium">
              <input type="checkbox" name="isenta" defaultChecked={a.isenta} className="size-5" />
              Isenta (não cobrar mensalidade)
            </label>
          </FormAcao>
        </Cartao>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Histórico</h2>
          <Tabela cabecalhos={["Mês", "Vencimento", "Valor", "Situação", ""]}>
            {historico.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma mensalidade ainda.
                </td>
              </tr>
            )}
            {historico.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium">{m.competencia.split("-").reverse().join("/")}</td>
                <td className="px-4 py-3">{formatarData(m.vencimento)}</td>
                <td className="px-4 py-3">
                  {formatarMoeda(m.valorCentavos)}
                  <span className="text-sm text-slate-500"> · {FORMAS_COBRANCA[m.forma] ?? m.forma}</span>
                </td>
                <td className="px-4 py-3">
                  {m.pagoEm ? (
                    <Etiqueta cor="verde">Paga em {formatarDataLocal(m.pagoEm)}</Etiqueta>
                  ) : m.informadoEm ? (
                    <Etiqueta cor="amarelo">Avisou em {formatarDataLocal(m.informadoEm)}</Etiqueta>
                  ) : (
                    <Etiqueta cor="vermelho">Em aberto</Etiqueta>
                  )}
                  {m.obs && <div className="mt-1 text-sm text-slate-600">“{m.obs}”</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {m.comprovanteNome && (
                      <a
                        href={`/plataforma/comprovante/${m.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                      >
                        <FileText className="size-4" aria-hidden /> Comprovante
                      </a>
                    )}
                    <form action={confirmarMensalidade.bind(null, m.id, !m.pagoEm)}>
                      {m.pagoEm ? (
                        <Botao variante="secundario" tamanho="pequeno" icone={Undo2}>
                          Desfazer
                        </Botao>
                      ) : (
                        <Botao variante="sucesso" tamanho="pequeno" icone={Check}>
                          Confirmar pagamento
                        </Botao>
                      )}
                    </form>
                    <BotaoConfirmar
                      acao={excluirMensalidade.bind(null, m.id)}
                      mensagem={`Excluir a mensalidade de ${m.competencia.split("-").reverse().join("/")}? Use para apagar testes. Se a cobrança continuar ligada, a do mês atual é criada de novo.`}
                      icone="excluir"
                    >
                      Excluir
                    </BotaoConfirmar>
                  </div>
                </td>
              </tr>
            ))}
          </Tabela>
        </div>
      </div>
    </>
  );
}
