"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  Car,
  FileText,
  House,
  LoaderCircle,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";

const itens: { href: string; label: string; icone: typeof House; soAdmin?: boolean }[] = [
  { href: "/", label: "Início", icone: House },
  { href: "/aulas", label: "Agenda", icone: CalendarDays },
  { href: "/exames", label: "Exames e taxas", icone: ClipboardCheck },
  { href: "/alunos", label: "Alunos", icone: Users },
  { href: "/pagamentos", label: "Pagamentos", icone: Wallet },
  { href: "/despesas", label: "Despesas", icone: Receipt, soAdmin: true },
  { href: "/veiculos", label: "Veículos", icone: Car },
  { href: "/instrutores", label: "Instrutores", icone: UserRound },
  { href: "/relatorios", label: "Relatórios", icone: FileText },
  { href: "/configuracoes", label: "Configurações", icone: Settings },
];

export function MenuLateral({
  nome,
  autoescola,
  logo,
  admin,
  superadmin,
  sair,
}: {
  nome: string;
  autoescola: string;
  logo: string | null;
  admin: boolean;
  superadmin: boolean;
  sair: () => Promise<void>;
}) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  // Item clicado enquanto a próxima tela carrega (some quando a tela muda).
  // Um loading.tsx faria o mesmo, mas ele trava o redirecionamento depois de salvar formulários.
  const [indo, setIndo] = useState<string | null>(null);
  useEffect(() => setIndo(null), [caminho]);
  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

  return (
    <aside className="w-full shrink-0 bg-slate-900 text-slate-200 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col">
      {indo && <div className="fixed inset-x-0 top-0 z-50 h-1 animate-pulse bg-blue-500" role="progressbar" />}
      <div className="flex items-center justify-between gap-3 px-5 py-4 md:py-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="size-11 shrink-0 rounded-lg bg-white object-contain p-1" />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <Car className="size-6 text-white" aria-hidden />
            </span>
          )}
          <span className="line-clamp-2 text-lg font-bold leading-tight text-white">{autoescola}</span>
        </Link>
        <button
          className="rounded-lg p-2 hover:bg-slate-800 md:hidden"
          onClick={() => setAberto(!aberto)}
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        >
          {aberto ? <X className="size-7" /> : <Menu className="size-7" />}
        </button>
      </div>

      <div className={`${aberto ? "flex" : "hidden"} flex-1 flex-col md:flex`}>
        <nav className="flex flex-col gap-1 px-3">
          {[
            ...itens.filter((i) => admin || !i.soAdmin),
            ...(superadmin ? [{ href: "/plataforma", label: "Plataforma", icone: ShieldCheck }] : []),
          ].map(({ href, label, icone: Icone }) => (
            <Link
              key={href}
              href={href}
              onClick={() => {
                setAberto(false);
                if (href !== caminho) setIndo(href);
              }}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition ${
                ativo(href) ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {indo === href ? (
                <LoaderCircle className="size-6 animate-spin" aria-label="Carregando" />
              ) : (
                <Icone className="size-6" aria-hidden />
              )}
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t border-slate-800 px-5 py-4 md:mt-auto">
          <div className="mb-2 truncate text-sm text-slate-400">Conectado como {nome}</div>
          <form action={sair}>
            <button className="flex items-center gap-2 text-base text-slate-300 hover:text-white">
              <LogOut className="size-5" aria-hidden /> Sair
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
