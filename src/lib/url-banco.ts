// A conexão "Transaction pooler" do Supabase (porta 6543) usa PgBouncer, que
// não suporta os prepared statements do Prisma. Sem "pgbouncer=true" na URL o
// erro é "prepared statement "s0" already exists". Acrescenta os parâmetros
// automaticamente quando faltarem, para não depender de digitá-los certo.
export function urlDoBanco(url = process.env.DATABASE_URL) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.port === "6543") {
      if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
      // Algumas conexões por instância, para as consultas de uma mesma tela
      // rodarem ao mesmo tempo (com 1 elas esperam em fila).
      if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "5");
    }
    return u.toString();
  } catch {
    return url;
  }
}
