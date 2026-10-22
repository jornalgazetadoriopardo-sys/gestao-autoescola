import { notFound } from "next/navigation";
import type { Aula, Instrutor } from "@prisma/client";
import { enderecoCompleto, obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import {
  FORMAS_PAGAMENTO,
  formatarCpf,
  formatarData,
  formatarDataLocal,
  formatarMoeda,
  formatarPercentual,
  formatarTelefone,
  situacaoParcela,
} from "@/lib/format";
import { FUSO, formatarHora } from "@/lib/aulas";
import { ORIENTACOES_PADRAO } from "@/lib/orientacoes";
import { FORMAS_MATRICULA } from "@/lib/pagamentos";
import { CabecalhoDocumento } from "../../cabecalho-documento";
import { RodapeDocumento } from "../../rodape-documento";
import { EnviarWhatsapp } from "./enviar-whatsapp";

export const dynamic = "force-dynamic";

type AulaComInstrutor = Aula & { instrutor: Instrutor | null };

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function diaSemana(data: Date) {
  return SEMANA[new Date(data.toLocaleDateString("en-CA", { timeZone: FUSO }) + "T12:00:00Z").getUTCDay()];
}

// Guia entregue ao aluno na matrícula: dados, pagamento, cronograma de aulas
// (preenchido com as aulas já agendadas, ou em branco para escrever à mão) e orientações.
export default async function GuiaMatriculaPage({ params }: { params: Promise<{ id: string }> }) {
  const [matricula, config] = await Promise.all([
    db.matricula.findUnique({
      where: { id: Number((await params).id) || 0 },
      include: {
        aluno: true,
        parcelas: { orderBy: { numero: "asc" } },
        aulas: { orderBy: { dataHora: "asc" }, include: { instrutor: true } },
      },
    }),
    obterConfig(),
  ]);
  if (!matricula) notFound();
  const { aluno } = matricula;

  // Aulas que ocupam a vaga contratada vão para os quadros; faltas aparecem à parte.
  const doTipo = (tipo: string) =>
    matricula.aulas.filter((a) => a.tipo === tipo && (a.status === "agendada" || a.status === "presente"));
  const faltas = matricula.aulas.filter((a) => a.status === "faltou");
  const orientacoes = (config.orientacoesAluno ?? ORIENTACOES_PADRAO)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const pagaNaHora = matricula.formaPagamento !== "carne";
  const total = matricula.parcelas.reduce((s, p) => s + p.valorCentavos, 0);

  const mensagem = montarMensagem({
    aluno: aluno.nome,
    autoescola: config.nome,
    categoria: matricula.categoria,
    praticas: matricula.qtdPraticas,
    teoricas: matricula.qtdTeoricas,
    agendadas: matricula.aulas.filter((a) => a.status === "agendada"),
    pagamento: pagaNaHora
      ? `pago à vista (${FORMAS_PAGAMENTO[matricula.formaPagamento] ?? matricula.formaPagamento}) — quitado`
      : matricula.parcelas.length > 0
        ? `${matricula.parcelas.length}x de ${formatarMoeda(matricula.parcelas[0].valorCentavos)}, 1ª parcela em ${formatarData(matricula.parcelas[0].vencimento)}`
        : "sem valor a pagar",
    contato: config.whatsapp ?? config.telefone,
  });

  return (
    <>
      <EnviarWhatsapp telefone={aluno.telefone} mensagem={mensagem} />
      <div className="folha text-[13px] leading-snug">
        <CabecalhoDocumento config={config} titulo="Guia do aluno" />

        <p className="mt-3 text-base">
          Seja bem-vindo(a), <b>{aluno.nome.split(" ")[0]}</b>! Aqui estão as informações da sua matrícula.
          Guarde este guia.
        </p>

        <Secao titulo="Seus dados">
          <div className="grid grid-cols-3 gap-x-6 gap-y-1">
            <Dado rotulo="Aluno" valor={aluno.nome} />
            <Dado rotulo="CPF" valor={formatarCpf(aluno.cpf)} />
            <Dado rotulo="Telefone" valor={formatarTelefone(aluno.telefone) || "—"} />
            <Dado rotulo="Nascimento" valor={formatarData(aluno.nascimento) || "—"} />
            <Dado rotulo="E-mail" valor={aluno.email ?? "—"} />
            <Dado rotulo="Endereço" valor={aluno.endereco ?? "—"} />
          </div>
        </Secao>

        <Secao titulo="Sua matrícula">
          <div className="grid grid-cols-4 gap-x-6 gap-y-1">
            <Dado rotulo="Categoria" valor={matricula.categoria} />
            <Dado rotulo="Data da matrícula" valor={formatarDataLocal(matricula.data)} />
            <Dado rotulo="Aulas práticas" valor={String(matricula.qtdPraticas)} />
            <Dado rotulo="Aulas teóricas" valor={String(matricula.qtdTeoricas)} />
          </div>
        </Secao>

        <Secao titulo="Pagamento">
          <p>
            <b>{FORMAS_MATRICULA[matricula.formaPagamento]?.titulo ?? matricula.formaPagamento}</b> · Valor:{" "}
            <b>{formatarMoeda(matricula.valorTotalCentavos)}</b>
            {matricula.jurosMesBp > 0 &&
              ` · Total parcelado: ${formatarMoeda(total)} (juros de ${formatarPercentual(matricula.jurosMesBp)} ao mês)`}
          </p>
          {pagaNaHora ? (
            <p className="mt-1">
              {matricula.parcelas[0]?.pagoEm
                ? `Pago em ${formatarData(matricula.parcelas[0].pagoEm)}${matricula.parcelas[0].obs ? ` (${matricula.parcelas[0].obs})` : ""}. Matrícula quitada.`
                : "Sem valor a pagar."}
            </p>
          ) : matricula.parcelas.length === 0 ? (
            <p className="mt-1">Sem valor a pagar.</p>
          ) : (
            <>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {matricula.parcelas.map((p) => (
                  <div key={p.id} className="rounded border border-slate-300 px-2 py-1">
                    <div className="text-[11px] text-slate-500">
                      Parcela {p.numero}/{matricula.parcelas.length}
                    </div>
                    <div className="font-semibold">
                      {formatarData(p.vencimento)} · {formatarMoeda(p.valorCentavos)}
                    </div>
                    {situacaoParcela(p) === "pago" && <div className="text-[11px] text-green-700">Paga</div>}
                  </div>
                ))}
              </div>
              {config.chavePix && (
                <p className="mt-1.5">
                  Pague com Pix: <b>{config.chavePix}</b>
                </p>
              )}
            </>
          )}
        </Secao>

        {matricula.qtdPraticas > 0 && (
          <Cronograma
            titulo="Aulas práticas"
            rotulo="Prática"
            total={matricula.qtdPraticas}
            aulas={doTipo("pratica")}
          />
        )}
        {matricula.qtdTeoricas > 0 && (
          <Cronograma
            titulo="Aulas teóricas"
            rotulo="Teórica"
            total={matricula.qtdTeoricas}
            aulas={doTipo("teorica")}
          />
        )}
        {faltas.length > 0 && (
          <p className="mt-2 text-[12px] text-slate-700">
            <b>Faltas registradas:</b>{" "}
            {faltas.map((a) => `${formatarData(a.dataHora)} ${formatarHora(a.dataHora)}`).join(" · ")} (as
            faltas não contam como aula dada).
          </p>
        )}

        <Secao titulo="Informações importantes">
          <ul className="list-disc space-y-0.5 pl-5">
            {orientacoes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <p className="mt-2">
            <b>Fale com a gente:</b>{" "}
            {[
              config.telefone && `Tel. ${config.telefone}`,
              config.whatsapp && `WhatsApp ${config.whatsapp}`,
              config.email,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
            {enderecoCompleto(config) && (
              <>
                <br />
                <b>Endereço:</b> {enderecoCompleto(config)}
              </>
            )}
          </p>
        </Secao>

        <div className="mt-12 grid grid-cols-2 gap-16 break-inside-avoid">
          <div className="border-t border-slate-800 pt-1 text-center">{aluno.nome}</div>
          <div className="border-t border-slate-800 pt-1 text-center">{config.nome}</div>
        </div>
        <RodapeDocumento />
      </div>
    </>
  );
}

// Um quadro por aula contratada; os primeiros mostram as aulas já marcadas.
function Cronograma({
  titulo,
  rotulo,
  total,
  aulas,
}: {
  titulo: string;
  rotulo: string;
  total: number;
  aulas: AulaComInstrutor[];
}) {
  return (
    <Secao titulo={`Cronograma — ${titulo} (${total})`}>
      <p className="mb-2 text-[12px] text-slate-600">
        {aulas.length === 0
          ? "Ainda não há aulas agendadas. Anote nos quadros a data e o horário combinados."
          : aulas.length < total
            ? "Os quadros preenchidos já estão agendados. Anote nos demais a data e o horário combinados."
            : "Todas as aulas já estão agendadas."}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: total }, (_, i) => {
          const aula = aulas[i];
          return (
            <div
              key={i}
              className="flex h-[24mm] flex-col rounded border border-slate-400 px-2 py-1.5 break-inside-avoid"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {rotulo} {i + 1}
                </span>
                {aula?.status === "presente" && (
                  <span className="text-[11px] font-semibold text-green-700">✓ Feita</span>
                )}
              </div>
              {aula ? (
                <div className="mt-0.5">
                  <div className="font-semibold">
                    {diaSemana(aula.dataHora)}, {formatarData(aula.dataHora)}
                  </div>
                  <div className="truncate">
                    <b>{formatarHora(aula.dataHora)}</b>
                    {aula.instrutor && <span className="text-[11px] text-slate-600"> · {aula.instrutor.nome}</span>}
                  </div>
                </div>
              ) : (
                <div className="mt-1 space-y-1.5 text-[12px] text-slate-500">
                  <div>Data: ____/____/______</div>
                  <div>Horário: ____:____</div>
                </div>
              )}
              <div className="mt-auto text-[10px] text-slate-500">Visto: ____________________</div>
            </div>
          );
        })}
      </div>
    </Secao>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 break-inside-avoid">
      <h2 className="mb-1.5 border-b border-slate-400 pb-0.5 text-[15px] font-bold uppercase tracking-wide">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase text-slate-500">{rotulo}</div>
      <div className="truncate font-semibold">{valor}</div>
    </div>
  );
}

function montarMensagem(d: {
  aluno: string;
  autoescola: string;
  categoria: string;
  praticas: number;
  teoricas: number;
  agendadas: Aula[];
  pagamento: string;
  contato: string | null;
}) {
  const linhas = [
    `Olá, ${d.aluno.split(" ")[0]}! Aqui é da ${d.autoescola}.`,
    `Sua matrícula na categoria ${d.categoria} está confirmada.`,
    "",
    `Aulas contratadas: ${d.praticas} práticas e ${d.teoricas} teóricas.`,
  ];
  if (d.agendadas.length > 0) {
    linhas.push("", "Suas aulas agendadas:");
    for (const a of d.agendadas.slice(0, 30)) {
      linhas.push(
        `• ${diaSemana(a.dataHora)}, ${formatarData(a.dataHora)} às ${formatarHora(a.dataHora)} (${a.tipo === "pratica" ? "prática" : "teórica"})`,
      );
    }
  } else {
    linhas.push("As datas das aulas serão combinadas com você.");
  }
  linhas.push("", `Pagamento: ${d.pagamento}.`);
  if (d.contato) linhas.push("", `Qualquer dúvida, fale com a gente: ${d.contato}`);
  return linhas.join("\n");
}
