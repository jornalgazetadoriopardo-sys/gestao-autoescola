import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  Car,
  Check,
  ClipboardCheck,
  FileSignature,
  Laptop,
  LogIn,
  MessageCircle,
  Palette,
  Printer,
  QrCode,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import agenda from "../../../public/site/agenda.jpg";
import agendar from "../../../public/site/agendar.jpg";
import aluno from "../../../public/site/aluno.jpg";
import carne from "../../../public/site/carne.jpg";
import celularAgenda from "../../../public/site/celular-agenda.jpg";
import celularInicio from "../../../public/site/celular-inicio.jpg";
import cores from "../../../public/site/cores.jpg";
import escuro from "../../../public/site/escuro.jpg";
import exames from "../../../public/site/exames.jpg";
import inicio from "../../../public/site/inicio.jpg";
import pagamentos from "../../../public/site/pagamentos.jpg";

// Site de apresentação e venda do sistema (página pública, fora do login).
// O número do WhatsApp vem da variável de ambiente WHATSAPP_VENDAS (com DDD);
// sem ela, os botões de WhatsApp não aparecem. As telas são prints de uma
// autoescola de demonstração, com dados fictícios.

const NOME = "Gestão Autoescola";
const PRECO = "R$ 99";
const MENSAGEM = `Olá! Vi o site do ${NOME} e quero saber mais.`;

export const metadata: Metadata = {
  title: `${NOME} — sistema para autoescolas`,
  description:
    "Alunos, agenda de aulas, exames do Detran, carnê com Pix e financeiro da autoescola num só lugar. Funciona no computador e no celular.",
  openGraph: {
    title: `${NOME} — sistema para autoescolas`,
    description: "Organize a autoescola do cadastro à CNH: agenda, exames, carnê com Pix e financeiro.",
    images: [{ url: inicio.src, width: inicio.width, height: inicio.height }],
    locale: "pt_BR",
    type: "website",
  },
};

function linkWhatsApp() {
  const digitos = (process.env.WHATSAPP_VENDAS ?? "").replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const numero = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(MENSAGEM)}`;
}

const RECURSOS: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: CalendarDays,
    titulo: "Agenda que não deixa marcar errado",
    texto:
      "Horários ocupados do aluno, do instrutor e do veículo ficam bloqueados. Feriados também. Marque várias aulas de uma vez pelo calendário.",
  },
  {
    icone: Users,
    titulo: "Alunos e matrículas",
    texto:
      "Cadastro com foto, documentos e conta gov.br. Matrícula por categoria (ex.: 10 aulas de moto e 20 de carro) e cancelamento de uma categoria quando o aluno desiste.",
  },
  {
    icone: ClipboardCheck,
    titulo: "Exames e taxas do Detran",
    texto:
      "Médico, psicológico, toxicológico, provas teórica e prática, emissão da CNH. A lista entra sozinha na matrícula, com reexame automático se reprovar.",
  },
  {
    icone: Wallet,
    titulo: "Pagamentos sem planilha",
    texto:
      "Entrada e restante no carnê, cartão, Pix ou dinheiro. Parcelas em atraso em destaque, recibo na hora e relatório do que entrou no mês.",
  },
  {
    icone: QrCode,
    titulo: "Carnê com QR Code do Pix",
    texto:
      "Cada parcela sai com o QR Code já com o valor. O aluno aponta a câmera do banco e paga. Também imprime na térmica (ex.: Elgin i9).",
  },
  {
    icone: FileSignature,
    titulo: "Contrato e documentos prontos",
    texto:
      "Envie seu contrato em Word uma vez: o sistema preenche com os dados de cada aluno. Também declaração de comparecimento e autorização de imagem.",
  },
  {
    icone: Bell,
    titulo: "Avisos que lembram por você",
    texto:
      "Parcelas vencendo, licenciamento pelo final da placa, exames do dia, alunos prontos para a prova prática e contas a pagar.",
  },
  {
    icone: Printer,
    titulo: "Ficha, guia e relatórios",
    texto:
      "Ficha do aluno em folha inteira ou meia folha frente e verso, guia com o cronograma de aulas, relatórios financeiros e de despesas.",
  },
];

const TELAS: { titulo: string; texto: string; itens: string[]; imagem: StaticImageData; alt: string }[] = [
  {
    titulo: "A agenda do dia, com presença em um clique",
    texto: "Veja todas as aulas do dia, filtre por instrutor e marque presença ou falta direto na lista.",
    itens: ["Aulas práticas e teóricas", "Exames do Detran aparecem na agenda", "Aviso quando o dia é feriado"],
    imagem: agenda,
    alt: "Tela da agenda de aulas do dia",
  },
  {
    titulo: "Agende o curso inteiro em segundos",
    texto:
      "Escolha os dias da semana e o horário: o sistema monta as datas, pula feriados e avisa se algum horário já estiver ocupado.",
    itens: ["Calendário para clicar nos dias", "Saldo de aulas por categoria", "Instrutor e veículo de cada aula"],
    imagem: agendar,
    alt: "Tela de agendamento de várias aulas pelo calendário",
  },
  {
    titulo: "Tudo do aluno numa tela só",
    texto:
      "Dados, matrículas, aulas feitas e que faltam, exames, pagamentos e documentos. Avisa quando o aluno está pronto para a prova prática.",
    itens: ["Progresso das aulas por categoria", "Guia, ficha, contrato e carnê", "Histórico completo"],
    imagem: aluno,
    alt: "Tela com a ficha completa do aluno",
  },
  {
    titulo: "Quem pagou, quem deve e quanto entra",
    texto:
      "As parcelas em atraso aparecem primeiro. Receba, imprima o recibo e acompanhe o que entra nos próximos 30 dias.",
    itens: ["Em atraso, a vencer e pagas no mês", "Recibo em A4 ou térmica", "Despesas e lucro nos relatórios"],
    imagem: pagamentos,
    alt: "Tela de pagamentos com parcelas em atraso",
  },
  {
    titulo: "Exames e taxas sob controle",
    texto:
      "Acompanhe o que está agendado, o que espera resultado, o que ainda não tem data e as taxas que a autoescola precisa receber.",
    itens: ["Regras novas da CNH (2025/2026)", "Prova prática por categoria", "Taxas cobradas pela autoescola"],
    imagem: exames,
    alt: "Tela de exames e taxas",
  },
];

export default function ConhecaPage() {
  const whatsapp = linkWhatsApp();

  return (
    <div className="sem-tema min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#inicio" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Car className="size-5" aria-hidden />
            </span>
            <span className="text-base font-semibold tracking-tight">{NOME}</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex" aria-label="Seções">
            <a href="#recursos" className="hover:text-slate-900">
              Recursos
            </a>
            <a href="#telas" className="hover:text-slate-900">
              Telas
            </a>
            <a href="#preco" className="hover:text-slate-900">
              Preço
            </a>
            <a href="#duvidas" className="hover:text-slate-900">
              Dúvidas
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              <LogIn className="size-4" aria-hidden /> Entrar
            </Link>
            {whatsapp && <BotaoWhatsApp href={whatsapp} pequeno texto="Falar no WhatsApp" />}
          </div>
        </div>
      </header>

      <main id="inicio">
        {/* Abertura */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-blue-50),transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20">
            <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">
              <span className="size-1.5 rounded-full bg-green-500" aria-hidden /> Feito para o dia a dia da autoescola
            </p>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Sua autoescola organizada, do cadastro à CNH.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-slate-600 sm:text-xl">
              Alunos, agenda de aulas, exames do Detran, carnê com Pix e financeiro num só lugar. Simples para quem
              atende no balcão, completo para quem administra.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {whatsapp && <BotaoWhatsApp href={whatsapp} texto="Quero conhecer" />}
              <a
                href="#telas"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Ver as telas
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">Planos a partir de {PRECO}.</p>
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
            <div className="relative">
              <MolduraNavegador imagem={inicio} alt="Tela inicial do sistema com avisos do dia" prioridade />
              <div className="absolute -right-2 -bottom-10 hidden w-[23%] sm:block lg:-right-8">
                <MolduraCelular imagem={celularInicio} alt="Tela inicial no celular" />
              </div>
            </div>
          </div>
        </section>

        {/* Destaques */}
        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            <Destaque icone={Laptop} titulo="Sem instalar nada" texto="Abre no navegador, no computador da recepção." />
            <Destaque
              icone={Smartphone}
              titulo="No celular também"
              texto="Instrutores e dono consultam de qualquer lugar."
            />
            <Destaque
              icone={ShieldCheck}
              titulo="Dados só da sua autoescola"
              texto="Cada autoescola enxerga só o que é dela, com usuários e senhas."
            />
            <Destaque
              icone={CalendarCheck}
              titulo="Regras novas da CNH"
              texto="Curso teórico online grátis, toxicológico e mínimo de aulas atualizados."
            />
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Titulo
              chapeu="Recursos"
              titulo="Tudo o que a autoescola faz no dia, num sistema só"
              texto="Chega de caderno, planilha e carnê preenchido à mão."
            />
            <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {RECURSOS.map((r) => (
                <div key={r.titulo}>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <r.icone className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{r.titulo}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{r.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Telas */}
        <section id="telas" className="scroll-mt-20 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Titulo
              chapeu="Por dentro do sistema"
              titulo="Veja como é usar no dia a dia"
              texto="Telas reais do sistema, com uma autoescola de demonstração."
            />
            <div className="mt-14 space-y-20 lg:space-y-28">
              {TELAS.map((t, i) => (
                <div key={t.titulo} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
                  <div className={`lg:col-span-4 ${i % 2 ? "lg:order-2" : ""}`}>
                    <h3 className="text-2xl font-bold tracking-tight text-balance">{t.titulo}</h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-600">{t.texto}</p>
                    <ul className="mt-5 space-y-2.5">
                      {t.itens.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-[15px] text-slate-700">
                          <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`lg:col-span-8 ${i % 2 ? "lg:order-1" : ""}`}>
                    <MolduraNavegador imagem={t.imagem} alt={t.alt} />
                  </div>
                </div>
              ))}

              {/* Carnê com Pix */}
              <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-4 lg:order-2">
                  <h3 className="text-2xl font-bold tracking-tight text-balance">Carnê com QR Code do Pix</h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    Cada parcela sai com o QR Code já com o valor. Imprime em folha A4 (4 parcelas por folha) ou na
                    impressora térmica, um cupom por parcela.
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {[
                      "Via do aluno e via da autoescola",
                      "Recibo de pagamento em 1 ou 2 vias",
                      "Sua chave Pix e seu logotipo",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[15px] text-slate-700">
                        <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lg:col-span-8 lg:order-1">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/5 sm:p-5">
                    <Image
                      src={carne}
                      alt="Parcela do carnê com QR Code do Pix"
                      placeholder="blur"
                      sizes="(min-width: 1024px) 760px, 100vw"
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Personalização e celular */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Titulo
              chapeu="Do seu jeito"
              titulo="Com a cara da sua autoescola"
              texto="Escolha a cor do sistema, coloque seu logotipo e use no modo claro ou escuro."
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <Cartao icone={Palette} titulo="Oito cores para escolher" texto="Botões, menu e destaques mudam juntos.">
                <MolduraNavegador imagem={cores} alt="Configuração da cor principal do sistema" />
              </Cartao>
              <Cartao icone={Laptop} titulo="Modo escuro" texto="Mais conforto para os olhos no fim do dia.">
                <MolduraNavegador imagem={escuro} alt="Agenda no modo escuro" />
              </Cartao>
            </div>
            <div className="mt-6 grid items-center gap-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-10 lg:grid-cols-2">
              <div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Smartphone className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-2xl font-bold tracking-tight">Funciona no celular</h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  O instrutor confere a agenda do dia e marca presença do próprio celular. O dono acompanha os
                  pagamentos de onde estiver. Sem baixar aplicativo.
                </p>
              </div>
              <div className="flex justify-center gap-4 sm:gap-6">
                <div className="w-[44%] max-w-[230px]">
                  <MolduraCelular imagem={celularAgenda} alt="Agenda do dia no celular" />
                </div>
                <div className="mt-10 w-[44%] max-w-[230px]">
                  <MolduraCelular imagem={celularInicio} alt="Tela inicial no celular" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Preço */}
        <section id="preco" className="scroll-mt-20 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
              <div className="grid md:grid-cols-5">
                <div className="p-8 md:col-span-3 sm:p-10">
                  <p className="text-sm font-semibold tracking-wider text-blue-700 uppercase">Preço</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight">Planos a partir de {PRECO}</h2>
                  <p className="mt-3 text-base text-slate-600">
                    Fale com a gente para conhecer o plano ideal para o tamanho da sua autoescola.
                  </p>
                  <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                    {[
                      "Todos os recursos",
                      "Acesso no computador e no celular",
                      "Usuários para a equipe",
                      "Ajuda para começar",
                      "Atualizações incluídas",
                      "Seus dados exportáveis",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[15px] text-slate-700">
                        <Check className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col justify-center gap-3 border-t border-slate-200 bg-slate-50 p-8 md:col-span-2 md:border-t-0 md:border-l sm:p-10">
                  <div>
                    <span className="text-sm text-slate-500">a partir de</span>
                    <div className="text-5xl font-bold tracking-tight">{PRECO}</div>
                  </div>
                  {whatsapp ? (
                    <BotaoWhatsApp href={whatsapp} texto="Pedir proposta" />
                  ) : (
                    <p className="text-sm text-slate-600">Contato pelo WhatsApp em breve.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dúvidas */}
        <section id="duvidas" className="scroll-mt-20">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <Titulo chapeu="Dúvidas" titulo="Perguntas frequentes" />
            <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {[
                [
                  "Preciso instalar alguma coisa?",
                  "Não. O sistema abre no navegador (Chrome, Edge, Safari...), no computador ou no celular. É só entrar com e-mail e senha.",
                ],
                [
                  "Quantas pessoas podem usar?",
                  "Você cadastra os usuários da equipe: administrador (vê tudo, inclusive despesas) e secretaria (atendimento, agenda e pagamentos).",
                ],
                [
                  "Funciona com a minha impressora?",
                  "Sim. Fichas, guias e relatórios saem em qualquer impressora comum (A4). Recibos e carnê também podem sair em impressora térmica de 80 mm, como a Elgin i9.",
                ],
                [
                  "Posso usar o meu contrato?",
                  "Pode. Você envia o seu contrato em Word uma vez, marcando onde entram os dados, e o sistema preenche para cada aluno. Há um exemplo pronto para começar.",
                ],
                [
                  "E os meus dados?",
                  "Ficam guardados na nuvem e separados das outras autoescolas: cada uma só enxerga o que é dela. Se um dia precisar, todos os dados podem ser exportados.",
                ],
                [
                  "Como começo?",
                  "Chame no WhatsApp. A gente mostra o sistema funcionando, tira as dúvidas e deixa a sua autoescola pronta para usar.",
                ],
              ].map(([pergunta, resposta]) => (
                <details key={pergunta} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
                    {pergunta}
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Chamada final */}
        <section id="contato" className="scroll-mt-20 px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[var(--menu-fundo)] px-6 py-14 text-center text-white sm:px-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Pronto para organizar a sua autoescola?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Chame no WhatsApp e veja o sistema funcionando com a sua rotina.
            </p>
            <div className="mt-8 flex justify-center">
              {whatsapp ? (
                <BotaoWhatsApp href={whatsapp} texto="Falar no WhatsApp" />
              ) : (
                <p className="rounded-xl bg-white/10 px-5 py-3 text-base">Contato pelo WhatsApp em breve.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <span className="flex items-center gap-2">
            <Car className="size-4" aria-hidden /> {NOME}
          </span>
          <span>As telas mostram uma autoescola de demonstração, com dados fictícios.</span>
          <Link href="/login" className="hover:text-slate-900">
            Já sou cliente: entrar
          </Link>
        </div>
      </footer>

      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
          className="fixed right-4 bottom-4 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105 sm:right-6 sm:bottom-6"
        >
          <MessageCircle className="size-7" aria-hidden />
        </a>
      )}
    </div>
  );
}

function BotaoWhatsApp({ href, texto, pequeno = false }: { href: string; texto: string; pequeno?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] font-semibold whitespace-nowrap text-white shadow-sm transition hover:bg-[#1ebe5b] ${
        pequeno ? "px-3.5 py-2 text-sm" : "px-6 py-3 text-base"
      }`}
    >
      <MessageCircle className={pequeno ? "size-4" : "size-5"} aria-hidden />
      {texto}
    </a>
  );
}

function Titulo({ chapeu, titulo, texto }: { chapeu: string; titulo: string; texto?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-wider text-blue-700 uppercase">{chapeu}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{titulo}</h2>
      {texto && <p className="mt-4 text-lg text-slate-600">{texto}</p>}
    </div>
  );
}

function Destaque({ icone: Icone, titulo, texto }: { icone: LucideIcon; titulo: string; texto: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icone className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
      <div>
        <div className="text-[15px] font-semibold">{titulo}</div>
        <div className="text-sm text-slate-600">{texto}</div>
      </div>
    </div>
  );
}

function Cartao({
  icone: Icone,
  titulo,
  texto,
  children,
}: {
  icone: LucideIcon;
  titulo: string;
  texto: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <Icone className="mt-1 size-5 shrink-0 text-blue-600" aria-hidden />
        <div>
          <h3 className="text-lg font-semibold">{titulo}</h3>
          <p className="text-[15px] text-slate-600">{texto}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function MolduraNavegador({
  imagem,
  alt,
  prioridade = false,
}: {
  imagem: StaticImageData;
  alt: string;
  prioridade?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-4 py-2.5" aria-hidden>
        <span className="size-2.5 rounded-full bg-slate-300" />
        <span className="size-2.5 rounded-full bg-slate-300" />
        <span className="size-2.5 rounded-full bg-slate-300" />
      </div>
      <Image
        src={imagem}
        alt={alt}
        placeholder="blur"
        priority={prioridade}
        sizes="(min-width: 1152px) 1100px, 100vw"
        className="h-auto w-full"
      />
    </div>
  );
}

function MolduraCelular({ imagem, alt }: { imagem: StaticImageData; alt: string }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/25">
      <Image src={imagem} alt={alt} placeholder="blur" sizes="240px" className="h-auto w-full rounded-[1.6rem]" />
    </div>
  );
}
