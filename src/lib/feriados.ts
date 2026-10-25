// Feriados: nacionais (fixos e móveis), estaduais pela UF da autoescola e os
// cadastrados à mão. Em feriado não se marca aula. Cada autoescola pode deixar
// de seguir um feriado automático (ex.: trabalha no Carnaval).

export type Feriado = { chave: string; data: string; nome: string };

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).
export function pascoa(ano: number) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const somar = (d: Date, dias: number) => new Date(d.getTime() + dias * 86_400_000);

// Nacionais fixos (Lei 662/1949, 6.802/1980 e 14.759/2023).
const FIXOS: [chave: string, mmdd: string, nome: string][] = [
  ["confraternizacao", "01-01", "Confraternização Universal"],
  ["tiradentes", "04-21", "Tiradentes"],
  ["trabalho", "05-01", "Dia do Trabalho"],
  ["independencia", "09-07", "Independência do Brasil"],
  ["aparecida", "10-12", "Nossa Senhora Aparecida"],
  ["finados", "11-02", "Finados"],
  ["republica", "11-15", "Proclamação da República"],
  ["consciencia-negra", "11-20", "Dia da Consciência Negra"],
  ["natal", "12-25", "Natal"],
];

// Estaduais mais conhecidos, pela UF cadastrada nos dados da autoescola.
export const ESTADUAIS: Record<string, [mmdd: string, nome: string][]> = {
  SP: [["07-09", "Revolução Constitucionalista"]],
  RJ: [["04-23", "Dia de São Jorge"]],
  RS: [["09-20", "Revolução Farroupilha"]],
  BA: [["07-02", "Independência da Bahia"]],
  PE: [["03-06", "Revolução Pernambucana"]],
  CE: [["03-25", "Data Magna do Ceará"]],
  PA: [["08-15", "Adesão do Pará"]],
  MA: [["07-28", "Adesão do Maranhão"]],
  AM: [["09-05", "Elevação do Amazonas"]],
};

export function feriadosAutomaticos(ano: number, uf: string | null): Feriado[] {
  const p = pascoa(ano);
  const lista: Feriado[] = [
    ...FIXOS.map(([chave, mmdd, nome]) => ({ chave, data: `${ano}-${mmdd}`, nome })),
    // Móveis: Carnaval e Corpus Christi são ponto facultativo nacional, mas a maioria não abre.
    { chave: "carnaval-segunda", data: iso(somar(p, -48)), nome: "Carnaval (segunda-feira)" },
    { chave: "carnaval-terca", data: iso(somar(p, -47)), nome: "Carnaval (terça-feira)" },
    { chave: "sexta-santa", data: iso(somar(p, -2)), nome: "Sexta-feira Santa" },
    { chave: "corpus-christi", data: iso(somar(p, 60)), nome: "Corpus Christi" },
    ...(ESTADUAIS[(uf ?? "").toUpperCase()] ?? []).map(([mmdd, nome]) => ({
      chave: `estadual-${mmdd}`,
      data: `${ano}-${mmdd}`,
      nome,
    })),
  ];
  return lista.sort((a, b) => a.data.localeCompare(b.data));
}

export type FeriadoManual = { data: Date; nome: string; anual: boolean };

// Feriados de um período (dias AAAA-MM-DD → nome), já sem os ignorados.
export function feriadosDoPeriodo(
  inicio: string,
  fim: string,
  uf: string | null,
  ignorados: string[],
  manuais: FeriadoManual[],
) {
  const mapa = new Map<string, string>();
  for (let ano = Number(inicio.slice(0, 4)); ano <= Number(fim.slice(0, 4)); ano++) {
    for (const f of feriadosAutomaticos(ano, uf)) {
      if (!ignorados.includes(f.chave) && f.data >= inicio && f.data <= fim) mapa.set(f.data, f.nome);
    }
    for (const m of manuais) {
      const d = m.data.toISOString().slice(0, 10);
      const dia = m.anual ? `${ano}${d.slice(4)}` : d;
      if (dia >= inicio && dia <= fim && (m.anual || d.startsWith(String(ano)))) mapa.set(dia, m.nome);
    }
  }
  return mapa;
}

export function lerIgnorados(json: unknown): string[] {
  return Array.isArray(json) ? json.filter((x): x is string => typeof x === "string") : [];
}
