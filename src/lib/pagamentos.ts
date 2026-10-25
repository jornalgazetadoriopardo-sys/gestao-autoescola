// Formas de pagamento e textos usados em recibos.

// Como a matrícula foi paga.
export const FORMAS_MATRICULA: Record<string, { titulo: string; descricao: string }> = {
  carne: { titulo: "Parcelado pela autoescola", descricao: "Gera as parcelas e o carnê para imprimir" },
  cartao: { titulo: "Cartão de crédito ou débito", descricao: "Pago na maquininha: já fica quitado" },
  pix: { titulo: "Pix à vista", descricao: "Pago na hora: já fica quitado" },
  dinheiro: { titulo: "Dinheiro à vista", descricao: "Pago na hora: já fica quitado" },
};

// Escreve um valor em centavos por extenso: 152050 → "mil quinhentos e vinte reais e cinquenta centavos".
export function valorPorExtenso(centavos: number) {
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  const partes: string[] = [];
  if (reais > 0) partes.push(`${inteiroPorExtenso(reais)} ${reais === 1 ? "real" : "reais"}`);
  if (cents > 0) partes.push(`${inteiroPorExtenso(cents)} ${cents === 1 ? "centavo" : "centavos"}`);
  if (partes.length === 0) return "zero real";
  // "um milhão de reais"
  if (reais >= 1_000_000 && reais % 1_000_000 === 0) partes[0] = partes[0].replace(/ (reais|real)$/, " de $1");
  return partes.join(" e ");
}

const UNIDADES = [
  "zero",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

function ate999(n: number): string {
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (c > 0) partes.push(CENTENAS[c]);
  if (resto > 0) {
    if (resto < 20) partes.push(UNIDADES[resto]);
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      partes.push(u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
    }
  }
  return partes.join(" e ");
}

function inteiroPorExtenso(n: number): string {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const grupos: string[] = [];
  if (milhoes) grupos.push(milhoes === 1 ? "um milhão" : `${ate999(milhoes)} milhões`);
  if (milhares) grupos.push(milhares === 1 ? "mil" : `${ate999(milhares)} mil`);
  if (resto) grupos.push(ate999(resto));
  // O último grupo leva "e" quando é menor que 100 ou centena exata ("mil e duzentos", "mil e cinco").
  if (grupos.length > 1 && resto && (resto < 100 || resto % 100 === 0)) {
    return `${grupos.slice(0, -1).join(" ")} e ${grupos[grupos.length - 1]}`;
  }
  return grupos.join(" ");
}

// ---- Entrada -------------------------------------------------------------
// A entrada paga na matrícula fica na parcela de número 0; o restante segue a
// forma de pagamento da matrícula (carnê, cartão, Pix ou dinheiro).

export const FORMAS_ENTRADA: Record<string, string> = { dinheiro: "Dinheiro", pix: "Pix", cartao: "Cartão" };

// Filtro do Prisma para contar só as parcelas (sem a entrada).
export const SO_PARCELAS = { numero: { gt: 0 } };

export function rotuloParcela(numero: number, total: number) {
  return numero === 0 ? "Entrada" : `${numero}/${total}`;
}

// Parcelas sem a entrada (para numerar "1/3, 2/3...").
export function totalDeParcelas(parcelas: { numero: number }[]) {
  return parcelas.filter((p) => p.numero > 0).length;
}

// Texto do recibo: "entrada da matrícula", "parcela 2 de 5", "restante da matrícula"...
export function referenteParcela(
  p: { numero: number },
  m: { formaPagamento: string; entradaCentavos: number },
  total: number,
) {
  if (p.numero === 0) return "entrada da matrícula";
  if (m.formaPagamento === "carne") return `parcela ${p.numero} de ${total}`;
  return m.entradaCentavos > 0 ? "restante da matrícula" : "matrícula";
}

// "Entrada de R$ 300,00 (Pix) + Parcelado pela autoescola"
export function descricaoPagamento(
  m: { formaPagamento: string; entradaCentavos: number; entradaForma: string | null },
  formatarMoeda: (c: number) => string,
) {
  const forma = FORMAS_MATRICULA[m.formaPagamento]?.titulo ?? m.formaPagamento;
  if (!m.entradaCentavos) return forma;
  const comoEntrada = FORMAS_ENTRADA[m.entradaForma ?? ""] ?? m.entradaForma ?? "";
  return `Entrada de ${formatarMoeda(m.entradaCentavos)}${comoEntrada ? ` (${comoEntrada})` : ""} + restante: ${forma.toLowerCase()}`;
}
