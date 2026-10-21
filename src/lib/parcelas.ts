// Divide o valor em parcelas mensais.
//
// Sem juros: a diferença de centavos da divisão vai para a primeira parcela,
// para que a soma bata exatamente com o total.
// Com juros (jurosMesBp > 0, só no parcelado): parcelas iguais pela Tabela Price,
// PMT = valor × i / (1 − (1 + i)^−n). À vista não tem juros.
export function gerarParcelas(
  totalCentavos: number,
  quantidade: number,
  primeiroVencimento: Date,
  jurosMesBp = 0,
) {
  const i = jurosMesBp / 10000;
  const comJuros = i > 0 && quantidade > 1;
  const base = comJuros
    ? Math.round((totalCentavos * i) / (1 - Math.pow(1 + i, -quantidade)))
    : Math.floor(totalCentavos / quantidade);
  const resto = comJuros ? 0 : totalCentavos - base * quantidade;
  const dia = primeiroVencimento.getUTCDate();

  return Array.from({ length: quantidade }, (_, n) => {
    const ano = primeiroVencimento.getUTCFullYear();
    const mes = primeiroVencimento.getUTCMonth() + n;
    // Se o mês não tem o dia (ex.: 31 em fevereiro), usa o último dia do mês.
    const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
    return {
      numero: n + 1,
      valorCentavos: base + (n === 0 ? resto : 0),
      vencimento: new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDia))),
    };
  });
}
