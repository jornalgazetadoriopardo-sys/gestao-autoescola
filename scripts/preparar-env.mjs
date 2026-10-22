// Cria o arquivo .env na primeira instalação, com uma chave de sessão aleatória.
// Funciona igual no Windows, Linux e Mac.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (existsSync(".env")) {
  console.log(".env já existe. Mantendo o atual.");
} else {
  const conteudo = readFileSync(".env.example", "utf8").replace(
    "troque-este-valor-por-um-segredo-longo",
    randomBytes(32).toString("base64"),
  );
  writeFileSync(".env", conteudo);
  console.log(".env criado.");
}
