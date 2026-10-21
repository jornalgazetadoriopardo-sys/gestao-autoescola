import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Componentes visuais básicos reaproveitados em todas as telas.

const campoBase =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

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
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const variantes = {
  primario: "bg-blue-600 text-white hover:bg-blue-700",
  secundario: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  perigo: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
};

type Variante = keyof typeof variantes;

const tamanhos = {
  normal: "px-4 py-2 text-sm shadow-sm",
  pequeno: "px-2.5 py-1 text-xs",
};

type Tamanho = keyof typeof tamanhos;

const botaoBase =
  "inline-flex items-center justify-center rounded-md font-medium transition disabled:opacity-50";

export function Botao({
  variante = "primario",
  tamanho = "normal",
  ...props
}: ComponentProps<"button"> & { variante?: Variante; tamanho?: Tamanho }) {
  return (
    <button
      {...props}
      className={`${botaoBase} ${tamanhos[tamanho]} ${variantes[variante]} ${props.className ?? ""}`}
    />
  );
}

export function BotaoLink({
  variante = "primario",
  tamanho = "normal",
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante; tamanho?: Tamanho }) {
  return (
    <Link
      {...props}
      className={`${botaoBase} ${tamanhos[tamanho]} ${variantes[variante]} ${props.className ?? ""}`}
    />
  );
}

export function Cartao({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>
  );
}

export function Cabecalho({ titulo, acoes }: { titulo: string; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      {acoes && <div className="flex gap-2">{acoes}</div>}
    </div>
  );
}

export function Tabela({ cabecalhos, children }: { cabecalhos: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm [&_td]:whitespace-nowrap">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            {cabecalhos.map((c) => (
              <th key={c} className="px-4 py-3 font-medium">
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
      <td colSpan={colunas} className="px-4 py-8 text-center text-slate-500">
        {texto}
      </td>
    </tr>
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
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cores[cor]}`}>{children}</span>;
}

export function MensagemErro({ erro }: { erro?: string }) {
  if (!erro) return null;
  return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>;
}
