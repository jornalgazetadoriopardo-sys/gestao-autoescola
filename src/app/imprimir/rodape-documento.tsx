import { formatarDataHora } from "@/lib/aulas";

export function RodapeDocumento() {
  return (
    <div className="mt-8 border-t border-slate-300 pt-2 text-right text-xs text-slate-500">
      Emitido em {formatarDataHora(new Date())}
    </div>
  );
}
