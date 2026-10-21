import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// Cria o primeiro usuário administrador, se ainda não houver nenhum.
const db = new PrismaClient();

async function main() {
  if ((await db.usuario.count()) > 0) {
    console.log("Já existem usuários cadastrados. Nada a fazer.");
    return;
  }
  const email = (process.env.ADMIN_EMAIL ?? "admin@autoescola.local").toLowerCase();
  const senha = process.env.ADMIN_SENHA ?? "admin123";
  await db.usuario.create({
    data: { nome: "Administrador", email, senhaHash: await bcrypt.hash(senha, 10), papel: "admin" },
  });
  console.log(`Usuário criado: ${email} / ${senha}`);
}

main().finally(() => db.$disconnect());
