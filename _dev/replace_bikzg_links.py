#!/usr/bin/env python3
"""Replace bikzg.ru CSS links with local/CDN in all HTML files."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# (pattern, replacement) - order matters for overlapping
REPLACEMENTS = [
    (r'https://bikzg\.ru/modules/hostcms/dadata/css/suggestions\.min\.css\?[^"]+', '/assets/css/vendor/suggestions.min.css'),
    (r'https://bikzg\.ru/templates/template(?:9|11|31)/style\.css\?[^"]+', '/assets/css/vendor/template.css'),
    (r'https://bikzg\.ru/site/css/owl\.carousel\.min\.css\?[^"]+', 'https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.carousel.min.css'),
    (r'https://bikzg\.ru/scripts/jquery\.fancybox\.css\?[^"]+', 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.css'),
    (r'https://bikzg\.ru/scripts/remodal\.min\.css\?[^"]+', 'https://cdnjs.cloudflare.com/ajax/libs/remodal/1.1.1/remodal.min.css'),
    (r'https://bikzg\.ru/css/swiper\.css\?[^"]+', 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css'),
    (r'https://bikzg\.ru/css/header\.css\?[^"]+', '/assets/css/vendor/header.css'),
    (r'https://bikzg\.ru/css/footer\.css\?[^"]+', '/assets/css/vendor/footer.css'),
    (r'https://bikzg\.ru/hostcmsfiles/multiregion/css/style\d+\.css\?[^"]+', '/assets/css/vendor/multiregion.css'),
]
# After CSS replacements: make remaining bikzg.ru URLs root-relative (for meta og:image, og:url, etc.)
REPLACEMENTS.append((r'https://bikzg\.ru', ''))

def main():
    count_files = 0
    count_changes = 0
    for path in ROOT.rglob('*.html'):
        if '_drafts' in path.parts or path.name.startswith('.'):
            continue
        try:
            text = path.read_text(encoding='utf-8')
        except Exception as e:
            print(path, e)
            continue
        original = text
        for pattern, repl in REPLACEMENTS:
            text = re.sub(pattern, repl, text)
        if text != original:
            path.write_text(text, encoding='utf-8')
            count_files += 1
            count_changes += 1
    print(f'Updated {count_files} HTML files.')

if __name__ == '__main__':
    main()
