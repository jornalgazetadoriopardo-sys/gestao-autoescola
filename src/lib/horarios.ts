// Horário de funcionamento da autoescola (Configurações > Horários).
// Usado no servidor (validar-aula, buscarOcupados) e nos formulários.
// - Cada dia da semana: abre ou não, e das quantas às quantas.
// - Almoço (opcional): não se marca aula nesse intervalo.
// - Dias especiais: abre num dia que normalmente fecha (feriado, domingo...).
// - Exceção: uma aula pode ser marcada fora disso, marcando "Exceção" ao agendar.

export const NOMES_DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const NOMES_EXTENSO = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const PLURAL = ["aos domingos", "às segundas", "às terças", "às quartas", "às quintas", "às sextas", "aos sábados"];

export type HorarioDia = { aberto: boolean; inicio: string; fim: string };
export type Horarios = {
  // Índice 0 = domingo ... 6 = sábado.
  dias: HorarioDia[];
  almoco: { inicio: string; fim: string } | null;
};
export type DiaEspecialInfo = { data: string; inicio: string; fim: string; motivo: string | null };

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
export const horaValida = (h: unknown): h is string => typeof h === "string" && HORA.test(h);

// Lê o JSON salvo. Sem nada salvo (quem já usava o sistema): todos os dias abertos
// no expediente antigo, como funcionava antes.
export function lerHorarios(json: unknown, horaInicio: string, horaFim: string): Horarios {
  const padrao: Horarios = {
    dias: Array.from({ length: 7 }, () => ({ aberto: true, inicio: horaInicio, fim: horaFim })),
    almoco: null,
  };
  if (!json || typeof json !== "object") return padrao;
  const j = json as { dias?: unknown; almoco?: unknown };
  const dias = Array.isArray(j.dias) && j.dias.length === 7 ? j.dias : null;
  const almoco = j.almoco as { inicio?: unknown; fim?: unknown } | null | undefined;
  return {
    dias: padrao.dias.map((p, i) => {
      const d = (dias?.[i] ?? {}) as Partial<HorarioDia>;
      const ok = horaValida(d.inicio) && horaValida(d.fim) && d.fim > d.inicio;
      return ok ? { aberto: d.aberto !== false, inicio: d.inicio!, fim: d.fim! } : p;
    }),
    almoco:
      almoco && horaValida(almoco.inicio) && horaValida(almoco.fim) && almoco.fim > almoco.inicio
        ? { inicio: almoco.inicio, fim: almoco.fim }
        : null,
  };
}

export function diaDaSemana(dia: string) {
  return new Date(`${dia}T12:00:00Z`).getUTCDay();
}

// "sábado", "domingo"...
export const nomeDoDia = (dia: string) => NOMES_EXTENSO[diaDaSemana(dia)];

// Janela de funcionamento de um dia, ou o motivo de estar fechado.
// `feriado` é o nome do feriado do dia (se houver); o dia especial vale mais que ele.
export function funcionamentoDoDia(
  h: Horarios,
  dia: string,
  especial?: DiaEspecialInfo,
  feriado?: string,
):
  | { aberto: true; inicio: string; fim: string; almoco: Horarios["almoco"]; especial: boolean }
  | { aberto: false; motivo: string } {
  if (especial) return { aberto: true, inicio: especial.inicio, fim: especial.fim, almoco: h.almoco, especial: true };
  if (feriado) return { aberto: false, motivo: `feriado (${feriado})` };
  const d = h.dias[diaDaSemana(dia)];
  if (!d.aberto) return { aberto: false, motivo: `a autoescola não abre ${PLURAL[diaDaSemana(dia)]}` };
  return { aberto: true, inicio: d.inicio, fim: d.fim, almoco: h.almoco, especial: false };
}

// Motivo de uma aula (início e fim em HH:MM) estar fora do horário, ou null.
export function foraDoHorario(
  janela: { inicio: string; fim: string; almoco: Horarios["almoco"] },
  inicio: string,
  fim: string,
): string | null {
  if (inicio < janela.inicio || fim > janela.fim) {
    return `fora do horário de funcionamento (${janela.inicio} às ${janela.fim})`;
  }
  if (janela.almoco && inicio < janela.almoco.fim && fim > janela.almoco.inicio) {
    return `horário de almoço (${janela.almoco.inicio} às ${janela.almoco.fim})`;
  }
  return null;
}

// Menor abertura e maior fechamento da semana: a grade de horários dos formulários.
export function faixaDaSemana(h: Horarios) {
  const abertos = h.dias.filter((d) => d.aberto);
  const lista = abertos.length ? abertos : h.dias;
  return {
    inicio: lista.reduce((m, d) => (d.inicio < m ? d.inicio : m), "23:59"),
    fim: lista.reduce((m, d) => (d.fim > m ? d.fim : m), "00:00"),
  };
}

// "Seg a sex 07:00–19:00 · Sáb 08:00–12:00 · Dom fechado"
export function resumoHorarios(h: Horarios) {
  const curto = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const texto = (d: HorarioDia) => (d.aberto ? `${d.inicio}–${d.fim}` : "fechado");
  const partes: string[] = [];
  // Agrupa dias seguidos (de segunda a domingo) com o mesmo horário.
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  let i = 0;
  while (i < ordem.length) {
    let j = i;
    while (j + 1 < ordem.length && texto(h.dias[ordem[j + 1]]) === texto(h.dias[ordem[i]])) j++;
    const nome = i === j ? curto[ordem[i]] : `${curto[ordem[i]]} a ${curto[ordem[j]].toLowerCase()}`;
    partes.push(`${nome} ${texto(h.dias[ordem[i]])}`);
    i = j + 1;
  }
  return partes.join(" · ");
}
