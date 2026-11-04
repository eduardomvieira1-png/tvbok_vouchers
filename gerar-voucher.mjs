#!/usr/bin/env node
// Gera vouchers e grava só o hash em vouchers.json (o código aparece uma única vez, no terminal).
//
// Uso:
//   node gerar-voucher.mjs --qtd 5 --dias 30 --nota "Cliente João"
//   node gerar-voucher.mjs --desativar K7QM-4HXP
//   node gerar-voucher.mjs --reativar  K7QM-4HXP
//
// Depois: git add vouchers.json && git commit -m "novos vouchers" && git push
//
// Os códigos têm 8 caracteres (fáceis de digitar no controle remoto). Como o vouchers.json
// é público, eles são guardados com PBKDF2 (hash lento), para não serem descobertos por
// tentativa e erro. Códigos antigos "TVBK-XXXX-XXXX-XXXX" (campo "hash", SHA-256) continuam valendo.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash, pbkdf2Sync, randomBytes, randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Sem 0/O, 1/I/L para evitar confusão ao digitar
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ITERACOES = 100000;
const ARQUIVO = join(dirname(fileURLToPath(import.meta.url)), "vouchers.json");

const args = lerArgs(process.argv.slice(2));
const base = existsSync(ARQUIVO) ? JSON.parse(readFileSync(ARQUIVO, "utf8")) : { listas: { canais: "", filmesSeries: "" }, vouchers: [] };
if (!base.kdf) base.kdf = { salt: randomBytes(16).toString("hex"), iteracoes: ITERACOES };

if (args.desativar || args.reativar) {
  const codigo = args.desativar || args.reativar;
  const sha = sha256De(codigo);
  const pb = pbkdf2De(codigo);
  const v = base.vouchers.find((x) => x.hash === sha || x.pbkdf2 === pb);
  if (!v) sair(`Voucher não encontrado: ${codigo}`);
  v.ativo = Boolean(args.reativar);
  salvar();
  console.log(`${codigo} -> ${v.ativo ? "reativado" : "desativado"}`);
} else {
  const qtd = Number(args.qtd || 1);
  const dias = args.dias ? Number(args.dias) : null;
  const expira = dias ? new Date(Date.now() + dias * 86400_000).toISOString().slice(0, 10) : null;
  const existentes = new Set(base.vouchers.map((x) => x.pbkdf2).filter(Boolean));

  console.log(`\nVouchers gerados (anote agora, eles NÃO ficam salvos em texto):\n`);
  for (let i = 0; i < qtd; i++) {
    let codigo, pb;
    do { codigo = gerarCodigo(); pb = pbkdf2De(codigo); } while (existentes.has(pb));
    existentes.add(pb);
    base.vouchers.push({
      pbkdf2: pb,
      ativo: true,
      expira,
      nota: args.nota || "",
      criado: new Date().toISOString().slice(0, 10),
    });
    console.log("  " + codigo);
  }
  salvar();
  console.log(`\nValidade: ${expira || "sem data"}`);
}

function gerarCodigo() {
  const bloco = () => Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  return `${bloco()}-${bloco()}`;
}

// Mesma regra do app: ignora maiúsculas/minúsculas, espaços e traços
function normalizar(codigo) {
  return String(codigo).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function sha256De(codigo) {
  return createHash("sha256").update(normalizar(codigo)).digest("hex");
}

function pbkdf2De(codigo) {
  return pbkdf2Sync(normalizar(codigo), Buffer.from(base.kdf.salt, "hex"), base.kdf.iteracoes, 32, "sha256").toString("hex");
}

function salvar() {
  writeFileSync(ARQUIVO, JSON.stringify(base, null, 2) + "\n");
}

function lerArgs(lista) {
  const r = {};
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].startsWith("--")) {
      const k = lista[i].slice(2);
      const prox = lista[i + 1];
      r[k] = prox && !prox.startsWith("--") ? (i++, prox) : true;
    }
  }
  return r;
}

function sair(msg) {
  console.error(msg);
  process.exit(1);
}
