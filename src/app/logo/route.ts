import { NextResponse } from "next/server";
import { situacaoDaSessao, dbGlobal } from "@/lib/db";

// Logotipo da autoescola de quem está logado. O endereço leva a versão da
// imagem (?v=...), então o navegador pode guardá-lo por muito tempo.
export async function GET() {
  const { sessao, situacao } = await situacaoDaSessao();
  if (!sessao || situacao !== "ok") return new NextResponse(null, { status: 401 });
  const config = await dbGlobal.configuracao.findUnique({ where: { id: sessao.autoescolaId }, select: { logo: true } });
  const partes = config?.logo?.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!partes) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(partes[2], "base64"), {
    headers: {
      "Content-Type": partes[1],
      // "private": cada autoescola tem o seu logotipo no mesmo endereço.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
