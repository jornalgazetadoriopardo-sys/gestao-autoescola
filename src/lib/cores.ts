import { PALETAS, paletaValida } from "./paletas";

// Cores das imagens dos posts (e de outras peças desenhadas no navegador).
// Trabalha em OKLCH para que as variações (mais clara, mais escura) fiquem
// harmoniosas a partir de uma única cor escolhida.

export type CoresPost = {
  principal: string; // botões, faixas, selos
  destaque: string; // preço, número, palavras em destaque
  escuro: string; // fundo escuro e texto sobre fundo claro
  claro: string; // fundo claro
};

const HEX = /^#[0-9a-f]{6}$/i;
export const corValida = (c: unknown): c is string => typeof c === "string" && HEX.test(c);

// OKLCH (l 0–1, c, h em graus) → #rrggbb.
export function oklchParaHex(l: number, c: number, h: number) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return (
    "#" +
    lin
      .map((x) => {
        const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
        return Math.round(Math.min(Math.max(v, 0), 1) * 255)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

// #rrggbb → OKLCH.
export function hexParaOklch(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2]);
  const m = Math.cbrt(0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2]);
  const s = Math.cbrt(0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2]);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

// A partir da cor principal, sugere o destaque, o fundo escuro e o fundo claro.
export function derivarCores(principal: string): CoresPost {
  const { c, h } = hexParaOklch(principal);
  const croma = Math.min(c, 0.25);
  return {
    principal,
    destaque: oklchParaHex(0.86, Math.min(croma * 0.55, 0.13), h),
    escuro: oklchParaHex(0.2, Math.min(croma * 0.22, 0.06), h),
    claro: oklchParaHex(0.97, Math.min(croma * 0.08, 0.02), h),
  };
}

// Cores dos posts a partir da paleta do sistema (Configurações > Aparência).
export function coresDaPaleta(paleta: string): CoresPost {
  const p = PALETAS[paletaValida(paleta)];
  return derivarCores(oklchParaHex(0.56, 0.22 * p.croma, p.matiz));
}

// Combinações prontas para os posts, para quem não quer escolher cor por cor.
export const COMBINACOES: { id: string; nome: string; cores: CoresPost }[] = [
  {
    id: "azul",
    nome: "Azul confiança",
    cores: { principal: "#2563eb", destaque: "#93c5fd", escuro: "#0b1730", claro: "#f1f5ff" },
  },
  {
    id: "cnh",
    nome: "Amarelo CNH",
    cores: { principal: "#f5b301", destaque: "#ffe08a", escuro: "#111111", claro: "#fffbea" },
  },
  {
    id: "verde",
    nome: "Verde aprovação",
    cores: { principal: "#16a34a", destaque: "#bbf7d0", escuro: "#0b2416", claro: "#f0fdf4" },
  },
  {
    id: "brasil",
    nome: "Verde e amarelo",
    cores: { principal: "#009c3b", destaque: "#ffdf00", escuro: "#002776", claro: "#f4fbf6" },
  },
  {
    id: "vermelho",
    nome: "Vermelho energia",
    cores: { principal: "#dc2626", destaque: "#fecaca", escuro: "#1f0a0a", claro: "#fff5f5" },
  },
  {
    id: "laranja",
    nome: "Laranja e marinho",
    cores: { principal: "#f97316", destaque: "#fed7aa", escuro: "#0f1e3d", claro: "#fff7ed" },
  },
  {
    id: "roxo",
    nome: "Roxo moderno",
    cores: { principal: "#7c3aed", destaque: "#ddd6fe", escuro: "#160b2e", claro: "#f7f3ff" },
  },
  {
    id: "petroleo",
    nome: "Azul-petróleo",
    cores: { principal: "#0e7490", destaque: "#a5f3fc", escuro: "#06222b", claro: "#effcfd" },
  },
  {
    id: "rosa",
    nome: "Rosa acolhedor",
    cores: { principal: "#db2777", destaque: "#fbcfe8", escuro: "#2a0a1b", claro: "#fff1f7" },
  },
  {
    id: "grafite",
    nome: "Preto e branco",
    cores: { principal: "#334155", destaque: "#e2e8f0", escuro: "#0b0f17", claro: "#f8fafc" },
  },
];

export function transparente(hex: string, alfa: number) {
  return `${hex}${Math.round(Math.min(Math.max(alfa, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

// Texto branco ou escuro sobre uma cor (contraste).
export function textoSobre(hex: string) {
  return hexParaOklch(hex).l > 0.7 ? "#0b0f17" : "#ffffff";
}
