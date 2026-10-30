import type { Metadata } from "next";
import { dbGlobal } from "@/lib/db";
import { PALETA_PADRAO, paletaValida } from "@/lib/paletas";
import { sessaoDoCookie } from "@/lib/sessao-atual";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão Autoescola",
  description: "Controle de alunos, aulas e pagamentos",
};

// Aplica o tema salvo (claro, escuro ou automático) antes de a página aparecer,
// para não piscar branco. Ver src/components/seletor-tema.tsx.
const scriptTema = `(function(){try{var t=localStorage.getItem("tema")||"claro";var m=window.matchMedia("(prefers-color-scheme: dark)");var a=function(){var x=localStorage.getItem("tema")||"claro";document.documentElement.classList.toggle("dark",x==="escuro"||(x==="auto"&&m.matches));};a();m.addEventListener("change",a);}catch(e){}})();`;

// Cor principal da autoescola de quem está logado (ver src/lib/paletas.ts).
// Sem login (tela de entrada), fica a padrão.
async function paletaDaSessao() {
  try {
    const sessao = await sessaoDoCookie();
    if (!sessao) return PALETA_PADRAO;
    const c = await dbGlobal.configuracao.findUnique({ where: { id: sessao.autoescolaId }, select: { paleta: true } });
    return paletaValida(c?.paleta);
  } catch {
    return PALETA_PADRAO;
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-paleta={await paletaDaSessao()} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
