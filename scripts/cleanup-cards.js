const fs = require('fs');
const path = require('path');

/**
 * Чистка "лишних" карточек из products-data по правилу:
 * карточка остаётся только на страницах своего раздела (отдела).
 *
 * Раздел страницы = первый сегмент пути после catalog/ (gorelki, zapchasti, kotly, ...).
 * "Свой" раздел для товара = раздел той страницы, где этот товар встречается
 * на минимальной глубине пути (т.е. приоритет у "родной" категории/страницы товара).
 *
 * В результате на странице раздела X остаются только карточки, чей "родной" раздел = X.
 * Свои отделы скрипт не трогает — карточки в них не удаляются.
 */

const ROOT = path.resolve(__dirname, '..');
// Явно несуществующие / ошибочные товары, которые нужно выпилить везде (не убираем ВП-О-444/498 — они есть на bikzg.ru в разделе Воздухоподогреватели)
const TITLE_BLACKLIST = new Set([
  'ФЭЛВ-0,2-G1/2B',
  'ФЭЛВ-0,2-G3/4B',
  'ФЭЛВ-0,4-G1/2B',
  'ФЭЛВ-0,4-G3/4B',
]);
// Страницы, где не фильтруем по разделу (оставляем все карточки, убираем только blacklist)
const SKIP_SECTION_FILTER = new Set([
  'catalog/zapchasti/verxnie-raspredelitelnye-ustrojstva/index.html',
  'catalog/zapchasti/zapchasti-dlya-kotlov-e/baraban-nizhnij-kotla-e-10-09/index.html',
  'catalog/vodopodgotovka/filtry/filtry-fov/filtr-fov-2k-20-06/index.html',
  'catalog/vodopodgotovka/filtry/filtry-fov/filtr-fov-2k-26-06/index.html',
  'catalog/vodopodgotovka/filtry/filtry-fov/filtr-fov-2k-30-06/index.html',
  'catalog/vodopodgotovka/filtry/filtry-fov/filtr-fov-2k-34-06/index.html',
  'catalog/vodogrejnye-kotly/kv-gm-tradiczionnye/index.html',
  'catalog/tyagodutevye-mashiny/dymososy-s-posadkoi-na-val-elektrodvigatelia/dymosos-dn-21-750/index.html',
]);

function walk(dir, handler) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, handler);
    } else if (entry.isFile()) {
      handler(full);
    }
  }
}

/** Путь относительно ROOT, с прямыми слэшами */
function relPath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

/** Для пути вида "catalog/zapchasti/verxnie-raspredelitelnye-ustrojstva/index.html"
 *  возвращает { section: "zapchasti", depth: 4 }. Если не catalog/ — null. */
function catalogSectionAndDepth(relativePath) {
  if (!relativePath.startsWith('catalog/')) return null;
  const parts = relativePath.split('/').filter(Boolean);
  if (parts.length < 2) return null; // catalog/index.html или catalog/xxx
  const section = parts[1]; // первый сегмент после catalog
  return { section, depth: parts.length };
}

/** Парсит products-data из HTML, возвращает массив объектов или null */
function parseProductsData(html) {
  const marker = '<script type="application/json" id="products-data">';
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const jsonStart = html.indexOf('[', start);
  if (jsonStart === -1) return null;
  const scriptEnd = html.indexOf('</script>', jsonStart);
  if (scriptEnd === -1) return null;
  const jsonText = html.slice(jsonStart, scriptEnd).trim();
  try {
    const data = JSON.parse(jsonText);
    return Array.isArray(data) ? data : null;
  } catch (_) {
    return null;
  }
}

// —— Шаг 1: строим индекс title -> { section, depth, productCount }
// "Родной" раздел = страница с минимальным числом карточек (наиболее специфичная), при равенстве — меньшая глубина
const titleToPrimary = Object.create(null);

function buildIndex(filePath) {
  if (!filePath.endsWith('index.html')) return;
  const rp = relPath(filePath);
  const info = catalogSectionAndDepth(rp);
  if (!info) return;

  const html = fs.readFileSync(filePath, 'utf8');
  const data = parseProductsData(html);
  if (!data) return;

  const productCount = data.length;
  data.forEach((item) => {
    const title = (item && item.title) ? String(item.title).trim() : '';
    if (!title) return;
    if (TITLE_BLACKLIST.has(title)) return; // в индекс не попадают
    const prev = titleToPrimary[title];
    const better =
      !prev ||
      productCount < prev.productCount ||
      (productCount === prev.productCount && info.depth < prev.depth);
    if (better) {
      titleToPrimary[title] = { section: info.section, depth: info.depth, productCount };
    }
  });
}

walk(ROOT, buildIndex);

// —— Шаг 2: в каждом catalog/index.html оставляем только карточки своего раздела
function cleanupFile(filePath) {
  if (!filePath.endsWith('index.html')) return;

  const rp = relPath(filePath);
  const info = catalogSectionAndDepth(rp);
  // Файлы вне catalog/ не фильтруем
  if (!info) return;

  let html = fs.readFileSync(filePath, 'utf8');

  const marker = '<script type="application/json" id="products-data">';
  const start = html.indexOf(marker);
  if (start === -1) return;

  const jsonStart = html.indexOf('[', start);
  if (jsonStart === -1) return;

  const scriptEnd = html.indexOf('</script>', jsonStart);
  if (scriptEnd === -1) return;

  const jsonText = html.slice(jsonStart, scriptEnd).trim();

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    console.warn('Не удалось распарсить JSON в', filePath, e.message);
    return;
  }

  if (!Array.isArray(data)) return;

  const pageSection = info.section;
  const beforeLen = data.length;
  const skipSectionFilter = SKIP_SECTION_FILTER.has(rp);
  const filtered = data.filter((item, index) => {
    const title = (item && item.title) ? String(item.title).trim() : '';
    if (TITLE_BLACKLIST.has(title)) return false; // полностью убираем
    if (skipSectionFilter) return true; // на белых страницах только blacklist
    // Первую карточку (главный товар страницы) всегда оставляем, чтобы не обнулять раздел
    if (index === 0) return true;
    const primary = titleToPrimary[title];
    if (!primary) return true;
    return primary.section === pageSection;
  });

  const safeFiltered = filtered.length > 0 ? filtered : data.slice(0, 1);
  if (safeFiltered.length === beforeLen) return;

  const newJson = JSON.stringify(safeFiltered, null, 2);
  const newHtml = html.slice(0, jsonStart) + newJson + html.slice(scriptEnd);
  fs.writeFileSync(filePath, newHtml, 'utf8');
  console.log(
    'Обновлён',
    rp,
    `: ${beforeLen} -> ${safeFiltered.length} карточек`
  );
}

walk(ROOT, cleanupFile);

console.log('Готово: проход по проекту завершён.');
