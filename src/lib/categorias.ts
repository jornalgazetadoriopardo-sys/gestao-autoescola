// Categorias de que o aluno desistiu depois da matrícula (ex.: contratou AB e
// ficou só com B). Guardadas em Matricula.categoriasCanceladas.
export type CategoriaCancelada = {
  categoria: string;
  // Data e hora do cancelamento (ISO).
  em: string;
  motivo: string | null;
  // Aulas práticas contratadas nessa categoria, quando se sabia (null em matrícula antiga).
  praticas: number | null;
  // Aulas agendadas dessa categoria que foram canceladas junto.
  aulasCanceladas: number;
};

export function lerCanceladas(json: unknown): CategoriaCancelada[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (x): x is CategoriaCancelada =>
      x && typeof x === "object" && typeof (x as CategoriaCancelada).categoria === "string",
  );
}

// "AB" sem "A" → "B".
export function semCategoria(categoria: string, letra: string) {
  return categoria
    .split("")
    .filter((l) => l !== letra)
    .join("");
}
