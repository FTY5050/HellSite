#!/usr/bin/env node
/**
 * Собирает все карточки товаров из catalog/.../index.html в один массив,
 * фильтрует заглушки, пересчитывает пути к картинкам для catalog/katalog-mku-pku/,
 * дедуплицирует и обновляет catalog/katalog-mku-pku/index.html.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_PAGE = 'catalog/katalog-mku-pku/index.html';

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === 'index.html') out.push(path.relative(ROOT, full));
  }
}

/** Путь к img от страницы catalog/katalog-mku-pku/ (всегда ../../upload/...) */
function normalizeImgPath(img) {
  if (!img || typeof img !== 'string') return img;
  const idx = img.indexOf('upload/');
  if (idx === -1) return img;
  return '../../' + img.slice(idx);
}

function isPlaceholder(card) {
  if (card.props !== null && card.props !== undefined) return false;
  const img = (card.img || '').toString();
  return /group_/.test(img);
}

function extractProductsData(html) {
  const id = 'id="products-data"';
  const i = html.indexOf(id);
  if (i === -1) return null;
  const start = html.indexOf('[', i);
  const end = html.indexOf('</script>', start);
  if (start === -1 || end === -1) return null;
  const json = html.slice(start, end).trim();
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : null;
  } catch (_) {
    return null;
  }
}

const catalogDir = path.join(ROOT, 'catalog');
const files = [];
walk(catalogDir, files);

const seen = new Set();
const all = [];

for (const relPath of files) {
  if (relPath === TARGET_PAGE) continue;

  const fullPath = path.join(ROOT, relPath);
  const html = fs.readFileSync(fullPath, 'utf8');
  const arr = extractProductsData(html);
  if (!arr) continue;

  for (const card of arr) {
    if (isPlaceholder(card)) continue;

    const key = (card.title || '') + '\0' + (card.img || '');
    if (seen.has(key)) continue;
    seen.add(key);

    const copy = { ...card };
    if (copy.img) copy.img = normalizeImgPath(copy.img);
    all.push(copy);
  }
}

const targetPath = path.join(ROOT, TARGET_PAGE);
let targetHtml = fs.readFileSync(targetPath, 'utf8');

const dataScriptStart = targetHtml.indexOf('<script type="application/json" id="products-data">');
const dataScriptEnd = targetHtml.indexOf('</script>', dataScriptStart);
if (dataScriptStart === -1 || dataScriptEnd === -1) {
  console.error('Не найден блок #products-data в', TARGET_PAGE);
  process.exit(1);
}

const jsonStr = JSON.stringify(all, null, 2);
const before = targetHtml.slice(0, dataScriptStart + '<script type="application/json" id="products-data">'.length);
const after = targetHtml.slice(dataScriptEnd);
const newContent = before + '\n' + jsonStr + '\n' + after;

fs.writeFileSync(targetPath, newContent, 'utf8');
console.log('Собрано карточек:', all.length);
console.log('Обновлён файл:', TARGET_PAGE);
