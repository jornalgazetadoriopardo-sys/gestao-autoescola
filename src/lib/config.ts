import "server-only";
import type { Configuracao } from "@prisma/client";
import { db } from "./db";

// Dados da autoescola. Enquanto nada foi salvo, devolve valores padrão.
export async function obterConfig(): Promise<Configuracao> {
  const config = await db.configuracao.findUnique({ where: { id: 1 } });
  return (
    config ?? {
      id: 1,
      nome: "Minha Autoescola",
      razaoSocial: null,
      cnpj: null,
      endereco: null,
      bairro: null,
      cidade: null,
      uf: null,
      cep: null,
      telefone: null,
      whatsapp: null,
      email: null,
      chavePix: null,
      avisoCarne: null,
      orientacoesAluno: null,
      horaInicio: "07:00",
      horaFim: "20:00",
      intervaloMin: 60,
      logo: null,
    }
  );
}

// Horários de aula oferecidos nos formulários de agendamento.
export function expedienteDe(c: Configuracao) {
  return { horaInicio: c.horaInicio, horaFim: c.horaFim, intervaloMin: c.intervaloMin };
}

// "Rua X, 100 - Centro - Cidade/UF - CEP 00000-000"
export function enderecoCompleto(c: Configuracao) {
  const cidade = [c.cidade, c.uf].filter(Boolean).join("/");
  return [c.endereco, c.bairro, cidade, c.cep && `CEP ${c.cep}`].filter(Boolean).join(" - ");
}
