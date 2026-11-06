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

export const CATEGORIAS_POST: Record<string, string> = {
  alunos: "Alunos",
  vendas: "Vendas",
  avisos: "Avisos",
  conteudo: "Conteúdo",
  institucional: "A autoescola",
};

export type ModeloPost = {
  categoria: keyof typeof CATEGORIAS_POST;
  titulo: string;
  descricao: string;
  campos: CampoPost[];
  // Valores iniciais do formulário e da miniatura.
  exemplo: Record<string, string>;
};

export const FORMATOS_POST = {
  feed: { titulo: "Quadrado", largura: 1080, altura: 1080 },
  retrato: { titulo: "Retrato 4:5", largura: 1080, altura: 1350 },
  story: { titulo: "Stories / Status", largura: 1080, altura: 1920 },
} as const;
export type FormatoPost = keyof typeof FORMATOS_POST;

export const MODELOS_POST: Record<string, ModeloPost> = {
  aprovado: {
    categoria: "alunos",
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
    categoria: "vendas",
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
    categoria: "avisos",
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
    categoria: "conteudo",
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
    categoria: "institucional",
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
    categoria: "alunos",
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

// Modelos acrescentados depois: mesma estrutura dos de cima.
Object.assign(MODELOS_POST, {
  promocao: {
    categoria: "vendas",
    titulo: "Promoção / desconto",
    descricao: "Oferta com um destaque grande (ex.: 20% OFF).",
    campos: [
      { id: "destaque", rotulo: "Destaque", tipo: "texto", placeholder: "20% OFF", max: 16 },
      { id: "titulo", rotulo: "Título", tipo: "texto", max: 40 },
      { id: "texto", rotulo: "Texto", tipo: "textarea", max: 160 },
      { id: "validade", rotulo: "Validade", tipo: "texto", placeholder: "Só até sexta-feira", max: 40 },
      { id: "foto", rotulo: "Foto de fundo (opcional)", tipo: "foto" },
    ],
    exemplo: {
      destaque: "20% OFF",
      titulo: "Semana da habilitação",
      texto: "Desconto na matrícula da categoria B pagando à vista ou no Pix.",
      validade: "Só até sexta-feira",
    },
  },
  resultados: {
    categoria: "alunos",
    titulo: "Resultados do mês",
    descricao: "Quantos alunos foram aprovados (o número já vem do sistema).",
    campos: [
      { id: "numero", rotulo: "Número", tipo: "texto", max: 6 },
      { id: "rotulo", rotulo: "Texto do número", tipo: "texto", max: 50 },
      { id: "texto", rotulo: "Mensagem", tipo: "textarea", max: 140 },
    ],
    exemplo: {
      numero: "32",
      rotulo: "alunos aprovados este mês",
      texto: "Obrigado a cada aluno pela confiança. O próximo pode ser você!",
    },
  },
  comemorativa: {
    categoria: "avisos",
    titulo: "Data comemorativa",
    descricao: "Dia do Motorista, Dia das Mães, Natal, aniversário da cidade...",
    campos: [
      { id: "data", rotulo: "Data", tipo: "texto", placeholder: "25 de julho", max: 30 },
      { id: "titulo", rotulo: "Título", tipo: "texto", max: 40 },
      { id: "mensagem", rotulo: "Mensagem", tipo: "textarea", max: 180 },
      { id: "foto", rotulo: "Foto de fundo (opcional)", tipo: "foto" },
    ],
    exemplo: {
      data: "25 de julho",
      titulo: "Dia do Motorista",
      mensagem: "Parabéns a todos que fazem do trânsito um lugar mais seguro, todos os dias.",
    },
  },
  frota: {
    categoria: "institucional",
    titulo: "Nossa frota",
    descricao: "Mostre um veículo novo ou a frota da autoescola.",
    campos: [
      { id: "foto", rotulo: "Foto do veículo", tipo: "foto" },
      { id: "titulo", rotulo: "Título", tipo: "texto", max: 40 },
      { id: "modelo", rotulo: "Veículo", tipo: "texto", placeholder: "Chevrolet Onix 2025", max: 40 },
      { id: "detalhes", rotulo: "Detalhes", tipo: "texto", placeholder: "Ar-condicionado e duplo comando", max: 60 },
    ],
    exemplo: {
      titulo: "Carro novo na frota!",
      modelo: "Chevrolet Onix 2025",
      detalhes: "Ar-condicionado, câmbio manual e duplo comando",
    },
  },
  equipe: {
    categoria: "institucional",
    titulo: "Instrutor / equipe",
    descricao: "Apresente um instrutor ou alguém da equipe.",
    campos: [
      { id: "foto", rotulo: "Foto", tipo: "foto" },
      { id: "nome", rotulo: "Nome", tipo: "texto", max: 40 },
      { id: "cargo", rotulo: "Função", tipo: "texto", placeholder: "Instrutor categorias A e B", max: 50 },
      { id: "texto", rotulo: "Apresentação", tipo: "textarea", max: 160 },
    ],
    exemplo: {
      nome: "Carlos Pereira",
      cargo: "Instrutor categorias A e B",
      texto: "Há 12 anos ensinando a dirigir com calma e segurança.",
    },
  },
  quiz: {
    categoria: "conteudo",
    titulo: "Pergunta e resposta",
    descricao: "Quiz de trânsito para os seguidores comentarem.",
    campos: [
      { id: "pergunta", rotulo: "Pergunta", tipo: "textarea", max: 140 },
      { id: "alternativas", rotulo: "Alternativas (uma por linha)", tipo: "textarea", ajuda: "Até 4 linhas." },
      { id: "chamada", rotulo: "Chamada", tipo: "texto", placeholder: "Responda nos comentários!", max: 40 },
    ],
    exemplo: {
      pergunta: "Qual a distância mínima para estacionar de uma esquina?",
      alternativas: "3 metros\n5 metros\n10 metros",
      chamada: "Responda nos comentários!",
    },
  },
  horario: {
    categoria: "avisos",
    titulo: "Horário de atendimento",
    descricao: "Dias e horários da secretaria e das aulas.",
    campos: [
      { id: "titulo", rotulo: "Título", tipo: "texto", max: 40 },
      {
        id: "linhas",
        rotulo: "Horários (uma linha por dia)",
        tipo: "textarea",
        ajuda: "Ex.: Segunda a sexta: 8h às 19h",
      },
      { id: "obs", rotulo: "Observação", tipo: "texto", max: 60 },
    ],
    exemplo: {
      titulo: "Horário de atendimento",
      linhas: "Segunda a sexta: 8h às 19h\nSábado: 8h às 12h\nDomingo e feriados: fechado",
      obs: "Aulas práticas com hora marcada",
    },
  },
} satisfies Record<string, ModeloPost>);

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

export type Autoescola = {
  nome: string;
  cidade: string | null;
  uf: string | null;
  contato: string | null;
  instagram?: string | null;
};

function hashtagCidade(cidade: string | null) {
  if (!cidade) return "";
  const limpa = cidade
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]/g, "");
  return limpa ? ` #${limpa.toLowerCase()}` : "";
}

function rodape(a: Autoescola) {
  const linhas = [
    a.contato && `📲 ${a.contato}`,
    a.instagram && `📸 ${a.instagram}`,
    a.cidade && `📍 ${a.cidade}${a.uf ? `/${a.uf}` : ""}`,
  ].filter(Boolean);
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
    case "promocao":
      return [
        `🔥 ${v("titulo", "Promoção")}: ${v("destaque")}!\n\n${v("texto")}${v("validade") ? `\n\n⏳ ${v("validade")}` : ""}\n\nChame no WhatsApp e aproveite!${fim}`,
        `Oferta especial na ${a.nome} 💥\n\n${v("destaque")} — ${v("texto")}${v("validade") ? `\n${v("validade")}.` : ""}\n\nNão deixe para depois!${fim}`,
        `${v("destaque")} pra você tirar a CNH! 🚗\n\n${v("titulo")}\n${v("texto")}${v("validade") ? `\n\n📅 ${v("validade")}` : ""}${fim}`,
      ];
    case "resultados":
      return [
        `🏆 ${v("numero")} ${v("rotulo", "alunos aprovados")}!\n\n${v("texto")}\n\nQuer ser o próximo? Fale com a gente!${fim}`,
        `Resultado que dá orgulho 🙌\n\nForam ${v("numero")} ${v("rotulo", "alunos aprovados")} aqui na ${a.nome}.\n${v("texto")}${fim}`,
        `${v("numero")} sonhos realizados 🚗💨\n\n${v("texto")}\n\nParabéns a todos os nossos alunos!${fim}`,
      ];
    case "comemorativa":
      return [
        `${v("titulo")}${v("data") ? ` — ${v("data")}` : ""} 💙\n\n${v("mensagem")}\n\nCom carinho, ${a.nome}.${fim}`,
        `Hoje é ${v("titulo")}! 🎉\n\n${v("mensagem")}${fim}`,
        `✨ ${v("titulo")} ✨\n\n${v("mensagem")}\n\nUm abraço de toda a equipe da ${a.nome}!${fim}`,
      ];
    case "frota":
      return [
        `🚗 ${v("titulo", "Nossa frota")}\n\n${v("modelo")}${v("detalhes") ? `\n✅ ${v("detalhes")}` : ""}\n\nAprenda a dirigir com conforto e segurança. Agende sua aula!${fim}`,
        `Novidade na ${a.nome}! 😍\n\nChegou o ${v("modelo")}${v("detalhes") ? ` — ${v("detalhes").toLowerCase()}` : ""}.\n\nVem fazer sua aula nele!${fim}`,
        `Conheça nossa frota 👇\n\n${v("modelo")}\n${v("detalhes")}\n\nVeículos revisados e com duplo comando para sua segurança.${fim}`,
      ];
    case "equipe":
      return [
        `Conheça quem faz a ${a.nome} 💙\n\n${nome}${v("cargo") ? ` — ${v("cargo")}` : ""}.\n${v("texto")}${fim}`,
        `👋 Este é o ${primeiro}!\n\n${v("cargo")}\n${v("texto")}\n\nVem fazer aula com a nossa equipe!${fim}`,
        `Nossa equipe 🙌\n\n${nome}\n${v("cargo")}\n\n“${v("texto")}”${fim}`,
      ];
    case "quiz": {
      const alts = v("alternativas")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l, i) => `${"ABCD"[i]}) ${l}`)
        .join("\n");
      return [
        `🤔 Você sabe?\n\n${v("pergunta")}\n\n${alts}\n\n${v("chamada", "Responda nos comentários!")} 👇${fim}`,
        `Quiz do trânsito 🚦\n\n${v("pergunta")}\n${alts}\n\nComente a letra certa e marque um amigo!${fim}`,
        `Teste rápido 📝\n\n${v("pergunta")}\n\n${alts}\n\nAmanhã a gente posta a resposta!${fim}`,
      ];
    }
    case "horario":
      return [
        `🕗 ${v("titulo", "Horário de atendimento")}\n\n${v("linhas")}${v("obs") ? `\n\n${v("obs")}` : ""}\n\nEstamos te esperando!${fim}`,
        `Anote nossos horários 📌\n\n${v("linhas")}${v("obs") ? `\n\n${v("obs")}.` : ""}${fim}`,
        `Precisa falar com a gente? 📲\n\n${v("linhas")}\n\nNo WhatsApp também respondemos!${fim}`,
      ];
    default:
      return [fim.trim()];
  }
}
