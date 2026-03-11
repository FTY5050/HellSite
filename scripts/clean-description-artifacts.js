#!/usr/bin/env node
/**
 * Проходит по всем catalog/.../index.html, в блоках products-data чистит
 * артефакты в полях description и title: &nbsp;, пробелы, управляющие символы,
 * буквальные \\n \\r, двойное «Описание», UUID в тексте и т.п.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_PAGE = 'catalog/katalog-mku-pku/index.html';

function cleanDescription(str) {
  if (typeof str !== 'string') return str;
  let s = str;
  // Реальные переводы строк и CR — в пробел
  s = s.replace(/\n|\r/g, ' ');
  // Буквальные \n \r \t (два символа: слэш + буква) — в пробел
  s = s.replace(/\\[nrt]/g, ' ');
  // Управляющие символы (кроме пробела, таба) — убрать
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  // Двойное «Описание» в начале — оставить одно
  s = s.replace(/^Описание\s+Описание\s+/i, 'Описание ');
  // Заменить HTML-сущности на обычные символы (чтобы текст отображался без кодов)
  s = s.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
  s = s.replace(/&nbsp;/g, ' ').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&divide;/g, '÷');
  // Убрать завершающие пробелы
  s = s.replace(/\s+$/, '');
  // Убрать ведущие пробелы
  s = s.replace(/^\s+/, '');
  // Два и более подряд пробела или перевода строки — один пробел
  s = s.replace(/(?:\s|\n|\r)+/g, ' ');
  // UUID в середине текста (случайно попавший ID) — убрать
  s = s.replace(/\s[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\s/g, ' ');
  // Снова схлопнуть пробелы и trim
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

function cleanTitle(str) {
  if (typeof str !== 'string') return str;
  let s = str;
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === 'index.html') out.push(path.relative(ROOT, full));
  }
}

function extractProductsData(html) {
  const id = 'id="products-data"';
  const i = html.indexOf(id);
  if (i === -1) return { json: null, start: -1, end: -1 };
  const start = html.indexOf('[', i);
  const end = html.indexOf('</script>', start);
  if (start === -1 || end === -1) return { json: null, start: -1, end: -1 };
  const jsonStr = html.slice(start, end).trim();
  try {
    const arr = JSON.parse(jsonStr);
    return { json: Array.isArray(arr) ? arr : null, start, end };
  } catch (_) {
    return { json: null, start: -1, end: -1 };
  }
}

function updateProductsInHtml(html, newArr) {
  const { start, end } = extractProductsData(html);
  if (start === -1 || end === -1) return null;
  const newJsonStr = JSON.stringify(newArr, null, 2);
  return html.slice(0, start) + newJsonStr + html.slice(end);
}

const catalogDir = path.join(ROOT, 'catalog');
const files = [];
walk(catalogDir, files);

let totalFixed = 0;
let filesModified = 0;

for (const relPath of files) {
  if (relPath === TARGET_PAGE) continue;

  const fullPath = path.join(ROOT, relPath);
  const html = fs.readFileSync(fullPath, 'utf8');
  const { json } = extractProductsData(html);
  if (!json) continue;

  let changed = false;
  for (const card of json) {
    if (!card) continue;
    if (typeof card.title === 'string') {
      const t = cleanTitle(card.title);
      if (t !== card.title) {
        card.title = t;
        changed = true;
        totalFixed++;
      }
    }
    if (typeof card.description === 'string') {
      const cleaned = cleanDescription(card.description);
      if (cleaned !== card.description) {
        card.description = cleaned;
        changed = true;
        totalFixed++;
      }
    }
  }

  if (changed) {
    const newHtml = updateProductsInHtml(html, json);
    if (newHtml) {
      fs.writeFileSync(fullPath, newHtml, 'utf8');
      filesModified++;
      console.log('Cleaned:', relPath);
    }
  }
}

console.log('Done. Files modified:', filesModified, 'Descriptions fixed:', totalFixed);
