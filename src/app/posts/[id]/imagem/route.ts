import { NextResponse } from "next/server";
import { db, situacaoDaSessao } from "@/lib/db";

// Imagem de um post salvo (JPEG). Com ?baixar=1 vem como download.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { sessao, situacao } = await situacaoDaSessao();
  if (!sessao || situacao !== "ok") return new NextResponse(null, { status: 401 });
  const post = await db.postSocial.findFirst({
    where: { id: Number((await params).id) || 0 },
    select: { imagem: true, titulo: true, criadoEm: true },
  });
  if (!post) return new NextResponse(null, { status: 404 });
  const bytes = Buffer.from(post.imagem.replace(/^data:image\/jpeg;base64,/, ""), "base64");
  const baixar = new URL(req.url).searchParams.get("baixar") === "1";
  const nome = `${post.titulo} - ${post.criadoEm.toISOString().slice(0, 10)}.jpg`;
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
      ...(baixar
        ? { "Content-Disposition": `attachment; filename="post.jpg"; filename*=UTF-8''${encodeURIComponent(nome)}` }
        : {}),
    },
  });
}
