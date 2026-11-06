import "server-only";
import { obterConfig } from "@/lib/config";
import { formatarTelefone } from "@/lib/format";
import { lerIdentidade } from "@/lib/identidade";
import type { MarcaInicial } from "./editor-post";

// Nome, contato, cidade, logotipo e identidade visual da autoescola, usados nas imagens e legendas.
export async function marcaDaAutoescola(): Promise<MarcaInicial> {
  const c = await obterConfig();
  const zap = c.whatsapp ? formatarTelefone(c.whatsapp) || c.whatsapp : null;
  const tel = c.telefone ? formatarTelefone(c.telefone) || c.telefone : null;
  const identidade = lerIdentidade(c.identidadeVisual, c.paleta);
  return {
    nome: c.nome,
    contato: zap ? `WhatsApp ${zap}` : tel ? `Tel. ${tel}` : null,
    cidade: c.cidade,
    uf: c.uf,
    instagram: identidade.instagram,
    logoUrl: c.logo,
    identidade,
  };
}
