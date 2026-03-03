#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Обработка фото товаров:
  - перекрашивание в тёмно-коричневый тон (цветовой фильтр);
  - опционально: обрезка краёв (убирает водяные знаки в углах).

Запуск из корня проекта:
  python3 _dev/process_product_images.py                    # только перекраска
  python3 _dev/process_product_images.py --crop-edges 0.06  # + обрезка 6% с каждого края
  python3 _dev/process_product_images.py --dry-run          # без сохранения
"""

import os
import sys
import argparse
from pathlib import Path

try:
    from PIL import Image, ImageEnhance
except ImportError:
    print("Нужен Pillow: pip install Pillow")
    sys.exit(1)

# Тёмно-коричневый для тонирования (RGB)
DARK_BROWN = (101, 67, 33)  # ~ #654321
TINT_STRENGTH = 0.35  # сила наложения тона (0–1)

EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif"}
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "upload" / "shop_1"


def tint_dark_brown(img: Image.Image, strength: float = TINT_STRENGTH) -> Image.Image:
    """Накладывает тёмно-коричневый тон на изображение."""
    if img.mode != "RGB":
        img = img.convert("RGB")
    w, h = img.size
    overlay = Image.new("RGB", (w, h), DARK_BROWN)
    return Image.blend(img, overlay, strength)


def crop_edges(img: Image.Image, fraction: float) -> Image.Image:
    """Обрезает fraction доли с каждого края (убирает углы с водяными знаками)."""
    w, h = img.size
    dx = int(w * fraction)
    dy = int(h * fraction)
    if dx <= 0 and dy <= 0:
        return img
    return img.crop((dx, dy, w - dx, h - dy))


def process_image(path: Path, crop_fraction: float, dry_run: bool) -> bool:
    try:
        img = Image.open(path).convert("RGB")
    except Exception as e:
        print(f"  Ошибка открытия {path}: {e}")
        return False

    if crop_fraction > 0:
        img = crop_edges(img, crop_fraction)
    img = tint_dark_brown(img, TINT_STRENGTH)

    if dry_run:
        return True
    try:
        if path.suffix.lower() in (".jpg", ".jpeg"):
            img.save(path, "JPEG", quality=90, optimize=True)
        elif path.suffix.lower() == ".png":
            img.save(path, "PNG", optimize=True)
        elif path.suffix.lower() == ".gif":
            img.save(path, "GIF")
        else:
            img.save(path, "JPEG", quality=90)
    except Exception as e:
        print(f"  Ошибка сохранения {path}: {e}")
        return False
    return True


def main():
    ap = argparse.ArgumentParser(description="Перекраска фото товаров в тёмно-коричневый, опционально обрезка краёв")
    ap.add_argument("--crop-edges", type=float, default=0, metavar="0.05",
                    help="Обрезать долю с каждого края (например 0.06 = 6%%), чтобы убрать водяные знаки в углах")
    ap.add_argument("--dry-run", action="store_true", help="Не сохранять, только показать, что будет обработано")
    ap.add_argument("--limit", type=int, default=0, metavar="N", help="Обработать только первые N файлов (для теста)")
    args = ap.parse_args()

    if not UPLOAD_DIR.is_dir():
        print(f"Папка не найдена: {UPLOAD_DIR}")
        sys.exit(1)

    files = []
    for root, _, names in os.walk(UPLOAD_DIR):
        for name in names:
            p = Path(root) / name
            if p.suffix.lower() in EXTENSIONS:
                files.append(p)
    files.sort()

    if args.limit:
        files = files[: args.limit]
    print(f"Найдено изображений: {len(files)}")
    if args.crop_edges:
        print(f"Обрезка краёв: {args.crop_edges * 100:.0f}%% с каждой стороны")
    if args.dry_run:
        print("Режим dry-run — файлы не изменяются")

    ok = 0
    for i, path in enumerate(files):
        if (i + 1) % 500 == 0:
            print(f"  ... обработано {i + 1}/{len(files)}")
        if process_image(path, args.crop_edges, args.dry_run):
            ok += 1
    print(f"Готово: {ok}/{len(files)}")
    return 0 if ok == len(files) else 1


if __name__ == "__main__":
    sys.exit(main())
