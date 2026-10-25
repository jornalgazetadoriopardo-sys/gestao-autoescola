// Papel de recibo e carnê: "termica" (bobina 80 mm) ou "a4". O endereço
// (?formato=) tem prioridade sobre a configuração da autoescola.
export type Formato = "a4" | "termica";

export function formatoDe(pedido: string | undefined, padrao: string): Formato {
  if (pedido === "termica" || pedido === "a4") return pedido;
  return padrao === "termica" ? "termica" : "a4";
}
