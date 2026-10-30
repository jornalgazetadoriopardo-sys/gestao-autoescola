"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Car,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
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
  type LucideIcon,
} from "lucide-react";
import { SeletorTema } from "./seletor-tema";

// Estrutura de todas as telas: menu lateral (recolhível no computador, gaveta
// no celular) e a área da página. O menu é agrupado por assunto para quem
// não conhece o sistema achar as coisas pelo nome.
type Item = { href: string; label: string; icone: LucideIcon; soAdmin?: boolean };
const GRUPOS: { titulo: string; itens: Item[] }[] = [
  {
    titulo: "Dia a dia",
    itens: [
      { href: "/", label: "Início", icone: House },
      { href: "/aulas", label: "Agenda", icone: CalendarDays },
      { href: "/alunos", label: "Alunos", icone: Users },
      { href: "/exames", label: "Exames e taxas", icone: ClipboardCheck },
    ],
  },
  {
    titulo: "Financeiro",
    itens: [
      { href: "/pagamentos", label: "Pagamentos", icone: Wallet },
      { href: "/despesas", label: "Despesas", icone: Receipt, soAdmin: true },
      { href: "/relatorios", label: "Relatórios", icone: FileText },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      { href: "/veiculos", label: "Veículos", icone: Car },
      { href: "/instrutores", label: "Instrutores", icone: UserRound },
    ],
  },
];

const CHAVE_RECOLHIDO = "menu-recolhido";

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export function CascaApp({
  nome,
  autoescola,
  logo,
  admin,
  superadmin,
  sair,
  children,
}: {
  nome: string;
  autoescola: string;
  logo: string | null;
  admin: boolean;
  superadmin: boolean;
  sair: () => Promise<void>;
  children: ReactNode;
}) {
  const caminho = usePathname();
  const [gaveta, setGaveta] = useState(false);
  const [recolhido, setRecolhido] = useState(false);
  // Item clicado enquanto a próxima tela carrega (some quando a tela muda).
  // Um loading.tsx faria o mesmo, mas ele trava o redirecionamento depois de salvar formulários.
  const [indo, setIndo] = useState<string | null>(null);

  useEffect(() => {
    setIndo(null);
    setGaveta(false);
  }, [caminho]);
  useEffect(() => {
    try {
      setRecolhido(localStorage.getItem(CHAVE_RECOLHIDO) === "1");
    } catch {}
  }, []);
  function alternarRecolhido() {
    setRecolhido((r) => {
      try {
        localStorage.setItem(CHAVE_RECOLHIDO, r ? "0" : "1");
      } catch {}
      return !r;
    });
  }

  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));
  const grupos = [
    ...GRUPOS.map((g) => ({ ...g, itens: g.itens.filter((i) => admin || !i.soAdmin) })),
    {
      titulo: "Sistema",
      itens: [
        { href: "/configuracoes", label: "Configurações", icone: Settings },
        ...(superadmin ? [{ href: "/plataforma", label: "Plataforma", icone: ShieldCheck }] : []),
      ],
    },
  ];
  const paginaAtual = grupos.flatMap((g) => g.itens).find((i) => ativo(i.href))?.label ?? autoescola;

  const marca = (
    <Link href="/" className="flex min-w-0 items-center gap-3" title={autoescola}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="size-10 shrink-0 rounded-xl bg-white object-contain p-1" />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Car className="size-5" aria-hidden />
        </span>
      )}
      {!recolhido && (
        <span className="line-clamp-2 text-[15px] font-semibold leading-tight tracking-tight text-white">
          {autoescola}
        </span>
      )}
    </Link>
  );

  const navegacao = (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2" aria-label="Menu principal">
      {grupos.map((g) => (
        <div key={g.titulo}>
          {!recolhido && (
            <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              {g.titulo}
            </div>
          )}
          {recolhido && <div className="mx-3 mb-2 border-t border-white/10" />}
          <ul className="flex flex-col gap-0.5">
            {g.itens.map(({ href, label, icone: Icone }) => {
              const atual = ativo(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={recolhido ? label : undefined}
                    aria-current={atual ? "page" : undefined}
                    onClick={() => {
                      if (href !== caminho) setIndo(href);
                    }}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                      recolhido ? "justify-center" : ""
                    } ${
                      atual
                        ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                        : "text-white/70 hover:bg-[var(--menu-hover)] hover:text-white"
                    }`}
                  >
                    {atual && (
                      <span className="absolute inset-y-2 -left-3 w-1 rounded-r-full bg-blue-400" aria-hidden />
                    )}
                    {indo === href ? (
                      <LoaderCircle className="size-5 shrink-0 animate-spin" aria-label="Carregando" />
                    ) : (
                      <Icone className={`size-5 shrink-0 ${atual ? "text-blue-300" : ""}`} aria-hidden />
                    )}
                    {!recolhido && <span className="truncate">{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const rodape = (
    <div className="border-t border-[var(--menu-borda)] p-3">
      {!recolhido && <SeletorTema />}
      <div className={`flex items-center gap-3 ${recolhido ? "flex-col" : ""}`}>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600/80 text-sm font-semibold text-white"
          title={nome}
          aria-hidden
        >
          {iniciais(nome)}
        </span>
        {!recolhido && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{nome}</div>
            <div className="text-xs text-white/50">{admin ? "Administrador" : "Secretaria"}</div>
          </div>
        )}
        <form action={sair}>
          <button
            className="rounded-lg p-2 text-white/60 transition hover:bg-[var(--menu-hover)] hover:text-white"
            title="Sair do sistema"
            aria-label="Sair do sistema"
          >
            <LogOut className="size-5" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {indo && <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-blue-500" role="progressbar" />}

      {/* Computador: menu fixo, recolhível */}
      <aside
        className={`sem-tema sticky top-0 hidden h-screen shrink-0 flex-col bg-[var(--menu-fundo)] text-white transition-[width] duration-200 md:flex ${
          recolhido ? "w-[4.75rem]" : "w-64"
        }`}
      >
        <div className={`flex items-center gap-2 px-4 py-4 ${recolhido ? "justify-center" : "justify-between"}`}>
          {marca}
        </div>
        {navegacao}
        <button
          type="button"
          onClick={alternarRecolhido}
          className="mx-3 mb-2 flex items-center justify-center gap-2 rounded-xl py-2 text-sm text-white/50 transition hover:bg-[var(--menu-hover)] hover:text-white"
          title={recolhido ? "Expandir menu" : "Recolher menu"}
          aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
        >
          {recolhido ? (
            <ChevronsRight className="size-5" aria-hidden />
          ) : (
            <ChevronsLeft className="size-5" aria-hidden />
          )}
          {!recolhido && "Recolher menu"}
        </button>
        {rodape}
      </aside>

      {/* Celular: barra no topo e menu em gaveta */}
      {gaveta && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setGaveta(false)}
            aria-label="Fechar menu"
          />
          <aside className="sem-tema absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[var(--menu-fundo)] text-white shadow-2xl">
            <div className="flex items-center justify-between gap-2 px-4 py-4">
              {marca}
              <button
                type="button"
                className="rounded-lg p-2 text-white/70 hover:bg-[var(--menu-hover)]"
                onClick={() => setGaveta(false)}
                aria-label="Fechar menu"
              >
                <X className="size-6" aria-hidden />
              </button>
            </div>
            {navegacao}
            {rodape}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sem-tema sticky top-0 z-30 flex items-center gap-3 bg-[var(--menu-fundo)] px-4 py-3 text-white md:hidden">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[var(--menu-hover)]"
            onClick={() => setGaveta(true)}
            aria-label="Abrir menu"
          >
            <Menu className="size-6" aria-hidden />
          </button>
          <span className="truncate text-base font-semibold">{paginaAtual}</span>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
