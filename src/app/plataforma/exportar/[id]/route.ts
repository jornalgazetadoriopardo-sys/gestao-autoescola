import { notFound } from "next/navigation";
import { exigirSuperadmin } from "@/lib/auth";
import { exportarAutoescola } from "@/lib/backup";

// Baixa um arquivo .json com todos os dados de uma autoescola.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await exigirSuperadmin();
  const id = Number((await params).id);
  const dados = Number.isInteger(id) && id > 0 ? await exportarAutoescola(id) : null;
  if (!dados) notFound();

  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const nome =
    dados.autoescola.nome
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "autoescola";
  return new Response(JSON.stringify(dados, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}-${hoje}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
