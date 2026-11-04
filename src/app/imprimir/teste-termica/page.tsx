import { obterConfig } from "@/lib/config";
import { formatarMoeda } from "@/lib/format";
import { Assinatura, CabecalhoCupom, Cupom, LinhaCupom } from "../cupom";

export const dynamic = "force-dynamic";

// Cupom de teste para conferir largura, margens e corte da térmica. A régua
// vai até 80 mm, além da largura do cupom: o último número que sair inteiro é a
// largura que a impressora aguenta (Configurações > Impressora).
export default async function TesteTermicaPage() {
  const config = await obterConfig();
  return (
    <Cupom>
      <CabecalhoCupom config={config} titulo="Teste de impressão" />
      <p className="mt-1 text-center">
        Largura configurada: <b>{config.larguraTermica} mm</b>,{" "}
        {config.alinhamentoTermica === "centro" ? "centralizado" : "encostado à esquerda"}.
      </p>
      <div className="tracejado" />
      <div className="text-[11px]">Régua (mm): veja até onde ela saiu no papel.</div>
      <Regua />
      <div className="tracejado" />
      <LinhaCupom rotulo="Esquerda" valor="Direita" />
      <LinhaCupom rotulo="Valor" valor={formatarMoeda(123456)} forte />
      <div className="tracejado" />
      <p className="text-[11px]">
        Se a palavra &quot;Direita&quot; e a borda direita deste quadro saíram inteiras, está tudo certo. Se cortou, em
        Configurações › Impressora escolha uma largura menor que o último número da régua que saiu inteiro.
      </p>
      <div className="mt-2 border-2 border-black p-1 text-center font-bold">QUADRO DE CONFERÊNCIA</div>
      <Assinatura texto="Assinatura" />
    </Cupom>
  );
}

function Regua() {
  const marcas = Array.from({ length: 81 }, (_, mm) => mm);
  return (
    <svg width="80mm" height="9mm" viewBox="0 0 80 9" className="block overflow-visible" aria-hidden>
      {marcas.map((mm) => (
        <line
          key={mm}
          x1={mm + 0.1}
          x2={mm + 0.1}
          y1={0}
          y2={mm % 10 === 0 ? 4 : mm % 5 === 0 ? 3 : 1.6}
          stroke="black"
          strokeWidth={0.2}
        />
      ))}
      {marcas
        .filter((mm) => mm % 10 === 0 && mm > 0)
        .map((mm) => (
          <text key={mm} x={mm} y={8} fontSize={3.4} textAnchor="end" fontWeight="bold">
            {mm}
          </text>
        ))}
    </svg>
  );
}
