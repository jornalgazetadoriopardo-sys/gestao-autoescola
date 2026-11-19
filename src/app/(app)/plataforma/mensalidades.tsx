import Link from "next/link";
import { AlertTriangle, BadgeCheck, CalendarClock, Check, FileText, Lock, Settings2, Wallet } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { FormAcao } from "@/components/form-acao";
import { Opcoes } from "@/components/opcoes";
import { Botao, Campo, Cartao, Etiqueta, IconeRedondo, Input, Select, Tabela, Textarea } from "@/components/ui";
import { dbGlobal } from "@/lib/db";
import { formatarMoeda, hojeISO, moedaParaInput } from "@/lib/format";
import {
  DIAS_AVISO,
  DIAS_TOLERANCIA,
  FORMAS_COBRANCA,
  condicoes,
  iso,
  lerPlataforma,
  situacaoDaCobranca,
  type SituacaoCobranca,
} from "@/lib/mensalidades";
import { confirmarMensalidade, recusarAviso, salvarPlataforma } from "./actions";

const data = (dia: string) => dia.split("-").reverse().join("/");

export function EtiquetaSituacao({ s }: { s: SituacaoCobranca | { tipo: "isenta" } }) {
  switch (s.tipo) {
    case "isenta":
      return <Etiqueta>Não cobra</Etiqueta>;
    case "em-dia":
      return <Etiqueta cor="verde">Em dia</Etiqueta>;
    case "aviso":
      return <Etiqueta cor="azul">Vence {data(s.vencimento).slice(0, 5)}</Etiqueta>;
    case "informada":
      return <Etiqueta cor="amarelo">Avisou que pagou</Etiqueta>;
    case "atraso":
      return <Etiqueta cor="vermelho">Atrasada · prazo {data(s.limite).slice(0, 5)}</Etiqueta>;
    case "bloqueada":
      return <Etiqueta cor="vermelho">Bloqueada</Etiqueta>;
  }
}

// Aba "Mensalidades" da Plataforma: configuração e situação de cada autoescola.
export async function Mensalidades() {
  const hoje = hojeISO();
  const p = await lerPlataforma();
  const autoescolas = await dbGlobal.autoescola.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
  const linhas = await Promise.all(
    autoescolas.map(async (a) => {
      const c = condicoes(a, p);
      const s = c ? await situacaoDaCobranca(a.id, hoje) : ({ tipo: "isenta" } as const);
      return { a, c, s };
    }),
  );
  const inicioMes = new Date(`${hoje.slice(0, 7)}-01T00:00:00Z`);
  const [recebido, abertas] = await Promise.all([
    dbGlobal.mensalidade.aggregate({
      where: { pagoEm: { gte: inicioMes } },
      _sum: { valorCentavos: true },
      _count: true,
    }),
    dbGlobal.mensalidade.aggregate({
      where: { pagoEm: null, autoescola: { isenta: false, ativo: true } },
      _sum: { valorCentavos: true },
      _count: true,
    }),
  ]);
  const atrasadas = linhas.filter((l) => l.s.tipo === "atraso" || l.s.tipo === "bloqueada").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Resumo
          icone={BadgeCheck}
          cor="verde"
          rotulo="Recebido este mês"
          valor={formatarMoeda(recebido._sum.valorCentavos ?? 0)}
        />
        <Resumo
          icone={Wallet}
          cor="azul"
          rotulo={`Em aberto (${abertas._count})`}
          valor={formatarMoeda(abertas._sum.valorCentavos ?? 0)}
        />
        <Resumo icone={AlertTriangle} cor="vermelho" rotulo="Atrasadas ou bloqueadas" valor={String(atrasadas)} />
      </div>

      <Tabela cabecalhos={["Autoescola", "Mensalidade", "Vencimento", "Situação", ""]}>
        {linhas.map(({ a, c, s }) => {
          const m = s.tipo !== "em-dia" && s.tipo !== "isenta" ? s.mensalidade : null;
          return (
            <tr key={a.id}>
              <td className="px-4 py-3 font-medium">{a.nome}</td>
              <td className="px-4 py-3">
                {c ? (
                  <>
                    {formatarMoeda(c.valor)}
                    <span className="text-sm text-slate-500"> · {FORMAS_COBRANCA[c.forma] ?? c.forma}</span>
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">{c ? `Dia ${c.dia}` : "—"}</td>
              <td className="px-4 py-3">
                <EtiquetaSituacao s={s} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {m && (
                    <form action={confirmarMensalidade.bind(null, m.id, true)}>
                      <Botao variante="sucesso" tamanho="pequeno" icone={Check}>
                        Confirmar pagamento de {iso(m.vencimento).slice(5, 7)}/{iso(m.vencimento).slice(0, 4)}
                      </Botao>
                    </form>
                  )}
                  {m?.comprovanteNome && (
                    <a
                      href={`/plataforma/comprovante/${m.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                    >
                      <FileText className="size-4" aria-hidden /> Comprovante
                    </a>
                  )}
                  {s.tipo === "informada" && m && (
                    <BotaoConfirmar
                      acao={recusarAviso.bind(null, m.id)}
                      mensagem="O pagamento não foi encontrado? A autoescola volta a ver o aviso de atraso e o prazo."
                      icone="cancelar"
                    >
                      Não encontrei
                    </BotaoConfirmar>
                  )}
                  <Link
                    href={`/plataforma/cobranca/${a.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Settings2 className="size-4" aria-hidden /> Cobrança e histórico
                  </Link>
                </div>
              </td>
            </tr>
          );
        })}
      </Tabela>

      <Cartao className="max-w-4xl">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Settings2 className="size-6 text-violet-600" aria-hidden /> Configuração da cobrança
        </h2>
        <p className="mb-5 text-base text-slate-600">
          Vale para todas as autoescolas (cada uma pode ter valor, dia e forma próprios em “Cobrança e histórico”). A
          mensalidade de cada mês é criada sozinha. <b>{DIAS_AVISO} dias úteis antes</b> do vencimento aparece uma faixa
          verde com o Pix; depois do vencimento, uma faixa vermelha com prazo de <b>{DIAS_TOLERANCIA} dias úteis</b>.
        </p>
        <FormAcao acao={salvarPlataforma} textoBotao="Salvar configuração">
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo label="Mensalidade padrão (R$)" ajuda="Em branco: só cobra quem tiver valor próprio.">
              <Input
                name="valor"
                inputMode="decimal"
                placeholder="Ex.: 99,00"
                defaultValue={moedaParaInput(p.mensalidadeCentavos)}
              />
            </Campo>
            <Campo label="Dia do vencimento" ajuda="Fim de semana ou feriado: vence no próximo dia útil.">
              <Select name="diaVencimento" defaultValue={String(p.diaVencimento)}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Dia {d}
                  </option>
                ))}
              </Select>
            </Campo>
            <Campo label="Forma de pagamento padrão">
              <Select name="formaPadrao" defaultValue={p.formaPadrao}>
                {Object.entries(FORMAS_COBRANCA).map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </Select>
            </Campo>
          </div>

          <fieldset className="grid gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
            <legend className="px-1 text-base font-semibold">Pix para receber</legend>
            <Campo label="Chave Pix" className="sm:col-span-3">
              <Input
                name="chavePix"
                defaultValue={p.chavePix ?? ""}
                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              />
            </Campo>
            <Campo
              label="Nome de quem recebe"
              ajuda="Aparece no app do banco ao ler o QR Code."
              className="sm:col-span-2"
            >
              <Input name="nomeRecebedor" maxLength={60} defaultValue={p.nomeRecebedor ?? ""} />
            </Campo>
            <Campo label="Cidade">
              <Input name="cidadeRecebedor" maxLength={40} defaultValue={p.cidadeRecebedor ?? ""} />
            </Campo>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo
              label="Instruções para boleto, cartão ou transferência"
              ajuda="Aparecem na faixa quando a forma não é Pix."
              className="sm:col-span-2"
            >
              <Textarea name="instrucoes" rows={2} maxLength={400} defaultValue={p.instrucoes ?? ""} />
            </Campo>
            <Campo
              label="WhatsApp para dúvidas sobre a mensalidade"
              ajuda="Botão “Falar com o suporte” na faixa vermelha."
            >
              <Input name="whatsappCobranca" defaultValue={p.whatsappCobranca ?? ""} placeholder="(51) 99999-9999" />
            </Campo>
          </div>

          <Opcoes
            nome="bloquearAutomatico"
            legenda="Depois do prazo, se não pagar nem avisar que pagou:"
            opcoes={{
              on: {
                titulo: "Bloquear o acesso",
                descricao: "A autoescola vê só a tela com o Pix e o “Já paguei” até regularizar.",
              },
              off: { titulo: "Só avisar", descricao: "A faixa vermelha continua, sem bloquear." },
            }}
            inicial={p.bloquearAutomatico ? "on" : "off"}
          />
        </FormAcao>
      </Cartao>

      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Lock className="size-4" aria-hidden /> A sua autoescola e as marcadas como isentas nunca são cobradas.
        <CalendarClock className="ml-2 size-4" aria-hidden /> Hoje: {data(hoje)}.
      </p>
    </div>
  );
}

function Resumo({
  icone,
  cor,
  rotulo,
  valor,
}: {
  icone: typeof Wallet;
  cor: "verde" | "azul" | "vermelho";
  rotulo: string;
  valor: string;
}) {
  return (
    <Cartao className="flex items-center gap-4">
      <IconeRedondo icone={icone} cor={cor} />
      <div>
        <div className="text-sm text-slate-600">{rotulo}</div>
        <div className="text-2xl font-bold">{valor}</div>
      </div>
    </Cartao>
  );
}
