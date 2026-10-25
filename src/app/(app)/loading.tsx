import { LoaderCircle } from "lucide-react";

// Aparece na hora do clique enquanto a próxima tela carrega, para não parecer travado.
export default function Carregando() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500" role="status">
      <LoaderCircle className="size-10 animate-spin text-blue-600" aria-hidden />
      <span className="text-lg">Carregando...</span>
    </div>
  );
}
