import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão Autoescola",
  description: "Controle de alunos, aulas e pagamentos",
};

// Aplica o tema salvo (claro, escuro ou automático) antes de a página aparecer,
// para não piscar branco. Ver src/components/seletor-tema.tsx.
const scriptTema = `(function(){try{var t=localStorage.getItem("tema")||"claro";var m=window.matchMedia("(prefers-color-scheme: dark)");var a=function(){var x=localStorage.getItem("tema")||"claro";document.documentElement.classList.toggle("dark",x==="escuro"||(x==="auto"&&m.matches));};a();m.addEventListener("change",a);}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
