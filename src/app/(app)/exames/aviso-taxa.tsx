import { CircleCheck, Printer } from "lucide-react";
import { Aviso, BotaoLink } from "@/components/ui";
import { db } from "@/lib/db";

// Depois de receber uma taxa: confirmação com o botão do recibo.
export async function AvisoTaxaRecebida({ id }: { id?: string }) {
  if (!id) return null;
  const etapa = await db.etapa.findUnique({ where: { id: Number(id) || 0 } });
  if (!etapa?.pagoEm) return null;
  return (
    <Aviso tipo="sucesso" icone={CircleCheck}>
      <span>
        Pagamento de <b>{etapa.descricao}</b> registrado!
      </span>
      <BotaoLink href={`/imprimir/recibo-taxa/${etapa.id}`} target="_blank" tamanho="pequeno" icone={Printer}>
        Imprimir recibo
      </BotaoLink>
    </Aviso>
  );
}
