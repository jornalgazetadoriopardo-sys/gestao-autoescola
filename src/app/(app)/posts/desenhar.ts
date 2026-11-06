import { FORMATOS_POST, type FormatoPost } from "@/lib/posts";
import { hexParaOklch, textoSobre, transparente, type CoresPost } from "@/lib/cores";
import { FONTES } from "@/lib/fontes";

// Desenha a imagem do post (1080 de largura) num <canvas>, no navegador.
// Cada modelo monta uma lista de blocos (texto, selo, lista...) que primeiro
// são medidos e depois posicionados: assim o mesmo modelo serve no quadrado,
// no retrato 4:5 e nos stories sem cortar texto. Cores, fontes, escurecimento
// da foto, logotipo e texto legal vêm do Estilo (identidade da autoescola,
// ajustável em cada post).

export type Marca = {
  nome: string;
  contato: string | null;
  cidade: string | null;
  instagram: string | null;
  logo: HTMLImageElement | null;
};

export type Estilo = {
  cores: CoresPost;
  fonteTitulo: string;
  fonteTexto: string;
  // 0 a 0,95; null usa o padrão do modelo.
  escurecer: number | null;
  mostrarLogo: boolean;
  textoLegal: string | null;
};

export type Imagens = { foto?: HTMLImageElement | null };

// Quanto cada modelo escurece a foto, se a pessoa não mudar.
export const ESCURECER_PADRAO: Record<string, number> = {
  aprovado: 0.15,
  matriculas: 0.78,
  promocao: 0.75,
  comemorativa: 0.6,
  frota: 0,
  equipe: 0,
  depoimento: 0,
};

// Fonte dos títulos e dos textos do desenho atual.
let F_TITULO = FONTES.sistema;
let F_TEXTO = FONTES.sistema;
const fonte = (peso: number, tamanho: number, titulo: boolean) => {
  const f = titulo ? F_TITULO : F_TEXTO;
  return `${Math.min(peso, f.pesoMax)} ${tamanho}px ${f.familia}`;
};

function misturar(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const canal = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return "#" + [16, 8, 0].map((s) => canal(s).toString(16).padStart(2, "0")).join("");
}

// Cores derivadas da combinação escolhida.
function paleta(c: CoresPost) {
  const claroDemais = hexParaOklch(c.principal).l > 0.72;
  return {
    ...c,
    // Cor principal muito clara (amarelo, por exemplo) misturada ao escuro vira
    // um marrom sem graça: aí o fundo fica quase no escuro, só tingido.
    forte: claroDemais ? misturar(c.escuro, c.principal, 0.16) : misturar(c.principal, c.escuro, 0.35),
    escuro2: misturar(c.escuro, c.principal, 0.25),
    claro2: misturar(c.claro, c.principal, 0.14),
    sobrePrincipal: textoSobre(c.principal),
    // Cor de destaque sobre fundo claro (amarelo-claro não aparece no branco).
    acentoClaro: claroDemais ? c.escuro : c.principal,
  };
}
type Cores = ReturnType<typeof paleta>;

// ---- Texto -----------------------------------------------------------------

function quebrar(ctx: CanvasRenderingContext2D, texto: string, larguraMax: number) {
  const linhas: string[] = [];
  for (const paragrafo of texto.split("\n")) {
    let atual = "";
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (ctx.measureText(teste).width <= larguraMax || !atual) atual = teste;
      else {
        linhas.push(atual);
        atual = palavra;
      }
    }
    linhas.push(atual);
  }
  return linhas;
}

type Bloco = { h: number; desenhar: (y: number) => void };

type OpcoesTexto = {
  tamanho: number;
  minimo?: number;
  peso?: number;
  cor: string;
  maxLinhas?: number;
  altura?: number; // entrelinha (× tamanho)
  alinhar?: CanvasTextAlign;
  titulo?: boolean; // usa a fonte dos títulos
  x: number;
  largura: number;
};

// Texto que diminui sozinho até caber no número de linhas.
function texto(ctx: CanvasRenderingContext2D, conteudo: string, o: OpcoesTexto): Bloco {
  if (!conteudo.trim()) return { h: 0, desenhar: () => {} };
  const peso = o.peso ?? 400;
  const maxLinhas = o.maxLinhas ?? 3;
  const titulo = o.titulo ?? false;
  let tamanho = o.tamanho;
  let linhas: string[] = [];
  for (;;) {
    ctx.font = fonte(peso, tamanho, titulo);
    linhas = quebrar(ctx, conteudo, o.largura);
    if (linhas.length <= maxLinhas || tamanho <= (o.minimo ?? o.tamanho * 0.55)) break;
    tamanho -= 2;
  }
  if (linhas.length > maxLinhas) {
    linhas = linhas.slice(0, maxLinhas);
    linhas[maxLinhas - 1] = linhas[maxLinhas - 1].replace(/\s*\S*$/, "") + "…";
  }
  const passo = tamanho * (o.altura ?? 1.15);
  return {
    h: passo * linhas.length,
    desenhar: (y) => {
      ctx.font = fonte(peso, tamanho, titulo);
      ctx.fillStyle = o.cor;
      ctx.textAlign = o.alinhar ?? "left";
      ctx.textBaseline = "top";
      const x = o.alinhar === "center" ? o.x + o.largura / 2 : o.alinhar === "right" ? o.x + o.largura : o.x;
      linhas.forEach((l, i) => ctx.fillText(l, x, y + i * passo + (passo - tamanho) / 2));
    },
  };
}

function selo(
  ctx: CanvasRenderingContext2D,
  conteudo: string,
  o: { x: number; tamanho: number; fundo: string; cor?: string; centro?: number },
): Bloco {
  if (!conteudo.trim()) return { h: 0, desenhar: () => {} };
  ctx.font = fonte(800, o.tamanho, true);
  const w = Math.min(ctx.measureText(conteudo).width + o.tamanho * 1.4, 1080 - MARGEM * 2);
  const h = o.tamanho * 1.9;
  return {
    h,
    desenhar: (y) => {
      const x = o.centro !== undefined ? o.centro - w / 2 : o.x;
      ctx.fillStyle = o.fundo;
      retangulo(ctx, x, y, w, h, h / 2);
      ctx.fill();
      ctx.font = fonte(800, o.tamanho, true);
      ctx.fillStyle = o.cor ?? textoSobre(o.fundo);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(conteudo, x + w / 2, y + h / 2 + o.tamanho * 0.04, w - o.tamanho);
    },
  };
}

const espaco = (h: number): Bloco => ({ h, desenhar: () => {} });

// Posiciona os blocos na área (de cima, no centro ou embaixo).
function posicionar(blocos: Bloco[], topo: number, base: number, ancora: "topo" | "centro" | "base") {
  const total = blocos.reduce((s, b) => s + b.h, 0);
  let y = ancora === "topo" ? topo : ancora === "base" ? base - total : topo + Math.max((base - topo - total) / 2, 0);
  for (const b of blocos) {
    b.desenhar(y);
    y += b.h;
  }
}

// ---- Formas e imagens --------------------------------------------------------

function retangulo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Imagem cobrindo a área (corta as sobras, como object-fit: cover).
function cobrir(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const escala = Math.max(w / iw, h / ih);
  const sw = w / escala;
  const sh = h / escala;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 3, sw, sh, x, y, w, h);
}

function circuloFoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  r: number,
  borda: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  cobrir(ctx, img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
  ctx.lineWidth = r * 0.06;
  ctx.strokeStyle = borda;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function degrade(ctx: CanvasRenderingContext2D, y0: number, y1: number, de: string, ate: string, W: number, H: number) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, de);
  g.addColorStop(1, ate);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Foto de fundo inteira, escurecida com a cor escura da identidade.
function fotoDeFundo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number,
  cor: string,
  alfa: number,
) {
  cobrir(ctx, img, 0, 0, W, H);
  if (alfa > 0) {
    ctx.fillStyle = transparente(cor, alfa);
    ctx.fillRect(0, 0, W, H);
  }
}

// ---- Cabeçalho e rodapé -------------------------------------------------------

const MARGEM = 80;

function cabecalho(ctx: CanvasRenderingContext2D, marca: Marca, estilo: Estilo, claro: boolean, cores: Cores) {
  const y = 64;
  let x = MARGEM;
  if (marca.logo && estilo.mostrarLogo) {
    const s = 96;
    ctx.fillStyle = "#ffffff";
    retangulo(ctx, x, y, s, s, 22);
    ctx.fill();
    const iw = marca.logo.naturalWidth || 1;
    const ih = marca.logo.naturalHeight || 1;
    const e = Math.min((s - 16) / iw, (s - 16) / ih);
    ctx.drawImage(marca.logo, x + (s - iw * e) / 2, y + (s - ih * e) / 2, iw * e, ih * e);
    x += s + 24;
  }
  texto(ctx, marca.nome, {
    tamanho: 38,
    minimo: 26,
    peso: 700,
    titulo: true,
    cor: claro ? cores.escuro : "#ffffff",
    maxLinhas: 2,
    x,
    largura: 1080 - x - MARGEM,
    altura: 1.1,
  }).desenhar(y + 6);
  return y + 96 + 40;
}

// Faixa de baixo com contato, Instagram e cidade; o texto legal vai embaixo dela.
function rodape(ctx: CanvasRenderingContext2D, marca: Marca, estilo: Estilo, H: number, fundo: string) {
  const cor = textoSobre(fundo);
  const legal = estilo.textoLegal?.trim()
    ? texto(ctx, estilo.textoLegal.trim(), {
        tamanho: 22,
        minimo: 16,
        cor: transparente(cor, 0.78),
        maxLinhas: 3,
        x: MARGEM,
        largura: 1080 - MARGEM * 2,
        alinhar: "center",
        altura: 1.25,
      })
    : null;
  const h = 128 + (legal ? legal.h + 14 : 0);
  ctx.fillStyle = fundo;
  ctx.fillRect(0, H - h, 1080, h);
  const partes = [marca.contato, marca.instagram, marca.cidade].filter(Boolean).join("   ·   ");
  texto(ctx, partes || marca.nome, {
    tamanho: 34,
    minimo: 24,
    peso: 600,
    cor,
    maxLinhas: 1,
    x: MARGEM,
    largura: 1080 - MARGEM * 2,
    alinhar: "center",
  }).desenhar(H - h + (legal ? 30 : (128 - 40) / 2));
  legal?.desenhar(H - h + 30 + 40 + 12);
  return H - h;
}

// ---- Modelos -----------------------------------------------------------------

export function desenharPost(
  canvas: HTMLCanvasElement,
  modelo: string,
  dados: Record<string, string>,
  imagens: Imagens,
  marca: Marca,
  formato: FormatoPost,
  estilo: Estilo,
) {
  const { largura: W, altura: H } = FORMATOS_POST[formato];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  F_TITULO = FONTES[estilo.fonteTitulo] ?? FONTES.sistema;
  F_TEXTO = FONTES[estilo.fonteTexto] ?? FONTES.sistema;
  const cores = paleta(estilo.cores);
  const v = (k: string) => (dados[k] ?? "").trim();
  const largura = W - MARGEM * 2;
  // Mais altura (retrato e stories): letras maiores.
  const alto = H >= 1350;
  const story = H >= 1900;
  const foto = imagens.foto ?? null;
  const escurecer = estilo.escurecer ?? ESCURECER_PADRAO[modelo] ?? 0.5;
  const t = (feed: number, grande: number) => (story ? grande : alto ? Math.round((feed + grande) / 2) : feed);
  ctx.clearRect(0, 0, W, H);

  switch (modelo) {
    case "aprovado": {
      if (foto) {
        fotoDeFundo(ctx, foto, W, H, cores.escuro, escurecer);
        degrade(ctx, H * 0.3, H, "rgba(0,0,0,0)", transparente(cores.escuro, 0.96), W, H);
        degrade(ctx, 0, H * 0.22, transparente(cores.escuro, 0.75), "rgba(0,0,0,0)", W, H * 0.22);
      } else {
        degrade(ctx, 0, H, cores.escuro2, cores.escuro, W, H);
        const cx = W / 2;
        const cy = H * 0.36;
        const r = t(150, 210);
        ctx.fillStyle = cores.principal;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = cores.sobrePrincipal;
        ctx.lineWidth = r * 0.16;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.42, cy + r * 0.02);
        ctx.lineTo(cx - r * 0.1, cy + r * 0.34);
        ctx.lineTo(cx + r * 0.46, cy - r * 0.3);
        ctx.stroke();
      }
      cabecalho(ctx, marca, estilo, false, cores);
      const base = rodape(ctx, marca, estilo, H, cores.principal) - t(56, 140);
      posicionar(
        [
          selo(ctx, "APROVADO!", { x: MARGEM, tamanho: t(50, 60), fundo: cores.principal }),
          espaco(28),
          texto(ctx, v("nome"), {
            tamanho: t(100, 120),
            peso: 800,
            titulo: true,
            cor: "#ffffff",
            maxLinhas: 2,
            x: MARGEM,
            largura,
            altura: 1.05,
          }),
          espaco(14),
          texto(ctx, v("categoria") ? `Habilitado(a) na categoria ${v("categoria").toUpperCase()}` : "", {
            tamanho: t(42, 50),
            peso: 600,
            cor: cores.destaque,
            maxLinhas: 1,
            x: MARGEM,
            largura,
          }),
          espaco(10),
          texto(ctx, v("mensagem"), { tamanho: t(38, 46), cor: "#ffffffdd", maxLinhas: 2, x: MARGEM, largura }),
        ],
        0,
        base,
        "base",
      );
      break;
    }

    case "matriculas":
    case "promocao": {
      if (foto) fotoDeFundo(ctx, foto, W, H, cores.escuro, escurecer);
      else {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, cores.escuro);
        g.addColorStop(1, cores.forte);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        // Faixas diagonais discretas, lembrando a pista.
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#ffffff";
        for (let i = -2; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(W * 0.55 + i * 140, H);
          ctx.lineTo(W * 0.55 + i * 140 + 60, H);
          ctx.lineTo(W + i * 140 + 60, H * 0.35);
          ctx.lineTo(W + i * 140, H * 0.35);
          ctx.fill();
        }
        ctx.restore();
      }
      const topo = cabecalho(ctx, marca, estilo, false, cores);
      const base = rodape(ctx, marca, estilo, H, cores.principal);
      if (modelo === "promocao") {
        const r = t(200, 250);
        const circulo: Bloco = {
          h: r * 2,
          desenhar: (y) => {
            ctx.save();
            ctx.translate(W / 2, y + r);
            ctx.rotate(-0.08);
            ctx.fillStyle = cores.principal;
            ctx.beginPath();
            // Selo com bordas recortadas.
            for (let i = 0; i < 48; i++) {
              const ang = (i / 48) * Math.PI * 2;
              const raio = i % 2 ? r : r * 0.93;
              ctx.lineTo(Math.cos(ang) * raio, Math.sin(ang) * raio);
            }
            ctx.closePath();
            ctx.fill();
            const destaque = texto(ctx, v("destaque"), {
              tamanho: t(130, 150),
              minimo: 60,
              peso: 800,
              titulo: true,
              cor: cores.sobrePrincipal,
              maxLinhas: 2,
              x: -r * 0.8,
              largura: r * 1.6,
              alinhar: "center",
              altura: 1.0,
            });
            destaque.desenhar(-destaque.h / 2);
            ctx.restore();
          },
        };
        posicionar(
          [
            texto(ctx, v("titulo"), {
              tamanho: t(76, 96),
              peso: 800,
              titulo: true,
              cor: "#ffffff",
              maxLinhas: 2,
              x: MARGEM,
              largura,
              alinhar: "center",
              altura: 1.05,
            }),
            espaco(36),
            circulo,
            espaco(36),
            texto(ctx, v("texto"), {
              tamanho: t(38, 46),
              cor: "#ffffff",
              maxLinhas: 3,
              x: MARGEM,
              largura,
              alinhar: "center",
              altura: 1.3,
            }),
            espaco(v("validade") ? 26 : 0),
            selo(ctx, v("validade"), { x: 0, centro: W / 2, tamanho: t(30, 36), fundo: cores.destaque }),
          ],
          topo,
          base - 40,
          "centro",
        );
        break;
      }
      const condicoes = v("condicoes")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 4);
      posicionar(
        [
          selo(ctx, v("destaque").toUpperCase(), { x: MARGEM, tamanho: t(34, 40), fundo: cores.principal }),
          espaco(v("destaque") ? 30 : 0),
          texto(ctx, v("titulo"), {
            tamanho: t(108, 130),
            peso: 800,
            titulo: true,
            cor: "#ffffff",
            maxLinhas: 3,
            x: MARGEM,
            largura,
            altura: 1.0,
          }),
          espaco(30),
          texto(ctx, v("preco"), {
            tamanho: t(66, 80),
            peso: 800,
            titulo: true,
            cor: cores.destaque,
            maxLinhas: 2,
            x: MARGEM,
            largura,
            altura: 1.05,
          }),
          espaco(condicoes.length ? 34 : 0),
          ...condicoes.flatMap((c) => [
            texto(ctx, `✓  ${c}`, { tamanho: t(36, 44), peso: 500, cor: "#ffffff", maxLinhas: 1, x: MARGEM, largura }),
            espaco(10),
          ]),
          espaco(v("validade") ? 18 : 0),
          texto(ctx, v("validade"), {
            tamanho: t(30, 36),
            peso: 600,
            cor: "#ffffffbb",
            maxLinhas: 1,
            x: MARGEM,
            largura,
          }),
        ],
        topo + 20,
        base - 50,
        alto ? "centro" : "base",
      );
      break;
    }

    case "aviso":
    case "horario": {
      ctx.fillStyle = cores.claro;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = cores.principal;
      ctx.fillRect(0, 0, 24, H);
      const topo = cabecalho(ctx, marca, estilo, true, cores);
      const base = rodape(ctx, marca, estilo, H, cores.escuro);
      if (modelo === "horario") {
        const linhas = v("linhas")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 7);
        const linha = (l: string): Bloco => {
          const [dia, ...resto] = l.split(":");
          const hora = resto.join(":").trim();
          const altura = t(88, 110);
          return {
            h: altura,
            desenhar: (y) => {
              ctx.strokeStyle = cores.claro2;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(MARGEM, y + altura);
              ctx.lineTo(W - MARGEM, y + altura);
              ctx.stroke();
              const meio = y + altura / 2 - t(20, 24);
              texto(ctx, hora ? dia : l, {
                tamanho: t(40, 48),
                peso: 700,
                cor: cores.escuro,
                maxLinhas: 1,
                x: MARGEM,
                largura: hora ? largura * 0.55 : largura,
              }).desenhar(meio);
              if (hora) {
                texto(ctx, hora, {
                  tamanho: t(40, 48),
                  peso: 600,
                  cor: cores.acentoClaro,
                  maxLinhas: 1,
                  x: MARGEM + largura * 0.45,
                  largura: largura * 0.55,
                  alinhar: "right",
                }).desenhar(meio);
              }
            },
          };
        };
        posicionar(
          [
            texto(ctx, v("titulo"), {
              tamanho: t(84, 100),
              peso: 800,
              titulo: true,
              cor: cores.escuro,
              maxLinhas: 2,
              x: MARGEM,
              largura,
              altura: 1.05,
            }),
            espaco(30),
            ...linhas.map(linha),
            espaco(v("obs") ? 34 : 0),
            texto(ctx, v("obs"), { tamanho: t(34, 40), cor: "#475569", maxLinhas: 2, x: MARGEM, largura }),
          ],
          topo,
          base - 40,
          "centro",
        );
        break;
      }
      posicionar(
        [
          selo(ctx, "AVISO", { x: MARGEM, tamanho: t(38, 44), fundo: cores.principal }),
          espaco(34),
          texto(ctx, v("titulo"), {
            tamanho: t(92, 110),
            peso: 800,
            titulo: true,
            cor: cores.escuro,
            maxLinhas: 3,
            x: MARGEM,
            largura,
            altura: 1.05,
          }),
          espaco(30),
          texto(ctx, v("texto"), {
            tamanho: t(40, 48),
            cor: "#334155",
            maxLinhas: story ? 7 : 5,
            x: MARGEM,
            largura,
            altura: 1.35,
          }),
          espaco(v("data") ? 40 : 0),
          selo(ctx, v("data"), { x: MARGEM, tamanho: t(32, 38), fundo: cores.claro2, cor: cores.escuro }),
        ],
        topo,
        base - 40,
        "centro",
      );
      break;
    }

    case "dica":
    case "quiz": {
      degrade(ctx, 0, H, cores.forte, cores.escuro, W, H);
      ctx.save();
      ctx.font = `800 ${t(440, 560)}px Georgia, serif`;
      ctx.fillStyle = "#ffffff14";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(modelo === "quiz" ? "?" : "“", W - 30, t(60, 120));
      ctx.restore();
      const topo = cabecalho(ctx, marca, estilo, false, cores);
      const base = rodape(ctx, marca, estilo, H, cores.principal);
      if (modelo === "quiz") {
        const alternativas = v("alternativas")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 4);
        const caixa = (l: string, i: number): Bloco => {
          const altura = t(84, 104);
          return {
            h: altura + 16,
            desenhar: (y) => {
              ctx.fillStyle = "#ffffff1f";
              retangulo(ctx, MARGEM, y, largura, altura, 22);
              ctx.fill();
              const r = altura * 0.32;
              ctx.fillStyle = cores.principal;
              ctx.beginPath();
              ctx.arc(MARGEM + 24 + r, y + altura / 2, r, 0, Math.PI * 2);
              ctx.fill();
              ctx.font = fonte(800, r * 1.1, true);
              ctx.fillStyle = cores.sobrePrincipal;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("ABCD"[i], MARGEM + 24 + r, y + altura / 2 + 2);
              texto(ctx, l, {
                tamanho: t(36, 44),
                peso: 600,
                cor: "#ffffff",
                maxLinhas: 1,
                x: MARGEM + 24 + r * 2 + 24,
                largura: largura - r * 2 - 72,
              }).desenhar(y + altura / 2 - t(21, 25));
            },
          };
        };
        posicionar(
          [
            selo(ctx, "QUIZ DO TRÂNSITO", { x: MARGEM, tamanho: t(32, 38), fundo: "#ffffff", cor: cores.escuro }),
            espaco(34),
            texto(ctx, v("pergunta"), {
              tamanho: t(64, 76),
              minimo: 36,
              peso: 800,
              titulo: true,
              cor: "#ffffff",
              maxLinhas: 4,
              x: MARGEM,
              largura,
              altura: 1.12,
            }),
            espaco(36),
            ...alternativas.map(caixa),
            espaco(v("chamada") ? 20 : 0),
            texto(ctx, v("chamada"), {
              tamanho: t(36, 44),
              peso: 700,
              cor: cores.destaque,
              maxLinhas: 1,
              x: MARGEM,
              largura,
            }),
          ],
          topo,
          base - 30,
          "centro",
        );
        break;
      }
      posicionar(
        [
          selo(ctx, (v("titulo") || "Dica de trânsito").toUpperCase(), {
            x: MARGEM,
            tamanho: t(34, 40),
            fundo: "#ffffff",
            cor: cores.escuro,
          }),
          espaco(44),
          texto(ctx, v("dica"), {
            tamanho: t(62, 76),
            minimo: 38,
            peso: 700,
            titulo: true,
            cor: "#ffffff",
            maxLinhas: story ? 9 : 6,
            x: MARGEM,
            largura,
            altura: 1.22,
          }),
        ],
        topo,
        base - 30,
        "centro",
      );
      break;
    }

    case "curso":
    case "resultados": {
      degrade(ctx, 0, H, cores.escuro2, cores.escuro, W, H);
      ctx.fillStyle = cores.principal;
      ctx.beginPath();
      ctx.arc(W + 60, story ? H * 0.2 : H * 0.12, t(300, 380), 0, Math.PI * 2);
      ctx.fill();
      const topo = cabecalho(ctx, marca, estilo, false, cores);
      const base = rodape(ctx, marca, estilo, H, cores.principal);
      if (modelo === "resultados") {
        posicionar(
          [
            texto(ctx, v("numero"), {
              tamanho: t(300, 380),
              minimo: 120,
              peso: 800,
              titulo: true,
              cor: cores.destaque,
              maxLinhas: 1,
              x: MARGEM,
              largura,
              alinhar: "center",
              altura: 1.0,
            }),
            espaco(10),
            texto(ctx, v("rotulo"), {
              tamanho: t(56, 68),
              peso: 800,
              titulo: true,
              cor: "#ffffff",
              maxLinhas: 2,
              x: MARGEM,
              largura,
              alinhar: "center",
              altura: 1.1,
            }),
            espaco(30),
            texto(ctx, v("texto"), {
              tamanho: t(36, 44),
              cor: "#ffffffcc",
              maxLinhas: 3,
              x: MARGEM,
              largura,
              alinhar: "center",
              altura: 1.3,
            }),
          ],
          topo,
          base - 30,
          "centro",
        );
        break;
      }
      const info = [
        ["INÍCIO", v("inicio")],
        ["HORÁRIO", v("horario")],
      ].filter(([, valor]) => valor);
      posicionar(
        [
          selo(ctx, "NOVA TURMA", { x: MARGEM, tamanho: t(34, 40), fundo: cores.principal }),
          espaco(30),
          texto(ctx, v("curso"), {
            tamanho: t(100, 120),
            peso: 800,
            titulo: true,
            cor: "#ffffff",
            maxLinhas: 3,
            x: MARGEM,
            largura,
            altura: 1.02,
          }),
          espaco(info.length ? 50 : 0),
          ...info.flatMap(([rotulo, valor]) => [
            texto(ctx, rotulo, {
              tamanho: t(26, 30),
              peso: 700,
              cor: cores.destaque,
              maxLinhas: 1,
              x: MARGEM,
              largura,
            }),
            espaco(4),
            texto(ctx, valor, {
              tamanho: t(54, 64),
              peso: 700,
              titulo: true,
              cor: "#ffffff",
              maxLinhas: 1,
              x: MARGEM,
              largura,
            }),
            espaco(26),
          ]),
          espaco(v("detalhes") ? 10 : 0),
          texto(ctx, v("detalhes"), {
            tamanho: t(34, 40),
            peso: 500,
            cor: "#ffffffcc",
            maxLinhas: 2,
            x: MARGEM,
            largura,
          }),
        ],
        topo,
        base - 50,
        alto ? "centro" : "base",
      );
      break;
    }

    case "depoimento":
    case "equipe": {
      ctx.fillStyle = cores.claro;
      ctx.fillRect(0, 0, W, H);
      const topo = cabecalho(ctx, marca, estilo, true, cores);
      const base = rodape(ctx, marca, estilo, H, cores.principal);
      if (modelo === "equipe") {
        const r = t(170, 230);
        const nome = v("nome");
        const retrato: Bloco = {
          h: r * 2 + 30,
          desenhar: (y) => {
            if (foto) {
              if (escurecer > 0) {
                ctx.save();
                ctx.globalAlpha = 1 - escurecer;
                circuloFoto(ctx, foto, W / 2, y + r, r, cores.principal);
                ctx.restore();
              } else circuloFoto(ctx, foto, W / 2, y + r, r, cores.principal);
            } else {
              ctx.fillStyle = cores.principal;
              ctx.beginPath();
              ctx.arc(W / 2, y + r, r, 0, Math.PI * 2);
              ctx.fill();
              const iniciais = nome
                .split(/\s+/)
                .filter(Boolean)
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              ctx.font = fonte(800, r * 0.8, true);
              ctx.fillStyle = cores.sobrePrincipal;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(iniciais, W / 2, y + r + 4);
            }
          },
        };
        posicionar(
          [
            retrato,
            texto(ctx, nome, {
              tamanho: t(72, 86),
              peso: 800,
              titulo: true,
              cor: cores.escuro,
              maxLinhas: 1,
              x: MARGEM,
              largura,
              alinhar: "center",
            }),
            espaco(16),
            selo(ctx, v("cargo"), { x: 0, centro: W / 2, tamanho: t(32, 38), fundo: cores.principal }),
            espaco(28),
            texto(ctx, v("texto"), {
              tamanho: t(36, 44),
              cor: "#334155",
              maxLinhas: 3,
              x: MARGEM,
              largura,
              alinhar: "center",
              altura: 1.3,
            }),
          ],
          topo,
          base - 30,
          "centro",
        );
        break;
      }
      const r = t(96, 130);
      const blocos: Bloco[] = [
        texto(ctx, "★★★★★", {
          tamanho: t(52, 64),
          cor: cores.acentoClaro,
          maxLinhas: 1,
          x: MARGEM,
          largura,
          alinhar: "center",
        }),
        espaco(30),
        texto(ctx, `“${v("depoimento")}”`, {
          tamanho: t(54, 66),
          minimo: 34,
          peso: 600,
          titulo: true,
          cor: cores.escuro,
          maxLinhas: story ? 9 : 6,
          x: MARGEM,
          largura,
          alinhar: "center",
          altura: 1.28,
        }),
        espaco(46),
      ];
      if (foto) {
        blocos.push({ h: r * 2 + 24, desenhar: (y) => circuloFoto(ctx, foto, W / 2, y + r, r, cores.principal) });
      }
      blocos.push(
        texto(ctx, v("nome"), {
          tamanho: t(42, 50),
          peso: 800,
          titulo: true,
          cor: cores.escuro,
          maxLinhas: 1,
          x: MARGEM,
          largura,
          alinhar: "center",
        }),
        espaco(6),
        texto(ctx, v("categoria") ? `Habilitado(a) na categoria ${v("categoria").toUpperCase()}` : "", {
          tamanho: t(30, 36),
          cor: "#475569",
          maxLinhas: 1,
          x: MARGEM,
          largura,
          alinhar: "center",
        }),
      );
      posicionar(blocos, topo, base - 30, "centro");
      break;
    }

    case "comemorativa": {
      if (foto) fotoDeFundo(ctx, foto, W, H, cores.escuro, escurecer);
      else {
        ctx.fillStyle = cores.claro;
        ctx.fillRect(0, 0, W, H);
        // Confetes nas cores da identidade.
        const confetes = [cores.principal, cores.destaque, cores.forte];
        // Só nas faixas de cima e de baixo, para não passar atrás do texto.
        for (let i = 0; i < 26; i++) {
          const x = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
          const y = Math.abs((Math.sin(i * 78.233) * 12345.678) % 1);
          const faixa = i % 2 ? 0.2 + y * 0.12 : 0.68 + y * 0.12;
          ctx.fillStyle = transparente(confetes[i % 3], 0.55);
          ctx.beginPath();
          ctx.arc(x * W, faixa * H, 10 + (i % 4) * 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const claro = !foto;
      const topo = cabecalho(ctx, marca, estilo, claro, cores);
      const base = rodape(ctx, marca, estilo, H, cores.principal);
      posicionar(
        [
          selo(ctx, v("data").toUpperCase(), { x: 0, centro: W / 2, tamanho: t(34, 40), fundo: cores.principal }),
          espaco(34),
          texto(ctx, v("titulo"), {
            tamanho: t(112, 136),
            peso: 800,
            titulo: true,
            cor: claro ? cores.escuro : "#ffffff",
            maxLinhas: 3,
            x: MARGEM,
            largura,
            alinhar: "center",
            altura: 1.02,
          }),
          espaco(34),
          texto(ctx, v("mensagem"), {
            tamanho: t(40, 48),
            cor: claro ? "#334155" : "#ffffffdd",
            maxLinhas: 4,
            x: MARGEM,
            largura,
            alinhar: "center",
            altura: 1.32,
          }),
        ],
        topo,
        base - 30,
        "centro",
      );
      break;
    }

    case "frota": {
      degrade(ctx, 0, H, cores.escuro2, cores.escuro, W, H);
      const altoFoto = H * (story ? 0.55 : 0.58);
      if (foto) {
        cobrir(ctx, foto, 0, 0, W, altoFoto);
        if (escurecer > 0) {
          ctx.fillStyle = transparente(cores.escuro, escurecer);
          ctx.fillRect(0, 0, W, altoFoto);
        }
        degrade(ctx, 0, 240, transparente(cores.escuro, 0.7), "rgba(0,0,0,0)", W, 240);
        degrade(ctx, altoFoto - 160, altoFoto, "rgba(0,0,0,0)", cores.escuro, W, altoFoto);
      }
      cabecalho(ctx, marca, estilo, false, cores);
      const base = rodape(ctx, marca, estilo, H, cores.principal);
      posicionar(
        [
          selo(ctx, v("titulo").toUpperCase(), { x: MARGEM, tamanho: t(34, 40), fundo: cores.principal }),
          espaco(24),
          texto(ctx, v("modelo"), {
            tamanho: t(80, 96),
            peso: 800,
            titulo: true,
            cor: "#ffffff",
            maxLinhas: 2,
            x: MARGEM,
            largura,
            altura: 1.05,
          }),
          espaco(16),
          texto(ctx, v("detalhes"), {
            tamanho: t(36, 44),
            peso: 500,
            cor: cores.destaque,
            maxLinhas: 2,
            x: MARGEM,
            largura,
            altura: 1.25,
          }),
        ],
        foto ? altoFoto - 40 : 200,
        base - 40,
        foto ? "topo" : "centro",
      );
      break;
    }
  }
}
