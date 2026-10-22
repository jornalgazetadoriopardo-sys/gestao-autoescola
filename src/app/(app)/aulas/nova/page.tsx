import Link from "next/link";
import { CalendarDays, CalendarPlus, CalendarRange, GraduationCap } from "lucide-react";
import { BotaoLink, Cabecalho, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarDataLocal, hojeISO } from "@/lib/format";
import { resumoAulas } from "@/lib/aulas";
import { AulaForm, type OpcaoMatricula } from "../aula-form";
import { AulasLoteForm } from "../aulas-lote-form";

export const dynamic = "force-dynamic";

export default async function NovaAulaPage({
  searchParams,
}: {
  searchParams: Promise<{ matricula?: string; dia?: string; modo?: string }>;
}) {
  const params = await searchParams;
  const hoje = hojeISO();
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(params.dia ?? "") ? params.dia! : hoje;
  const varias = params.modo === "varias";

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

  const listaInstrutores = instrutores.map((i) => ({ id: i.id, nome: i.nome, categorias: i.categorias }));
  const listaVeiculos = veiculos.map((v) => ({ id: v.id, nome: `${v.placa} · ${v.modelo}`, categorias: v.categoria }));
  const matriculaInicial = Number(params.matricula) || undefined;
  const link = (modo: string) =>
    `/aulas/nova?modo=${modo}${matriculaInicial ? `&matricula=${matriculaInicial}` : ""}${params.dia ? `&dia=${dia}` : ""}`;

  return (
    <>
      <Cabecalho
        titulo="Agendar aulas"
        descricao={
          varias
            ? "Escolha vários dias no calendário e agende todas as aulas de uma vez."
            : "Escolha o aluno, o instrutor e o horário."
        }
        icone={CalendarPlus}
        cor="roxo"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { modo: "uma", label: "Uma aula", icone: CalendarDays, ativo: !varias },
          { modo: "varias", label: "Várias aulas (calendário)", icone: CalendarRange, ativo: varias },
        ].map(({ modo, label, icone: Icone, ativo }) => (
          <Link
            key={modo}
            href={link(modo)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium ${
              ativo ? "bg-blue-600 text-white" : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            }`}
          >
            <Icone className="size-5" aria-hidden /> {label}
          </Link>
        ))}
      </div>

      {opcoes.length === 0 ? (
        <Vazio
          icone={GraduationCap}
          titulo="Nenhum aluno com aulas disponíveis"
          texto="Para agendar, o aluno precisa estar ativo e ter uma matrícula com aulas a agendar."
          acao={<BotaoLink href="/alunos">Ir para alunos</BotaoLink>}
        />
      ) : varias ? (
        <AulasLoteForm
          matriculas={opcoes}
          instrutores={listaInstrutores}
          veiculos={listaVeiculos}
          matriculaInicial={matriculaInicial}
          hoje={hoje}
        />
      ) : (
        <AulaForm
          matriculas={opcoes}
          instrutores={listaInstrutores}
          veiculos={listaVeiculos}
          matriculaInicial={matriculaInicial}
          dia={dia}
        />
      )}
    </>
  );
}
