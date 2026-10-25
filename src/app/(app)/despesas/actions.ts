"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth";
import { FORMAS_PAGAMENTO, lerMoeda } from "@/lib/format";
import { CATEGORIAS_DESPESA, lerLitros, mesmoDiaEmOutroMes } from "@/lib/despesas";
import type { EstadoForm } from "@/components/form-acao";

const DIA = /^\d{4}-\d{2}-\d{2}$/;
const MAX_REPETICOES = 12;

function texto(dados: FormData, campo: string) {
  return String(dados.get(campo) ?? "").trim() || null;
}

function dia(v: string) {
  return new Date(`${v}T00:00:00Z`);
}

function revalidar() {
  revalidatePath("/despesas");
  revalidatePath("/");
}

// Só volta para endereços internos do sistema.
function destinoSeguro(voltar: string, padrao: string) {
  return voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : padrao;
}

// Cadastra ou altera uma despesa. Na criação pode repetir nos meses seguintes
// (ex.: salário, aluguel): as repetições ficam "a pagar".
export async function salvarDespesa(id: number | null, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirAdmin();

  const categoria = String(dados.get("categoria") ?? "");
  if (!(categoria in CATEGORIAS_DESPESA)) return { erro: "Escolha o tipo de despesa." };
  const descricao = texto(dados, "descricao") ?? CATEGORIAS_DESPESA[categoria].titulo;
  const valor = lerMoeda(String(dados.get("valor") ?? ""));
  if (valor === null || valor <= 0) return { erro: "Informe o valor. Ex.: 150,00" };
  const vencimento = String(dados.get("vencimento") ?? "");
  if (!DIA.test(vencimento)) return { erro: "Informe a data da despesa." };

  const paga = dados.get("situacao") === "paga";
  const pagoEm = String(dados.get("pagoEm") ?? "");
  const forma = String(dados.get("forma") ?? "");
  if (paga && !DIA.test(pagoEm)) return { erro: "Informe a data em que foi paga." };
  if (paga && !(forma in FORMAS_PAGAMENTO)) return { erro: "Escolha a forma de pagamento." };

  // Veículo, litros e km só no abastecimento.
  const abastecimento = categoria === "combustivel";
  const veiculoId = abastecimento ? Number(dados.get("veiculoId")) || null : null;
  const litrosCent = abastecimento ? lerLitros(String(dados.get("litros") ?? "")) : null;
  if (litrosCent === undefined) return { erro: "Litros inválidos. Ex.: 35,5" };
  const kmTexto = abastecimento ? String(dados.get("km") ?? "").replace(/\D/g, "") : "";
  const km = kmTexto ? Number(kmTexto) : null;

  const campos = {
    categoria,
    descricao,
    favorecido: texto(dados, "favorecido"),
    valorCentavos: valor,
    vencimento: dia(vencimento),
    pagoEm: paga ? dia(pagoEm) : null,
    forma: paga ? forma : null,
    veiculoId,
    litrosCent,
    km,
    obs: texto(dados, "obs"),
  };

  if (id) {
    const atual = await db.despesa.findUnique({ where: { id } });
    if (!atual) return { erro: "Despesa não encontrada." };
    await db.despesa.update({ where: { id }, data: campos });
  } else {
    const repetir = Math.min(Math.max(Number(dados.get("repetir")) || 1, 1), MAX_REPETICOES);
    const novas = [{ ...campos, autoescolaId: sessao.autoescolaId }];
    for (let n = 1; n < repetir; n++) {
      novas.push({ ...novas[0], vencimento: dia(mesmoDiaEmOutroMes(vencimento, n)), pagoEm: null, forma: null });
    }
    await db.despesa.createMany({ data: novas });
  }

  revalidar();
  redirect(destinoSeguro(String(dados.get("voltar") ?? ""), `/despesas?mes=${vencimento.slice(0, 7)}`));
}

// Marca uma despesa "a pagar" como paga.
export async function pagarDespesa(id: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirAdmin();
  const data = String(dados.get("data") ?? "");
  const valor = lerMoeda(String(dados.get("valor") ?? ""));
  const forma = String(dados.get("forma") ?? "");
  if (!DIA.test(data)) return { erro: "Informe a data do pagamento." };
  if (valor === null || valor <= 0) return { erro: "Informe o valor pago. Ex.: 150,00" };
  if (!(forma in FORMAS_PAGAMENTO)) return { erro: "Escolha a forma de pagamento." };

  const despesa = await db.despesa.findUnique({ where: { id } });
  if (!despesa) return { erro: "Despesa não encontrada." };
  if (despesa.pagoEm) return { erro: "Esta despesa já está paga." };
  await db.despesa.update({ where: { id }, data: { pagoEm: dia(data), valorCentavos: valor, forma } });

  revalidar();
  redirect(destinoSeguro(String(dados.get("voltar") ?? ""), "/despesas"));
}

// Volta uma despesa paga para "a pagar".
export async function desfazerPagamento(id: number) {
  await exigirAdmin();
  await db.despesa.update({ where: { id }, data: { pagoEm: null, forma: null } });
  revalidar();
}

export async function excluirDespesa(id: number) {
  await exigirAdmin();
  await db.despesa.delete({ where: { id } });
  revalidar();
}
