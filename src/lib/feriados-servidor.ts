import "server-only";
import { db } from "./db";
import { feriadosDoPeriodo, lerIgnorados } from "./feriados";
import { funcionamentoDoDia, lerHorarios, type DiaEspecialInfo } from "./horarios";

// Feriados da autoescola de quem está logado entre duas datas (AAAA-MM-DD → nome).
export async function carregarFeriados(inicio: string, fim: string) {
  const [config, manuais] = await Promise.all([
    db.configuracao.findFirst({ select: { uf: true, feriadosIgnorados: true } }),
    db.feriado.findMany(),
  ]);
  return feriadosDoPeriodo(inicio, fim, config?.uf ?? null, lerIgnorados(config?.feriadosIgnorados), manuais);
}

// Horário de funcionamento, dias especiais e feriados entre duas datas.
// Devolve uma função que diz, para cada dia, a janela aberta ou o motivo de estar fechado.
export async function carregarFuncionamento(inicio: string, fim: string) {
  const [config, feriados, especiais] = await Promise.all([
    db.configuracao.findFirst({ select: { horarios: true, horaInicio: true, horaFim: true } }),
    carregarFeriados(inicio, fim),
    db.diaEspecial.findMany({
      where: { data: { gte: new Date(`${inicio}T00:00:00Z`), lte: new Date(`${fim}T00:00:00Z`) } },
    }),
  ]);
  const h = lerHorarios(config?.horarios, config?.horaInicio ?? "07:00", config?.horaFim ?? "20:00");
  const porDia = new Map<string, DiaEspecialInfo>(
    especiais.map((e) => {
      const data = e.data.toISOString().slice(0, 10);
      return [data, { data, inicio: e.inicio, fim: e.fim, motivo: e.motivo }];
    }),
  );
  return (dia: string) => funcionamentoDoDia(h, dia, porDia.get(dia), feriados.get(dia));
}

// Dias fechados (feriado ou dia da semana sem expediente) entre duas datas: AAAA-MM-DD → motivo.
export async function carregarDiasFechados(inicio: string, fim: string) {
  const funcionamento = await carregarFuncionamento(inicio, fim);
  const mapa: Record<string, string> = {};
  for (let d = inicio; d <= fim; d = proximo(d)) {
    const f = funcionamento(d);
    if (!f.aberto) mapa[d] = f.motivo;
  }
  return mapa;
}

function proximo(dia: string) {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
