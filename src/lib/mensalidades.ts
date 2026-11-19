import "server-only";
import { Prisma, type Autoescola, type Mensalidade, type PlataformaConfig } from "@prisma/client";
import { dbGlobal } from "./db";
import { proximoDiaUtil, somarDiasUteis } from "./dias-uteis";
import { hojeISO } from "./format";
import { codigoPix, qrCodePix } from "./pix";

// Mensalidade que cada autoescola paga ao dono do sistema.
// - Uma por mês (competência AAAA-MM), criada sozinha no começo do mês.
// - Vence no dia escolhido (passa para o próximo dia útil se cair em fim de semana ou feriado).
// - 2 dias úteis antes: faixa verde com o Pix. Depois do vencimento: faixa vermelha
//   com o prazo de tolerância (2 dias úteis). Depois do prazo, sem pagamento nem
//   aviso de pagamento ("Já paguei"), a conta fica bloqueada (se estiver ligado).
// O pagamento é confirmado pelo dono do sistema na Plataforma.

export const FORMAS_COBRANCA: Record<string, string> = {
  pix: "Pix",
  boleto: "Boleto",
  cartao: "Cartão de crédito",
  transferencia: "Transferência bancária",
};

export const DIAS_AVISO = 2;
export const DIAS_TOLERANCIA = 2;

export const COMPROVANTE_MAX = 2_000_000;

const PADRAO: Omit<PlataformaConfig, "atualizadoEm"> = {
  id: 1,
  mensalidadeCentavos: null,
  diaVencimento: 10,
  formaPadrao: "pix",
  chavePix: null,
  nomeRecebedor: null,
  cidadeRecebedor: null,
  instrucoes: null,
  bloquearAutomatico: true,
  whatsappCobranca: null,
};

export async function lerPlataforma() {
  return (await dbGlobal.plataformaConfig.findUnique({ where: { id: 1 } })) ?? { ...PADRAO, atualizadoEm: new Date() };
}
export type Plataforma = Awaited<ReturnType<typeof lerPlataforma>>;

type AutoescolaCobranca = Pick<
  Autoescola,
  "id" | "isenta" | "mensalidadeCentavos" | "diaVencimento" | "formaCobranca" | "cobrancaInicio"
>;

// Valor, dia e forma de uma autoescola (o próprio ou o padrão). Null: não paga.
export function condicoes(a: AutoescolaCobranca, p: Plataforma) {
  if (a.isenta) return null;
  const valor = a.mensalidadeCentavos ?? p.mensalidadeCentavos;
  if (!valor || valor <= 0) return null;
  return {
    valor,
    dia: a.diaVencimento ?? p.diaVencimento,
    forma: a.formaCobranca ?? p.formaPadrao,
  };
}

// Vencimento da competência (AAAA-MM) no dia escolhido; dia 31 em mês curto vira o último dia.
export function vencimentoDe(competencia: string, dia: number) {
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return proximoDiaUtil(`${competencia}-${String(Math.min(dia, ultimo)).padStart(2, "0")}`);
}

export const iso = (d: Date) => d.toISOString().slice(0, 10);

// Cria a mensalidade do mês atual, se ainda não existe (e se já começou a cobrança).
export async function garantirMensalidade(a: AutoescolaCobranca, p: Plataforma, hoje = hojeISO()) {
  const c = condicoes(a, p);
  if (!c) return;
  const competencia = hoje.slice(0, 7);
  const vencimento = vencimentoDe(competencia, c.dia);
  if (a.cobrancaInicio && vencimento < iso(a.cobrancaInicio)) return;
  const existe = await dbGlobal.mensalidade.findUnique({
    where: { autoescolaId_competencia: { autoescolaId: a.id, competencia } },
    select: { id: true },
  });
  if (existe) return;
  try {
    await dbGlobal.mensalidade.create({
      data: {
        autoescolaId: a.id,
        competencia,
        vencimento: new Date(`${vencimento}T00:00:00Z`),
        valorCentavos: c.valor,
        forma: c.forma,
      },
    });
  } catch (e) {
    // Já existe (outra página criou ao mesmo tempo).
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }
}

export type SituacaoCobranca =
  | { tipo: "em-dia" }
  | {
      tipo: "aviso" | "atraso" | "bloqueada" | "informada";
      mensalidade: Omit<Mensalidade, "comprovante">;
      vencimento: string;
      limite: string;
    };

// Situação da mensalidade mais antiga em aberto de uma autoescola.
export async function situacaoDaCobranca(autoescolaId: number, hoje = hojeISO()): Promise<SituacaoCobranca> {
  const [p, a] = await Promise.all([lerPlataforma(), dbGlobal.autoescola.findUnique({ where: { id: autoescolaId } })]);
  if (!a || !condicoes(a, p)) return { tipo: "em-dia" };
  await garantirMensalidade(a, p, hoje);
  const m = await dbGlobal.mensalidade.findFirst({
    where: { autoescolaId, pagoEm: null },
    orderBy: { vencimento: "asc" },
  });
  if (!m) return { tipo: "em-dia" };
  const vencimento = iso(m.vencimento);
  const limite = somarDiasUteis(vencimento, DIAS_TOLERANCIA);
  const base = { mensalidade: m, vencimento, limite };
  if (m.informadoEm) return { tipo: "informada", ...base };
  if (hoje < somarDiasUteis(vencimento, -DIAS_AVISO)) return { tipo: "em-dia" };
  if (hoje <= vencimento) return { tipo: "aviso", ...base };
  if (hoje <= limite || !p.bloquearAutomatico) return { tipo: "atraso", ...base };
  return { tipo: "bloqueada", ...base };
}

// Pix "copia e cola" e QR Code da mensalidade (com o valor), se a forma for Pix e houver chave.
export async function pixDaMensalidade(m: Pick<Mensalidade, "id" | "valorCentavos" | "forma">, p: Plataforma) {
  if (m.forma !== "pix" || !p.chavePix) return null;
  const dados = {
    chave: p.chavePix,
    nome: p.nomeRecebedor || "Gestao Autoescola",
    cidade: p.cidadeRecebedor,
    valorCentavos: m.valorCentavos,
    identificador: `MENS${m.id}`,
  };
  return { chave: p.chavePix, copiaECola: codigoPix(dados), svg: await qrCodePix(dados) };
}
