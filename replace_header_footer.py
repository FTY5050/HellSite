import os
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin

EXCLUDE_DIRS = {'venv', '__pycache__', '.git', 'node_modules'}
ROOT_INDEX = os.path.join(os.path.dirname(__file__), 'index.html')

def normalize_url(url, current_page_path):
    """Преобразует относительный URL в абсолютный от корня сайта."""
    if url.startswith(('http://', 'https://', '//')):
        return url
    if url.startswith('/'):
        return url
    depth = current_page_path.count('/')
    if depth == 0:
        return '/' + url
    else:
        base = '/' + '/'.join(current_page_path.split('/')[:-1]) + '/'
        return urljoin(base, url)

def extract_info_from_old(soup, current_page_path):
    """Извлекает заголовок, описание и список элементов (карточек)."""
    data = {
        'title': '',
        'image': '',
        'description': '',
        'items': []
    }

    h1 = soup.find('h1')
    if h1:
        data['title'] = h1.get_text(strip=True)

    # Пытаемся найти первое изображение товара/категории
    img = soup.find('img', class_=re.compile(r'product__img|shop-group__img'))
    if not img:
        img = soup.find('img', src=re.compile(r'/upload/'))
    if img and img.get('src'):
        data['image'] = normalize_url(img['src'], current_page_path)

    desc = soup.find('div', class_='shop-content__description') or soup.find('div', class_='description')
    if desc:
        data['description'] = desc.get_text(strip=True)

    # Сначала ищем стандартные блоки shop-group и product
    for group in soup.find_all('div', class_='shop-group'):
        link = group.find('a', class_='shop-group__link')
        if link:
            href = normalize_url(link.get('href', ''), current_page_path)
            title_tag = group.find('div', class_='shop-group__title')
            title = title_tag.get_text(strip=True) if title_tag else ''
            img_tag = group.find('img', class_='shop-group__img')
            img_src = img_tag['src'] if img_tag and img_tag.get('src') else ''
            img_src = normalize_url(img_src, current_page_path) if img_src else ''
            data['items'].append({
                'title': title,
                'href': href,
                'image': img_src
            })

    for prod in soup.find_all('div', class_='product'):
        link = prod.find('a', class_='product__link')
        if link:
            href = normalize_url(link.get('href', ''), current_page_path)
            title = link.get_text(strip=True)
            img_tag = prod.find('img', class_='product__img')
            img_src = img_tag['src'] if img_tag and img_tag.get('src') else ''
            img_src = normalize_url(img_src, current_page_path) if img_src else ''
            data['items'].append({
                'title': title,
                'href': href,
                'image': img_src
            })

    # Если ничего не нашли, собираем все ссылки из основного контента
    if not data['items']:
        content_area = soup.find('div', class_='shop-content') or soup.find('main') or soup.body
        header = soup.find('nav', class_='industrial-header-light')
        footer = soup.find('footer', class_='main-footer')
        all_links = content_area.find_all('a', href=True)
        seen = set()
        for a in all_links:
            if header and header in a.parents:
                continue
            if footer and footer in a.parents:
                continue
            href = a['href']
            if href.startswith('#') or href.startswith('javascript:'):
                continue
            text = a.get_text(strip=True)
            if not text or len(text) < 2:
                continue
            if href in seen:
                continue
            seen.add(href)
            href = normalize_url(href, current_page_path)
            # Поиск ближайшего изображения
            img_tag = a.find_previous('img') or a.find_next('img')
            img_src = img_tag['src'] if img_tag and img_tag.get('src') else ''
            img_src = normalize_url(img_src, current_page_path) if img_src else ''
            data['items'].append({
                'title': text,
                'href': href,
                'image': img_src
            })
        print(f"   DEBUG: собрано {len(data['items'])} ссылок из контента")

    return data

def generate_new_content(data):
    """Генерирует HTML с карточками, содержащими только изображение и заголовок."""
    html = '<div class="page-content" style="padding-top: 80px;">\n'
    html += f'<h1 class="shop-content__title h1 main-title" style="font-size: 2.5rem; margin-bottom: 30px;">{data["title"]}</h1>\n'
    if data['description']:
        html += f'<div class="category-description" style="margin-bottom: 30px;">{data["description"]}</div>\n'
    if data['items']:
        html += '<div class="catalog-container">\n'
        for item in data['items']:
            html += '<div class="prod-card">\n'
            if item['image']:
                html += f'<div class="prod-img"><img src="{item["image"]}" alt="{item["title"]}"></div>\n'
            html += f'<div class="prod-info">\n'
            html += f'<h4>{item["title"]}</h4>\n'
            html += '</div>\n'
            html += '</div>\n'
        html += '</div>\n'
    html += '</div>\n'
    return html

def get_css_relative_path(filepath, root_dir):
    rel_path = os.path.relpath(root_dir, os.path.dirname(filepath))
    return rel_path if rel_path != '.' else ''

def process_file(filepath, root_dir):
    if os.path.abspath(filepath) == os.path.abspath(ROOT_INDEX):
        print(f"⏭️  Пропускаем главную: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')

    header = soup.find('nav', class_='industrial-header-light')
    footer = soup.find('footer', class_='main-footer')
    if not header or not footer:
        print(f"⚠️  Не найдена шапка или подвал в {filepath}")
        return

    current_page_path = os.path.relpath(filepath, root_dir).replace('\\', '/')
    data = extract_info_from_old(soup, current_page_path)
    print(f"📄 {filepath}")
    print(f"   Заголовок: {data['title']}")
    print(f"   Найдено элементов: {len(data['items'])}")

    new_content_html = generate_new_content(data)
    new_content_soup = BeautifulSoup(new_content_html, 'html.parser')

    body = soup.body
    body.clear()
    body.append(header)
    body.append(new_content_soup)
    body.append(footer)

    # Корректируем путь к style.css
    css_path = get_css_relative_path(filepath, root_dir)
    style_link = soup.find('link', rel='stylesheet', href=re.compile(r'style\.css'))
    if style_link:
        style_link['href'] = f'{css_path}/style.css' if css_path else 'style.css'
    else:
        head = soup.head
        if head:
            new_tag = soup.new_tag('link', rel='stylesheet', href=f'{css_path}/style.css' if css_path else 'style.css')
            head.append(new_tag)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(str(soup))

    print(f"✅ Обработан {filepath}\n")

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                process_file(filepath, root_dir)

if __name__ == '__main__':
    main()
