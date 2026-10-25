import { db } from "@/lib/db";

// Veículos e instrutores ativos para o agendamento da prova (mais o já escolhido, se inativo).
export async function opcoesDoExame(atual?: { veiculoId: number | null; instrutorId: number | null }) {
  const [veiculos, instrutores] = await Promise.all([
    db.veiculo.findMany({
      where: { OR: [{ ativo: true }, { id: atual?.veiculoId ?? -1 }] },
      orderBy: { placa: "asc" },
    }),
    db.instrutor.findMany({
      where: { OR: [{ ativo: true }, { id: atual?.instrutorId ?? -1 }] },
      orderBy: { nome: "asc" },
    }),
  ]);
  return {
    veiculos: veiculos.map((v) => ({ id: v.id, nome: `${v.placa} · ${v.modelo} (${v.categoria})` })),
    instrutores: instrutores.map((i) => ({ id: i.id, nome: i.nome })),
  };
}
