import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Senha da conta gov.br do aluno, guardada criptografada (AES-256-GCM) com uma
// chave derivada do SESSION_SECRET. Quem vê o banco de dados não lê a senha;
// ela só aparece na tela do aluno, para usuários logados, ao clicar em "Mostrar".

function chave() {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) throw new Error("SESSION_SECRET não definido no .env");
  return createHash("sha256").update(`govbr:${segredo}`).digest();
}

export function cifrarSenha(senha: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([c.update(senha, "utf8"), c.final()]);
  return ["v1", iv, c.getAuthTag(), dados].map((x) => (typeof x === "string" ? x : x.toString("base64"))).join(":");
}

// null se não der para ler (ex.: o SESSION_SECRET mudou).
export function decifrarSenha(cifrada: string) {
  try {
    const [versao, iv, tag, dados] = cifrada.split(":");
    if (versao !== "v1") return null;
    const d = createDecipheriv("aes-256-gcm", chave(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(dados, "base64")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
