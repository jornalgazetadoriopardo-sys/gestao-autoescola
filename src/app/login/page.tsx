import { Car } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input } from "@/components/ui";
import { obterConfig } from "@/lib/config";
import { entrar } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const config = await obterConfig();
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-700 to-slate-900 p-4">
      <Cartao className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          {config.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logo} alt="" className="mb-3 h-24 w-auto" />
          ) : (
            <span className="mb-3 flex size-20 items-center justify-center rounded-full bg-blue-100">
              <Car className="size-10 text-blue-700" aria-hidden />
            </span>
          )}
          <h1 className="text-2xl font-bold">{config.nome}</h1>
          <p className="mt-1 text-base text-slate-600">Entre com seu e-mail e senha.</p>
        </div>
        <FormAcao acao={entrar} textoBotao="Entrar">
          <Campo label="E-mail">
            <Input name="email" type="email" required autoFocus autoComplete="username" />
          </Campo>
          <Campo label="Senha">
            <Input name="senha" type="password" required autoComplete="current-password" />
          </Campo>
        </FormAcao>
      </Cartao>
    </main>
  );
}
