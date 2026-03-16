#!/bin/sh
# Удаляем только на сервере Cloudflare перед деплоем (лимит 25 МБ на файл).
# В репозитории и локально эти папки не трогаем.
rm -rf .git video
exec npx wrangler deploy
