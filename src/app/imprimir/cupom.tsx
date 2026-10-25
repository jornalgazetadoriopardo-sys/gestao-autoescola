import type { Configuracao } from "@prisma/client";
import { enderecoCompleto } from "@/lib/config";

// Peças dos cupons da impressora térmica: só preto, texto firme e sem fundo.

export function Cupom({ children }: { children: React.ReactNode }) {
  return <div className="cupom">{children}</div>;
}

export function CabecalhoCupom({ config, titulo }: { config: Configuracao; titulo: string }) {
  return (
    <div className="text-center">
      {config.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.logo} alt="" className="mx-auto mb-1 max-h-[16mm] max-w-[50mm] grayscale" />
      )}
      <div className="text-[14px] font-bold uppercase leading-tight">{config.nome}</div>
      {config.cnpj && <div>CNPJ {config.cnpj}</div>}
      {enderecoCompleto(config) && <div className="text-[11px]">{enderecoCompleto(config)}</div>}
      {(config.telefone || config.whatsapp) && (
        <div className="text-[11px]">Tel. {config.telefone ?? config.whatsapp}</div>
      )}
      <div className="tracejado" />
      <div className="text-[15px] font-bold uppercase">{titulo}</div>
    </div>
  );
}

export function LinhaCupom({ rotulo, valor, forte }: { rotulo: string; valor: React.ReactNode; forte?: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${forte ? "text-[14px] font-bold" : ""}`}>
      <span>{rotulo}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}

export function Assinatura({ texto }: { texto: string }) {
  return (
    <div className="mt-8 text-center">
      <div className="mx-auto w-[56mm] border-t border-black" />
      <div className="text-[11px]">{texto}</div>
    </div>
  );
}
