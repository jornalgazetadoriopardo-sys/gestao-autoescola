import "server-only";
import type { Aula, Instrutor, Veiculo } from "@prisma/client";
import { TIPOS_AULA, fimDaAula, formatarHora } from "./aulas";
import { formatarDataLocal } from "./format";

// Outros documentos da autoescola, além do contrato. Cada autoescola envia o
// seu modelo em Word (.docx) com as mesmas marcações do contrato ({{aluno_nome}}
// etc.) e, na declaração, também as da aula. Ver TIPOS_DOCUMENTO abaixo.
export const TIPOS_DOCUMENTO: Record<
  string,
  { titulo: string; curto: string; descricao: string; exemplo: string; porAula: boolean }
> = {
  declaracao: {
    titulo: "Declaração de comparecimento",
    curto: "Declaração",
    descricao:
      "Para o aluno apresentar na escola ou no trabalho e justificar a falta. É gerada a partir de uma aula: na lista de aulas do aluno, clique em Declaração.",
    exemplo: "/modelo-declaracao.docx",
    porAula: true,
  },
  imagem: {
    titulo: "Autorização de uso de imagem",
    curto: "Autorização de imagem",
    descricao:
      "Termo em que o aluno autoriza (ou não) a autoescola a usar fotos e vídeos dele. Fica no botão Autorização de imagem da matrícula.",
    exemplo: "/modelo-autorizacao-imagem.docx",
    porAula: false,
  },
};

// Marcações só da declaração (a aula escolhida).
export const CAMPOS_AULA: [chave: string, descricao: string][] = [
  ["aula_data", "Data da aula (25/10/2026)"],
  ["aula_dia_semana", "Dia da semana (sábado)"],
  ["aula_inicio", "Horário de início (14:00)"],
  ["aula_fim", "Horário de término (14:50)"],
  ["aula_duracao", "Duração (50 minutos)"],
  ["aula_tipo", "Tipo de aula (prática ou teórica)"],
  ["instrutor_nome", "Nome do instrutor"],
  ["veiculo_placa", "Placa do veículo"],
];

export function dadosDaAula(aula: Aula & { instrutor: Instrutor | null; veiculo: Veiculo | null }) {
  const VAZIO = "____________________";
  return {
    aula_data: formatarDataLocal(aula.dataHora),
    aula_dia_semana: aula.dataHora.toLocaleDateString("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" }),
    aula_inicio: formatarHora(aula.dataHora),
    aula_fim: formatarHora(fimDaAula(aula)),
    aula_duracao: `${aula.duracaoMin} minutos`,
    aula_tipo: (TIPOS_AULA[aula.tipo] ?? aula.tipo).toLowerCase(),
    instrutor_nome: aula.instrutor?.nome ?? VAZIO,
    veiculo_placa: aula.veiculo?.placa ?? VAZIO,
  };
}
