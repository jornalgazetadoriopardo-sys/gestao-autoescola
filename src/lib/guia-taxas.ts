import type { Etapa } from "@prisma/client";

// Guia de taxas do Detran: as taxas que o próprio aluno paga no banco ou na
// lotérica pelo CPF (exames teórico e prático, emissão da CNH, curso
// especializado), agrupadas como no papel que as autoescolas entregam:
// "( 2 ) Exame de Habilitação Prático R$ 52,83".

export const TIPOS_GUIA = ["exame_teorico", "exame_pratico", "emissao", "curso_especializado"];

export const OBS_GUIA_PADRAO = "Pagamento no banco ou em lotérica, pelo número do CPF do aluno.";

const NOMES: Record<string, string> = {
  exame_teorico: "Exame de Habilitação Teórico",
  exame_pratico: "Exame de Habilitação Prático",
  emissao: "Emissão de CNH",
  curso_especializado: "Curso especializado",
};

export type GrupoGuia = {
  chave: string;
  nome: string;
  valorCentavos: number;
  // Taxas ainda a pagar e já pagas (ou que não precisam mais, porque o exame aconteceu).
  pendentes: number;
  pagas: number;
};

// Taxa que entra na guia: tipo do Detran, paga direto pelo aluno e com valor.
export function entraNaGuia(e: Pick<Etapa, "tipo" | "cobranca" | "valorCentavos">) {
  return TIPOS_GUIA.includes(e.tipo) && e.cobranca === "aluno" && (e.valorCentavos ?? 0) > 0;
}

// Já paga: marcada como paga, ou o exame já teve resultado (só faz a prova quem pagou).
export function taxaPaga(e: Pick<Etapa, "pagoEm" | "resultado">) {
  return Boolean(e.pagoEm) || e.resultado !== null;
}

export function gruposDaGuia(etapas: Etapa[], tipoProcesso: string): GrupoGuia[] {
  const grupos = new Map<string, GrupoGuia>();
  for (const e of etapas.filter(entraNaGuia)) {
    const reexame = /^reexame/i.test(e.descricao);
    const chave = `${e.tipo}|${e.valorCentavos}|${reexame ? "r" : ""}`;
    let nome = NOMES[e.tipo] ?? e.descricao;
    if (reexame) nome = e.tipo === "exame_pratico" ? "Reexame prático" : "Reexame teórico";
    else if (tipoProcesso === "reciclagem" && e.tipo === "exame_teorico") nome = "Exame teórico da reciclagem";
    const g = grupos.get(chave) ?? { chave, nome, valorCentavos: e.valorCentavos!, pendentes: 0, pagas: 0 };
    if (taxaPaga(e)) g.pagas++;
    else g.pendentes++;
    grupos.set(chave, g);
  }
  const ordem = (g: GrupoGuia) => TIPOS_GUIA.indexOf(g.chave.split("|")[0]);
  return [...grupos.values()].sort((a, b) => ordem(a) - ordem(b));
}
