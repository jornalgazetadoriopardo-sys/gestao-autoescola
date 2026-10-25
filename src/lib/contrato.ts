import "server-only";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { Aluno, Configuracao, Matricula, Parcela } from "@prisma/client";
import { enderecoCompleto } from "./config";
import {
  formatarCpf,
  formatarData,
  formatarDataLocal,
  formatarMoeda,
  formatarPercentual,
  formatarTelefone,
} from "./format";
import { FORMAS_MATRICULA, valorPorExtenso } from "./pagamentos";

// Contrato da autoescola: um arquivo do Word (.docx) com marcações entre chaves
// duplas, ex.: {{aluno_nome}}. Na hora de gerar, cada marcação é trocada pelo
// dado do aluno e da matrícula, mantendo a formatação do arquivo.

export const CONTRATO_MAX = 3 * 1024 * 1024;
const VAZIO = "____________________";

// Marcações disponíveis, na ordem em que aparecem na tela de configurações.
export const CAMPOS_CONTRATO: { grupo: string; campos: [chave: string, descricao: string][] }[] = [
  {
    grupo: "Aluno",
    campos: [
      ["aluno_nome", "Nome completo"],
      ["aluno_cpf", "CPF"],
      ["aluno_nascimento", "Data de nascimento"],
      ["aluno_telefone", "Telefone"],
      ["aluno_email", "E-mail"],
      ["aluno_endereco", "Endereço"],
    ],
  },
  {
    grupo: "Matrícula",
    campos: [
      ["categoria", "Categoria (A, B, AB...)"],
      ["aulas_praticas", "Quantidade de aulas práticas"],
      ["aulas_teoricas", "Quantidade de aulas teóricas"],
      ["valor_total", "Valor contratado (R$ 1.500,00)"],
      ["valor_total_extenso", "Valor por extenso"],
      ["forma_pagamento", "Forma de pagamento"],
      ["quantidade_parcelas", "Número de parcelas"],
      ["valor_parcela", "Valor da parcela"],
      ["primeiro_vencimento", "Vencimento da 1ª parcela"],
      ["juros_mes", "Juros ao mês (ex.: 1,99% ao mês)"],
      ["data_matricula", "Data da matrícula"],
    ],
  },
  {
    grupo: "Autoescola",
    campos: [
      ["autoescola_nome", "Nome"],
      ["autoescola_razao_social", "Razão social"],
      ["autoescola_cnpj", "CNPJ"],
      ["autoescola_endereco", "Endereço completo"],
      ["autoescola_cidade", "Cidade"],
      ["autoescola_uf", "Estado (UF)"],
      ["autoescola_telefone", "Telefone"],
      ["autoescola_email", "E-mail"],
    ],
  },
  {
    grupo: "Data",
    campos: [
      ["data_hoje", "Data de hoje por extenso (25 de outubro de 2026)"],
      ["cidade_data", "Cidade e data (Rio Pardo, 25 de outubro de 2026)"],
    ],
  },
];

// Lista de parcelas: repete o trecho entre {{#parcelas}} e {{/parcelas}}.
export const CAMPOS_PARCELA: [string, string][] = [
  ["numero", "Número da parcela"],
  ["vencimento", "Vencimento"],
  ["valor", "Valor"],
];

const CHAVES = new Set([...CAMPOS_CONTRATO.flatMap((g) => g.campos.map(([c]) => c)), "parcelas"]);

function dataPorExtenso(data = new Date()) {
  return data.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

type MatriculaCompleta = Matricula & { aluno: Aluno; parcelas: Parcela[] };

export function dadosDoContrato(m: MatriculaCompleta, c: Configuracao) {
  const ou = (v: string | null | undefined) => (v && v.trim() ? v : VAZIO);
  const primeira = m.parcelas[0];
  const hoje = dataPorExtenso();
  return {
    aluno_nome: m.aluno.nome,
    aluno_cpf: formatarCpf(m.aluno.cpf),
    aluno_nascimento: ou(formatarData(m.aluno.nascimento)),
    aluno_telefone: ou(formatarTelefone(m.aluno.telefone)),
    aluno_email: ou(m.aluno.email),
    aluno_endereco: ou(m.aluno.endereco),
    categoria: m.categoria,
    aulas_praticas: String(m.qtdPraticas),
    aulas_teoricas: String(m.qtdTeoricas),
    valor_total: formatarMoeda(m.valorTotalCentavos),
    valor_total_extenso: valorPorExtenso(m.valorTotalCentavos),
    forma_pagamento: FORMAS_MATRICULA[m.formaPagamento]?.titulo ?? m.formaPagamento,
    quantidade_parcelas: String(m.parcelas.length),
    valor_parcela: primeira ? formatarMoeda(primeira.valorCentavos) : VAZIO,
    primeiro_vencimento: primeira ? formatarData(primeira.vencimento) : VAZIO,
    juros_mes: `${formatarPercentual(m.jurosMesBp)} ao mês`,
    data_matricula: formatarDataLocal(m.data),
    autoescola_nome: c.nome,
    autoescola_razao_social: ou(c.razaoSocial ?? c.nome),
    autoescola_cnpj: ou(c.cnpj),
    autoescola_endereco: ou(enderecoCompleto(c)),
    autoescola_cidade: ou(c.cidade),
    autoescola_uf: ou(c.uf),
    autoescola_telefone: ou(c.telefone ?? c.whatsapp),
    autoescola_email: ou(c.email),
    data_hoje: hoje,
    cidade_data: c.cidade ? `${c.cidade}, ${hoje}` : hoje,
    parcelas: m.parcelas.map((p) => ({
      numero: `${p.numero}/${m.parcelas.length}`,
      vencimento: formatarData(p.vencimento),
      valor: formatarMoeda(p.valorCentavos),
    })),
  };
}

function abrir(arquivo: Uint8Array) {
  return new Docxtemplater(new PizZip(arquivo), {
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: true,
    linebreaks: true,
    // Marcação sem valor vira linha em branco para preencher à mão.
    nullGetter: () => VAZIO,
  });
}

// Confere o arquivo enviado: precisa ser um .docx válido e com as marcações
// bem escritas. Devolve o erro ou as marcações que o sistema não conhece.
export function conferirModelo(arquivo: Uint8Array): { erro: string } | { desconhecidas: string[] } {
  try {
    // Abrir já confere se as marcações estão bem escritas.
    const texto = abrir(arquivo).getFullText();
    const encontradas = [...texto.matchAll(/\{\{\s*[#/^]?\s*([^}]+?)\s*\}\}/g)].map((m) => m[1]);
    const conhecidas = new Set([...CHAVES, ...CAMPOS_PARCELA.map(([c]) => c)]);
    const desconhecidas = [...new Set(encontradas.filter((t) => !conhecidas.has(t)))];
    return { desconhecidas };
  } catch (e) {
    type Problema = { properties?: { id?: string; context?: string; xtag?: string } };
    const erros = (e as { properties?: { errors?: Problema[] } }).properties?.errors;
    if (erros?.length) {
      const frases = erros.slice(0, 3).map(({ properties: x }) => {
        const trecho = x?.context ?? x?.xtag ?? "";
        if (x?.id === "unclosed_tag") return `"${trecho}" foi aberta com {{ e não foi fechada com }}.`;
        if (x?.id === "unopened_tag") return `"${trecho}" foi fechada com }} sem ter sido aberta com {{.`;
        if (
          x?.id === "unclosed_loop" ||
          x?.id === "unopened_loop" ||
          x?.id === "closing_tag_does_not_match_opening_tag"
        ) {
          return "A lista de parcelas precisa começar com {{#parcelas}} e terminar com {{/parcelas}}.";
        }
        return trecho ? `Confira a marcação "${trecho}".` : "Confira as chaves {{ }} das marcações.";
      });
      return { erro: `O contrato tem marcações escritas errado. ${[...new Set(frases)].join(" ")}` };
    }
    return { erro: "Não foi possível ler o arquivo. Envie um documento do Word no formato .docx." };
  }
}

export function preencherContrato(arquivo: Uint8Array, dados: ReturnType<typeof dadosDoContrato>) {
  const doc = abrir(arquivo);
  doc.render(dados);
  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
