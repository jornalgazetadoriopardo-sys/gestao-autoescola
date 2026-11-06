// Fontes que podem ser usadas nos posts. Os arquivos vêm dos pacotes
// @fontsource (hospedados junto com o sistema): ver src/app/(app)/posts/fontes-posts.ts.

const SISTEMA = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

export const FONTES: Record<
  string,
  { nome: string; estilo: string; familia: string; pesoMax: number; soTitulo?: boolean }
> = {
  sistema: { nome: "Padrão", estilo: "Simples e legível", familia: SISTEMA, pesoMax: 800 },
  montserrat: { nome: "Montserrat", estilo: "Moderna e forte", familia: `"Montserrat", ${SISTEMA}`, pesoMax: 800 },
  poppins: { nome: "Poppins", estilo: "Redonda e jovem", familia: `"Poppins", ${SISTEMA}`, pesoMax: 800 },
  nunito: { nome: "Nunito", estilo: "Amigável", familia: `"Nunito", ${SISTEMA}`, pesoMax: 800 },
  oswald: { nome: "Oswald", estilo: "Condensada, impacto", familia: `"Oswald", ${SISTEMA}`, pesoMax: 700 },
  bebas: {
    nome: "Bebas Neue",
    estilo: "Títulos em caixa alta",
    familia: `"Bebas Neue", ${SISTEMA}`,
    pesoMax: 400,
    soTitulo: true,
  },
  playfair: {
    nome: "Playfair Display",
    estilo: "Elegante, com serifa",
    familia: `"Playfair Display", Georgia, serif`,
    pesoMax: 800,
  },
  robotoslab: {
    nome: "Roboto Slab",
    estilo: "Sólida, com serifa",
    familia: `"Roboto Slab", Georgia, serif`,
    pesoMax: 800,
  },
};

export const fonteValida = (id: unknown, titulo = true): id is string =>
  typeof id === "string" && id in FONTES && (titulo || !FONTES[id].soTitulo);
