"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { FORMAS_PAGAMENTO, lerMoeda } from "@/lib/format";
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

// Desfaz uma baixa lançada por engano.
export async function estornarParcela(parcelaId: number) {
  await exigirSessao();
  const parcela = await db.parcela.findUnique({ where: { id: parcelaId }, include: { matricula: true } });
  if (!parcela?.pagoEm) return;
  if (parcela.matricula.formaPagamento !== "carne") {
    throw new Error("Pagamento feito na matrícula (cartão/Pix/dinheiro) não pode ser desfeito aqui.");
  }
  await db.parcela.update({
    where: { id: parcelaId },
    data: { pagoEm: null, valorPagoCentavos: null, forma: null, obs: null },
  });
  revalidatePath("/pagamentos");
  revalidatePath(`/alunos/${parcela.matricula.alunoId}`);
  revalidatePath("/");
}
