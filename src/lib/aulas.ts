// Regras e formatação de aulas. Horários são sempre tratados no fuso de
// Brasília (UTC−3, sem horário de verão desde 2019).

export const FUSO = "America/Sao_Paulo";
const OFFSET = "-03:00";

export const TIPOS_AULA: Record<string, string> = {
  pratica: "Prática",
  teorica: "Teórica",
};

export const STATUS_AULA: Record<string, string> = {
  agendada: "Agendada",
  presente: "Presente",
  faltou: "Faltou",
  cancelada: "Cancelada",
};

export const COR_STATUS_AULA = {
  agendada: "azul",
  presente: "verde",
  faltou: "vermelho",
  cancelada: "cinza",
} as const;

export const DURACOES = [30, 45, 50, 60, 90, 100];

// "2026-10-21" + "14:30" (horário de Brasília) → Date. Retorna null se inválido.
export function lerDataHora(data: string, hora: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) return null;
  const d = new Date(`${data}T${hora}:00${OFFSET}`);
  return isNaN(d.getTime()) ? null : d;
}

// Início e fim (exclusivo) de um dia em Brasília.
export function intervaloDoDia(dia: string) {
  const inicio = new Date(`${dia}T00:00:00${OFFSET}`);
  return { inicio, fim: new Date(inicio.getTime() + 24 * 60 * 60 * 1000) };
}

// Soma dias a uma data AAAA-MM-DD.
export function somarDias(dia: string, dias: number) {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function formatarHora(data: Date) {
  return data.toLocaleTimeString("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" });
}

// "Quinta-feira, 22 de outubro de 2026"
export function formatarDiaSemana(dia: string) {
  const texto = new Date(`${dia}T12:00:00Z`).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarDataHora(data: Date) {
  return `${data.toLocaleDateString("pt-BR", { timeZone: FUSO })} ${formatarHora(data)}`;
}

export function fimDaAula(aula: { dataHora: Date; duracaoMin: number }) {
  return new Date(aula.dataHora.getTime() + aula.duracaoMin * 60 * 1000);
}

// Resumo de aulas de uma matrícula. Falta não consome a aula contratada;
// aulas agendadas já reservam o saldo.
export function resumoAulas(
  matricula: { qtdPraticas: number; qtdTeoricas: number },
  aulas: { tipo: string; status: string }[],
) {
  const contar = (tipo: string, status: string) =>
    aulas.filter((a) => a.tipo === tipo && a.status === status).length;
  const resumo = (tipo: string, contratadas: number) => {
    const feitas = contar(tipo, "presente");
    const agendadas = contar(tipo, "agendada");
    return {
      contratadas,
      feitas,
      agendadas,
      faltas: contar(tipo, "faltou"),
      restantes: Math.max(contratadas - feitas - agendadas, 0),
    };
  };
  return { pratica: resumo("pratica", matricula.qtdPraticas), teorica: resumo("teorica", matricula.qtdTeoricas) };
}
