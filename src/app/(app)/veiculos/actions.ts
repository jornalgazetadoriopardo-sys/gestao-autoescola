"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { hojeISO, lerMoeda } from "@/lib/format";
import type { EstadoForm } from "@/components/form-acao";

const CATEGORIAS_VEICULO = ["A", "B", "C", "D", "E"];

export async function salvarVeiculo(id: number | null, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirSessao();

  const placa = String(dados.get("placa") ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const modelo = String(dados.get("modelo") ?? "").trim();
  const categoria = String(dados.get("categoria") ?? "");

  // Aceita o padrão antigo (ABC1234) e o Mercosul (ABC1D23).
  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(placa)) return { erro: "Placa inválida." };
  if (!modelo) return { erro: "Informe o modelo do veículo." };
  if (!CATEGORIAS_VEICULO.includes(categoria)) return { erro: "Selecione a categoria." };

  const tipoLicenciamento = dados.get("tipoLicenciamento") === "pesado" ? "pesado" : "leve";
  const campos = { placa, modelo, categoria, tipoLicenciamento, ativo: dados.get("ativo") === "on" };

  try {
    if (id) await db.veiculo.update({ where: { id }, data: campos });
    else await db.veiculo.create({ data: { ...campos, autoescolaId: sessao.autoescolaId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Já existe um veículo com esta placa." };
    }
    throw e;
  }

  revalidatePath("/veiculos");
  redirect(id ? `/veiculos/${id}` : "/veiculos");
}

function data(dados: FormData, campo: string) {
  const v = String(dados.get(campo) ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00Z`) : null;
}

// Registra ou altera uma manutenção (feita ou a fazer) e, se informado, o dia do lembrete.
export async function salvarManutencao(
  veiculoId: number,
  manutencaoId: number | null,
  _: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  await exigirSessao();

  const descricao = String(dados.get("descricao") ?? "").trim();
  const kmTexto = String(dados.get("km") ?? "").replace(/\D/g, "");
  const valorTexto = String(dados.get("valor") ?? "").trim();
  const valorCentavos = valorTexto ? lerMoeda(valorTexto) : null;
  const lembrarEm = data(dados, "lembrarEm");
  const realizadaEm = data(dados, "data");

  if (!descricao) return { erro: "Informe o serviço. Ex.: Troca de óleo" };
  if (valorTexto && valorCentavos === null) return { erro: "Valor inválido. Ex.: 250,00" };
  if (!realizadaEm && !lembrarEm) return { erro: "Informe a data em que foi feita ou o dia para lembrar." };

  const campos = {
    descricao,
    data: realizadaEm,
    km: kmTexto ? Number(kmTexto) : null,
    valorCentavos,
    lembrarEm,
    obs: String(dados.get("obs") ?? "").trim() || null,
  };
  if (manutencaoId) {
    const atual = await db.manutencao.findUnique({ where: { id: manutencaoId } });
    if (!atual) return { erro: "Manutenção não encontrada." };
    // Lembrete com data nova volta a aparecer.
    const lembreteMudou = atual.lembrarEm?.getTime() !== lembrarEm?.getTime();
    await db.manutencao.update({
      where: { id: manutencaoId },
      data: { ...campos, ...(lembreteMudou ? { lembreteConcluido: false } : {}) },
    });
  } else {
    await db.manutencao.create({ data: { veiculoId, ...campos } });
  }

  revalidatePath(`/veiculos/${veiculoId}`);
  revalidatePath("/veiculos");
  revalidatePath("/");
  // O parâmetro novo faz o formulário voltar limpo.
  redirect(`/veiculos/${veiculoId}?salvo=${Date.now()}`);
}

export async function excluirManutencao(manutencaoId: number) {
  await exigirSessao();
  const m = await db.manutencao.delete({ where: { id: manutencaoId } });
  revalidatePath(`/veiculos/${m.veiculoId}`);
  revalidatePath("/veiculos");
  revalidatePath("/");
}

// Marca o lembrete como resolvido: some da tela inicial.
export async function concluirLembrete(manutencaoId: number) {
  await exigirSessao();
  const m = await db.manutencao.update({ where: { id: manutencaoId }, data: { lembreteConcluido: true } });
  revalidatePath(`/veiculos/${m.veiculoId}`);
  revalidatePath("/veiculos");
  revalidatePath("/");
}

// Exclui o veículo com o histórico de manutenções. As aulas e os abastecimentos
// continuam registrados, sem veículo.
export async function excluirVeiculo(veiculoId: number) {
  await exigirSessao();
  await db.$transaction([
    db.aula.updateMany({ where: { veiculoId }, data: { veiculoId: null } }),
    db.despesa.updateMany({ where: { veiculoId }, data: { veiculoId: null } }),
    db.manutencao.deleteMany({ where: { veiculoId } }),
    db.veiculo.delete({ where: { id: veiculoId } }),
  ]);
  revalidatePath("/veiculos");
  revalidatePath("/aulas");
  revalidatePath("/");
  redirect("/veiculos");
}

// Licenciamento do ano atual pago (o aviso some até o ano que vem) ou desfeito.
export async function marcarLicenciamento(veiculoId: number, pago: boolean) {
  await exigirSessao();
  const ano = Number(hojeISO().slice(0, 4));
  await db.veiculo.update({ where: { id: veiculoId }, data: { licenciamentoPagoAno: pago ? ano : null } });
  revalidatePath(`/veiculos/${veiculoId}`);
  revalidatePath("/veiculos");
  revalidatePath("/");
}
