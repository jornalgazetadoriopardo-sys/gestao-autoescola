import { NextResponse } from "next/server";
import { db, situacaoDaSessao } from "@/lib/db";

// Baixa o modelo de contrato que a autoescola enviou.
export async function GET() {
  const { sessao, situacao } = await situacaoDaSessao();
  if (!sessao || situacao !== "ok") return new NextResponse(null, { status: 401 });
  const config = await db.configuracao.findFirst({ select: { contratoArquivo: true, contratoNome: true } });
  if (!config?.contratoArquivo) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(config.contratoArquivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="modelo.docx"; filename*=UTF-8''${encodeURIComponent(config.contratoNome ?? "modelo-contrato.docx")}`,
      "Cache-Control": "no-store",
    },
  });
}
