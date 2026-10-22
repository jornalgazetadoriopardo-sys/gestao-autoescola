"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { somenteDigitos } from "@/lib/format";
import type { EstadoForm } from "@/components/form-acao";

const CATEGORIAS_INSTRUTOR = ["A", "B", "C", "D", "E"];

export async function salvarInstrutor(
  id: number | null,
  _: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  await exigirSessao();

  const nome = String(dados.get("nome") ?? "").trim();
  const categorias = dados
    .getAll("categorias")
    .map(String)
    .filter((c) => CATEGORIAS_INSTRUTOR.includes(c));

  if (!nome) return { erro: "Informe o nome do instrutor." };
  if (categorias.length === 0) return { erro: "Selecione ao menos uma categoria." };

  const campos = {
    nome,
    telefone: somenteDigitos(String(dados.get("telefone") ?? "")) || null,
    categorias: categorias.join(","),
    ativo: dados.get("ativo") === "on",
  };

  if (id) await db.instrutor.update({ where: { id }, data: campos });
  else await db.instrutor.create({ data: campos });

  revalidatePath("/instrutores");
  redirect("/instrutores");
}
