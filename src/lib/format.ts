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

export function formatarData(data: Date | null | undefined) {
  if (!data) return "";
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// Valor para <input type="date"> (AAAA-MM-DD).
export function dataParaInput(data: Date | null | undefined) {
  return data ? data.toISOString().slice(0, 10) : "";
}

export function formatarMoeda(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
