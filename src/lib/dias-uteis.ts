import { feriadosAutomaticos } from "./feriados";

// Dias úteis: segunda a sexta, sem os feriados nacionais (fixos e móveis).
// Datas no formato AAAA-MM-DD.

const nacionais = new Map<number, Set<string>>();
function feriadosNacionais(ano: number) {
  if (!nacionais.has(ano)) {
    // Carnaval e Corpus Christi são ponto facultativo; bancos não abrem, então contam como feriado.
    nacionais.set(ano, new Set(feriadosAutomaticos(ano, null).map((f) => f.data)));
  }
  return nacionais.get(ano)!;
}

export function diaUtil(dia: string) {
  const semana = new Date(`${dia}T12:00:00Z`).getUTCDay();
  return semana !== 0 && semana !== 6 && !feriadosNacionais(Number(dia.slice(0, 4))).has(dia);
}

function somar(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// n dias úteis depois (n > 0) ou antes (n < 0) de um dia.
export function somarDiasUteis(dia: string, n: number) {
  let atual = dia;
  let faltam = Math.abs(n);
  while (faltam > 0) {
    atual = somar(atual, n > 0 ? 1 : -1);
    if (diaUtil(atual)) faltam--;
  }
  return atual;
}

// O próprio dia, se for útil; senão o próximo dia útil.
export function proximoDiaUtil(dia: string) {
  return diaUtil(dia) ? dia : somarDiasUteis(dia, 1);
}
