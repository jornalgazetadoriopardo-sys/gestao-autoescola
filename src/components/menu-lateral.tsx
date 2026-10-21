"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
  { href: "/", label: "Painel" },
  { href: "/alunos", label: "Alunos" },
  { href: "/instrutores", label: "Instrutores" },
  { href: "/veiculos", label: "Veículos" },
];

export function MenuLateral({ nome, sair }: { nome: string; sair: () => Promise<void> }) {
  const caminho = usePathname();
  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

  return (
    <aside className="flex w-full flex-col bg-slate-900 text-slate-200 md:min-h-screen md:w-56">
      <div className="px-5 py-5 text-lg font-semibold text-white">Autoescola</div>
      <nav className="flex flex-row gap-1 overflow-x-auto px-3 md:flex-col">
        {itens.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
              ativo(item.href) ? "bg-slate-700 text-white" : "hover:bg-slate-800"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-800 px-5 py-3 text-sm md:mt-auto md:block md:py-4">
        <div className="truncate text-slate-400 md:mb-2">{nome}</div>
        <form action={sair}>
          <button className="text-slate-300 hover:text-white">Sair</button>
        </form>
      </div>
    </aside>
  );
}
