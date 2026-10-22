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
  "zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
  "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove",
];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = [
  "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos",
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
