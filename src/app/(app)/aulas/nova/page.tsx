import { CalendarPlus, GraduationCap } from "lucide-react";
import { BotaoLink, Cabecalho, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarDataLocal, hojeISO } from "@/lib/format";
import { resumoAulas } from "@/lib/aulas";
import { AulaForm, type OpcaoMatricula } from "../aula-form";

export const dynamic = "force-dynamic";

export default async function NovaAulaPage({
  searchParams,
}: {
  searchParams: Promise<{ matricula?: string; dia?: string }>;
}) {
  const params = await searchParams;
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(params.dia ?? "") ? params.dia! : hojeISO();

  const [matriculas, instrutores, veiculos] = await Promise.all([
    db.matricula.findMany({
      where: { aluno: { status: "ativo" } },
      include: { aluno: true, aulas: { select: { tipo: true, status: true } } },
      orderBy: [{ aluno: { nome: "asc" } }, { data: "desc" }],
    }),
    db.instrutor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    db.veiculo.findMany({ where: { ativo: true }, orderBy: { placa: "asc" } }),
  ]);

  // Só oferece matrículas que ainda têm aulas para agendar.
  const opcoes: OpcaoMatricula[] = matriculas
    .map((m) => {
      const r = resumoAulas(m, m.aulas);
      return {
        id: m.id,
        categoria: m.categoria,
        rotulo: `${m.aluno.nome} — categoria ${m.categoria} (matrícula de ${formatarDataLocal(m.data)})`,
        restantes: { pratica: r.pratica.restantes, teorica: r.teorica.restantes },
      };
    })
    .filter((m) => m.restantes.pratica + m.restantes.teorica > 0);

  return (
    <>
      <Cabecalho
        titulo="Agendar aula"
        descricao="Escolha o aluno, o instrutor e o horário."
        icone={CalendarPlus}
        cor="roxo"
      />
      {opcoes.length === 0 ? (
        <Vazio
          icone={GraduationCap}
          titulo="Nenhum aluno com aulas disponíveis"
          texto="Para agendar, o aluno precisa estar ativo e ter uma matrícula com aulas a agendar."
          acao={<BotaoLink href="/alunos">Ir para alunos</BotaoLink>}
        />
      ) : (
        <AulaForm
          matriculas={opcoes}
          instrutores={instrutores.map((i) => ({ id: i.id, nome: i.nome, categorias: i.categorias }))}
          veiculos={veiculos.map((v) => ({ id: v.id, nome: `${v.placa} · ${v.modelo}`, categorias: v.categoria }))}
          matriculaInicial={Number(params.matricula) || undefined}
          dia={dia}
        />
      )}
    </>
  );
}
