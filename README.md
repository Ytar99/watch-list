# Watch List

Совместные доски со списками (фильмы, сериалы, книги и т.п.). React + Mantine + Convex.

## Запуск

1. Установить зависимости: `npm install`
2. Настроить Convex:
   - Выполнить `npx convex dev` и следовать подсказкам (создание/привязка проекта).
   - В `.env.local` или `.env` указать `VITE_CONVEX_URL=<URL из вывода convex dev>`.
3. Запустить приложение: `npm run dev`

Без шага 2 сборка не пройдёт: Convex генерирует `convex/_generated` при первом запуске `npx convex dev`.

## Аутентификация

Проект использует Convex Auth с GitHub провайдером.

1. Создайте GitHub OAuth App: https://github.com/settings/applications/new
   - Homepage URL: `https://your-convex-url` (URL из `npx convex dev`)
   - Authorization callback URL: `https://your-convex-url/auth/callback/github`
2. В Convex dashboard (https://dashboard.convex.dev) добавьте переменные окружения:
   - `GITHUB_CLIENT_ID`: Client ID из GitHub App
   - `GITHUB_CLIENT_SECRET`: Client Secret из GitHub App
3. После входа вызовется мутация `users.store`, которая сохранит пользователя в таблице `users`.

Без настройки аутентификации приложение будет работать в режиме только чтения (без создания досок/элементов).

## Деплой на GitHub Pages

- В `vite.config.mts` задать `base: '/watch-list/'` (или имя репозитория).
- Сборка и публикация: `npm run deploy`

Используется `HashRouter`, поэтому маршруты работают на GitHub Pages без дополнительной настройки.
