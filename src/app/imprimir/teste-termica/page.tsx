import { obterConfig } from "@/lib/config";
import { formatarMoeda } from "@/lib/format";
import { Assinatura, CabecalhoCupom, Cupom, LinhaCupom } from "../cupom";

export const dynamic = "force-dynamic";

// Cupom de teste para conferir largura, margens e corte da térmica.
export default async function TesteTermicaPage() {
  const config = await obterConfig();
  return (
    <Cupom>
      <CabecalhoCupom config={config} titulo="Teste de impressão" />
      <p className="mt-1 text-center">Se este texto saiu inteiro e centralizado, a impressora está pronta.</p>
      <div className="tracejado" />
      <LinhaCupom rotulo="Esquerda" valor="Direita" />
      <LinhaCupom rotulo="Valor" valor={formatarMoeda(123456)} forte />
      <div className="tracejado" />
      <div className="text-center text-[11px]">1234567890123456789012345678901234567890123456</div>
      <Assinatura texto="Assinatura" />
    </Cupom>
  );
}
