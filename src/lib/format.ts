export const CATEGORIAS = ["A", "B", "AB", "C", "D", "E", "AC", "AD", "AE"] as const;

export const STATUS_ALUNO: Record<string, string> = {
  ativo: "Ativo",
  concluido: "Concluído",
  desistente: "Desistente",
};

export function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCpf(cpf: string) {
  const d = somenteDigitos(cpf);
  if (d.length !== 11) return cpf;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function cpfValido(cpf: string) {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

export function formatarTelefone(tel: string | null | undefined) {
  if (!tel) return "";
  const d = somenteDigitos(tel);
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return tel;
}

// Para datas sem horário (nascimento, vencimento), guardadas à meia-noite UTC.
export function formatarData(data: Date | null | undefined) {
  if (!data) return "";
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// Para momentos registrados pelo sistema (cadastro, matrícula), no horário de Brasília.
export function formatarDataLocal(data: Date | null | undefined) {
  if (!data) return "";
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Valor para <input type="date"> (AAAA-MM-DD).
export function dataParaInput(data: Date | null | undefined) {
  return data ? data.toISOString().slice(0, 10) : "";
}

export function formatarMoeda(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Converte "1.500,50", "1500,5", "2.000" ou "1500.50" em centavos. Retorna null se inválido.
export function lerMoeda(valor: string): number | null {
  let v = valor.replace(/[R$\s]/g, "");
  if (v.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  return Math.round(Number(v) * 100);
}

// Valor em centavos para campo de formulário ("1500,50").
export function moedaParaInput(centavos: number | null | undefined) {
  return centavos == null ? "" : (centavos / 100).toFixed(2).replace(".", ",");
}

export const FORMAS_PAGAMENTO: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
  boleto: "Boleto",
};

export type SituacaoParcela = "pago" | "atrasado" | "pendente";

// Data de hoje (AAAA-MM-DD) no horário de Brasília, independente do fuso do servidor.
export function hojeISO(agora = new Date()) {
  return agora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function situacaoParcela(
  p: { pagoEm: Date | null; vencimento: Date },
  hoje = hojeISO(),
): SituacaoParcela {
  if (p.pagoEm) return "pago";
  return dataParaInput(p.vencimento) < hoje ? "atrasado" : "pendente";
}
