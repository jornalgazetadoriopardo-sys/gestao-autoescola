"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { CATEGORIAS, STATUS_ALUNO, cpfValido, somenteDigitos } from "@/lib/format";
import { FOTO_MAX } from "@/lib/foto";
import type { EstadoForm } from "@/components/form-acao";

// "AAAA-MM-DD" → data (meia-noite UTC), ou null.
function dia(v: string | null) {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00Z`) : null;
}

function texto(dados: FormData, campo: string) {
  const v = String(dados.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

export async function salvarAluno(id: number | null, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirSessao();

  const nome = texto(dados, "nome");
  const cpf = somenteDigitos(texto(dados, "cpf") ?? "");
  const categoria = texto(dados, "categoria") ?? "";
  const status = texto(dados, "status") ?? "ativo";
  const nascimento = texto(dados, "nascimento");

  if (!nome) return { erro: "Informe o nome do aluno." };
  if (!cpfValido(cpf)) return { erro: "CPF inválido." };
  if (!(CATEGORIAS as readonly string[]).includes(categoria)) return { erro: "Selecione a categoria." };
  if (!(status in STATUS_ALUNO)) return { erro: "Status inválido." };

  // "manter" = a foto não foi mexida; vazio = foto removida.
  const foto = String(dados.get("foto") ?? "manter");
  if (foto !== "manter" && foto !== "" && (!/^data:image\/jpeg;base64,/.test(foto) || foto.length > FOTO_MAX)) {
    return { erro: "Foto inválida. Tente escolher a imagem de novo." };
  }

  const campos = {
    nome,
    cpf,
    categoria,
    status,
    telefone: somenteDigitos(texto(dados, "telefone") ?? "") || null,
    email: texto(dados, "email"),
    nascimento: nascimento ? new Date(`${nascimento}T00:00:00Z`) : null,
    endereco: texto(dados, "endereco"),
    telefone2: somenteDigitos(texto(dados, "telefone2") ?? "") || null,
    numero: texto(dados, "numero"),
    bairro: texto(dados, "bairro"),
    localAtividade: texto(dados, "localAtividade"),
    mae: texto(dados, "mae"),
    pai: texto(dados, "pai"),
    rg: texto(dados, "rg"),
    rgOrgao: texto(dados, "rgOrgao")?.toUpperCase() ?? null,
    rgUf: texto(dados, "rgUf")?.toUpperCase().slice(0, 2) ?? null,
    rgExpedicao: dia(texto(dados, "rgExpedicao")),
    naturalidade: texto(dados, "naturalidade"),
    renach: texto(dados, "renach"),
    registroCnh: texto(dados, "registroCnh"),
    biometriaEm: dia(texto(dados, "biometriaEm")),
    obs: texto(dados, "obs"),
    ...(foto === "manter" ? {} : { foto: foto || null, fotoEm: foto ? new Date() : null }),
  };

  let alunoId = id;
  try {
    if (id) {
      await db.aluno.update({ where: { id }, data: campos });
    } else {
      alunoId = (await db.aluno.create({ data: { ...campos, autoescolaId: sessao.autoescolaId } })).id;
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

// Exclui o aluno com todas as matrículas, aulas e pagamentos.
export async function excluirAluno(alunoId: number) {
  await exigirSessao();
  const aluno = await db.aluno.findUnique({ where: { id: alunoId } });
  if (!aluno) return;
  const daMatricula = { matricula: { alunoId } };
  await db.$transaction([
    db.aula.deleteMany({ where: daMatricula }),
    db.parcela.deleteMany({ where: daMatricula }),
    db.etapa.deleteMany({ where: daMatricula }),
    db.matricula.deleteMany({ where: { alunoId } }),
    db.aluno.delete({ where: { id: alunoId } }),
  ]);
  revalidatePath("/alunos");
  revalidatePath("/pagamentos");
  revalidatePath("/aulas");
  revalidatePath("/");
  redirect("/alunos?excluido=1");
}
