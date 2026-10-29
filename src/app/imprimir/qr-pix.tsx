import { qrCodePix } from "@/lib/pix";

type ConfigPix = { chavePix: string | null; nome: string; razaoSocial: string | null; cidade: string | null };

// QR Code do Pix para imprimir (com o valor, quando informado). Sem chave cadastrada, não mostra nada.
export async function QrPix({
  config,
  valorCentavos,
  identificador,
  className = "size-[22mm]",
}: {
  config: ConfigPix;
  valorCentavos?: number | null;
  identificador?: string;
  className?: string;
}) {
  if (!config.chavePix) return null;
  const svg = await qrCodePix({
    chave: config.chavePix,
    nome: config.razaoSocial || config.nome,
    cidade: config.cidade,
    valorCentavos,
    identificador,
  });
  return (
    <div
      role="img"
      aria-label="QR Code do Pix"
      className={`shrink-0 bg-white [&>svg]:size-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
