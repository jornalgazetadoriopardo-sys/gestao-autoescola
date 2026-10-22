import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { urlDoBanco } from "../src/lib/url-banco";

// Cria a autoescola nº 1 e o primeiro usuário administrador (dono da
// plataforma), se ainda não houver nenhum.
// Em produção (Vercel) o e-mail e a senha vêm obrigatoriamente de
// ADMIN_EMAIL e ADMIN_SENHA, para não existir senha padrão na internet.
const db = new PrismaClient({ datasourceUrl: urlDoBanco() });

async function main() {
  if ((await db.usuario.count()) > 0) {
    console.log("Já existem usuários cadastrados. Nada a fazer.");
    return;
  }

  const producao = Boolean(process.env.VERCEL);
  const email = (process.env.ADMIN_EMAIL || (producao ? "" : "admin@autoescola.local")).trim().toLowerCase();
  const senha = process.env.ADMIN_SENHA || (producao ? "" : "admin123");

  if (!email || !senha) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_SENHA nas variáveis de ambiente para criar o primeiro usuário.");
  }
  if (producao && senha.length < 8) {
    throw new Error("ADMIN_SENHA deve ter pelo menos 8 caracteres.");
  }

  const autoescola =
    (await db.autoescola.findFirst({ orderBy: { id: "asc" } })) ??
    (await db.autoescola.create({ data: { nome: "Minha Autoescola" } }));
  await db.usuario.create({
    data: {
      autoescolaId: autoescola.id,
      nome: "Administrador",
      email,
      senhaHash: await bcrypt.hash(senha, 10),
      papel: "admin",
      superadmin: true,
    },
  });
  console.log(producao ? `Usuário criado: ${email}` : `Usuário criado: ${email} / ${senha}`);
}

main().finally(() => db.$disconnect());
