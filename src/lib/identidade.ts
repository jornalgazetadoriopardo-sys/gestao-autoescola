import { COMBINACOES, coresDaPaleta, corValida, type CoresPost } from "./cores";
import { fonteValida } from "./fontes";

// Identidade visual dos posts de cada autoescola (Configurações > Aparência).
// Fica em Configuracao.identidadeVisual (JSON). Cada post pode mudar estes
// valores só para ele, no painel "Personalizar este post".

export type Identidade = {
  // "paleta": segue a cor do sistema; ou o id de uma combinação pronta; ou "personalizada".
  combinacao: string;
  cores: CoresPost;
  fonteTitulo: string;
  fonteTexto: string;
  mostrarLogo: boolean;
  instagram: string | null;
  textoLegal: string | null;
};

export function identidadePadrao(paleta: string): Identidade {
  return {
    combinacao: "paleta",
    cores: coresDaPaleta(paleta),
    fonteTitulo: "montserrat",
    fonteTexto: "sistema",
    mostrarLogo: true,
    instagram: null,
    textoLegal: null,
  };
}

// Lê o JSON salvo, completando o que faltar com o padrão (e as cores da paleta).
export function lerIdentidade(json: unknown, paleta: string): Identidade {
  const padrao = identidadePadrao(paleta);
  if (!json || typeof json !== "object") return padrao;
  const j = json as Record<string, unknown>;
  const combinacao =
    j.combinacao === "personalizada" || COMBINACOES.some((c) => c.id === j.combinacao)
      ? String(j.combinacao)
      : "paleta";
  let cores = padrao.cores;
  if (combinacao === "personalizada" && j.cores && typeof j.cores === "object") {
    const c = j.cores as Record<string, unknown>;
    cores = {
      principal: corValida(c.principal) ? c.principal : padrao.cores.principal,
      destaque: corValida(c.destaque) ? c.destaque : padrao.cores.destaque,
      escuro: corValida(c.escuro) ? c.escuro : padrao.cores.escuro,
      claro: corValida(c.claro) ? c.claro : padrao.cores.claro,
    };
  } else if (combinacao !== "paleta") {
    cores = COMBINACOES.find((c) => c.id === combinacao)!.cores;
  }
  const texto = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const instagram = texto(j.instagram, 40)?.replace(/^@?/, "@") ?? null;
  return {
    combinacao,
    cores,
    fonteTitulo: fonteValida(j.fonteTitulo) ? j.fonteTitulo : padrao.fonteTitulo,
    fonteTexto: fonteValida(j.fonteTexto, false) ? j.fonteTexto : padrao.fonteTexto,
    mostrarLogo: j.mostrarLogo !== false,
    instagram: instagram && /^@[\w.]{1,30}$/.test(instagram) ? instagram : null,
    textoLegal: texto(j.textoLegal, 240),
  };
}
