"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { dbGlobal } from "@/lib/db";
import { exigirSuperadmin } from "@/lib/auth";
import { ErroImportacao, importarAutoescola } from "@/lib/backup";
import type { EstadoForm } from "@/components/form-acao";

function texto(dados: FormData, campo: string) {
  const v = String(dados.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

// Cria uma autoescola nova, já com o primeiro administrador dela.
export async function criarAutoescola(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSuperadmin();

  const nome = texto(dados, "nome");
  const cidade = texto(dados, "cidade");
  const uf = texto(dados, "uf")?.toUpperCase().slice(0, 2) ?? null;
  const adminNome = texto(dados, "adminNome");
  const email = texto(dados, "email")?.toLowerCase();
  const senha = String(dados.get("senha") ?? "");

  if (!nome) return { erro: "Informe o nome da autoescola." };
  if (!adminNome) return { erro: "Informe o nome do administrador." };
  if (!email || !email.includes("@")) return { erro: "Informe um e-mail válido para o administrador." };
  if (senha.length < 8) return { erro: "A senha deve ter pelo menos 8 caracteres." };

  const senhaHash = await bcrypt.hash(senha, 10);
  try {
    await dbGlobal.$transaction(async (tx) => {
      const autoescola = await tx.autoescola.create({ data: { nome } });
      await tx.configuracao.create({ data: { id: autoescola.id, nome, cidade, uf } });
      await tx.usuario.create({
        data: { autoescolaId: autoescola.id, nome: adminNome, email, senhaHash, papel: "admin" },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Este e-mail já é usado por outro usuário do sistema." };
    }
    throw e;
  }
  revalidatePath("/plataforma");
  return { ok: `Autoescola ${nome} criada. O administrador já pode entrar com ${email}.` };
}

// Suspende ou reativa o acesso de uma autoescola (os dados continuam guardados).
export async function alternarAutoescola(autoescolaId: number) {
  const sessao = await exigirSuperadmin();
  if (autoescolaId === sessao.autoescolaId) throw new Error("Você não pode suspender a sua própria autoescola.");
  const autoescola = await dbGlobal.autoescola.findUnique({ where: { id: autoescolaId } });
  if (!autoescola) return;
  await dbGlobal.autoescola.update({ where: { id: autoescolaId }, data: { ativo: !autoescola.ativo } });
  revalidatePath("/plataforma");
}

const ARQUIVO_MAX = 4 * 1024 * 1024;

// Recebe o arquivo exportado (de outro servidor) e cria a autoescola com tudo.
export async function importarArquivo(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSuperadmin();

  const arquivo = dados.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Escolha o arquivo exportado (.json)." };
  if (arquivo.size > ARQUIVO_MAX) return { erro: "Arquivo grande demais (máximo 4 MB)." };

  let conteudo: unknown;
  try {
    conteudo = JSON.parse(await arquivo.text());
  } catch {
    return { erro: "Não foi possível ler o arquivo. Use o arquivo .json baixado em Exportar." };
  }

  try {
    const r = await importarAutoescola(conteudo);
    revalidatePath("/plataforma");
    return {
      ok:
        `Autoescola ${r.nome} importada: ${r.totais.usuarios} usuário(s), ${r.totais.alunos} aluno(s), ` +
        `${r.totais.aulas} aula(s), ${r.totais.parcelas} parcela(s) e ${r.totais.despesas} despesa(s). Os usuários entram com as mesmas senhas de antes.`,
    };
  } catch (e) {
    if (e instanceof ErroImportacao) return { erro: e.message };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Arquivo inválido: há CPF, placa ou e-mail repetido. Nada foi importado." };
    }
    console.error(e);
    return { erro: "Não foi possível importar. Nada foi gravado." };
  }
}

// Apaga a autoescola e TODOS os dados dela. Só para autoescola suspensa e com
// o nome digitado para confirmar.
export async function excluirAutoescola(autoescolaId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirSuperadmin();
  if (autoescolaId === sessao.autoescolaId) return { erro: "Você não pode excluir a sua própria autoescola." };
  const autoescola = await dbGlobal.autoescola.findUnique({ where: { id: autoescolaId } });
  if (!autoescola) return { erro: "Autoescola não encontrada." };
  if (autoescola.ativo) return { erro: "Suspenda a autoescola antes de excluir." };
  if (String(dados.get("confirmacao") ?? "").trim() !== autoescola.nome) {
    return { erro: "O nome digitado não confere. Digite exatamente como aparece acima." };
  }

  const doAluno = { aluno: { autoescolaId } };
  await dbGlobal.$transaction([
    dbGlobal.aula.deleteMany({ where: { matricula: doAluno } }),
    dbGlobal.parcela.deleteMany({ where: { matricula: doAluno } }),
    dbGlobal.etapa.deleteMany({ where: { matricula: doAluno } }),
    dbGlobal.matricula.deleteMany({ where: doAluno }),
    dbGlobal.aluno.deleteMany({ where: { autoescolaId } }),
    dbGlobal.despesa.deleteMany({ where: { autoescolaId } }),
    dbGlobal.feriado.deleteMany({ where: { autoescolaId } }),
    dbGlobal.manutencao.deleteMany({ where: { veiculo: { autoescolaId } } }),
    dbGlobal.veiculo.deleteMany({ where: { autoescolaId } }),
    dbGlobal.instrutor.deleteMany({ where: { autoescolaId } }),
    dbGlobal.usuario.deleteMany({ where: { autoescolaId } }),
    dbGlobal.configuracao.deleteMany({ where: { id: autoescolaId } }),
    dbGlobal.autoescola.delete({ where: { id: autoescolaId } }),
  ]);
  revalidatePath("/plataforma");
  redirect("/plataforma");
}
