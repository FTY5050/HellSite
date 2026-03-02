import os
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse

LOCAL_ROOT = os.path.dirname(os.path.abspath(__file__))

# Папки и префиксы, которые нужно игнорировать (не товары)
IGNORE_DIRS = {
    'page-2', 'page-3', 'page-4', 'page-5', 'page-6',
    'upload', 'information_system_1', 'information_system_15',
    'information_system_19', 'information_system_21', 'information_system_22',
    'information_system_23', 'information_system_6', 'scripts', 'templates',
    'site', 'css', 'images', 'modules', 'hostcmsfiles', 'news', 'services',
    'portfolio', 'about', 'contacts', 'vakancy', 'zakupki', 'reference',
    'policy', 'oprosnye-listy'
}
IGNORE_PREFIXES = (
    '/news/', '/services/', '/portfolio/', '/about/', '/contacts/',
    '/vakancy/', '/zakupki/', '/reference/', '/policy/', '/oprosnye-listy/'
)

def url_to_local_path(url):
    """
    Преобразует URL (абсолютный или относительный) в локальный путь,
    гарантированно находящийся внутри LOCAL_ROOT.
    """
    if not url:
        return None
    if url.startswith('http'):
        parsed = urlparse(url)
        path = parsed.path
    else:
        path = url

    # Убираем ведущий слеш
    path = path.lstrip('/')

    # Если путь уже начинается с upload/ или information_system_/, просто присоединяем
    if path.startswith('upload/') or path.startswith('information_system_'):
        full_path = os.path.join(LOCAL_ROOT, path)
        return full_path if os.path.exists(full_path) else None

    # Иначе пытаемся нормализовать относительно LOCAL_ROOT
    full_path = os.path.normpath(os.path.join(LOCAL_ROOT, path))
    # Если после нормализации путь оказался выше LOCAL_ROOT, ищем файл по имени в upload
    if not full_path.startswith(LOCAL_ROOT):
        filename = os.path.basename(path)
        for root, dirs, files in os.walk(os.path.join(LOCAL_ROOT, 'upload')):
            if filename in files:
                return os.path.join(root, filename)
        return None
    else:
        return full_path if os.path.exists(full_path) else None

def extract_product_data(html_file):
    """Извлекает название и URL изображения из HTML-файла товара."""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
    except Exception as e:
        print(f"Ошибка чтения {html_file}: {e}")
        return None, None

    # Название: ищем h1, если нет — title
    h1 = soup.find('h1')
    if h1:
        name = h1.get_text(strip=True)
    else:
        title = soup.find('title')
        name = title.get_text(strip=True) if title else None

    # Изображение: ищем в разных местах (расширенный список селекторов)
    selectors = [
        '.product__image img',
        '.product__img',
        '.detail-picture img',
        '.shop-group__thumbnail img',
        '.product__thumbnail img',
        '.catalog__item .product__thumbnail img',
        '.product-card img'
    ]
    img_url = None
    for selector in selectors:
        img_tag = soup.select_one(selector)
        if img_tag:
            src = img_tag.get('data-src') or img_tag.get('src')
            if src:
                local_path = url_to_local_path(src)
                if local_path:
                    # Сохраняем относительный путь от корня (для использования на сайте)
                    img_url = os.path.relpath(local_path, LOCAL_ROOT).replace('\\', '/')
                    break
                else:
                    print(f"  Изображение не найдено локально: {src}")
    return name, img_url

def is_product_folder(folder_path):
    """
    Проверяет, является ли папка конечным товаром:
    - содержит index.html
    - не содержит подпапок (кроме возможных файлов)
    """
    items = os.listdir(folder_path)
    if 'index.html' not in items:
        return False
    for item in items:
        item_path = os.path.join(folder_path, item)
        if os.path.isdir(item_path) and item not in IGNORE_DIRS:
            return False
    return True

def main():
    products = []
    total_folders = 0
    skipped = 0
    found_images = 0

    for root, dirs, files in os.walk(LOCAL_ROOT):
        # Исключаем игнорируемые папки из обхода
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        if is_product_folder(root):
            total_folders += 1
            html_path = os.path.join(root, 'index.html')
            name, img = extract_product_data(html_path)
            if name:
                # Относительный путь от корня для URL
                rel_path = os.path.relpath(root, LOCAL_ROOT).replace('\\', '/')
                # Категория — родительский путь (без ведущего слеша)
                category = os.path.dirname(rel_path)
                if category == '.':
                    category = ''
                # Проверяем, что это действительно товар (не служебная страница)
                if any(rel_path.startswith(prefix) for prefix in ('news', 'services', 'portfolio', 'about', 'contacts', 'vakancy', 'zakupki', 'reference', 'policy', 'oprosnye-listy')):
                    skipped += 1
                    continue
                if img:
                    found_images += 1
                products.append({
                    'name': name,
                    'url': '/' + rel_path + '/',
                    'image': img,
                    'category': category
                })
                print(f"Найден товар: {name} | Изображение: {img}")
            else:
                print(f"Не удалось извлечь название из {html_path}")

    print(f"\nВсего найдено папок-кандидатов: {total_folders}")
    print(f"Пропущено служебных: {skipped}")
    print(f"Сохранено товаров: {len(products)}")
    print(f"Из них с изображениями: {found_images}")

    with open('catalog_clean.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    # Создаём копию для data.js
    with open('js/data_new.js', 'w', encoding='utf-8') as f:
        f.write('const products = ')
        json.dump(products, f, ensure_ascii=False, indent=2)
        f.write(';')

    print("\nГотово! Новый файл данных сохранён как js/data_new.js")
    print("Скопируйте его поверх js/data.js и перезагрузите страницу.")

if __name__ == '__main__':
    main()
