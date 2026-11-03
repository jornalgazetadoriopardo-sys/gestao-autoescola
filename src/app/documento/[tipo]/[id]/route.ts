import { NextResponse } from "next/server";
import { db, situacaoDaSessao } from "@/lib/db";
import { obterConfigCompleta } from "@/lib/config";
import { dadosDoContrato, preencherContrato } from "@/lib/contrato";
import { TIPOS_DOCUMENTO, dadosDaAula } from "@/lib/documentos";

const texto = (mensagem: string, status: number) =>
  new NextResponse(mensagem, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

// Documento da matrícula (declaração, autorização de imagem...): o modelo da
// autoescola preenchido com os dados do aluno (.docx). A declaração usa a aula
// passada em ?aula=.
export async function GET(req: Request, { params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { sessao, situacao } = await situacaoDaSessao();
  if (!sessao || situacao !== "ok") return new NextResponse(null, { status: 401 });
  const { tipo, id } = await params;
  const doc = TIPOS_DOCUMENTO[tipo];
  if (!doc) return texto("Documento desconhecido.", 404);

  const aulaId = Number(new URL(req.url).searchParams.get("aula")) || 0;
  const [matricula, modelo, config, aula] = await Promise.all([
    db.matricula.findUnique({
      where: { id: Number(id) || 0 },
      include: { aluno: true, parcelas: { orderBy: { numero: "asc" } } },
    }),
    db.modeloDocumento.findFirst({ where: { tipo }, select: { arquivo: true } }),
    obterConfigCompleta(),
    doc.porAula ? db.aula.findUnique({ where: { id: aulaId }, include: { instrutor: true, veiculo: true } }) : null,
  ]);
  if (!matricula) return texto("Matrícula não encontrada.", 404);
  if (!modelo) {
    return texto(`Nenhum modelo de "${doc.titulo}" cadastrado. Envie o arquivo em Configurações > Documentos.`, 404);
  }
  if (doc.porAula && (!aula || aula.matriculaId !== matricula.id)) return texto("Aula não encontrada.", 404);

  const dados = { ...dadosDoContrato(matricula, config), ...(aula ? dadosDaAula(aula) : {}) };
  const arquivo = preencherContrato(modelo.arquivo, dados);
  const nome = `${doc.titulo} - ${matricula.aluno.nome}${aula ? ` - ${dados.aula_data?.replaceAll("/", "-")}` : ""}.docx`;
  return new NextResponse(new Uint8Array(arquivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="documento.docx"; filename*=UTF-8''${encodeURIComponent(nome)}`,
      "Cache-Control": "no-store",
    },
  });
}
