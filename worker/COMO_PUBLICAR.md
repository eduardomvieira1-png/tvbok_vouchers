# Como publicar o intermediário (grátis)

O intermediário deixa o repositório **privado** e entrega o `vouchers.json` para o app.
A chave do GitHub fica guardada no Cloudflare e nunca vai para dentro do app.

Custo: **zero**. O plano gratuito do Cloudflare Workers permite 100 mil acessos por dia.
Se o Cloudflare pedir cartão ou oferecer upgrade, não aceite: o plano gratuito basta.

---

## 1. Criar a chave no GitHub (só leitura, só este repositório)

1. Entre no GitHub → foto no canto superior direito → **Settings**.
2. No fim do menu da esquerda: **Developer settings** → **Personal access tokens** → **Fine-grained tokens**.
3. Clique em **Generate new token**.
4. Preencha:
   - **Token name:** `tvbok-worker`
   - **Expiration:** escolha o prazo mais longo disponível (anote a data para renovar).
   - **Repository access:** **Only select repositories** → escolha `tvbok_vouchers`.
   - **Permissions → Repository permissions → Contents:** **Read-only**.
     (Não marque mais nada.)
5. Clique em **Generate token** e **copie** a chave (começa com `github_pat_`).
   Ela aparece uma única vez. Não mande para ninguém nem cole no app.

## 2. Criar o Worker no Cloudflare

1. Crie uma conta grátis em https://dash.cloudflare.com/sign-up (só e-mail e senha).
2. No painel, menu da esquerda: **Workers & Pages** (ou **Compute → Workers**) → **Create** → **Create Worker** (opção "Hello World").
3. Nome: `tvbok-vouchers` → **Deploy**.
4. Clique em **Edit code**, apague tudo o que estiver lá e cole o conteúdo de [`worker.js`](worker.js).
5. Clique em **Deploy** (canto superior direito).

## 3. Guardar a chave no Worker

1. Volte para a página do Worker → aba **Settings** → **Variables and Secrets** → **Add**.
2. **Type:** `Secret` · **Variable name:** `GITHUB_TOKEN` · **Value:** cole a chave do passo 1.
3. Clique em **Deploy** / **Save**.

## 4. Testar

Abra no navegador:

```
https://tvbok-vouchers.<sua-conta>.workers.dev/vouchers.json
```

(O endereço exato aparece na página do Worker.)

- Se aparecer o conteúdo do `vouchers.json` → está funcionando.
- `GITHUB_TOKEN não configurado` → refaça o passo 3.
- `Não foi possível ler os vouchers` → a chave está errada, vencida ou sem acesso ao repositório.

## 5. Apontar o app para o intermediário

No código do app, troque o endereço de onde ele baixa os vouchers:

```
de:   https://raw.githubusercontent.com/eduardomvieira1-png/tvbok_vouchers/main/vouchers.json
para: https://tvbok-vouchers.<sua-conta>.workers.dev/vouchers.json
```

Pronto. Continue gerando vouchers com `node gerar-voucher.mjs` e dando push normalmente.
O Worker mostra as alterações em até 1 minuto.

## Quando a chave vencer

Gere uma nova (passo 1) e troque o valor de `GITHUB_TOKEN` (passo 3). O app não muda.
