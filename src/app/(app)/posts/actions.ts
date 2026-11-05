"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { FORMATOS_POST, MODELOS_POST } from "@/lib/posts";

// A imagem chega pronta do navegador (JPEG 1080 px, uns 200 a 600 KB).
const IMAGEM_MAX = 3_000_000;

export async function salvarPost(dados: {
  modelo: string;
  formato: string;
  titulo: string;
  legenda: string;
  imagem: string;
}): Promise<{ erro?: string; id?: number }> {
  const sessao = await exigirSessao();
  if (!(dados.modelo in MODELOS_POST)) return { erro: "Modelo inválido." };
  if (!(dados.formato in FORMATOS_POST)) return { erro: "Formato inválido." };
  if (!/^data:image\/jpeg;base64,/.test(dados.imagem) || dados.imagem.length > IMAGEM_MAX) {
    return { erro: "Imagem inválida ou grande demais." };
  }
  const post = await db.postSocial.create({
    data: {
      autoescolaId: sessao.autoescolaId,
      modelo: dados.modelo,
      formato: dados.formato,
      titulo: (dados.titulo.trim() || MODELOS_POST[dados.modelo].titulo).slice(0, 80),
      legenda: dados.legenda.slice(0, 2200),
      imagem: dados.imagem,
    },
  });
  revalidatePath("/posts");
  return { id: post.id };
}

export async function excluirPost(id: number) {
  await exigirSessao();
  await db.postSocial.deleteMany({ where: { id } });
  revalidatePath("/posts");
}
