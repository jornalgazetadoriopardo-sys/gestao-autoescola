"use client";

import { useEffect, useState } from "react";
import type { Ocupado } from "@/lib/disponibilidade";
import { buscarOcupados } from "./ocupados";

// Carrega as aulas já marcadas nos dias informados (recarrega quando os dias mudam).
export function useOcupados(datas: string[], ignorar?: number) {
  const chave = [...new Set(datas.filter(Boolean))].sort().join(",");
  const [estado, setEstado] = useState<{ chave: string; ocupados: Ocupado[] }>({ chave: "", ocupados: [] });

  useEffect(() => {
    if (!chave) return;
    let ativo = true;
    buscarOcupados(chave.split(","), ignorar).then((ocupados) => {
      if (ativo) setEstado({ chave, ocupados });
    });
    return () => {
      ativo = false;
    };
  }, [chave, ignorar]);

  return { ocupados: estado.ocupados, carregando: Boolean(chave) && estado.chave !== chave };
}
