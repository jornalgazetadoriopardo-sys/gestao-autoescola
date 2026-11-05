import "server-only";
import { obterConfig } from "@/lib/config";
import { formatarTelefone } from "@/lib/format";
import { paletaValida } from "@/lib/paletas";
import type { MarcaInicial } from "./editor-post";

// Nome, contato, cidade, cor e logotipo da autoescola, usados nas imagens e legendas.
export async function marcaDaAutoescola(): Promise<MarcaInicial> {
  const c = await obterConfig();
  const zap = c.whatsapp ? formatarTelefone(c.whatsapp) || c.whatsapp : null;
  const tel = c.telefone ? formatarTelefone(c.telefone) || c.telefone : null;
  return {
    nome: c.nome,
    contato: zap ? `WhatsApp ${zap}` : tel ? `Tel. ${tel}` : null,
    cidade: c.cidade,
    uf: c.uf,
    paleta: paletaValida(c.paleta),
    logoUrl: c.logo,
  };
}
