import { dataParaInput, hojeISO } from "./format";

// Dias entre hoje (Brasília) e a data do lembrete; negativo se já passou.
export function diasAte(data: Date, hoje = hojeISO()) {
  const alvo = Date.parse(`${dataParaInput(data)}T00:00:00Z`);
  return Math.round((alvo - Date.parse(`${hoje}T00:00:00Z`)) / 86_400_000);
}

export function quandoLembrar(data: Date) {
  const dias = diasAte(data);
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias > 1) return `em ${dias} dias`;
  if (dias === -1) return "ontem";
  return `há ${-dias} dias`;
}

export const SERVICOS_SUGERIDOS = [
  "Troca de óleo",
  "Revisão",
  "Troca de pneus",
  "Alinhamento e balanceamento",
  "Freios",
  "Licenciamento (CRLV)",
  "IPVA",
  "Seguro",
  "Vistoria do Detran",
  "Lavagem",
];
