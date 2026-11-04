#!/usr/bin/env node
// Gera vouchers e grava só o hash em vouchers.json (o código aparece uma única vez, no terminal).
//
// Uso:
//   node gerar-voucher.mjs --qtd 5 --dias 30 --nota "Cliente João"
//   node gerar-voucher.mjs --desativar TVBK-ABCD-EFGH-JKMN
//   node gerar-voucher.mjs --reativar  TVBK-ABCD-EFGH-JKMN
//
// Depois: git add vouchers.json && git commit -m "novos vouchers" && git push

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash, randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Sem 0/O, 1/I/L para evitar confusão ao digitar
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ARQUIVO = join(dirname(fileURLToPath(import.meta.url)), "vouchers.json");

const args = lerArgs(process.argv.slice(2));
const base = existsSync(ARQUIVO) ? JSON.parse(readFileSync(ARQUIVO, "utf8")) : { listas: { canais: "", filmesSeries: "" }, vouchers: [] };

if (args.desativar || args.reativar) {
  const codigo = args.desativar || args.reativar;
  const hash = hashDe(codigo);
  const v = base.vouchers.find((x) => x.hash === hash);
  if (!v) sair(`Voucher não encontrado: ${codigo}`);
  v.ativo = Boolean(args.reativar);
  salvar();
  console.log(`${codigo} -> ${v.ativo ? "reativado" : "desativado"}`);
} else {
  const qtd = Number(args.qtd || 1);
  const dias = args.dias ? Number(args.dias) : null;
  const expira = dias ? new Date(Date.now() + dias * 86400_000).toISOString().slice(0, 10) : null;

  console.log(`\nVouchers gerados (anote agora, eles NÃO ficam salvos em texto):\n`);
  for (let i = 0; i < qtd; i++) {
    const codigo = gerarCodigo();
    base.vouchers.push({
      hash: hashDe(codigo),
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
  return `TVBK-${bloco()}-${bloco()}-${bloco()}`;
}

// Mesma regra do Worker: ignora caixa, espaços e traços
function hashDe(codigo) {
  const normal = String(codigo).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return createHash("sha256").update(normal).digest("hex");
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
