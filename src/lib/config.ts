import "server-only";
import type { Configuracao } from "@prisma/client";
import { cache } from "react";
import { db, dbGlobal, situacaoDaSessao } from "./db";

// Dados da autoescola de quem está logado, sem a imagem do logotipo: em
// `logo` vem o endereço /logo, que o navegador baixa uma vez e guarda.
// Assim a imagem não vai dentro de cada página (no carnê ela se repete).
export const obterConfig = cache(async (): Promise<Configuracao> => {
  const { sessao } = await situacaoDaSessao();
  const [config, versao] = await Promise.all([
    db.configuracao.findFirst({ omit: { logo: true } }),
    // Só a "impressão digital" da imagem: muda quando o logotipo é trocado.
    sessao
      ? dbGlobal.$queryRaw<{ v: string | null }[]>`SELECT md5(logo) AS v FROM "Configuracao" WHERE id = ${sessao.autoescolaId}`
      : [],
  ]);
  const v = versao[0]?.v;
  if (config) return { ...config, logo: v ? `/logo?v=${v.slice(0, 12)}` : null };
  return configPadrao();
});

// Com a imagem do logotipo, para a tela de configurações.
export async function obterConfigCompleta(): Promise<Configuracao> {
  return (await db.configuracao.findFirst()) ?? configPadrao();
}

async function configPadrao(): Promise<Configuracao> {
  const autoescola = await db.autoescola.findFirstOrThrow();
  return (
    {
      id: autoescola.id,
      nome: autoescola.nome,
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
      impressoraRecibo: "a4",
      contratoArquivo: null,
      contratoNome: null,
      contratoEm: null,
      taxasPadrao: null,
      calendarioLicenciamento: null,
      feriadosIgnorados: null,
      paleta: "azul",
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
