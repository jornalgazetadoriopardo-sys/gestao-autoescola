// Divide o valor total em parcelas mensais. A diferença de centavos da divisão
// vai para a primeira parcela, para que a soma bata exatamente com o total.
export function gerarParcelas(totalCentavos: number, quantidade: number, primeiroVencimento: Date) {
  const base = Math.floor(totalCentavos / quantidade);
  const resto = totalCentavos - base * quantidade;
  const dia = primeiroVencimento.getUTCDate();

  return Array.from({ length: quantidade }, (_, i) => {
    const ano = primeiroVencimento.getUTCFullYear();
    const mes = primeiroVencimento.getUTCMonth() + i;
    // Se o mês não tem o dia (ex.: 31 em fevereiro), usa o último dia do mês.
    const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
    return {
      numero: i + 1,
      valorCentavos: base + (i === 0 ? resto : 0),
      vencimento: new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDia))),
    };
  });
}
