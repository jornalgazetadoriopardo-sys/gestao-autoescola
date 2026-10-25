import { hojeISO } from "./format";

// Licenciamento anual: o vencimento depende do final da placa e do tipo de
// veículo. Cada estado tem o seu calendário; o padrão é o de São Paulo e cada
// autoescola pode ajustar em Configurações > Licenciamento.

export type Calendario = { leve: Record<string, number>; pesado: Record<string, number> };

export const TIPOS_LICENCIAMENTO: Record<string, { titulo: string; descricao: string }> = {
  leve: { titulo: "Carros, motos e ônibus", descricao: "Calendário geral" },
  pesado: { titulo: "Caminhões e tratores", descricao: "Calendário de veículos pesados" },
};

// Mês (1 a 12) do vencimento por final de placa — Detran-SP.
export const CALENDARIO_SP: Calendario = {
  leve: { "1": 7, "2": 7, "3": 8, "4": 8, "5": 9, "6": 9, "7": 10, "8": 10, "9": 11, "0": 12 },
  pesado: { "1": 9, "2": 9, "3": 10, "4": 10, "5": 10, "6": 11, "7": 11, "8": 11, "9": 12, "0": 12 },
};

export const FINAIS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

// Avisa a partir de quantos dias antes do vencimento.
export const DIAS_AVISO_LICENCIAMENTO = 30;

export function lerCalendario(json: unknown): Calendario {
  const c = (json ?? {}) as Partial<Record<keyof Calendario, Record<string, unknown>>>;
  const ler = (tipo: keyof Calendario) =>
    Object.fromEntries(
      FINAIS.map((f) => {
        const mes = Number(c[tipo]?.[f]);
        return [f, Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : CALENDARIO_SP[tipo][f]];
      }),
    );
  return { leve: ler("leve"), pesado: ler("pesado") };
}

// Último algarismo da placa (no padrão Mercosul também é um número).
export function finalDaPlaca(placa: string) {
  return placa.replace(/\D/g, "").slice(-1) || null;
}

// Vencimento do licenciamento do ano: último dia do mês do calendário.
export function vencimentoLicenciamento(
  v: { placa: string; tipoLicenciamento: string },
  calendario: Calendario,
  ano = Number(hojeISO().slice(0, 4)),
) {
  const final = finalDaPlaca(v.placa);
  if (!final) return null;
  const mes = (v.tipoLicenciamento === "pesado" ? calendario.pesado : calendario.leve)[final];
  return new Date(Date.UTC(ano, mes, 0));
}

export type SituacaoLicenciamento = { vencimento: Date | null; pago: boolean; dias: number | null };

// Situação do licenciamento deste ano: pago, ou quantos dias faltam (negativo = vencido).
export function situacaoLicenciamento(
  v: { placa: string; tipoLicenciamento: string; licenciamentoPagoAno: number | null },
  calendario: Calendario,
  hoje = hojeISO(),
): SituacaoLicenciamento {
  const ano = Number(hoje.slice(0, 4));
  const vencimento = vencimentoLicenciamento(v, calendario, ano);
  const pago = (v.licenciamentoPagoAno ?? 0) >= ano;
  const dias = vencimento ? Math.round((vencimento.getTime() - Date.parse(`${hoje}T00:00:00Z`)) / 86_400_000) : null;
  return { vencimento, pago, dias };
}

export const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
