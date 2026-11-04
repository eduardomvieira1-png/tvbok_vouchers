// Intermediário do TV BOK (Cloudflare Worker).
// Lê o vouchers.json do repositório privado usando uma chave que fica guardada
// no Cloudflare (segredo GITHUB_TOKEN). O app pede o arquivo aqui e nunca vê a chave.
//
// Endereço para o app: https://<nome-do-worker>.<sua-conta>.workers.dev/vouchers.json

const REPO = "eduardomvieira1-png/tvbok_vouchers";
const ARQUIVO = "vouchers.json";
const BRANCH = "main";
const CACHE_SEGUNDOS = 60; // evita pedir ao GitHub a cada acesso

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "GET") return resposta("Método não permitido", 405);
    if (url.pathname !== "/" && url.pathname !== "/" + ARQUIVO) return resposta("Não encontrado", 404);
    if (!env.GITHUB_TOKEN) return resposta("GITHUB_TOKEN não configurado no Cloudflare", 500);

    // Cache do próprio Cloudflare (se disponível)
    const cache = typeof caches !== "undefined" ? caches.default : null;
    const chave = new Request(url.origin + "/" + ARQUIVO);
    if (cache) {
      const guardado = await cache.match(chave);
      if (guardado) return guardado;
    }

    const gh = await fetch(`https://api.github.com/repos/${REPO}/contents/${ARQUIVO}?ref=${BRANCH}`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.raw+json",
        "User-Agent": "tvbok-vouchers-worker",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!gh.ok) {
      // Não repassa detalhes do GitHub para o público
      console.log("GitHub respondeu", gh.status, await gh.text());
      return resposta("Não foi possível ler os vouchers", 502);
    }

    const texto = await gh.text();
    try {
      JSON.parse(texto);
    } catch {
      return resposta("vouchers.json inválido no repositório", 502);
    }

    const r = new Response(texto, {
      headers: {
        ...CORS,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `public, max-age=${CACHE_SEGUNDOS}`,
      },
    });
    if (cache) ctx.waitUntil(cache.put(chave, r.clone()));
    return r;
  },
};

function resposta(msg, status) {
  return new Response(JSON.stringify({ erro: msg }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}
