import { dataParaInput, hojeISO } from "./format";

// Processo de habilitação: exames, provas e taxas externas de cada matrícula.

export const TIPOS_PROCESSO: Record<string, { titulo: string; descricao: string }> = {
  primeira: { titulo: "1ª habilitação", descricao: "Ainda não tem CNH" },
  adicao: { titulo: "Adição de categoria", descricao: "Já tem CNH e quer outra categoria (ex.: tem B, quer A)" },
  mudanca: { titulo: "Mudança de categoria", descricao: "Passa para categoria maior (ex.: B para C, D ou E)" },
  reabilitacao: { titulo: "Reabilitação", descricao: "CNH cassada ou vencida há muito tempo" },
};

export const CURSOS_TEORICOS: Record<string, { titulo: string; descricao: string }> = {
  autoescola: { titulo: "Na autoescola", descricao: "Aulas teóricas pagas, dadas pela autoescola" },
  online: { titulo: "Online grátis (app CNH do Brasil)", descricao: "O aluno faz o curso pelo aplicativo do governo" },
  dispensado: { titulo: "Não precisa", descricao: "Ex.: adição de categoria" },
};

type Resultados = { ok: string; falhou?: string };
const EXAME: Resultados = { ok: "Aprovado", falhou: "Reprovado" };
const APTIDAO: Resultados = { ok: "Apto", falhou: "Inapto" };
const CONCLUIDO: Resultados = { ok: "Concluído" };

// Tipos de exame/taxa. `reexame`: quem reprova ganha uma nova tentativa automaticamente.
export const TIPOS_ETAPA: Record<string, { titulo: string; resultados: Resultados; reexame?: boolean }> = {
  medico: { titulo: "Exame médico (inclui vista)", resultados: APTIDAO },
  psicologico: { titulo: "Avaliação psicológica (psicotécnico)", resultados: APTIDAO },
  toxicologico: { titulo: "Exame toxicológico", resultados: { ok: "Negativo", falhou: "Positivo" } },
  biometria: { titulo: "Coleta biométrica", resultados: CONCLUIDO },
  curso_online: { titulo: "Curso teórico online (CNH do Brasil)", resultados: CONCLUIDO },
  exame_teorico: { titulo: "Exame teórico (prova do Detran)", resultados: EXAME, reexame: true },
  exame_pratico: { titulo: "Exame prático", resultados: EXAME, reexame: true },
  emissao: { titulo: "Emissão da CNH", resultados: CONCLUIDO },
  outra: { titulo: "Outra taxa", resultados: CONCLUIDO },
};

// Valor padrão da nova tentativa depois de reprovar (taxa de reexame / "reprova").
export const REEXAME = "reexame";

export type TaxaPadrao = { valor: number | null; cobranca: "aluno" | "autoescola" };
export type TaxasPadrao = Record<string, TaxaPadrao>;

// Itens que aparecem na tabela de taxas das configurações.
export const TAXAS_CONFIGURAVEIS: [tipo: string, titulo: string][] = [
  ...Object.entries(TIPOS_ETAPA)
    .filter(([t]) => t !== "outra")
    .map(([t, d]) => [t, d.titulo] as [string, string]),
  [REEXAME, "Reexame (taxa de reprova)"],
];

export function lerTaxasPadrao(json: unknown): TaxasPadrao {
  const r: TaxasPadrao = {};
  if (json && typeof json === "object") {
    for (const [tipo, v] of Object.entries(json as Record<string, unknown>)) {
      const x = v as { valor?: unknown; cobranca?: unknown };
      r[tipo] = {
        valor: Number.isInteger(x?.valor) ? (x.valor as number) : null,
        cobranca: x?.cobranca === "autoescola" ? "autoescola" : "aluno",
      };
    }
  }
  return r;
}

// Categorias do exame prático: "AB" faz prova de A e de B.
export function letrasDaCategoria(categoria: string) {
  return [...new Set(categoria.split(""))].filter((c) => "ABCDE".includes(c));
}

const PROFISSIONAL = /[CDE]/;

type NovaEtapa = {
  tipo: string;
  descricao: string;
  categoria: string | null;
  ordem: number;
  valorCentavos: number | null;
  cobranca: string;
};

// Lista inicial de exames e taxas conforme o processo, a categoria e o curso teórico.
// - Exame médico: sempre. Psicológico: 1ª habilitação, reabilitação e categorias profissionais.
// - Toxicológico: 1ª habilitação (qualquer categoria, Lei 15.153/2025) e categorias C, D e E.
// - Curso e exame teórico: não entram na adição de categoria.
// - Exame prático: uma prova para cada letra da categoria.
export function gerarEtapas(
  m: { tipoProcesso: string; categoria: string; cursoTeorico: string },
  taxas: TaxasPadrao,
): NovaEtapa[] {
  const novas: Omit<NovaEtapa, "ordem" | "valorCentavos" | "cobranca">[] = [];
  const add = (tipo: string, descricao = TIPOS_ETAPA[tipo].titulo, categoria: string | null = null) =>
    novas.push({ tipo, descricao, categoria });

  const primeira = m.tipoProcesso === "primeira";
  const comTeorico = m.tipoProcesso !== "adicao";
  const profissional = PROFISSIONAL.test(m.categoria);

  add("medico");
  if (primeira || m.tipoProcesso === "reabilitacao" || profissional) add("psicologico");
  if (primeira || profissional) add("toxicologico");
  if (primeira || m.tipoProcesso === "reabilitacao") add("biometria");
  if (comTeorico && m.cursoTeorico === "online") add("curso_online");
  if (comTeorico) add("exame_teorico");
  for (const letra of letrasDaCategoria(m.categoria)) {
    add("exame_pratico", `Exame prático – categoria ${letra}`, letra);
  }
  add("emissao");

  return novas.map((e, i) => ({
    ...e,
    ordem: i + 1,
    valorCentavos: taxas[e.tipo]?.valor ?? null,
    cobranca: taxas[e.tipo]?.cobranca ?? "aluno",
  }));
}

export type SituacaoEtapa = "concluida" | "reprovada" | "agendada" | "aguardando" | "pendente";

// Situação mostrada na tela: resultado, ou se tem data marcada (futura ou já passada).
export function situacaoEtapa(e: { resultado: string | null; data: Date | null }, hoje = hojeISO()): SituacaoEtapa {
  if (e.resultado === "ok") return "concluida";
  if (e.resultado === "falhou") return "reprovada";
  if (!e.data) return "pendente";
  return dataParaInput(e.data) >= hoje ? "agendada" : "aguardando";
}

export function textoSituacaoEtapa(e: { tipo: string; resultado: string | null; data: Date | null }) {
  const r = TIPOS_ETAPA[e.tipo]?.resultados ?? CONCLUIDO;
  const s = situacaoEtapa(e);
  if (s === "concluida") return r.ok;
  if (s === "reprovada") return r.falhou ?? "Não concluído";
  if (s === "agendada") return "Agendado";
  if (s === "aguardando") return "Aguardando resultado";
  return "Pendente";
}

export const COR_SITUACAO_ETAPA = {
  concluida: "verde",
  reprovada: "vermelho",
  agendada: "azul",
  aguardando: "amarelo",
  pendente: "cinza",
} as const;
