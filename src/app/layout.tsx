import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão Autoescola",
  description: "Controle de alunos, aulas e pagamentos",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
