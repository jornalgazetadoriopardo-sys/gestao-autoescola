import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

// Componentes visuais básicos reaproveitados em todas as telas.
// Tamanhos generosos (texto 16px+, botões altos) para facilitar o uso.

const campoBase =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${campoBase} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${campoBase} ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea rows={3} {...props} className={`${campoBase} ${props.className ?? ""}`} />;
}

export function Campo({
  label,
  ajuda,
  children,
  className = "",
}: {
  label: string;
  ajuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-base font-medium text-slate-800">{label}</span>
      {children}
      {ajuda && <span className="mt-1 block text-sm text-slate-500">{ajuda}</span>}
    </label>
  );
}

const variantes = {
  primario: "bg-blue-600 text-white hover:bg-blue-700",
  sucesso: "bg-green-600 text-white hover:bg-green-700",
  secundario: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  perigo: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
};

type Variante = keyof typeof variantes;

const tamanhos = {
  normal: "gap-2 px-5 py-2.5 text-base shadow-sm",
  pequeno: "gap-1.5 px-3 py-1.5 text-sm",
};

type Tamanho = keyof typeof tamanhos;

const botaoBase =
  "inline-flex items-center justify-center rounded-lg font-medium transition disabled:opacity-50 whitespace-nowrap";

type ExtrasBotao = { variante?: Variante; tamanho?: Tamanho; icone?: LucideIcon };

function conteudoBotao(Icone: LucideIcon | undefined, tamanho: Tamanho, children: ReactNode) {
  return (
    <>
      {Icone && <Icone className={tamanho === "pequeno" ? "size-4" : "size-5"} aria-hidden />}
      {children}
    </>
  );
}

export function Botao({
  variante = "primario",
  tamanho = "normal",
  icone,
  children,
  ...props
}: ComponentProps<"button"> & ExtrasBotao) {
  return (
    <button {...props} className={`${botaoBase} ${tamanhos[tamanho]} ${variantes[variante]} ${props.className ?? ""}`}>
      {conteudoBotao(icone, tamanho, children)}
    </button>
  );
}

export function BotaoLink({
  variante = "primario",
  tamanho = "normal",
  icone,
  children,
  ...props
}: ComponentProps<typeof Link> & ExtrasBotao) {
  return (
    <Link {...props} className={`${botaoBase} ${tamanhos[tamanho]} ${variantes[variante]} ${props.className ?? ""}`}>
      {conteudoBotao(icone, tamanho, children)}
    </Link>
  );
}

// Link para baixar um arquivo (contrato, modelo...): <a> comum, com cara de botão.
export function BotaoDownload({
  variante = "secundario",
  tamanho = "normal",
  icone,
  children,
  ...props
}: ComponentProps<"a"> & ExtrasBotao) {
  return (
    <a {...props} className={`${botaoBase} ${tamanhos[tamanho]} ${variantes[variante]} ${props.className ?? ""}`}>
      {conteudoBotao(icone, tamanho, children)}
    </a>
  );
}

export function Cartao({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>{children}</div>
  );
}

const coresIcone = {
  azul: "bg-blue-100 text-blue-700",
  verde: "bg-green-100 text-green-700",
  vermelho: "bg-red-100 text-red-700",
  amarelo: "bg-amber-100 text-amber-700",
  roxo: "bg-violet-100 text-violet-700",
  cinza: "bg-slate-100 text-slate-600",
};

export type CorIcone = keyof typeof coresIcone;

// Ícone dentro de um círculo colorido, usado como ilustração.
export function IconeRedondo({
  icone: Icone,
  cor = "azul",
  tamanho = "normal",
}: {
  icone: LucideIcon;
  cor?: CorIcone;
  tamanho?: "pequeno" | "normal" | "grande";
}) {
  const t = { pequeno: "size-9 [&>svg]:size-5", normal: "size-12 [&>svg]:size-6", grande: "size-20 [&>svg]:size-10" };
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full ${coresIcone[cor]} ${t[tamanho]}`}>
      <Icone aria-hidden />
    </span>
  );
}

export function Cabecalho({
  titulo,
  descricao,
  icone,
  cor = "azul",
  acoes,
}: {
  titulo: string;
  descricao?: string;
  icone?: LucideIcon;
  cor?: CorIcone;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {icone && <IconeRedondo icone={icone} cor={cor} />}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{titulo}</h1>
          {descricao && <p className="mt-0.5 text-base text-slate-600">{descricao}</p>}
        </div>
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

export function Secao({ titulo, icone: Icone, acoes }: { titulo: string; icone?: LucideIcon; acoes?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
        {Icone && <Icone className="size-6 text-slate-500" aria-hidden />}
        {titulo}
      </h2>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

export function Tabela({ cabecalhos, children }: { cabecalhos: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-base [&_td]:whitespace-nowrap">
        <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-600">
          <tr>
            {cabecalhos.map((c, i) => (
              <th key={`${c}-${i}`} className="px-4 py-3 font-semibold uppercase tracking-wide">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function LinhaVazia({ colunas, texto }: { colunas: number; texto: string }) {
  return (
    <tr>
      <td colSpan={colunas} className="px-4 py-10 text-center text-slate-500">
        {texto}
      </td>
    </tr>
  );
}

// Tela vazia ilustrada, com uma ação sugerida.
export function Vazio({
  icone,
  titulo,
  texto,
  acao,
}: {
  icone: LucideIcon;
  titulo: string;
  texto?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <IconeRedondo icone={icone} cor="cinza" tamanho="grande" />
      <p className="mt-4 text-lg font-semibold text-slate-800">{titulo}</p>
      {texto && <p className="mt-1 max-w-md text-base text-slate-600">{texto}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

const cores: Record<string, string> = {
  verde: "bg-green-100 text-green-800",
  cinza: "bg-slate-100 text-slate-700",
  vermelho: "bg-red-100 text-red-800",
  azul: "bg-blue-100 text-blue-800",
  amarelo: "bg-amber-100 text-amber-800",
};

export function Etiqueta({ cor = "cinza", children }: { cor?: keyof typeof cores; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold ${cores[cor]}`}>{children}</span>
  );
}

const coresAviso = {
  sucesso: "border-green-200 bg-green-50 text-green-900",
  erro: "border-red-200 bg-red-50 text-red-800",
  alerta: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

export function Aviso({
  tipo = "info",
  icone: Icone,
  children,
}: {
  tipo?: keyof typeof coresAviso;
  icone?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className={`mb-5 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-base ${coresAviso[tipo]}`}>
      {Icone && <Icone className="size-6 shrink-0" aria-hidden />}
      <div className="flex flex-1 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function MensagemErro({ erro }: { erro?: string }) {
  if (!erro) return null;
  return <p className="rounded-lg bg-red-50 px-4 py-3 text-base font-medium text-red-700">{erro}</p>;
}
