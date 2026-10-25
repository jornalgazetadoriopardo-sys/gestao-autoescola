import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BellRing, Car, Check, Fuel, Pencil, Plus, Undo2, Wrench } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { FormAcao } from "@/components/form-acao";
import {
  Botao,
  BotaoLink,
  Cabecalho,
  Campo,
  Cartao,
  Etiqueta,
  Input,
  Secao,
  Tabela,
  Textarea,
  Vazio,
} from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatarLitros } from "@/lib/despesas";
import { dataParaInput, formatarData, formatarMoeda, hojeISO, moedaParaInput } from "@/lib/format";
import { SERVICOS_SUGERIDOS, diasAte, quandoLembrar } from "@/lib/lembretes";
import { marcarLicenciamento } from "../actions";
import { EtiquetaLicenciamento } from "../etiqueta-licenciamento";
import {
  DIAS_AVISO_LICENCIAMENTO,
  TIPOS_LICENCIAMENTO,
  lerCalendario,
  situacaoLicenciamento,
} from "@/lib/licenciamento";
import { concluirLembrete, excluirManutencao, salvarManutencao } from "../actions";

export const dynamic = "force-dynamic";

export default async function VeiculoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; editar?: string }>;
}) {
  const veiculo = await db.veiculo.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: { manutencoes: { orderBy: [{ data: "desc" }, { lembrarEm: "desc" }] } },
  });
  if (!veiculo) notFound();
  const { salvo, editar } = await searchParams;
  // Manutenção sendo alterada no formulário ao lado (?editar=id).
  const editando = veiculo.manutencoes.find((m) => String(m.id) === editar);
  // Abastecimentos são despesas: só o administrador vê.
  const admin = (await exigirSessao()).papel === "admin";
  const config = await db.configuracao.findFirst({ select: { calendarioLicenciamento: true } });
  const licenciamento = situacaoLicenciamento(veiculo, lerCalendario(config?.calendarioLicenciamento));
  const abastecimentos = admin
    ? await db.despesa.findMany({
        where: { veiculoId: veiculo.id, categoria: "combustivel" },
        orderBy: [{ vencimento: "desc" }, { id: "desc" }],
        take: 10,
      })
    : [];

  const lembretes = veiculo.manutencoes
    .filter((m) => m.lembrarEm && !m.lembreteConcluido)
    .sort((a, b) => a.lembrarEm!.getTime() - b.lembrarEm!.getTime());

  return (
    <>
      <Cabecalho
        titulo={`${veiculo.modelo}`}
        descricao={`Placa ${veiculo.placa} · Categoria ${veiculo.categoria}${veiculo.ativo ? "" : " · Inativo"}`}
        icone={Car}
        acoes={
          <>
            <BotaoLink href="/veiculos" variante="secundario" icone={ArrowLeft}>
              Voltar
            </BotaoLink>
            <BotaoLink href={`/veiculos/${veiculo.id}/editar`} variante="secundario" icone={Pencil}>
              Editar veículo
            </BotaoLink>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex-1 text-base">
              <EtiquetaLicenciamento situacao={licenciamento} />
              <p className="mt-1 text-sm text-slate-600">
                Calculado pelo final da placa ({TIPOS_LICENCIAMENTO[veiculo.tipoLicenciamento]?.titulo.toLowerCase()}).
                O aviso aparece na tela inicial {DIAS_AVISO_LICENCIAMENTO} dias antes.
              </p>
            </div>
            {licenciamento.vencimento &&
              (licenciamento.pago ? (
                <form action={marcarLicenciamento.bind(null, veiculo.id, false)}>
                  <Botao variante="secundario" tamanho="pequeno" icone={Undo2}>
                    Desfazer
                  </Botao>
                </form>
              ) : (
                <form action={marcarLicenciamento.bind(null, veiculo.id, true)}>
                  <Botao variante="sucesso" tamanho="pequeno" icone={Check}>
                    Já paguei o licenciamento
                  </Botao>
                </form>
              ))}
          </div>

          {lembretes.length > 0 && (
            <>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                <BellRing className="size-6 text-amber-600" aria-hidden /> Lembretes
              </h2>
              <div className="mb-6 space-y-3">
                {lembretes.map((m) => {
                  const vencido = diasAte(m.lembrarEm!) <= 0;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${
                        vencido ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <Wrench className={`size-7 ${vencido ? "text-red-600" : "text-amber-600"}`} aria-hidden />
                      <div className="flex-1">
                        <div className="text-base font-semibold">{m.descricao}</div>
                        <div className="text-sm text-slate-700">
                          Lembrar em {formatarData(m.lembrarEm)} ({quandoLembrar(m.lembrarEm!)})
                        </div>
                      </div>
                      <form action={concluirLembrete.bind(null, m.id)}>
                        <Botao variante="sucesso" tamanho="pequeno" icone={Check}>
                          Já resolvi
                        </Botao>
                      </form>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Secao titulo="Histórico de manutenções" icone={Wrench} />
          {veiculo.manutencoes.length === 0 ? (
            <Vazio
              icone={Wrench}
              titulo="Nenhuma manutenção registrada"
              texto="Use o formulário ao lado para registrar trocas de óleo, revisões e criar lembretes."
            />
          ) : (
            <Tabela cabecalhos={["Serviço", "Feita em", "Km", "Valor", "Lembrete", ""]}>
              {veiculo.manutencoes.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.descricao}</div>
                    {m.obs && <div className="text-sm text-slate-500">{m.obs}</div>}
                  </td>
                  <td className="px-4 py-3">{formatarData(m.data) || "—"}</td>
                  <td className="px-4 py-3">{m.km ? m.km.toLocaleString("pt-BR") : "—"}</td>
                  <td className="px-4 py-3">{m.valorCentavos != null ? formatarMoeda(m.valorCentavos) : "—"}</td>
                  <td className="px-4 py-3">
                    {m.lembrarEm ? (
                      m.lembreteConcluido ? (
                        <Etiqueta cor="verde">Resolvido</Etiqueta>
                      ) : (
                        <Etiqueta cor={diasAte(m.lembrarEm) <= 0 ? "vermelho" : "amarelo"}>
                          {formatarData(m.lembrarEm)}
                        </Etiqueta>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BotaoLink
                        href={`/veiculos/${veiculo.id}?editar=${m.id}`}
                        variante="secundario"
                        tamanho="pequeno"
                        icone={Pencil}
                      >
                        Alterar
                      </BotaoLink>
                      <BotaoConfirmar
                        acao={excluirManutencao.bind(null, m.id)}
                        mensagem={`Excluir "${m.descricao}"?`}
                        icone="excluir"
                      >
                        Excluir
                      </BotaoConfirmar>
                    </div>
                  </td>
                </tr>
              ))}
            </Tabela>
          )}

          {admin && (
            <>
              <Secao
                titulo="Últimos abastecimentos"
                icone={Fuel}
                acoes={
                  <BotaoLink
                    href={`/despesas/nova?categoria=combustivel&veiculo=${veiculo.id}&voltar=${encodeURIComponent(`/veiculos/${veiculo.id}`)}`}
                    variante="secundario"
                    tamanho="pequeno"
                    icone={Plus}
                  >
                    Lançar abastecimento
                  </BotaoLink>
                }
              />
              {abastecimentos.length === 0 ? (
                <Vazio
                  icone={Fuel}
                  titulo="Nenhum abastecimento lançado"
                  texto="Os abastecimentos são lançados em Despesas."
                />
              ) : (
                <Tabela cabecalhos={["Data", "Combustível", "Litros", "Km", "Valor"]}>
                  {abastecimentos.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3">{formatarData(d.pagoEm ?? d.vencimento)}</td>
                      <td className="px-4 py-3">{d.descricao}</td>
                      <td className="px-4 py-3">{d.litrosCent ? formatarLitros(d.litrosCent) : "—"}</td>
                      <td className="px-4 py-3">{d.km ? d.km.toLocaleString("pt-BR") : "—"}</td>
                      <td className="px-4 py-3 font-semibold">{formatarMoeda(d.valorCentavos)}</td>
                    </tr>
                  ))}
                </Tabela>
              )}
            </>
          )}
        </div>

        <Cartao className="h-fit">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Wrench className="size-6 text-blue-600" aria-hidden />{" "}
            {editando ? "Alterar manutenção" : "Registrar manutenção"}
          </h2>
          {editando && (
            <Link href={`/veiculos/${veiculo.id}`} className="-mt-2 mb-4 block text-base text-blue-700 hover:underline">
              Cancelar alteração
            </Link>
          )}
          <FormAcao
            key={editando ? `editar-${editando.id}` : (salvo ?? "novo")}
            acao={salvarManutencao.bind(null, veiculo.id, editando?.id ?? null)}
            textoBotao={editando ? "Salvar alterações" : "Salvar"}
          >
            <Campo label="Serviço" ajuda="Escolha da lista ou escreva.">
              <Input
                name="descricao"
                list="servicos"
                required
                placeholder="Ex.: Troca de óleo"
                defaultValue={editando?.descricao}
              />
              <datalist id="servicos">
                {SERVICOS_SUGERIDOS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Campo>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Feita em" ajuda="Deixe vazio se ainda vai fazer.">
                <Input name="data" type="date" defaultValue={editando ? dataParaInput(editando.data) : hojeISO()} />
              </Campo>
              <Campo label="Km do veículo">
                <Input name="km" inputMode="numeric" placeholder="Ex.: 45000" defaultValue={editando?.km ?? ""} />
              </Campo>
            </div>
            <Campo label="Valor gasto (R$)">
              <Input
                name="valor"
                inputMode="decimal"
                placeholder="Ex.: 250,00"
                defaultValue={moedaParaInput(editando?.valorCentavos)}
              />
            </Campo>
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
              <Campo label="Me lembrar no dia" ajuda="O aviso aparece na tela inicial alguns dias antes.">
                <Input name="lembrarEm" type="date" defaultValue={dataParaInput(editando?.lembrarEm)} />
              </Campo>
            </div>
            <Campo label="Observação">
              <Textarea name="obs" rows={2} defaultValue={editando?.obs ?? ""} />
            </Campo>
          </FormAcao>
        </Cartao>
      </div>
    </>
  );
}
