// Cor principal do sistema, escolhida por cada autoescola em Configurações >
// Aparência. Cada paleta é uma matiz (hue) em OKLCH; os tons claros e escuros
// são calculados no CSS (src/app/globals.css) a partir dela, então botões,
// abas, links e o menu lateral mudam juntos.

export const PALETAS: Record<string, { nome: string; descricao: string; matiz: number; croma: number }> = {
  azul: { nome: "Azul", descricao: "Padrão do sistema", matiz: 262, croma: 1 },
  petroleo: { nome: "Azul-petróleo", descricao: "Sóbrio e moderno", matiz: 200, croma: 0.75 },
  verde: { nome: "Verde", descricao: "Natureza e aprovação", matiz: 155, croma: 0.8 },
  roxo: { nome: "Roxo", descricao: "Criativo", matiz: 300, croma: 0.95 },
  vinho: { nome: "Vinho", descricao: "Clássico", matiz: 10, croma: 0.85 },
  laranja: { nome: "Laranja", descricao: "Energia", matiz: 45, croma: 0.85 },
  rosa: { nome: "Rosa", descricao: "Acolhedor", matiz: 345, croma: 0.85 },
  grafite: { nome: "Grafite", descricao: "Neutro, quase sem cor", matiz: 260, croma: 0.15 },
};

export const PALETA_PADRAO = "azul";

export function paletaValida(p: string | null | undefined) {
  return p && p in PALETAS ? p : PALETA_PADRAO;
}
