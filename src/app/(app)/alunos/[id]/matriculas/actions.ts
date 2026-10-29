"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { CATEGORIAS, hojeISO, lerMoeda, lerPercentual } from "@/lib/format";
import { gerarParcelas } from "@/lib/parcelas";
import { FORMAS_ENTRADA, FORMAS_MATRICULA } from "@/lib/pagamentos";
import { CURSOS_TEORICOS, TIPOS_PROCESSO, gerarEtapas, lerTaxasPadrao } from "@/lib/etapas";
import type { EstadoForm } from "@/components/form-acao";

function inteiro(dados: FormData, campo: string) {
  const v = String(dados.get(campo) ?? "").trim();
  return /^\d+$/.test(v) ? Number(v) : null;
}

// Aulas práticas de cada letra da categoria (campos praticas_A, praticas_B...).
function lerPraticas(dados: FormData, categoria: string) {
  const mapa: Record<string, number> = {};
  for (const l of new Set(categoria.split(""))) {
    const n = inteiro(dados, `praticas_${l}`);
    if (n === null) return null;
    mapa[l] = n;
  }
  return { mapa, total: Object.values(mapa).reduce((s, n) => s + n, 0) };
}

export async function criarMatricula(alunoId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();

  const categoria = String(dados.get("categoria") ?? "");
  const praticas = (CATEGORIAS as readonly string[]).includes(categoria) ? lerPraticas(dados, categoria) : null;
  const qtdPraticas = praticas?.total ?? null;
  const qtdTeoricas = inteiro(dados, "qtdTeoricas");
  const valorTotal = lerMoeda(String(dados.get("valorTotal") ?? ""));
  const formaPagamento = String(dados.get("formaPagamento") ?? "");
  const tipoProcesso = String(dados.get("tipoProcesso") ?? "primeira");
  const cursoTeorico = String(dados.get("cursoTeorico") ?? "autoescola");
  if (!(tipoProcesso in TIPOS_PROCESSO)) return { erro: "Escolha o tipo de processo." };
  if (!(cursoTeorico in CURSOS_TEORICOS)) return { erro: "Escolha como será o curso teórico." };

  if (!(CATEGORIAS as readonly string[]).includes(categoria)) return { erro: "Selecione a categoria." };
  if (qtdPraticas === null || qtdTeoricas === null) {
    return { erro: "Informe a quantidade de aulas (de cada categoria)." };
  }
  if (qtdPraticas + qtdTeoricas === 0) return { erro: "A matrícula precisa ter ao menos uma aula." };
  if (valorTotal === null) return { erro: "Valor total inválido. Use o formato 1.500,00." };
  if (!(formaPagamento in FORMAS_MATRICULA)) return { erro: "Escolha a forma de pagamento." };

  // Entrada opcional, paga na hora; o restante segue a forma escolhida.
  const temEntrada = dados.get("temEntrada") === "sim";
  const entrada = temEntrada ? lerMoeda(String(dados.get("entradaValor") ?? "")) : 0;
  const entradaForma = temEntrada ? String(dados.get("entradaForma") ?? "") : null;
  if (temEntrada) {
    if (entrada === null || entrada <= 0) return { erro: "Informe o valor da entrada. Ex.: 300,00" };
    if (entrada >= valorTotal) {
      return { erro: "A entrada precisa ser menor que o valor total. Se o aluno pagou tudo, escolha a forma à vista." };
    }
    if (!(entradaForma! in FORMAS_ENTRADA)) return { erro: "Escolha como o aluno pagou a entrada." };
  }
  const restante = valorTotal - (entrada ?? 0);

  const aluno = await db.aluno.findUnique({ where: { id: alunoId } });
  if (!aluno) return { erro: "Aluno não encontrado." };

  const hoje = new Date(`${hojeISO()}T00:00:00Z`);
  let jurosMesBp = 0;
  let parcelas: {
    numero: number;
    valorCentavos: number;
    vencimento: Date;
    pagoEm?: Date;
    valorPagoCentavos?: number;
    forma?: string;
    obs?: string;
  }[] = [];

  if (formaPagamento === "carne") {
    // Parcelado pela autoescola: gera as parcelas do carnê.
    const qtdParcelas = inteiro(dados, "qtdParcelas");
    const vencimento = String(dados.get("primeiroVencimento") ?? "");
    const jurosInformado = lerPercentual(String(dados.get("jurosMes") ?? ""));
    if (qtdParcelas === null || qtdParcelas < 1 || qtdParcelas > 24) {
      return { erro: "O número de parcelas deve ser entre 1 e 24." };
    }
    if (restante > 0 && restante < qtdParcelas) return { erro: "Valor a parcelar menor que o número de parcelas." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) return { erro: "Informe a data do primeiro vencimento." };
    if (jurosInformado === null || jurosInformado > 1000) {
      return { erro: "Juros inválido. Informe a porcentagem ao mês, entre 0 e 10 (ex.: 1,99)." };
    }
    // À vista não tem juros.
    jurosMesBp = qtdParcelas > 1 ? jurosInformado : 0;
    // Matrícula gratuita (valor 0) não gera parcelas.
    if (restante > 0) {
      parcelas = gerarParcelas(restante, qtdParcelas, new Date(`${vencimento}T00:00:00Z`), jurosMesBp);
    }
  } else if (restante > 0) {
    // Cartão, Pix ou dinheiro: pago na hora, já fica quitado.
    const vezesCartao = inteiro(dados, "vezesCartao") ?? 1;
    parcelas = [
      {
        numero: 1,
        valorCentavos: restante,
        vencimento: hoje,
        pagoEm: hoje,
        valorPagoCentavos: restante,
        forma: formaPagamento,
        obs: formaPagamento === "cartao" && vezesCartao > 1 ? `Cartão de crédito em ${vezesCartao}x` : undefined,
      },
    ];
  }

  // A entrada vira a parcela 0, já paga.
  if (entrada) {
    const vezesEntrada = inteiro(dados, "entradaVezes") ?? 1;
    parcelas.unshift({
      numero: 0,
      valorCentavos: entrada,
      vencimento: hoje,
      pagoEm: hoje,
      valorPagoCentavos: entrada,
      forma: entradaForma!,
      obs:
        entradaForma === "cartao" && vezesEntrada > 1 ? `Entrada no cartão de crédito em ${vezesEntrada}x` : "Entrada",
    });
  }

  // Exames e taxas do processo, com os valores padrão das configurações.
  const config = await db.configuracao.findFirst({ select: { taxasPadrao: true } });
  const etapas = gerarEtapas({ tipoProcesso, categoria, cursoTeorico }, lerTaxasPadrao(config?.taxasPadrao));

  const matricula = await db.matricula.create({
    data: {
      alunoId,
      categoria,
      qtdPraticas,
      praticasPorCategoria: praticas!.mapa,
      qtdTeoricas: cursoTeorico === "autoescola" ? qtdTeoricas : 0,
      valorTotalCentavos: valorTotal,
      jurosMesBp,
      formaPagamento,
      entradaCentavos: entrada ?? 0,
      entradaForma,
      tipoProcesso,
      cursoTeorico,
      parcelas: { create: parcelas },
      etapas: { create: etapas },
    },
  });

  revalidatePath(`/alunos/${alunoId}`);
  redirect(`/alunos/${alunoId}?nova=${matricula.id}`);
}

// Exclui a matrícula com todas as suas aulas e parcelas (pagas ou não).
export async function excluirMatricula(matriculaId: number) {
  await exigirSessao();
  const matricula = await db.matricula.findUnique({ where: { id: matriculaId } });
  if (!matricula) return;
  await db.$transaction([
    db.aula.deleteMany({ where: { matriculaId } }),
    db.parcela.deleteMany({ where: { matriculaId } }),
    db.etapa.deleteMany({ where: { matriculaId } }),
    db.matricula.delete({ where: { id: matriculaId } }),
  ]);
  revalidatePath(`/alunos/${matricula.alunoId}`);
  revalidatePath("/pagamentos");
  revalidatePath("/aulas");
}

// Corrige os dados da matrícula. As parcelas são alteradas uma a uma.
export async function editarMatricula(matriculaId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();
  const categoria = String(dados.get("categoria") ?? "");
  const praticas = (CATEGORIAS as readonly string[]).includes(categoria) ? lerPraticas(dados, categoria) : null;
  const qtdPraticas = praticas?.total ?? null;
  const qtdTeoricas = inteiro(dados, "qtdTeoricas");
  const valorTotal = lerMoeda(String(dados.get("valorTotal") ?? ""));
  const formaPagamento = String(dados.get("formaPagamento") ?? "");
  const data = String(dados.get("data") ?? "");

  if (!(CATEGORIAS as readonly string[]).includes(categoria)) return { erro: "Selecione a categoria." };
  if (qtdPraticas === null || qtdTeoricas === null) {
    return { erro: "Informe a quantidade de aulas (de cada categoria)." };
  }
  if (qtdPraticas + qtdTeoricas === 0) return { erro: "A matrícula precisa ter ao menos uma aula." };
  if (valorTotal === null) return { erro: "Valor total inválido. Use o formato 1.500,00." };
  if (!(formaPagamento in FORMAS_MATRICULA)) return { erro: "Escolha a forma de pagamento." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { erro: "Informe a data da matrícula." };
  const tipoProcesso = String(dados.get("tipoProcesso") ?? "");
  const cursoTeorico = String(dados.get("cursoTeorico") ?? "");
  if (!(tipoProcesso in TIPOS_PROCESSO)) return { erro: "Escolha o tipo de processo." };
  if (!(cursoTeorico in CURSOS_TEORICOS)) return { erro: "Escolha como será o curso teórico." };

  const matricula = await db.matricula.findUnique({ where: { id: matriculaId } });
  if (!matricula) return { erro: "Matrícula não encontrada." };
  await db.matricula.update({
    where: { id: matriculaId },
    // Meio-dia no horário de Brasília, para a data não mudar com o fuso.
    data: {
      categoria,
      qtdPraticas,
      praticasPorCategoria: praticas!.mapa,
      qtdTeoricas,
      valorTotalCentavos: valorTotal,
      formaPagamento,
      tipoProcesso,
      cursoTeorico,
      data: new Date(`${data}T12:00:00-03:00`),
    },
  });
  revalidatePath(`/alunos/${matricula.alunoId}`);
  redirect(`/alunos/${matricula.alunoId}`);
}
