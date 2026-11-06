// Arquivos das fontes dos posts (só o alfabeto latino, que já tem os acentos).
// Importado pelas telas que desenham posts; o navegador baixa cada fonte só
// quando ela é usada.
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/latin-600.css";
import "@fontsource/montserrat/latin-800.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-800.css";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/oswald/latin-400.css";
import "@fontsource/oswald/latin-600.css";
import "@fontsource/oswald/latin-700.css";
import "@fontsource/bebas-neue/latin-400.css";
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/playfair-display/latin-800.css";
import "@fontsource/roboto-slab/latin-400.css";
import "@fontsource/roboto-slab/latin-600.css";
import "@fontsource/roboto-slab/latin-800.css";
import { FONTES } from "@/lib/fontes";

// Espera os arquivos das fontes escolhidas antes de desenhar (o canvas não
// redesenha sozinho quando a fonte chega).
export async function carregarFontes(ids: string[]) {
  if (typeof document === "undefined" || !document.fonts) return;
  const pedidos = ids.flatMap((id) => {
    const f = FONTES[id];
    if (!f || id === "sistema") return [];
    const familia = f.familia.split(",")[0];
    return [400, 600, f.pesoMax].map((p) => document.fonts.load(`${Math.min(p, f.pesoMax)} 40px ${familia}`, "ÁáçÃõ"));
  });
  await Promise.allSettled(pedidos);
}
