#!/usr/bin/env node
/**
 * Проверка всех страниц каталога: подсчёт страниц с products-data,
 * пустые массивы, невалидный JSON, список разделов.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const catalogDir = path.join(ROOT, 'catalog');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === 'index.html') out.push(path.relative(ROOT, full));
  }
}

const files = [];
walk(catalogDir, files);

let empty = 0;
let invalid = 0;
const emptyList = [];
const invalidList = [];
const bySection = Object.create(null);

for (const f of files) {
  const section = f.split('/')[1] || 'other';
  bySection[section] = (bySection[section] || 0) + 1;

  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const i = html.indexOf('id="products-data"');
  if (i === -1) continue;

  const start = html.indexOf('[', i);
  const end = html.indexOf('</script>', start);
  if (start === -1 || end === -1) {
    invalid++;
    invalidList.push(f);
    continue;
  }

  const json = html.slice(start, end).trim();
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) {
      invalid++;
      invalidList.push(f);
      continue;
    }
    if (arr.length === 0) {
      empty++;
      emptyList.push(f);
    }
  } catch (err) {
    invalid++;
    invalidList.push(f);
  }
}

console.log('=== Проверка каталога ===\n');
console.log('Всего index.html в catalog/:', files.length);
console.log('С блоком products-data:', files.filter((f) => {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  return html.indexOf('id="products-data"') !== -1;
}).length);
console.log('С пустым массивом (0 карточек):', empty);
console.log('С невалидным JSON:', invalid);

if (emptyList.length) {
  console.log('\nПустые страницы:');
  emptyList.forEach((p) => console.log('  ', p));
}
if (invalidList.length) {
  console.log('\nНевалидный JSON:');
  invalidList.forEach((p) => console.log('  ', p));
}

console.log('\nРазделы (число страниц):');
const sections = Object.keys(bySection).sort();
sections.forEach((s) => console.log('  ', s, bySection[s]));

console.log('\nГотово.');
