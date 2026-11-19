"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { dbGlobal } from "@/lib/db";
import { exigirSuperadmin } from "@/lib/auth";
import { ErroImportacao, importarAutoescola } from "@/lib/backup";
import { lerMoeda } from "@/lib/format";
import { FORMAS_COBRANCA, fimDaAvaliacao, iso, lerPlataforma } from "@/lib/mensalidades";
import type { EstadoForm } from "@/components/form-acao";

function texto(dados: FormData, campo: string) {
  const v = String(dados.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

// Cria uma autoescola nova, já com o primeiro administrador dela.
export async function criarAutoescola(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSuperadmin();

  const nome = texto(dados, "nome");
  const cidade = texto(dados, "cidade");
  const uf = texto(dados, "uf")?.toUpperCase().slice(0, 2) ?? null;
  const adminNome = texto(dados, "adminNome");
  const email = texto(dados, "email")?.toLowerCase();
  const senha = String(dados.get("senha") ?? "");

  if (!nome) return { erro: "Informe o nome da autoescola." };
  if (!adminNome) return { erro: "Informe o nome do administrador." };
  if (!email || !email.includes("@")) return { erro: "Informe um e-mail válido para o administrador." };
  if (senha.length < 8) return { erro: "A senha deve ter pelo menos 8 caracteres." };

  const senhaHash = await bcrypt.hash(senha, 10);
  try {
    await dbGlobal.$transaction(async (tx) => {
      // Autoescola nova ganha o período de avaliação configurado em Plataforma > Mensalidades.
      const { diasAvaliacao } = await lerPlataforma();
      const autoescola = await tx.autoescola.create({
        data: { nome, avaliacaoAte: fimDaAvaliacao(diasAvaliacao) },
      });
      await tx.configuracao.create({ data: { id: autoescola.id, nome, cidade, uf } });
      await tx.usuario.create({
        data: { autoescolaId: autoescola.id, nome: adminNome, email, senhaHash, papel: "admin" },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Este e-mail já é usado por outro usuário do sistema." };
    }
    throw e;
  }
  revalidatePath("/plataforma");
  return { ok: `Autoescola ${nome} criada. O administrador já pode entrar com ${email}.` };
}

// Suspende ou reativa o acesso de uma autoescola (os dados continuam guardados).
export async function alternarAutoescola(autoescolaId: number) {
  const sessao = await exigirSuperadmin();
  if (autoescolaId === sessao.autoescolaId) throw new Error("Você não pode suspender a sua própria autoescola.");
  const autoescola = await dbGlobal.autoescola.findUnique({ where: { id: autoescolaId } });
  if (!autoescola) return;
  await dbGlobal.autoescola.update({ where: { id: autoescolaId }, data: { ativo: !autoescola.ativo } });
  revalidatePath("/plataforma");
}

const ARQUIVO_MAX = 4 * 1024 * 1024;

// Recebe o arquivo exportado (de outro servidor) e cria a autoescola com tudo.
export async function importarArquivo(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSuperadmin();

  const arquivo = dados.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Escolha o arquivo exportado (.json)." };
  if (arquivo.size > ARQUIVO_MAX) return { erro: "Arquivo grande demais (máximo 4 MB)." };

  let conteudo: unknown;
  try {
    conteudo = JSON.parse(await arquivo.text());
  } catch {
    return { erro: "Não foi possível ler o arquivo. Use o arquivo .json baixado em Exportar." };
  }

  try {
    const r = await importarAutoescola(conteudo);
    revalidatePath("/plataforma");
    return {
      ok:
        `Autoescola ${r.nome} importada: ${r.totais.usuarios} usuário(s), ${r.totais.alunos} aluno(s), ` +
        `${r.totais.aulas} aula(s), ${r.totais.parcelas} parcela(s) e ${r.totais.despesas} despesa(s). Os usuários entram com as mesmas senhas de antes.`,
    };
  } catch (e) {
    if (e instanceof ErroImportacao) return { erro: e.message };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Arquivo inválido: há CPF, placa ou e-mail repetido. Nada foi importado." };
    }
    console.error(e);
    return { erro: "Não foi possível importar. Nada foi gravado." };
  }
}

// Apaga a autoescola e TODOS os dados dela. Só para autoescola suspensa e com
// o nome digitado para confirmar.
export async function excluirAutoescola(autoescolaId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirSuperadmin();
  if (autoescolaId === sessao.autoescolaId) return { erro: "Você não pode excluir a sua própria autoescola." };
  const autoescola = await dbGlobal.autoescola.findUnique({ where: { id: autoescolaId } });
  if (!autoescola) return { erro: "Autoescola não encontrada." };
  if (autoescola.ativo) return { erro: "Suspenda a autoescola antes de excluir." };
  if (String(dados.get("confirmacao") ?? "").trim() !== autoescola.nome) {
    return { erro: "O nome digitado não confere. Digite exatamente como aparece acima." };
  }

  const doAluno = { aluno: { autoescolaId } };
  await dbGlobal.$transaction([
    dbGlobal.aula.deleteMany({ where: { matricula: doAluno } }),
    dbGlobal.parcela.deleteMany({ where: { matricula: doAluno } }),
    dbGlobal.etapa.deleteMany({ where: { matricula: doAluno } }),
    dbGlobal.matricula.deleteMany({ where: doAluno }),
    dbGlobal.aluno.deleteMany({ where: { autoescolaId } }),
    dbGlobal.despesa.deleteMany({ where: { autoescolaId } }),
    dbGlobal.feriado.deleteMany({ where: { autoescolaId } }),
    dbGlobal.diaEspecial.deleteMany({ where: { autoescolaId } }),
    dbGlobal.modeloDocumento.deleteMany({ where: { autoescolaId } }),
    dbGlobal.postSocial.deleteMany({ where: { autoescolaId } }),
    dbGlobal.mensalidade.deleteMany({ where: { autoescolaId } }),
    dbGlobal.manutencao.deleteMany({ where: { veiculo: { autoescolaId } } }),
    dbGlobal.veiculo.deleteMany({ where: { autoescolaId } }),
    dbGlobal.instrutor.deleteMany({ where: { autoescolaId } }),
    dbGlobal.usuario.deleteMany({ where: { autoescolaId } }),
    dbGlobal.configuracao.deleteMany({ where: { id: autoescolaId } }),
    dbGlobal.autoescola.delete({ where: { id: autoescolaId } }),
  ]);
  revalidatePath("/plataforma");
  redirect("/plataforma");
}

// ---- Mensalidades das autoescolas -------------------------------------------

function dia(v: string | null) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
}

// Configuração geral da cobrança (valor e dia padrão, Pix de quem recebe...).
export async function salvarPlataforma(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSuperadmin();
  const valorTexto = texto(dados, "valor");
  const mensalidadeCentavos = valorTexto ? lerMoeda(valorTexto) : null;
  if (valorTexto && (mensalidadeCentavos === null || mensalidadeCentavos <= 0)) {
    return { erro: "Valor inválido. Ex.: 99,00" };
  }
  const diaVencimento = dia(texto(dados, "diaVencimento"));
  if (!diaVencimento) return { erro: "Escolha o dia de vencimento (1 a 31)." };
  const formaPadrao = String(dados.get("formaPadrao") ?? "pix");
  if (!(formaPadrao in FORMAS_COBRANCA)) return { erro: "Forma de pagamento inválida." };
  const chavePix = texto(dados, "chavePix");
  if (formaPadrao === "pix" && !chavePix) return { erro: "Informe a chave Pix para receber as mensalidades." };
  const diasAvaliacao = Number(texto(dados, "diasAvaliacao") ?? 0);
  if (!Number.isInteger(diasAvaliacao) || diasAvaliacao < 0 || diasAvaliacao > 90) {
    return { erro: "Período de avaliação: de 0 a 90 dias." };
  }
  const campos = {
    mensalidadeCentavos,
    diaVencimento,
    formaPadrao,
    chavePix,
    nomeRecebedor: texto(dados, "nomeRecebedor"),
    cidadeRecebedor: texto(dados, "cidadeRecebedor"),
    instrucoes: texto(dados, "instrucoes")?.slice(0, 400) ?? null,
    whatsappCobranca: texto(dados, "whatsappCobranca"),
    bloquearAutomatico: dados.get("bloquearAutomatico") === "on",
    diasAvaliacao,
  };
  await dbGlobal.plataformaConfig.upsert({ where: { id: 1 }, create: { id: 1, ...campos }, update: campos });
  revalidatePath("/", "layout");
  return {
    ok: mensalidadeCentavos
      ? "Cobrança salva! As mensalidades do mês são criadas sozinhas para cada autoescola."
      : "Salvo. Sem valor padrão, só são cobradas as autoescolas com valor próprio.",
  };
}

// Valor, dia, forma, isenção e início da cobrança de uma autoescola.
export async function salvarCobrancaAutoescola(
  autoescolaId: number,
  _: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  await exigirSuperadmin();
  const valorTexto = texto(dados, "valor");
  const mensalidadeCentavos = valorTexto ? lerMoeda(valorTexto) : null;
  if (valorTexto && (mensalidadeCentavos === null || mensalidadeCentavos <= 0)) {
    return { erro: "Valor inválido. Ex.: 99,00" };
  }
  const diaTexto = texto(dados, "diaVencimento");
  const diaVencimento = diaTexto ? dia(diaTexto) : null;
  if (diaTexto && !diaVencimento) return { erro: "Dia de vencimento inválido (1 a 31)." };
  const forma = texto(dados, "formaCobranca");
  if (forma && !(forma in FORMAS_COBRANCA)) return { erro: "Forma de pagamento inválida." };
  const inicio = texto(dados, "cobrancaInicio");
  const avaliacaoTexto = texto(dados, "avaliacaoAte");
  if (avaliacaoTexto && !/^\d{4}-\d{2}-\d{2}$/.test(avaliacaoTexto)) return { erro: "Data da avaliação inválida." };
  const avaliacaoAte = avaliacaoTexto ? new Date(`${avaliacaoTexto}T00:00:00Z`) : null;

  // Mudou a avaliação: a 1ª mensalidade (que vencia no fim dela) acompanha a data nova,
  // ou é apagada se a avaliação foi tirada (a do mês volta a ser criada no dia normal).
  const atual = await dbGlobal.autoescola.findUnique({ where: { id: autoescolaId }, select: { avaliacaoAte: true } });
  if (atual?.avaliacaoAte && atual.avaliacaoAte.getTime() !== avaliacaoAte?.getTime()) {
    const primeira = await dbGlobal.mensalidade.findFirst({
      where: { autoescolaId, vencimento: atual.avaliacaoAte, pagoEm: null },
    });
    if (primeira) {
      const competencia = avaliacaoAte ? iso(avaliacaoAte).slice(0, 7) : null;
      const ocupada =
        competencia &&
        competencia !== primeira.competencia &&
        (await dbGlobal.mensalidade.findUnique({
          where: { autoescolaId_competencia: { autoescolaId, competencia } },
        }));
      if (!avaliacaoAte || ocupada) await dbGlobal.mensalidade.delete({ where: { id: primeira.id } });
      else
        await dbGlobal.mensalidade.update({
          where: { id: primeira.id },
          data: { vencimento: avaliacaoAte, competencia: competencia ?? primeira.competencia },
        });
    }
  }

  await dbGlobal.autoescola.update({
    where: { id: autoescolaId },
    data: {
      mensalidadeCentavos,
      diaVencimento,
      formaCobranca: forma,
      isenta: dados.get("isenta") === "on",
      cobrancaInicio: inicio && /^\d{4}-\d{2}-\d{2}$/.test(inicio) ? new Date(`${inicio}T00:00:00Z`) : null,
      avaliacaoAte,
    },
  });
  revalidatePath("/", "layout");
  return { ok: "Cobrança da autoescola salva!" };
}

// Confirma (ou desfaz) o pagamento de uma mensalidade.
export async function confirmarMensalidade(id: number, pago: boolean) {
  await exigirSuperadmin();
  const m = await dbGlobal.mensalidade.findUnique({ where: { id }, select: { forma: true } });
  if (!m) return;
  await dbGlobal.mensalidade.update({
    where: { id },
    data: pago ? { pagoEm: new Date() } : { pagoEm: null, informadoEm: null },
  });
  revalidatePath("/", "layout");
}

// O aviso de "Já paguei" não confere: volta a cobrar normalmente (faixa e prazo).
export async function recusarAviso(id: number) {
  await exigirSuperadmin();
  await dbGlobal.mensalidade.update({ where: { id }, data: { informadoEm: null } });
  revalidatePath("/", "layout");
}

// Apaga uma mensalidade (ex.: lançada em teste). Se a cobrança da autoescola
// continuar ligada, a do mês atual volta a ser criada.
export async function excluirMensalidade(id: number) {
  await exigirSuperadmin();
  await dbGlobal.mensalidade.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
}

// Zera a cobrança (depois de testar): apaga todas as mensalidades e tira os valores
// (o padrão e o de cada autoescola). Nenhuma autoescola é cobrada até um valor ser cadastrado de novo.
export async function zerarCobranca() {
  await exigirSuperadmin();
  await dbGlobal.$transaction([
    dbGlobal.mensalidade.deleteMany({}),
    dbGlobal.autoescola.updateMany({ data: { mensalidadeCentavos: null } }),
    dbGlobal.plataformaConfig.updateMany({ data: { mensalidadeCentavos: null } }),
  ]);
  revalidatePath("/", "layout");
}
