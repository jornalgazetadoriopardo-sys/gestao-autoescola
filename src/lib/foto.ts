// Endereço da foto do aluno, com a versão para o navegador guardar em cache.
export function urlFoto(aluno: { id: number; fotoEm: Date | null }) {
  return aluno.fotoEm ? `/foto/aluno/${aluno.id}?v=${aluno.fotoEm.getTime()}` : null;
}

// Tamanho máximo aceito (a foto já chega reduzida para 360x480 em JPEG).
export const FOTO_MAX = 300_000;
