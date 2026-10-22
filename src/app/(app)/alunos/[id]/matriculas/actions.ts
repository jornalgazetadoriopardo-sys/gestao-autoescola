"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { CATEGORIAS, hojeISO, lerMoeda, lerPercentual } from "@/lib/format";
import { gerarParcelas } from "@/lib/parcelas";
import { FORMAS_MATRICULA } from "@/lib/pagamentos";
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

  const matricula = await db.matricula.create({
    data: {
      alunoId,
      categoria,
      qtdPraticas,
      qtdTeoricas,
      valorTotalCentavos: valorTotal,
      jurosMesBp,
      formaPagamento,
      parcelas: { create: parcelas },
    },
  });

  revalidatePath(`/alunos/${alunoId}`);
  redirect(`/alunos/${alunoId}?nova=${matricula.id}`);
}

// Só permite excluir matrícula lançada por engano: sem aulas e sem parcelas pagas.
// Matrícula paga na hora (cartão/Pix/dinheiro) também pode ser excluída enquanto não tiver aulas.
export async function excluirMatricula(matriculaId: number) {
  await exigirSessao();

  const matricula = await db.matricula.findUnique({
    where: { id: matriculaId },
    include: {
      _count: { select: { aulas: true } },
      parcelas: { where: { pagoEm: { not: null } }, select: { id: true } },
    },
  });
  if (!matricula) return;
  const pagaNaHora = matricula.formaPagamento !== "carne";
  if (matricula._count.aulas > 0 || (!pagaNaHora && matricula.parcelas.length > 0)) {
    throw new Error("Matrícula com aulas ou pagamentos não pode ser excluída.");
  }

  await db.$transaction([
    db.parcela.deleteMany({ where: { matriculaId } }),
    db.matricula.delete({ where: { id: matriculaId } }),
  ]);
  revalidatePath(`/alunos/${matricula.alunoId}`);
}
