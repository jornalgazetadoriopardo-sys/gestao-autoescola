import { exigirSessao } from "@/lib/auth";
import { BarraImpressao } from "./barra-impressao";
import "./impressao.css";

// Páginas para impressão: sem menu, fundo cinza na tela e papel branco A4.
export default async function ImprimirLayout({ children }: { children: React.ReactNode }) {
  await exigirSessao();
  return (
    <div className="impressao sem-tema min-h-screen bg-slate-200 print:bg-white">
      <BarraImpressao />
      <div className="py-6 print:p-0">{children}</div>
    </div>
  );
}
