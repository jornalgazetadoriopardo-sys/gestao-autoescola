"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { CATEGORIAS, hojeISO, lerMoeda, lerPercentual } from "@/lib/format";
import { gerarParcelas } from "@/lib/parcelas";
import { FORMAS_MATRICULA } from "@/lib/pagamentos";
import { CURSOS_TEORICOS, TIPOS_PROCESSO, gerarEtapas, lerTaxasPadrao } from "@/lib/etapas";
import type { EstadoForm } from "@/components/form-acao";

function inteiro(dados: FormData, campo: string) {
  const v = String(dados.get(campo) ?? "").trim();
  return /^\d+$/.test(v) ? Number(v) : null;
}

export async function criarMatricula(alunoId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();

  const categoria = String(dados.get("categoria") ?? "");
  const qtdPraticas = inteiro(dados, "qtdPraticas");
  const qtdTeoricas = inteiro(dados, "qtdTeoricas");
  const valorTotal = lerMoeda(String(dados.get("valorTotal") ?? ""));
  const formaPagamento = String(dados.get("formaPagamento") ?? "");
  const tipoProcesso = String(dados.get("tipoProcesso") ?? "primeira");
  const cursoTeorico = String(dados.get("cursoTeorico") ?? "autoescola");
  if (!(tipoProcesso in TIPOS_PROCESSO)) return { erro: "Escolha o tipo de processo." };
  if (!(cursoTeorico in CURSOS_TEORICOS)) return { erro: "Escolha como será o curso teórico." };

  if (!(CATEGORIAS as readonly string[]).includes(categoria)) return { erro: "Selecione a categoria." };
  if (qtdPraticas === null || qtdTeoricas === null) return { erro: "Informe a quantidade de aulas." };
  if (qtdPraticas + qtdTeoricas === 0) return { erro: "A matrícula precisa ter ao menos uma aula." };
  if (valorTotal === null) return { erro: "Valor total inválido. Use o formato 1.500,00." };
  if (!(formaPagamento in FORMAS_MATRICULA)) return { erro: "Escolha a forma de pagamento." };

  const aluno = await db.aluno.findUnique({ where: { id: alunoId } });
  if (!aluno) return { erro: "Aluno não encontrado." };

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
    if (valorTotal > 0 && valorTotal < qtdParcelas) return { erro: "Valor total menor que o número de parcelas." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) return { erro: "Informe a data do primeiro vencimento." };
    if (jurosInformado === null || jurosInformado > 1000) {
      return { erro: "Juros inválido. Informe a porcentagem ao mês, entre 0 e 10 (ex.: 1,99)." };
    }
    // À vista não tem juros.
    jurosMesBp = qtdParcelas > 1 ? jurosInformado : 0;
    // Matrícula gratuita (valor 0) não gera parcelas.
    if (valorTotal > 0) {
      parcelas = gerarParcelas(valorTotal, qtdParcelas, new Date(`${vencimento}T00:00:00Z`), jurosMesBp);
    }
  } else if (valorTotal > 0) {
    // Cartão, Pix ou dinheiro: pago na hora, já fica quitado.
    const hoje = new Date(`${hojeISO()}T00:00:00Z`);
    const vezesCartao = inteiro(dados, "vezesCartao") ?? 1;
    parcelas = [
      {
        numero: 1,
        valorCentavos: valorTotal,
        vencimento: hoje,
        pagoEm: hoje,
        valorPagoCentavos: valorTotal,
        forma: formaPagamento,
        obs: formaPagamento === "cartao" && vezesCartao > 1 ? `Cartão de crédito em ${vezesCartao}x` : undefined,
      },
    ];
  }

  // Exames e taxas do processo, com os valores padrão das configurações.
  const config = await db.configuracao.findFirst({ select: { taxasPadrao: true } });
  const etapas = gerarEtapas({ tipoProcesso, categoria, cursoTeorico }, lerTaxasPadrao(config?.taxasPadrao));

  const matricula = await db.matricula.create({
    data: {
      alunoId,
      categoria,
      qtdPraticas,
      qtdTeoricas: cursoTeorico === "autoescola" ? qtdTeoricas : 0,
      valorTotalCentavos: valorTotal,
      jurosMesBp,
      formaPagamento,
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
  const qtdPraticas = inteiro(dados, "qtdPraticas");
  const qtdTeoricas = inteiro(dados, "qtdTeoricas");
  const valorTotal = lerMoeda(String(dados.get("valorTotal") ?? ""));
  const formaPagamento = String(dados.get("formaPagamento") ?? "");
  const data = String(dados.get("data") ?? "");

  if (!(CATEGORIAS as readonly string[]).includes(categoria)) return { erro: "Selecione a categoria." };
  if (qtdPraticas === null || qtdTeoricas === null) return { erro: "Informe a quantidade de aulas." };
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
