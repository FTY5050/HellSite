import os
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin

EXCLUDE_DIRS = {'venv', '__pycache__', '.git', 'node_modules'}
ROOT_INDEX = os.path.join(os.path.dirname(__file__), 'index.html')

# Шапка и подвал нового дизайна
new_header = '''<nav class="industrial-header-light">
    <div class="header-inner">
        <a href="/index.html" class="header-logo">
            <img src="/logo2.png" alt="НПП КПК" class="nav-logo-img">
        </a>
        <ul class="header-links">
            <li><a href="/about/index.html">О ПРЕДПРИЯТИИ</a></li>
            <li class="sep">/</li>
            <li><a href="/catalog/index.html">НОМЕНКЛАТУРА</a></li>
            <li class="sep">/</li>
            <li><a href="/services/index.html">УСЛУГИ</a></li>
            <li class="sep">/</li>
            <li><a href="/reference/index.html">ОБЪЕКТЫ</a></li>
            <li class="sep">/</li>
            <li><a href="/catalog/index.html">ПРОИЗВОДСТВО</a></li>
            <li class="sep">/</li>
            <li><a href="/contacts/index.html">КОНТАКТЫ</a></li>
        </ul>
        <div class="header-cta">
            <a href="tel:+73854000000" class="h-phone">8 (3854) 00-00-00</a>
            <button class="h-btn open-modal-trigger" data-remodal-target="callback">СВЯЗАТЬСЯ</button>
        </div>
    </div>
</nav>'''

new_footer = '''<footer class="main-footer">
    <div class="footer-container">
        <div class="footer-col about">
            <div class="second-logo-area">
                <img src="/logo2.png" alt="НПП КПК" style="height: 155px; width: auto; opacity: 0.8;">
            </div>
        </div>
        <div class="footer-col">
            <h4>Компания</h4>
            <ul>
                <li><a href="/about/index.html">О предприятии</a></li>
                <li><a href="/catalog/index.html">Производство</a></li>
                <li><a href="/reference/index.html">Проекты</a></li>
                <li><a href="/contacts/index.html">Контакты</a></li>
            </ul>
        </div>
        <div class="footer-col">
            <h4>Продукция</h4>
            <ul>
                <li><a href="/catalog/kotly/index.html">Паровые котлы</a></li>
                <li><a href="/catalog/tyagodutevye-mashiny/index.html">Тягодутьевые машины</a></li>
                <li><a href="/catalog/vodopodgotovka/index.html">Водоподготовка</a></li>
                <li><a href="/catalog/zapchasti/index.html">Запчасти</a></li>
            </ul>
        </div>
        <div class="footer-col contacts">
            <h4>Связаться с нами</h4>
            <div class="contact-item">
                <span class="label">Телефон:</span>
                <a href="tel:+73854000000" class="phone">8 (3854) 00-00-00</a>
            </div>
            <div class="contact-item">
                <span class="label">Email:</span>
                <a href="mailto:info@nppkpk.ru">info@nppkpk.ru</a>
            </div>
            <div class="contact-item">
                <span class="label">Адрес:</span>
                <span>Бийск, пер. Прямой, 2г</span>
            </div>
        </div>
    </div>
    <div class="footer-bottom">
        <div class="bottom-container">
            <p>© 2026 ООО НПП «КПК». Все права защищены.</p>
        </div>
    </div>
</footer>'''

def normalize_url(url, current_page_path):
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
    data = {
        'title': '',
        'image': '',
        'description': '',
        'items': [],
        'is_product_page': False,
        'product': {}
    }

    h1 = soup.find('h1')
    if h1:
        data['title'] = h1.get_text(strip=True)

    desc = soup.find('div', class_='shop-content__description') or soup.find('div', class_='description')
    if desc:
        data['description'] = desc.get_text(strip=True)

    products = soup.find_all('div', class_='product')
    groups = soup.find_all('div', class_='shop-group')

    if len(products) == 1 and not groups:
        data['is_product_page'] = True
        prod = products[0]

        link = prod.find('a', class_='product__link')
        if link:
            title = link.get_text(strip=True)
        else:
            title = data['title']
        data['product']['title'] = title

        img_tag = prod.find('img', class_='product__img')
        if img_tag and img_tag.get('src'):
            data['product']['image'] = normalize_url(img_tag['src'], current_page_path)

        props_div = prod.find('div', class_='product__properties')
        if props_div:
            table = props_div.find('table')
            if table:
                data['product']['props'] = str(table)
            else:
                data['product']['props'] = ''.join(str(p) for p in props_div.find_all(['p', 'div', 'span']))
        else:
            data['product']['props'] = ''

        desc_div = prod.find('div', class_='product__description') or prod.find('div', class_='description')
        data['product']['description'] = desc_div.get_text(strip=True) if desc_div else ''

        if link:
            data['product']['href'] = normalize_url(link.get('href', ''), current_page_path)
        else:
            data['product']['href'] = ''

    else:
        for prod in products:
            link = prod.find('a', class_='product__link')
            if link:
                href = normalize_url(link.get('href', ''), current_page_path)
                title = link.get_text(strip=True)
                img_tag = prod.find('img', class_='product__img')
                img_src = img_tag['src'] if img_tag and img_tag.get('src') else ''
                img_src = normalize_url(img_src, current_page_path) if img_src else ''
                props_div = prod.find('div', class_='product__properties')
                props_html = ''
                if props_div:
                    table = props_div.find('table')
                    if table:
                        props_html = str(table)
                    else:
                        props_html = ''.join(str(p) for p in props_div.find_all(['p', 'div', 'span']))
                desc_div = prod.find('div', class_='product__description') or prod.find('div', class_='description')
                item_desc = desc_div.get_text(strip=True) if desc_div else ''
                data['items'].append({
                    'type': 'product',
                    'title': title,
                    'href': href,
                    'image': img_src,
                    'props': props_html,
                    'description': item_desc
                })

        for group in groups:
            link = group.find('a', class_='shop-group__link')
            if link:
                href = normalize_url(link.get('href', ''), current_page_path)
                title_tag = group.find('div', class_='shop-group__title')
                title = title_tag.get_text(strip=True) if title_tag else ''
                img_tag = group.find('img', class_='shop-group__img')
                img_src = img_tag['src'] if img_tag and img_tag.get('src') else ''
                img_src = normalize_url(img_src, current_page_path) if img_src else ''
                data['items'].append({
                    'type': 'group',
                    'title': title,
                    'href': href,
                    'image': img_src,
                    'props': '',
                    'description': ''
                })

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
                if href in seen:
                    continue
                seen.add(href)
                href = normalize_url(href, current_page_path)
                img_tag = a.find_previous('img') or a.find_next('img')
                img_src = img_tag['src'] if img_tag and img_tag.get('src') else ''
                img_src = normalize_url(img_src, current_page_path) if img_src else ''
                title = ''
                if img_tag and img_tag.get('alt'):
                    title = img_tag['alt'].strip()
                if not title or title == 'Подробнее':
                    title = a.get_text(strip=True)
                if not title or len(title) < 2:
                    continue
                data['items'].append({
                    'type': 'link',
                    'title': title,
                    'href': href,
                    'image': img_src,
                    'props': '',
                    'description': ''
                })
            print(f"   DEBUG: собрано {len(data['items'])} ссылок из контента")

    return data

def generate_new_content(data):
    html = '<div class="page-content" style="padding-top: 80px;">\n'
    html += f'<h1 class="shop-content__title h1 main-title" style="font-size: 2.5rem; margin-bottom: 30px;">{data["title"]}</h1>\n'
    if data['description']:
        html += f'<div class="category-description" style="margin-bottom: 30px;">{data["description"]}</div>\n'

    if data['is_product_page']:
        prod = data['product']
        html += '<div class="product-detail">\n'
        if prod.get('image'):
            html += f'<div class="product-detail-img"><img src="{prod["image"]}" alt="{prod["title"]}"></div>\n'
        html += f'<h2 class="product-detail-title">{prod["title"]}</h2>\n'
        html += '<div class="product-price">Цена: по запросу</div>\n'
        if prod.get('props'):
            html += f'<div class="product-props">{prod["props"]}</div>\n'
        if prod.get('description'):
            html += f'<div class="product-description">{prod["description"]}</div>\n'
        html += f'<button class="btn-order open-modal-trigger" data-item-title="{prod["title"]}">Заказать</button>\n'
        html += '</div>\n'
    else:
        if data['items']:
            html += '<div class="catalog-container">\n'
            for item in data['items']:
                html += '<div class="prod-card">\n'
                if item['image']:
                    html += f'<div class="prod-img"><img src="{item["image"]}" alt="{item["title"]}"></div>\n'
                html += '<div class="prod-info">\n'
                html += f'<h4>{item["title"]}</h4>\n'
                html += '<div class="product-price">Цена: по запросу</div>\n'
                if item['props']:
                    html += f'<div class="product-props">{item["props"]}</div>\n'
                html += f'<button class="btn-order open-modal-trigger" data-item-title="{item["title"]}">Заказать</button>\n'
                if item['description']:
                    html += f'<button class="btn-details" data-item-title="{item["title"]}" data-item-desc="{item["description"]}" data-item-props="{item["props"]}">Подробнее</button>\n'
                html += '</div>\n'
                html += '</div>\n'
            html += '</div>\n'
    html += '</div>\n'
    return html

def get_css_relative_path(filepath, root_dir):
    rel_path = os.path.relpath(root_dir, os.path.dirname(filepath))
    return rel_path if rel_path != '.' else ''

def ensure_header_footer(soup):
    """Добавляет шапку и подвал, если их нет."""
    modified = False
    # Проверяем наличие шапки
    if not soup.find('nav', class_='industrial-header-light'):
        body = soup.body
        if body:
            # Вставляем после открывающего body
            body.insert(0, BeautifulSoup(new_header, 'html.parser'))
            modified = True

    # Проверяем наличие подвала
    if not soup.find('footer', class_='main-footer'):
        body = soup.body
        if body:
            body.append(BeautifulSoup(new_footer, 'html.parser'))
            modified = True

    return modified

def process_file(filepath, root_dir):
    if os.path.abspath(filepath) == os.path.abspath(ROOT_INDEX):
        print(f"⏭️  Пропускаем главную: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')

    # Удаляем JivoSite
    for tag in soup.find_all(['script', 'link']):
        src = tag.get('src', '') or tag.get('href', '')
        if 'jivosite' in src.lower() or 'zchb' in src.lower():
            tag.decompose()

    # Добавляем шапку и подвал, если их нет
    header_footer_added = ensure_header_footer(soup)

    # Теперь ищем их (они уже должны быть)
    header = soup.find('nav', class_='industrial-header-light')
    footer = soup.find('footer', class_='main-footer')
    if not header or not footer:
        # Если всё ещё нет, что-то пошло не так
        print(f"⚠️  Не удалось добавить шапку или подвал в {filepath}")
        return

    current_page_path = os.path.relpath(filepath, root_dir).replace('\\', '/')
    data = extract_info_from_old(soup, current_page_path)
    print(f"📄 {filepath}")
    print(f"   Заголовок: {data['title']}")
    print(f"   Это страница товара: {data['is_product_page']}")
    print(f"   Найдено элементов: {len(data['items'])}")

    new_content_html = generate_new_content(data)
    new_content_soup = BeautifulSoup(new_content_html, 'html.parser')

    # Очищаем body и собираем заново (оставляем только шапку, новый контент, подвал)
    body = soup.body
    body.clear()
    body.append(header)
    body.append(new_content_soup)
    body.append(footer)

    # Добавляем модальные окна, если их нет
    if not soup.find('div', id='contact-modal'):
        contact_modal_html = '''
<div id="contact-modal" class="modal-overlay">
    <div class="modal-box">
        <button class="close-modal-btn">&times;</button>
        <div class="modal-body">
            <h3 class="modal-title">ОСТАВИТЬ ЗАЯВКУ</h3>
            <p class="modal-subtitle">Специалист свяжется с вами</p>
            <form id="modal-form" class="modal-form-content">
                <div class="input-group"><input type="text" placeholder="ВАШЕ ИМЯ" required></div>
                <div class="input-group"><input type="tel" placeholder="ТЕЛЕФОН" required></div>
                <div class="input-group"><input type="email" placeholder="EMAIL"></div>
                <div class="input-group"><textarea placeholder="ВАШ ВОПРОС" rows="3"></textarea></div>
                <button type="submit" class="btn-yellow-full">ОТПРАВИТЬ</button>
            </form>
        </div>
    </div>
</div>
'''
        body.append(BeautifulSoup(contact_modal_html, 'html.parser'))

    if not soup.find('div', id='item-desc-modal'):
        desc_modal_html = '''
<div id="item-desc-modal" class="modal-overlay" style="display: none;">
    <div class="modal-box" style="max-width: 600px;">
        <button class="close-modal-btn">&times;</button>
        <div class="modal-body">
            <h3 class="modal-title" id="desc-modal-title"></h3>
            <div id="desc-modal-price" class="modal-price"></div>
            <div id="desc-modal-props" class="modal-props"></div>
            <div id="desc-modal-description" class="modal-description"></div>
        </div>
    </div>
</div>
'''
        body.append(BeautifulSoup(desc_modal_html, 'html.parser'))

    script_for_details = '''
<script>
(function() {
    const modal = document.getElementById('item-desc-modal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.close-modal-btn');
    const titleEl = document.getElementById('desc-modal-title');
    const priceEl = document.getElementById('desc-modal-price');
    const propsEl = document.getElementById('desc-modal-props');
    const descEl = document.getElementById('desc-modal-description');

    document.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            titleEl.textContent = this.dataset.itemTitle;
            priceEl.innerHTML = 'Цена: по запросу';
            propsEl.innerHTML = this.dataset.itemProps || '';
            descEl.innerHTML = this.dataset.itemDesc || 'Нет описания';
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    });

    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    }

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
})();
</script>
'''
    body.append(BeautifulSoup(script_for_details, 'html.parser'))

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
