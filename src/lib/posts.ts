// Posts para redes sociais: modelos (o que a pessoa preenche), exemplos e as
// legendas montadas a partir dos dados. A imagem é desenhada no navegador
// (src/app/(app)/posts/desenhar.ts). Sem nada de servidor: serve no cliente.

export type CampoPost = {
  id: string;
  rotulo: string;
  tipo: "texto" | "textarea" | "foto";
  placeholder?: string;
  ajuda?: string;
  max?: number;
};

export type ModeloPost = {
  titulo: string;
  descricao: string;
  campos: CampoPost[];
  // Valores iniciais do formulário e da miniatura.
  exemplo: Record<string, string>;
};

export const FORMATOS_POST = {
  feed: { titulo: "Feed (quadrado)", largura: 1080, altura: 1080 },
  story: { titulo: "Stories / Status", largura: 1080, altura: 1920 },
} as const;
export type FormatoPost = keyof typeof FORMATOS_POST;

export const MODELOS_POST: Record<string, ModeloPost> = {
  aprovado: {
    titulo: "Aluno aprovado",
    descricao: "Comemore quem passou no exame prático.",
    campos: [
      { id: "foto", rotulo: "Foto do aluno", tipo: "foto", ajuda: "Com a autorização de uso de imagem do aluno." },
      { id: "nome", rotulo: "Nome do aluno", tipo: "texto", max: 40 },
      { id: "categoria", rotulo: "Categoria", tipo: "texto", placeholder: "B", max: 4 },
      { id: "mensagem", rotulo: "Mensagem", tipo: "texto", max: 60 },
    ],
    exemplo: { nome: "Ana Beatriz", categoria: "B", mensagem: "Parabéns pela conquista!" },
  },
  matriculas: {
    titulo: "Matrículas abertas / promoção",
    descricao: "Divulgue preço, condições e a validade da oferta.",
    campos: [
      { id: "titulo", rotulo: "Título", tipo: "texto", max: 40 },
      { id: "destaque", rotulo: "Destaque", tipo: "texto", placeholder: "Categoria A e B", max: 30 },
      { id: "preco", rotulo: "Preço", tipo: "texto", placeholder: "a partir de R$ 1.500", max: 30 },
      {
        id: "condicoes",
        rotulo: "Condições (uma por linha)",
        tipo: "textarea",
        ajuda: "Aparecem como uma lista com ✓. Use até 4 linhas.",
      },
      { id: "validade", rotulo: "Validade", tipo: "texto", placeholder: "Válido até 30/11", max: 40 },
      { id: "foto", rotulo: "Foto de fundo (opcional)", tipo: "foto", ajuda: "Ex.: um carro da frota ou a fachada." },
    ],
    exemplo: {
      titulo: "Matrículas abertas",
      destaque: "Categorias A e B",
      preco: "a partir de R$ 1.500",
      condicoes: "Parcelamos no carnê\nAulas de segunda a sábado\nCurso teórico grátis pelo app",
      validade: "Vagas limitadas",
    },
  },
  aviso: {
    titulo: "Aviso / feriado",
    descricao: "Recesso, feriado, mudança de horário.",
    campos: [
      { id: "titulo", rotulo: "Título", tipo: "texto", max: 50 },
      { id: "texto", rotulo: "Texto", tipo: "textarea", max: 220 },
      { id: "data", rotulo: "Data", tipo: "texto", placeholder: "20/11 – Dia da Consciência Negra", max: 50 },
    ],
    exemplo: {
      titulo: "Não haverá expediente",
      texto: "Na sexta-feira não teremos aulas nem atendimento. Voltamos normalmente na segunda.",
      data: "20/11 – Dia da Consciência Negra",
    },
  },
  dica: {
    titulo: "Dica de trânsito",
    descricao: "Conteúdo educativo para engajar seguidores.",
    campos: [
      { id: "titulo", rotulo: "Título", tipo: "texto", max: 40 },
      { id: "dica", rotulo: "Dica", tipo: "textarea", max: 200, ajuda: "Ou clique em “Sugerir dica”." },
    ],
    exemplo: {
      titulo: "Dica de trânsito",
      dica: "Mantenha distância segura do carro da frente: conte dois segundos depois que ele passar por um ponto fixo.",
    },
  },
  curso: {
    titulo: "Nova turma / curso",
    descricao: "Reciclagem, curso especializado, turma teórica.",
    campos: [
      { id: "curso", rotulo: "Curso", tipo: "texto", max: 50 },
      { id: "inicio", rotulo: "Início", tipo: "texto", placeholder: "10/11", max: 30 },
      { id: "horario", rotulo: "Horário", tipo: "texto", placeholder: "19h às 22h", max: 30 },
      { id: "detalhes", rotulo: "Detalhes", tipo: "texto", placeholder: "Vagas limitadas", max: 50 },
    ],
    exemplo: { curso: "Curso de reciclagem", inicio: "10/11", horario: "19h às 22h", detalhes: "Vagas limitadas" },
  },
  depoimento: {
    titulo: "Depoimento de aluno",
    descricao: "A opinião de quem já tirou a CNH com vocês.",
    campos: [
      { id: "foto", rotulo: "Foto do aluno (opcional)", tipo: "foto" },
      { id: "nome", rotulo: "Nome do aluno", tipo: "texto", max: 40 },
      { id: "depoimento", rotulo: "Depoimento", tipo: "textarea", max: 220 },
      { id: "categoria", rotulo: "Categoria", tipo: "texto", placeholder: "B", max: 4 },
    ],
    exemplo: {
      nome: "Lucas Ferreira",
      depoimento: "Os instrutores tiveram muita paciência comigo. Passei de primeira na prova prática!",
      categoria: "B",
    },
  },
};

export const DICAS_TRANSITO = [
  "Mantenha distância segura do carro da frente: conte dois segundos depois que ele passar por um ponto fixo.",
  "Use a seta sempre, mesmo quando não houver ninguém por perto. É obrigatório e evita acidentes.",
  "Celular ao volante é infração gravíssima. Se precisar atender, pare em local seguro.",
  "Na chuva, reduza a velocidade e aumente a distância: o carro leva mais tempo para frear.",
  "Faixa de pedestres é prioridade de quem atravessa. Reduza e pare antes dela.",
  "Antes de sair, ajuste banco e espelhos. Dirigir confortável é dirigir com segurança.",
  "Motociclista: capacete afivelado e viseira abaixada, sempre. Sem viseira, use óculos de proteção.",
  "Farol baixo ligado em rodovias de pista simples é obrigatório, inclusive de dia.",
  "Cinto de segurança é para todos no carro, inclusive no banco de trás.",
  "Cansou? Pare e descanse. Dirigir com sono é tão perigoso quanto dirigir alcoolizado.",
];

export type Autoescola = { nome: string; cidade: string | null; uf: string | null; contato: string | null };

function hashtagCidade(cidade: string | null) {
  if (!cidade) return "";
  const limpa = cidade
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]/g, "");
  return limpa ? ` #${limpa.toLowerCase()}` : "";
}

function rodape(a: Autoescola) {
  const linhas = [a.contato && `📲 ${a.contato}`, a.cidade && `📍 ${a.cidade}${a.uf ? `/${a.uf}` : ""}`].filter(
    Boolean,
  );
  return `${linhas.length ? `\n\n${linhas.join("\n")}` : ""}\n\n#autoescola #cnh #habilitacao #direcao${hashtagCidade(a.cidade)}`;
}

// Algumas versões de legenda para cada modelo; "Gerar outra" passa para a próxima.
export function legendas(modelo: string, d: Record<string, string>, a: Autoescola): string[] {
  const v = (k: string, padrao = "") => (d[k] ?? "").trim() || padrao;
  const nome = v("nome", "nosso aluno");
  const primeiro = nome.split(" ")[0];
  const cat = v("categoria") ? ` na categoria ${v("categoria").toUpperCase()}` : "";
  const fim = rodape(a);
  const lista = v("condicoes")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `✅ ${l}`)
    .join("\n");

  switch (modelo) {
    case "aprovado":
      return [
        `🎉 APROVADO! 🎉\n\nParabéns, ${nome}! Habilitado${cat} aqui na ${a.nome}. ${v("mensagem", "Desejamos muitas viagens com segurança!")} 🚗💨\n\nQuer ser o próximo? Chama a gente!${fim}`,
        `Mais um sonho realizado! 🙌\n\n${primeiro} passou no exame prático${cat} e agora é motorista habilitado(a). Foi um prazer fazer parte dessa conquista!\n\nSua vez está chegando: fale com a gente e comece hoje.${fim}`,
        `Aprovado(a) de primeira? Aqui é assim! 😄\n\nParabéns, ${nome}, pela aprovação${cat}. Obrigado pela confiança na ${a.nome}.\n\nMatrículas abertas — vem tirar a sua CNH também!${fim}`,
      ];
    case "matriculas":
      return [
        `🚗 ${v("titulo", "Matrículas abertas")}! ${v("destaque") ? `\n\n${v("destaque")}` : ""}${v("preco") ? ` — ${v("preco")}` : ""}\n\n${lista}${v("validade") ? `\n\n⏳ ${v("validade")}` : ""}\n\nChame no WhatsApp e garanta sua vaga!${fim}`,
        `Chegou a hora de tirar a sua CNH! 🙌\n\n${v("titulo", "Matrículas abertas")} na ${a.nome}${v("destaque") ? ` para ${v("destaque").toLowerCase()}` : ""}.${v("preco") ? `\n💰 ${v("preco")}` : ""}\n\n${lista}${v("validade") ? `\n\n${v("validade")}.` : ""}\n\nFale com a gente!${fim}`,
        `Seu documento de motorista começa aqui 👇\n\n📌 ${v("titulo", "Matrículas abertas")}${v("destaque") ? ` · ${v("destaque")}` : ""}${v("preco") ? `\n📌 ${v("preco")}` : ""}\n${lista}\n\nNão deixe para depois!${fim}`,
      ];
    case "aviso":
      return [
        `⚠️ AVISO ⚠️\n\n${v("titulo")}${v("data") ? ` — ${v("data")}` : ""}\n\n${v("texto")}\n\nObrigado pela compreensão!${fim}`,
        `📢 ${v("titulo")}\n\n${v("texto")}${v("data") ? `\n\n🗓️ ${v("data")}` : ""}\n\nQualquer dúvida, chame no WhatsApp.${fim}`,
        `Atenção, alunos e clientes! 👀\n\n${v("titulo")}${v("data") ? ` (${v("data")})` : ""}.\n${v("texto")}${fim}`,
      ];
    case "dica":
      return [
        `💡 ${v("titulo", "Dica de trânsito")}\n\n${v("dica")}\n\nSalve este post e compartilhe com quem está aprendendo a dirigir! 🚦${fim}`,
        `Você sabia? 🤔\n\n${v("dica")}\n\nAqui na ${a.nome} a gente ensina a dirigir com segurança de verdade.${fim}`,
        `🚦 ${v("titulo", "Dica de trânsito")} da semana:\n\n${v("dica")}\n\nMarque um amigo que precisa ver isso! 👇${fim}`,
      ];
    case "curso":
      return [
        `📚 ${v("curso", "Nova turma")}!\n\n${v("inicio") ? `🗓️ Início: ${v("inicio")}\n` : ""}${v("horario") ? `🕖 Horário: ${v("horario")}\n` : ""}${v("detalhes") ? `✅ ${v("detalhes")}\n` : ""}\nGaranta sua vaga pelo WhatsApp!${fim}`,
        `Nova turma chegando! 🙌\n\n${v("curso", "Curso")} na ${a.nome}${v("inicio") ? `, começando dia ${v("inicio")}` : ""}${v("horario") ? `, das ${v("horario")}` : ""}.\n${v("detalhes")}\n\nChame a gente para fazer sua inscrição.${fim}`,
        `📌 ${v("curso", "Nova turma")}\n${[v("inicio") && `Início: ${v("inicio")}`, v("horario") && `Horário: ${v("horario")}`, v("detalhes")].filter(Boolean).join(" · ")}\n\nInscrições abertas!${fim}`,
      ];
    case "depoimento":
      return [
        `⭐⭐⭐⭐⭐\n\n“${v("depoimento")}”\n\n— ${nome}${cat ? `, habilitado(a)${cat}` : ""}\n\nObrigado pelo carinho, ${primeiro}! 💙${fim}`,
        `Quem tira a CNH com a gente recomenda! 🙌\n\n“${v("depoimento")}”\n— ${nome}\n\nVem fazer parte dessa história também.${fim}`,
        `O que nossos alunos dizem 💬\n\n“${v("depoimento")}”\n\n${nome}${cat}. Muito obrigado!${fim}`,
      ];
    default:
      return [fim.trim()];
  }
}
