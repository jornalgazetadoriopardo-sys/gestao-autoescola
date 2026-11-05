"use client";

import { PublicarPost } from "./publicar";

// Publicar/baixar/copiar um post já salvo (a imagem vem do servidor).
export function AcoesPostSalvo({ id, legenda, nome }: { id: number; legenda: string; nome: string }) {
  async function arquivo() {
    const r = await fetch(`/posts/${id}/imagem`);
    return new File([await r.blob()], nome, { type: "image/jpeg" });
  }
  return <PublicarPost arquivo={arquivo} legenda={legenda} nomeArquivo={nome} />;
}
