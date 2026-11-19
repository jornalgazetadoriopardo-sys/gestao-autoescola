import { NextResponse } from "next/server";
import { dbGlobal, situacaoDaSessao } from "@/lib/db";

// Comprovante que a autoescola anexou ao avisar o pagamento (só o dono do sistema vê).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { sessao, situacao } = await situacaoDaSessao();
  if (!sessao?.superadmin || situacao !== "ok") return new NextResponse(null, { status: 404 });
  const m = await dbGlobal.mensalidade.findUnique({
    where: { id: Number((await params).id) || 0 },
    select: { comprovante: true, comprovanteNome: true },
  });
  const partes = m?.comprovante?.match(/^data:([\w/.+-]+);base64,(.*)$/);
  if (!partes) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(Buffer.from(partes[2], "base64")), {
    headers: {
      "Content-Type": partes[1],
      "Content-Disposition": `inline; filename="comprovante"; filename*=UTF-8''${encodeURIComponent(m!.comprovanteNome ?? "comprovante")}`,
      "Cache-Control": "private, no-store",
    },
  });
}
