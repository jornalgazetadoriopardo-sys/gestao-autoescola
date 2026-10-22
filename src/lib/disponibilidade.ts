// Horários disponíveis para marcar aula. Usado nos formulários (para
// desabilitar horários ocupados) com os dados de `buscarOcupados`.
// A validação final continua no servidor (validar-aula.ts).

export type Ocupado = {
  id: number;
  inicio: number; // ms
  fim: number; // ms
  instrutorId: number | null;
  veiculoId: number | null;
  alunoId: number;
  tipo: string;
  descricao: string; // "Maria da Silva com João (ABC1D23)"
};

export type Expediente = { horaInicio: string; horaFim: string; intervaloMin: number };

export type Pedido = {
  data: string; // AAAA-MM-DD
  duracaoMin: number;
  tipo: string;
  instrutorId: number | null;
  veiculoId: number | null;
  alunoId: number | null;
  // Na edição de uma aula antiga, horários passados continuam valendo.
  permitirPassado?: boolean;
};

function minutos(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function hhmm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

// Horário de Brasília (UTC−3) → instante.
export function instante(data: string, hora: string) {
  return Date.parse(`${data}T${hora}:00-03:00`);
}

// Horários de início dentro do expediente em que a aula inteira cabe.
export function horariosDoExpediente(exp: Expediente, duracaoMin: number) {
  const inicio = minutos(exp.horaInicio);
  const fim = minutos(exp.horaFim);
  const passo = Math.max(exp.intervaloMin, 10);
  const lista: string[] = [];
  for (let t = inicio; t + duracaoMin <= fim; t += passo) lista.push(hhmm(t));
  return lista;
}

// Motivo de o horário não estar disponível, ou null se estiver livre.
// Mesmas regras do servidor: aluno, veículo e instrutor não podem estar em duas
// aulas ao mesmo tempo; aulas teóricas do mesmo instrutor formam turma.
export function motivoOcupado(p: Pedido, hora: string, ocupados: Ocupado[], agora = Date.now()) {
  const ini = instante(p.data, hora);
  const fim = ini + p.duracaoMin * 60_000;
  if (!p.permitirPassado && ini < agora) return "horário já passou";
  for (const o of ocupados) {
    if (o.inicio >= fim || o.fim <= ini) continue;
    if (p.alunoId && o.alunoId === p.alunoId) return `o aluno já tem aula (${o.descricao})`;
    if (p.veiculoId && o.veiculoId === p.veiculoId) return `veículo em uso (${o.descricao})`;
    if (p.instrutorId && o.instrutorId === p.instrutorId && !(p.tipo === "teorica" && o.tipo === "teorica")) {
      return `instrutor ocupado (${o.descricao})`;
    }
  }
  return null;
}

// Lista de horários do dia com o motivo de cada um estar ocupado.
// O horário atual (`atual`) entra na lista mesmo fora do expediente.
export function opcoesDeHorario(p: Pedido, ocupados: Ocupado[], exp: Expediente, atual?: string) {
  const horas = horariosDoExpediente(exp, p.duracaoMin);
  if (atual && /^\d{2}:\d{2}$/.test(atual) && !horas.includes(atual)) horas.push(atual);
  horas.sort();
  return horas.map((hora) => ({ hora, motivo: motivoOcupado(p, hora, ocupados) }));
}
