"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { COMPROVANTE_MAX } from "@/lib/mensalidades";
import type { EstadoForm } from "@/components/form-acao";

// "Já paguei": a autoescola avisa que pagou a mensalidade, com o comprovante
// (opcional). Enquanto o dono do sistema confere, a conta não é bloqueada.
export async function informarPagamento(mensalidadeId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();
  const m = await db.mensalidade.findFirst({ where: { id: mensalidadeId } });
  if (!m) return { erro: "Mensalidade não encontrada." };
  if (m.pagoEm) return { ok: "Esta mensalidade já está paga. Obrigado!" };

  const arquivo = dados.get("comprovante");
  let comprovante: { comprovante: string; comprovanteNome: string } | null = null;
  if (arquivo instanceof File && arquivo.size > 0) {
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(arquivo.type)) {
      return { erro: "Envie o comprovante como foto (JPG ou PNG) ou PDF." };
    }
    if (arquivo.size > COMPROVANTE_MAX * 0.74) return { erro: "Comprovante grande demais (máximo 1,4 MB)." };
    const base64 = Buffer.from(await arquivo.arrayBuffer()).toString("base64");
    comprovante = { comprovante: `data:${arquivo.type};base64,${base64}`, comprovanteNome: arquivo.name.slice(0, 120) };
  }
  const obs = String(dados.get("obs") ?? "").trim().slice(0, 300) || null;
  await db.mensalidade.update({
    where: { id: m.id },
    data: { informadoEm: new Date(), obs, ...(comprovante ?? {}) },
  });
  revalidatePath("/", "layout");
  return { ok: "Obrigado! Recebemos seu aviso de pagamento. Assim que confirmarmos, o aviso some." };
}
