#!/usr/bin/env node
/**
 * Удаляет чужие карточки из указанных страниц каталога по правилам:
 * - ВРУ: только ВРУ для ФОВ-* ; убрать Горелка *, ФЭЛВ*
 * - дымосос Д-3,5М-250: только дымосос; убрать ВРУ для *
 * - ФОВ-2К-* (4 страницы): только фильтр; убрать Горелка *
 * - ЦБ-56: только циклон; убрать Горелка *
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

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
  const { json, start, end } = extractProductsData(html);
  if (json === null || start === -1) return null;
  const newJsonStr = JSON.stringify(newArr, null, 2);
  return html.slice(0, start) + newJsonStr + html.slice(end);
}

const RULES = [
  {
    file: 'catalog/zapchasti/verxnie-raspredelitelnye-ustrojstva/index.html',
    removeTitle: (title) =>
      (typeof title === 'string' && (title.startsWith('Горелка ') || title.startsWith('ФЭЛВ'))),
  },
  {
    file: 'catalog/tyagodutevye-mashiny/dymososy-s-posadkoi-na-val-elektrodvigatelia/dymosos-d-3-5m-250/index.html',
    removeTitle: (title) => typeof title === 'string' && title.startsWith('ВРУ для'),
  },
  {
    file: 'catalog/vodopodgotovka/filtry/filtry-fov/filtr-fov-2k-20-06/index.html',
    removeTitle: (title) => typeof title === 'string' && title.startsWith('Горелка '),
  },
  {
    file: 'catalog/vodopodgotovka/filtry/filtry-fov/filtr-fov-2k-26-06/index.html',
    removeTitle: (title) => typeof title === 'string' && title.startsWith('Горелка '),
  },
  {
    file: 'catalog/vodopodgotovka/filtry/filtry-fov/filtr-fov-2k-30-06/index.html',
    removeTitle: (title) => typeof title === 'string' && title.startsWith('Горелка '),
  },
  {
    file: 'catalog/vodopodgotovka/filtry/filtry-fov/filtr-fov-2k-34-06/index.html',
    removeTitle: (title) => typeof title === 'string' && title.startsWith('Горелка '),
  },
  {
    file: 'catalog/cziklony/cziklon-batarejnyj-czb-56/index.html',
    removeTitle: (title) => typeof title === 'string' && title.startsWith('Горелка '),
  },
  // Котлы Е 1.0-0.9 только в серии Е; убрать из КЕ, ДКВр, водогрейных
  { file: 'catalog/kotly/kotly-serii-ke/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-ke/kamennyj-ugol-buryj-ugol/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-ke/10/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-ke/ke25/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-ke/drevesnye-otxody-mnogotoplivnye/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-ke/4/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-ke/antraczit/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-ke/25/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-dkvr/kamennyj-ugol-buryj-ugol/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-dkvr/drevesnye-otxody-mnogotoplivnye/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-dkvr/gaz-zhidkoe-toplivo/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-dkvr/frezernyj-torf/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/vodogrejnye-kotly/kv-gm-tradiczionnye/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-de/16/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-de/4/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-de/10/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-de/25/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-de/65/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-ke/6-5/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-ke/gaz-zhidkoe-toplivo/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-dkvr/65/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-dkvr/antraczit/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-dkvr/10/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-dkvr/25/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-dkvr/20/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
  { file: 'catalog/kotly/kotly-serii-dkvr/4/index.html', removeTitle: (t) => t === 'Е 1.0-0.9 ГМ' || t === 'Е 1.0-0.9 Р' },
];

for (const { file, removeTitle } of RULES) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    console.warn('Skip (missing):', file);
    continue;
  }
  const html = fs.readFileSync(fullPath, 'utf8');
  const { json } = extractProductsData(html);
  if (!json) {
    console.warn('Skip (no products-data):', file);
    continue;
  }
  const before = json.length;
  const filtered = json.filter((card) => !removeTitle(card && card.title));
  const removed = before - filtered.length;
  if (removed === 0) {
    console.log('OK (no change):', file);
    continue;
  }
  const newHtml = updateProductsInHtml(html, filtered);
  if (!newHtml) {
    console.error('Failed to update:', file);
    process.exitCode = 1;
    continue;
  }
  fs.writeFileSync(fullPath, newHtml, 'utf8');
  console.log('Cleaned', file, '- removed', removed, 'cards');
}

console.log('Done.');
