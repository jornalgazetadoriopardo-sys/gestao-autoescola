import { exigirSessao } from "@/lib/auth";
import { obterConfig } from "@/lib/config";
import { BarraImpressao } from "./barra-impressao";
import "./impressao.css";

// Páginas para impressão: sem menu, fundo cinza na tela e papel branco A4.
// A largura e a posição dos cupons da térmica vêm de Configurações > Impressora.
export default async function ImprimirLayout({ children }: { children: React.ReactNode }) {
  await exigirSessao();
  const config = await obterConfig();
  const largura = Math.min(Math.max(config.larguraTermica, 44), 80);
  return (
    <div
      className={`impressao sem-tema min-h-screen bg-slate-200 print:bg-white ${
        config.alinhamentoTermica === "centro" ? "" : "termica-esquerda"
      }`}
      style={{ "--largura-termica": `${largura}mm` } as React.CSSProperties}
    >
      <BarraImpressao />
      <div className="py-6 print:p-0">{children}</div>
    </div>
  );
}
