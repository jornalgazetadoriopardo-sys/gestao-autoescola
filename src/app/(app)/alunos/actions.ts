"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { CATEGORIAS, STATUS_ALUNO, cpfValido, somenteDigitos } from "@/lib/format";
import type { EstadoForm } from "@/components/form-acao";

function texto(dados: FormData, campo: string) {
  const v = String(dados.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

export async function salvarAluno(
  id: number | null,
  _: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  await exigirSessao();

  const nome = texto(dados, "nome");
  const cpf = somenteDigitos(texto(dados, "cpf") ?? "");
  const categoria = texto(dados, "categoria") ?? "";
  const status = texto(dados, "status") ?? "ativo";
  const nascimento = texto(dados, "nascimento");

  if (!nome) return { erro: "Informe o nome do aluno." };
  if (!cpfValido(cpf)) return { erro: "CPF inválido." };
  if (!(CATEGORIAS as readonly string[]).includes(categoria)) return { erro: "Selecione a categoria." };
  if (!(status in STATUS_ALUNO)) return { erro: "Status inválido." };

  const campos = {
    nome,
    cpf,
    categoria,
    status,
    telefone: somenteDigitos(texto(dados, "telefone") ?? "") || null,
    email: texto(dados, "email"),
    nascimento: nascimento ? new Date(`${nascimento}T00:00:00Z`) : null,
    endereco: texto(dados, "endereco"),
    obs: texto(dados, "obs"),
  };

  let alunoId = id;
  try {
    if (id) {
      await db.aluno.update({ where: { id }, data: campos });
    } else {
      alunoId = (await db.aluno.create({ data: campos })).id;
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Já existe um aluno cadastrado com este CPF." };
    }
    throw e;
  }

  revalidatePath("/alunos");
  redirect(`/alunos/${alunoId}`);
}
