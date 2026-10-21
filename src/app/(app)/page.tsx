import Link from "next/link";
import { Cabecalho, Cartao } from "@/components/ui";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const [alunosAtivos, instrutores, veiculos] = await Promise.all([
    db.aluno.count({ where: { status: "ativo" } }),
    db.instrutor.count({ where: { ativo: true } }),
    db.veiculo.count({ where: { ativo: true } }),
  ]);

  const indicadores = [
    { label: "Alunos ativos", valor: alunosAtivos, href: "/alunos" },
    { label: "Instrutores ativos", valor: instrutores, href: "/instrutores" },
    { label: "Veículos ativos", valor: veiculos, href: "/veiculos" },
  ];

  return (
    <>
      <Cabecalho titulo="Painel" />
      <div className="grid gap-4 sm:grid-cols-3">
        {indicadores.map((i) => (
          <Link key={i.label} href={i.href}>
            <Cartao className="hover:border-blue-300">
              <div className="text-sm text-slate-500">{i.label}</div>
              <div className="mt-1 text-3xl font-semibold">{i.valor}</div>
            </Cartao>
          </Link>
        ))}
      </div>
    </>
  );
}
