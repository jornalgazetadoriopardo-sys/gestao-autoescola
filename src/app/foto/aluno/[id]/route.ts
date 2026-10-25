import { NextResponse } from "next/server";
import { db, situacaoDaSessao } from "@/lib/db";

// Foto de um aluno da autoescola de quem está logado.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { sessao, situacao } = await situacaoDaSessao();
  if (!sessao || situacao !== "ok") return new NextResponse(null, { status: 401 });
  const aluno = await db.aluno.findUnique({ where: { id: Number((await params).id) || 0 }, select: { foto: true } });
  const partes = aluno?.foto?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!partes) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(partes[2], "base64"), {
    headers: { "Content-Type": partes[1], "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
