import os
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse

LOCAL_ROOT = os.path.dirname(os.path.abspath(__file__))

# Папки, которые нужно игнорировать (служебные, не содержат товаров)
IGNORE_DIRS = {'page-2', 'page-3', 'page-4', 'page-5', 'page-6', 'upload', 'information_system_1', 'information_system_15', 'information_system_19', 'information_system_21', 'information_system_22', 'information_system_23', 'information_system_6', 'scripts', 'templates', 'site', 'css', 'images', 'modules', 'hostcmsfiles'}

def is_product_folder(folder_path):
    """
    Проверяет, является ли папка конечным товаром:
    - содержит index.html
    - не содержит подпапок (кроме возможных файлов)
    """
    items = os.listdir(folder_path)
    # Должен быть index.html
    if 'index.html' not in items:
        return False
    # Проверяем, есть ли среди элементов подпапки (исключаем файлы и ссылки)
    for item in items:
        item_path = os.path.join(folder_path, item)
        if os.path.isdir(item_path) and item not in IGNORE_DIRS:
            # Если есть подпапка (кроме игнорируемых), то это категория
            return False
    return True

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

    # Изображение
    img_tag = soup.select_one('.product__image img, .product__img, .detail-picture img')
    img_url = None
    if img_tag:
        img_url = img_tag.get('data-src') or img_tag.get('src')
        if img_url:
            # Преобразуем относительный URL в локальный путь
            if img_url.startswith('/'):
                img_url = img_url[1:]
            img_path = os.path.normpath(os.path.join(LOCAL_ROOT, img_url))
            if os.path.exists(img_path):
                # Сохраняем относительный путь от корня
                img_url = os.path.relpath(img_path, LOCAL_ROOT).replace('\\', '/')
            else:
                img_url = None
    return name, img_url

def main():
    products = []

    # Обходим все подпапки рекурсивно
    for root, dirs, files in os.walk(LOCAL_ROOT):
        # Исключаем игнорируемые папки
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        if is_product_folder(root):
            html_path = os.path.join(root, 'index.html')
            name, img = extract_product_data(html_path)
            if name:
                # Относительный путь от корня для URL
                rel_path = os.path.relpath(root, LOCAL_ROOT).replace('\\', '/')
                # Категория — родительский путь
                category = os.path.dirname(rel_path).replace('\\', '/')
                if category == '.':
                    category = ''
                products.append({
                    'name': name,
                    'url': '/' + rel_path + '/',  # формируем URL как в исходном сайте
                    'image': img,
                    'category': category
                })
                print(f"Найден товар: {name}")

    with open('catalog_products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"Готово! Найдено {len(products)} товаров. Данные сохранены в catalog_products.json")

if __name__ == '__main__':
    main()
