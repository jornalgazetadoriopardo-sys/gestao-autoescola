import "server-only";
import { db } from "./db";
import { feriadosDoPeriodo, lerIgnorados } from "./feriados";

// Feriados da autoescola de quem está logado entre duas datas (AAAA-MM-DD → nome).
export async function carregarFeriados(inicio: string, fim: string) {
  const [config, manuais] = await Promise.all([
    db.configuracao.findFirst({ select: { uf: true, feriadosIgnorados: true } }),
    db.feriado.findMany(),
  ]);
  return feriadosDoPeriodo(inicio, fim, config?.uf ?? null, lerIgnorados(config?.feriadosIgnorados), manuais);
}
