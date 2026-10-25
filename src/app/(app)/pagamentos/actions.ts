"use server";

import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { FORMAS_PAGAMENTO, lerMoeda } from "@/lib/format";
import { SO_PARCELAS } from "@/lib/pagamentos";
import type { EstadoForm } from "@/components/form-acao";

// Dá baixa numa parcela: registra data, valor recebido e forma de pagamento.
export async function receberParcela(parcelaId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();

  const data = String(dados.get("data") ?? "");
  const valor = lerMoeda(String(dados.get("valor") ?? ""));
  const forma = String(dados.get("forma") ?? "");
  const obs = String(dados.get("obs") ?? "").trim() || null;
  const voltar = String(dados.get("voltar") ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { erro: "Informe a data do pagamento." };
  if (valor === null || valor <= 0) return { erro: "Informe o valor recebido. Ex.: 150,00" };
  if (!(forma in FORMAS_PAGAMENTO)) return { erro: "Escolha a forma de pagamento." };

  const parcela = await db.parcela.findUnique({ where: { id: parcelaId }, include: { matricula: true } });
  if (!parcela) return { erro: "Parcela não encontrada." };
  if (parcela.pagoEm) return { erro: "Esta parcela já está paga." };

  await db.parcela.update({
    where: { id: parcelaId },
    data: { pagoEm: new Date(`${data}T00:00:00Z`), valorPagoCentavos: valor, forma, obs },
  });

  revalidatePath("/pagamentos");
  revalidatePath(`/alunos/${parcela.matricula.alunoId}`);
  revalidatePath("/");
  // Só volta para endereços internos do sistema.
  const destino = voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : `/alunos/${parcela.matricula.alunoId}`;
  redirect(`${destino}${destino.includes("?") ? "&" : "?"}recebido=${parcelaId}`);
}

// Desfaz uma baixa lançada por engano: a parcela volta a ficar em aberto.
export async function estornarParcela(parcelaId: number) {
  await exigirSessao();
  const parcela = await db.parcela.findUnique({ where: { id: parcelaId }, include: { matricula: true } });
  if (!parcela?.pagoEm) return;
  await db.parcela.update({
    where: { id: parcelaId },
    data: { pagoEm: null, valorPagoCentavos: null, forma: null, obs: null },
  });
  revalidar(parcela.matricula.alunoId);
}

function revalidar(alunoId: number) {
  revalidatePath("/pagamentos");
  revalidatePath(`/alunos/${alunoId}`);
  revalidatePath("/");
}

// Numera as parcelas da matrícula pela ordem de vencimento (1, 2, 3...).
// A entrada (número 0) fica de fora.
async function renumerar(matriculaId: number) {
  const parcelas = await db.parcela.findMany({
    where: { matriculaId, ...SO_PARCELAS },
    orderBy: [{ vencimento: "asc" }, { id: "asc" }],
    select: { id: true, numero: true },
  });
  for (const [i, p] of parcelas.entries()) {
    if (p.numero !== i + 1) await db.parcela.update({ where: { id: p.id }, data: { numero: i + 1 } });
  }
}

const DIA = /^\d{4}-\d{2}-\d{2}$/;

// Altera valor, vencimento e observação; se já foi paga, também a data, o valor e a forma do pagamento.
export async function editarParcela(parcelaId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();
  const valor = lerMoeda(String(dados.get("valor") ?? ""));
  const vencimento = String(dados.get("vencimento") ?? "");
  const obs = String(dados.get("obs") ?? "").trim() || null;
  if (valor === null || valor <= 0) return { erro: "Informe o valor da parcela. Ex.: 150,00" };
  if (!DIA.test(vencimento)) return { erro: "Informe o vencimento." };

  const parcela = await db.parcela.findUnique({ where: { id: parcelaId } });
  if (!parcela) return { erro: "Parcela não encontrada." };
  const campos: Prisma.ParcelaUpdateInput = {
    valorCentavos: valor,
    vencimento: new Date(`${vencimento}T00:00:00Z`),
    obs,
  };
  if (parcela.pagoEm) {
    const pagoEm = String(dados.get("pagoEm") ?? "");
    const valorPago = lerMoeda(String(dados.get("valorPago") ?? ""));
    const forma = String(dados.get("forma") ?? "");
    if (!DIA.test(pagoEm)) return { erro: "Informe a data do pagamento." };
    if (valorPago === null || valorPago <= 0) return { erro: "Informe o valor pago." };
    if (!(forma in FORMAS_PAGAMENTO)) return { erro: "Escolha a forma de pagamento." };
    Object.assign(campos, { pagoEm: new Date(`${pagoEm}T00:00:00Z`), valorPagoCentavos: valorPago, forma });
  }
  const atual = await db.parcela.update({ where: { id: parcelaId }, data: campos, include: { matricula: true } });
  // A entrada também fica registrada na matrícula (contrato e ficha).
  if (atual.numero === 0) {
    await db.matricula.update({
      where: { id: atual.matriculaId },
      data: { entradaCentavos: atual.valorPagoCentavos ?? atual.valorCentavos, entradaForma: atual.forma },
    });
  }
  await renumerar(atual.matriculaId);
  revalidar(atual.matricula.alunoId);
  const voltar = String(dados.get("voltar") ?? "");
  redirect(voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : `/alunos/${atual.matricula.alunoId}`);
}

export async function excluirParcela(parcelaId: number) {
  await exigirSessao();
  const parcela = await db.parcela.findUnique({ where: { id: parcelaId }, include: { matricula: true } });
  if (!parcela) return;
  await db.parcela.delete({ where: { id: parcelaId } });
  if (parcela.numero === 0) {
    await db.matricula.update({ where: { id: parcela.matriculaId }, data: { entradaCentavos: 0, entradaForma: null } });
  }
  await renumerar(parcela.matriculaId);
  revalidar(parcela.matricula.alunoId);
}

// Acrescenta uma parcela em aberto à matrícula.
export async function adicionarParcela(matriculaId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();
  const valor = lerMoeda(String(dados.get("valor") ?? ""));
  const vencimento = String(dados.get("vencimento") ?? "");
  if (valor === null || valor <= 0) return { erro: "Informe o valor da parcela. Ex.: 150,00" };
  if (!DIA.test(vencimento)) return { erro: "Informe o vencimento." };
  const matricula = await db.matricula.findUnique({
    where: { id: matriculaId },
    include: { _count: { select: { parcelas: { where: SO_PARCELAS } } } },
  });
  if (!matricula) return { erro: "Matrícula não encontrada." };
  await db.parcela.create({
    data: {
      matriculaId,
      numero: matricula._count.parcelas + 1,
      valorCentavos: valor,
      vencimento: new Date(`${vencimento}T00:00:00Z`),
    },
  });
  await renumerar(matriculaId);
  revalidar(matricula.alunoId);
  return { ok: "Parcela acrescentada." };
}
