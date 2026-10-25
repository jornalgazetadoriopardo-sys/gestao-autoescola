import "server-only";
import { db } from "@/lib/db";

// Sugestões de nomes (instrutores e usuários) e veículos para o formulário.
export async function dadosDoFormulario() {
  const [instrutores, usuarios, favorecidos, veiculos] = await Promise.all([
    db.instrutor.findMany({ where: { ativo: true }, select: { nome: true } }),
    db.usuario.findMany({ where: { ativo: true }, select: { nome: true } }),
    db.despesa.findMany({
      where: { favorecido: { not: null } },
      distinct: ["favorecido"],
      select: { favorecido: true },
      take: 200,
    }),
    db.veiculo.findMany({ where: { ativo: true }, orderBy: { placa: "asc" } }),
  ]);
  const pessoas = [
    ...new Set([...instrutores, ...usuarios].map((p) => p.nome).concat(favorecidos.map((f) => f.favorecido!))),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { pessoas, veiculos: veiculos.map((v) => ({ id: v.id, texto: `${v.placa} · ${v.modelo}` })) };
}
