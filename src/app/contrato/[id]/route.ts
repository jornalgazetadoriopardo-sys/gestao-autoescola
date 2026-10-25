import { NextResponse } from "next/server";
import { db, situacaoDaSessao } from "@/lib/db";
import { obterConfigCompleta } from "@/lib/config";
import { dadosDoContrato, preencherContrato } from "@/lib/contrato";

// Contrato da matrícula: o modelo da autoescola preenchido com os dados do aluno (.docx).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { sessao, situacao } = await situacaoDaSessao();
  if (!sessao || situacao !== "ok") return new NextResponse(null, { status: 401 });

  const [matricula, modelo, config] = await Promise.all([
    db.matricula.findUnique({
      where: { id: Number((await params).id) || 0 },
      include: { aluno: true, parcelas: { orderBy: { numero: "asc" } } },
    }),
    db.configuracao.findFirst({ select: { contratoArquivo: true } }),
    obterConfigCompleta(),
  ]);
  if (!matricula) return new NextResponse("Matrícula não encontrada.", { status: 404 });
  if (!modelo?.contratoArquivo) {
    return new NextResponse("Nenhum modelo de contrato cadastrado. Envie o arquivo em Configurações > Contrato.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const arquivo = preencherContrato(modelo.contratoArquivo, dadosDoContrato(matricula, config));
  const nome = `Contrato - ${matricula.aluno.nome}.docx`;
  return new NextResponse(new Uint8Array(arquivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="contrato.docx"; filename*=UTF-8''${encodeURIComponent(nome)}`,
      "Cache-Control": "no-store",
    },
  });
}
