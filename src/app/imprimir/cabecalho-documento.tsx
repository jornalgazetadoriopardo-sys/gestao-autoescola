import type { Configuracao } from "@prisma/client";
import { enderecoCompleto } from "@/lib/config";

// Logotipo e dados da autoescola no topo de recibos e relatórios.
export function CabecalhoDocumento({ config, titulo, compacto }: { config: Configuracao; titulo?: string; compacto?: boolean }) {
  const contato = [config.telefone && `Tel.: ${config.telefone}`, config.whatsapp && `WhatsApp: ${config.whatsapp}`, config.email]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex items-center gap-4 border-b-2 border-slate-800 pb-3">
      {config.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.logo} alt="" className={compacto ? "h-12 w-auto" : "h-16 w-auto"} />
      )}
      <div className="min-w-0 flex-1">
        <div className={`font-bold ${compacto ? "text-base" : "text-xl"}`}>{config.nome}</div>
        {config.razaoSocial && <div className="text-xs">{config.razaoSocial}</div>}
        <div className="text-xs text-slate-700">
          {[config.cnpj && `CNPJ ${config.cnpj}`, enderecoCompleto(config)].filter(Boolean).join(" · ")}
        </div>
        {contato && <div className="text-xs text-slate-700">{contato}</div>}
      </div>
      {titulo && <div className={`text-right font-bold uppercase ${compacto ? "text-base" : "text-2xl"}`}>{titulo}</div>}
    </div>
  );
}
