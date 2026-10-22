import { PrismaClient } from "@prisma/client";
import { urlDoBanco } from "./url-banco";

// Reaproveita a conexão entre recarregamentos no modo de desenvolvimento.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: urlDoBanco() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
