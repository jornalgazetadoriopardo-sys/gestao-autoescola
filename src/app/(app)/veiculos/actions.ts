"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import type { EstadoForm } from "@/components/form-acao";

const CATEGORIAS_VEICULO = ["A", "B", "C", "D", "E"];

export async function salvarVeiculo(
  id: number | null,
  _: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  await exigirSessao();

  const placa = String(dados.get("placa") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const modelo = String(dados.get("modelo") ?? "").trim();
  const categoria = String(dados.get("categoria") ?? "");

  // Aceita o padrão antigo (ABC1234) e o Mercosul (ABC1D23).
  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(placa)) return { erro: "Placa inválida." };
  if (!modelo) return { erro: "Informe o modelo do veículo." };
  if (!CATEGORIAS_VEICULO.includes(categoria)) return { erro: "Selecione a categoria." };

  const campos = { placa, modelo, categoria, ativo: dados.get("ativo") === "on" };

  try {
    if (id) await db.veiculo.update({ where: { id }, data: campos });
    else await db.veiculo.create({ data: campos });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Já existe um veículo com esta placa." };
    }
    throw e;
  }

  revalidatePath("/veiculos");
  redirect("/veiculos");
}
