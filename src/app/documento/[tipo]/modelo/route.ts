import { NextResponse } from "next/server";
import { db, situacaoDaSessao } from "@/lib/db";

// Baixa o modelo de documento que a autoescola enviou.
export async function GET(_: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { sessao, situacao } = await situacaoDaSessao();
  if (!sessao || situacao !== "ok") return new NextResponse(null, { status: 401 });
  const modelo = await db.modeloDocumento.findFirst({ where: { tipo: (await params).tipo } });
  if (!modelo) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(modelo.arquivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="modelo.docx"; filename*=UTF-8''${encodeURIComponent(modelo.nome)}`,
      "Cache-Control": "no-store",
    },
  });
}
