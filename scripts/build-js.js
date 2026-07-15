#!/usr/bin/env node
/**
 * build-js.js — concatena e minifica os módulos p-*.js do painel
 *
 * Os módulos NÃO usam ES modules; funções são globais.
 * O bundle usa format=iife com um wrapper que expõe tudo no escopo global,
 * mas como o código usa var/function (não let/const), eles já sobem para
 * window normalmente dentro do IIFE quando em modo não-strict.
 *
 * Estratégia: concatenar em ordem + minificar como um único bloco
 * (esbuild transform, não bundle), preservando o escopo global.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ORDER = [
  'p-core.js',
  'p-agenda.js',
  'p-clientes.js',
  'p-servicos.js',
  'p-equipe.js',
  'p-config.js',
  'p-analytics.js',
  'p-tema.js',
  'p-upgrade.js',
  'p-push.js',
];

const JS_DIR = path.join(__dirname, '..', 'js');
const OUT_DIR = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const concat = ORDER.map(f => {
  const p = path.join(JS_DIR, f);
  if (!fs.existsSync(p)) { console.warn(`⚠  Não encontrado: ${f}`); return ''; }
  return fs.readFileSync(p, 'utf8');
}).join('\n');

esbuild.transform(concat, {
  loader: 'js',
  minify: true,
  target: 'es2017',
}).then(result => {
  const outPath = path.join(OUT_DIR, 'painel.bundle.min.js');
  fs.writeFileSync(outPath, result.code);
  const kb = (result.code.length / 1024).toFixed(1);
  const srcKb = (concat.length / 1024).toFixed(1);
  console.log(`✓ dist/painel.bundle.min.js  ${srcKb} KB → ${kb} KB`);
  if (result.warnings.length) console.warn(result.warnings);
}).catch(e => { console.error(e); process.exit(1); });
