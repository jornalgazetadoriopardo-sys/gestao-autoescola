import { dataParaInput, hojeISO } from "./format";

// Tipos de despesa, na ordem em que aparecem na tela.
export const CATEGORIAS_DESPESA: Record<string, { titulo: string; descricao: string }> = {
  folha: { titulo: "Folha de pagamento", descricao: "Salários de instrutores e funcionários" },
  vale: { titulo: "Vale / adiantamento", descricao: "Adiantamento de salário" },
  combustivel: { titulo: "Abastecimento", descricao: "Combustível dos veículos" },
  retirada: { titulo: "Retirada do dono", descricao: "Dinheiro retirado pelos sócios" },
  aluguel: { titulo: "Aluguel", descricao: "Aluguel da sala ou garagem" },
  contas: { titulo: "Água, luz, internet", descricao: "Contas fixas e telefone" },
  impostos: { titulo: "Impostos e taxas", descricao: "Impostos, Detran, contador" },
  outras: { titulo: "Outras despesas", descricao: "Material, limpeza, propaganda..." },
};

// As manutenções com valor, lançadas em Veículos, também são despesas nos relatórios.
export const MANUTENCAO = "manutencao";
export const TITULO_MANUTENCAO = "Manutenção de veículos";

export function tituloCategoria(categoria: string) {
  if (categoria === MANUTENCAO) return TITULO_MANUTENCAO;
  return CATEGORIAS_DESPESA[categoria]?.titulo ?? categoria;
}

// Sugestões de descrição por tipo.
export const SUGESTOES_DESPESA: Record<string, string[]> = {
  folha: ["Salário", "13º salário", "Férias", "INSS / FGTS"],
  vale: ["Vale", "Adiantamento quinzenal"],
  combustivel: ["Gasolina", "Etanol", "Diesel"],
  retirada: ["Pró-labore", "Retirada"],
  aluguel: ["Aluguel da sala", "Aluguel da garagem", "Condomínio"],
  contas: ["Energia elétrica", "Água", "Internet", "Telefone"],
  impostos: ["Simples Nacional", "Contador", "Taxas do Detran", "Alvará"],
  outras: ["Material de escritório", "Limpeza", "Propaganda", "Material didático"],
};

export type SituacaoDespesa = "paga" | "atrasada" | "apagar";

export function situacaoDespesa(d: { pagoEm: Date | null; vencimento: Date }, hoje = hojeISO()): SituacaoDespesa {
  if (d.pagoEm) return "paga";
  return dataParaInput(d.vencimento) < hoje ? "atrasada" : "apagar";
}

// "2026-10" → primeiro dia do mês e primeiro dia do mês seguinte (datas sem horário, em UTC).
export function intervaloDoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return { inicio: new Date(Date.UTC(a, m - 1, 1)), fim: new Date(Date.UTC(a, m, 1)) };
}

export function somarMeses(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export function nomeDoMes(mes: string) {
  const texto = intervaloDoMes(mes).inicio.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Mesmo dia em outro mês; se o mês for mais curto, o último dia dele (31/01 → 28/02).
export function mesmoDiaEmOutroMes(dia: string, n: number) {
  const [a, m, d] = dia.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m - 1 + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(a, m - 1 + n, Math.min(d, ultimo))).toISOString().slice(0, 10);
}

// "35,5" ou "35.50" litros → 3550. Vazio = null.
export function lerLitros(valor: string): number | null | undefined {
  const v = valor.trim().replace(",", ".");
  if (v === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return undefined;
  return Math.round(Number(v) * 100);
}

export function formatarLitros(cent: number) {
  return `${(cent / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} L`;
}
