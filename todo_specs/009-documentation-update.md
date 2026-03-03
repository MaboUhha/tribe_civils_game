# SPEC-009: Обновление документации проекта

## Описание

Обновление документации проекта после внедрения инфраструктурных инструментов (SPEC-001–008).

## Проблема

После настройки инструментов разработки (Prettier, ESLint, Vitest, TypeDoc и др.) документация проекта устарела:
- Отсутствует описание новых инструментов
- Нет информации о доступных командах
- Не задокументирован workflow разработки
- QWEN.md не отражает текущее состояние проекта
- Разработчикам сложно разобраться в инфраструктуре

## Решение

Обновить документацию проекта, добавив информацию обо всех инфраструктурных инструментах и рабочих процессах.

### Обновляемые файлы

| Файл | Что обновляется |
|------|-----------------|
| `QWEN.md` | Основной контекст проекта для ИИ |
| `docs/DEVELOPMENT.md` | Руководство для разработчиков |
| `docs/INDEX.md` | Навигация по документации |
| `README.md` (если есть) | Быстрый старт |

---

## Обновление QWEN.md

### Добавить раздел "Инфраструктура разработки"

Вставить после раздела "Технологии":

```markdown
---

## Инфраструктура разработки

### Инструменты

После настройки проекта доступны следующие инструменты:

| Инструмент | Назначение | Команда | Статус |
|------------|------------|---------|--------|
| **Prettier** | Форматирование кода | `yarn format` | ✅ Настроен |
| **ESLint** | Линтинг TypeScript | `yarn lint` | ✅ Настроен |
| **Vitest** | Тестирование | `yarn test` | ✅ Настроен |
| **rollup-plugin-visualizer** | Анализ размера бандлов | `yarn build:analyze` | ✅ Настроен |
| **dependency-cruiser** | Валидация архитектуры | `yarn deps:validate` | ✅ Настроен |
| **Husky + lint-staged** | Pre-commit хуки | (автоматически) | ✅ Настроен |
| **commitlint** | Валидация commit-сообщений | (автоматически) | ✅ Настроен |
| **TypeDoc** | API документация | `yarn docs:api` | ✅ Настроен |

### Pre-commit проверки

При каждом `git commit` автоматически запускаются:

```
┌─────────────────────────────────────────────────────────┐
│                    Pre-commit Hook                      │
├─────────────────────────────────────────────────────────┤
│  1. lint-staged                                         │
│     • Prettier --write (форматирование)                 │
│     • ESLint --fix (исправление ошибок)                 │
│                                                         │
│  2. commitlint                                          │
│     • Проверка формата commit-сообщения                 │
│     • Conventional Commits стандарт                     │
└─────────────────────────────────────────────────────────┘
```

**Примеры коммитов:**

```bash
# ✅ Правильно
git commit -m "feat(core): add tribe AI behavior"
git commit -m "fix(ui): resolve rendering issue"
git commit -m "docs: update API reference"

# ❌ Неправильно (будет отклонено)
git commit -m "added new feature"
git commit -m "fixed bug"
git commit -m "update"
```

### Рабочий процесс

#### Перед коммитом (автоматически)

```bash
# Просто делаете коммит — проверки запустятся автоматически
git add .
git commit -m "feat: add new feature"
```

#### Перед пушем (рекомендуется вручную)

```bash
# Запустить все проверки
yarn format:check && yarn lint && yarn test:run && yarn deps:validate

# Или по отдельности
yarn lint              # Линтинг
yarn test:run          # Тесты
yarn deps:validate     # Валидация архитектуры
yarn build             # Сборка
```

#### CI/CD (GitHub Actions)

При пуше в main или создании PR запускается:

```yaml
- Tests (Vitest)
- Lint (ESLint)
- Format check (Prettier)
- Dependencies validate (dependency-cruiser)
- Build (Vite)
```

### Быстрые команды

#### Разработка

```bash
yarn dev              # Запуск dev-сервера
yarn build            # Сборка продакшена
yarn preview          # Предпросмотр сборки
```

#### Проверки

```bash
yarn format           # Форматировать все файлы
yarn format:check     # Проверить форматирование
yarn lint             # Проверить линтинг
yarn lint:fix         # Исправить ошибки линтинга
yarn test             # Тесты в watch-режиме
yarn test:run         # Однократный запуск тестов
yarn test:coverage    # Тесты с покрытием
```

#### Анализ

```bash
yarn build:analyze    # Анализ размера бандла
yarn deps             # Визуализация зависимостей
yarn deps:circular    # Поиск циклических зависимостей
yarn deps:validate    # Валидация архитектурных правил
```

#### Документация

```bash
yarn docs:api         # Генерация API документации
yarn docs:api:watch   # Автоперегенерация при изменениях
yarn docs:serve       # Локальный сервер документации
```

### Структура проверок

```
git commit
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Pre-commit (Husky + lint-staged)                       │
│  • Prettier: форматирование изменённых файлов           │
│  • ESLint: линтинг изменённых файлов                    │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Commit-msg (commitlint)                                │
│  • Проверка формата commit-сообщения                    │
│  • Conventional Commits стандарт                        │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Коммит создан ✓

git push
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions (CI/CD)                                 │
│  • yarn test:run (тесты)                                │
│  • yarn lint (линтинг)                                  │
│  • yarn format:check (форматирование)                   │
│  • yarn deps:validate (архитектура)                     │
│  • yarn build (сборка)                                  │
└─────────────────────────────────────────────────────────┘
```

---
```

### Обновить раздел "Быстрый старт"

Добавить информацию о проверках:

```markdown
## Быстрый старт

### Требования

- Node.js 18+
- Yarn 1.22+

### Установка и запуск

```bash
yarn install          # Установка зависимостей
yarn dev              # Запуск dev-сервера (http://localhost:3000)
yarn build            # Сборка продакшена (dist/)
yarn preview          # Предпросмотр сборки
```

### Проверки кода

```bash
yarn format           # Форматирование кода
yarn lint             # Линтинг
yarn test             # Тестирование
yarn deps:validate    # Валидация архитектуры
```

### Pre-commit хуки

При коммите автоматически запускаются:
- Форматирование (Prettier)
- Линтинг (ESLint)
- Валидация commit-сообщения (commitlint)
```

---

## Обновление docs/DEVELOPMENT.md

### Добавить раздел "Инфраструктура"

Вставить после раздела "Установка":

```markdown
---

## Инфраструктура

### Настроенные инструменты

#### Форматирование и линтинг

**Prettier** автоматически форматирует код при коммите.

```bash
# Ручное форматирование
yarn format

# Проверка форматирования
yarn format:check
```

**ESLint** проверяет код на ошибки и стиль.

```bash
# Линтинг
yarn lint

# Автоисправление
yarn lint:fix
```

#### Тестирование

**Vitest** — фреймворк для тестирования.

```bash
# Watch-режим
yarn test

# Однократный запуск
yarn test:run

# С покрытием
yarn test:coverage
```

Покрытие показывается автоматически при каждом запуске тестов.

#### Анализ зависимостей

**dependency-cruiser** валидирует архитектурные правила.

```bash
# Проверка правил
yarn deps:validate

# Поиск циклов
yarn deps:circular

# Визуализация (SVG)
yarn deps
```

**Правила архитектуры:**

- UI не зависит от Core напрямую
- Storage независим от всех слоёв
- Core не зависит от UI и Storage
- Запрещены циклические зависимости

#### Анализ бандлов

**rollup-plugin-visualizer** показывает размер выходных файлов.

```bash
# Сборка с отчётом
yarn build:analyze

# Открыть отчёт
start dist/stats.html   # Windows
```

#### Документация

**TypeDoc** генерирует API документацию.

```bash
# Генерация
yarn docs:api

# Watch-режим
yarn docs:api:watch

# Локальный сервер
yarn docs:serve
```

Документация доступна в `docs/api/index.html`.

### Pre-commit хуки

При каждом коммите автоматически:

1. **lint-staged** проверяет изменённые файлы:
   - Prettier форматирует
   - ESLint исправляет ошибки

2. **commitlint** проверяет сообщение коммита:
   - Формат Conventional Commits
   - Тип: feat, fix, docs, style, refactor, test, chore

**Примеры:**

```bash
# ✅ Принято
git commit -m "feat(core): add tribe AI"
git commit -m "fix(ui): resolve rendering issue"

# ❌ Отклонено
git commit -m "added stuff"
git commit -m "fixed bug"
```

### CI/CD

При пуше в main или создании PR:

```yaml
Tests → Lint → Format → Deps Validate → Build
```

Все проверки должны пройти успешно для мержа.

---
```

---

## Обновление docs/INDEX.md

Добавить навигацию по новой документации:

```markdown
# Документация Tribe Civils Game

## 📚 Разделы

### Основное

- [README](./README.md) — Обзор проекта
- [ARCHITECTURE](./ARCHITECTURE.md) — Архитектура системы
- [GAME_SYSTEMS](./GAME_SYSTEMS.md) — Игровые системы
- [DEVELOPMENT](./DEVELOPMENT.md) — Руководство разработчика

### Инфраструктура

- [Инструменты разработки](./DEVELOPMENT.md#инфраструктура) — Список инструментов
- [Pre-commit хуки](./DEVELOPMENT.md#pre-commit-хуки) — Автоматические проверки
- [CI/CD](./DEVELOPMENT.md#ci/cd) — Непрерывная интеграция

### API

- [API Documentation](./api/index.html) — Автогенерированная документация TypeDoc

---
```

---

## Обновление package.json

Добавить комментарии к скриптам (опционально):

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    
    "format": "prettier --write \"src/**/*.{ts,tsx,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json}\"",
    
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    
    "deps:validate": "depcruise --config .dependency-cruiser.js src",
    "deps:circular": "depcruise --config .dependency-cruiser.js --output-type circular src",
    "deps:html": "depcruise --config .dependency-cruiser.js --output-type html > dist/deps-report.html",
    
    "docs:api": "typedoc",
    "docs:api:watch": "typedoc --watch",
    "docs:serve": "npx serve docs/api",
    
    "build:analyze": "tsc && vite build --mode analyze",
    "analyze": "yarn build:analyze && start dist/stats.html",
    
    "prepare": "husky",
    "commitlint": "commitlint --edit"
  }
}
```

---

## Создание cheatsheet (опционально)

Создать файл `docs/CHEATSHEET.md`:

```markdown
# Cheatsheet разработчика

## Быстрые команды

### Разработка
```bash
yarn dev          # Запустить dev-сервер
yarn build        # Собрать продакшен
yarn preview      # Предпросмотр
```

### Проверки
```bash
yarn format       # Форматировать
yarn lint         # Линтить
yarn test         # Тестировать
yarn deps         # Проверить зависимости
```

### Коммиты
```bash
git commit -m "feat(scope): description"  # Стандартный коммит
yarn commitlint --from HEAD~5             # Проверить коммиты
```

## Формат коммитов

```
<type>(<scope>): <description>
```

**Типы:**
- `feat` — новая фича
- `fix` — исправление
- `docs` — документация
- `style` — форматирование
- `refactor` — рефакторинг
- `test` — тесты
- `chore` — обслуживание

**Примеры:**
```bash
feat(core): add tribe AI behavior
fix(ui): resolve rendering crash
docs: update API reference
```

## Pre-commit

Автоматически при коммите:
- Prettier форматирует файлы
- ESLint проверяет код
- commitlint проверяет сообщение

## CI/CD

При пуше проверяется:
- Тесты ✅
- Линтинг ✅
- Форматирование ✅
- Архитектура ✅
- Сборка ✅
```

---

## Критерии приемки (Definition of Done)

### Обязательные

- [ ] `QWEN.md` обновлён разделом "Инфраструктура разработки"
- [ ] `docs/DEVELOPMENT.md` обновлён информацией об инструментах
- [ ] `docs/INDEX.md` обновлён навигацией
- [ ] Все команды проверены и работают корректно
- [ ] Добавлены примеры использования
- [ ] Описан workflow разработки

### Дополнительные улучшения

- [ ] Создан `docs/CHEATSHEET.md` с быстрыми командами
- [ ] Обновлён `package.json` с комментариями
- [ ] Добавлена схема workflow
- [ ] Создана диаграмма проверок

---

## Команды для проверки

```bash
# Проверка ссылок в документации
# (опционально, если есть инструмент)
yarn markdownlint docs/

# Проверка форматирования документации
yarn format:check docs/

# Тестовая сборка документации
yarn docs:api
yarn docs:serve
```

---

## Примеры обновлений

### До обновления

```markdown
## Технологии

- TypeScript
- Vite
- Canvas API
```

### После обновления

```markdown
## Технологии

| Компонент | Технология | Назначение |
|-----------|------------|------------|
| Язык | TypeScript 5.6 | Типизация |
| Сборка | Vite 6.0 | Быстрая сборка |
| Тесты | Vitest 1.3 | Тестирование |
| Линтинг | ESLint 8.57 | Статический анализ |
| Форматирование | Prettier 3.2 | Автоформатирование |
| Документация | TypeDoc 0.25 | API docs |
| Валидация | dependency-cruiser 16 | Архитектура |

## Инфраструктура разработки

[см. выше]
```

---

## Интеграция с другими спецификациями

Эта спецификация завершает цикл SPEC-001–008:

| SPEC | Инструмент | Документация |
|------|------------|--------------|
| 001 | Prettier | ✅ Раздел "Форматирование" |
| 002 | ESLint | ✅ Раздел "Линтинг" |
| 003 | Vitest | ✅ Раздел "Тестирование" |
| 004 | rollup-plugin-visualizer | ✅ Раздел "Анализ бандлов" |
| 005 | dependency-cruiser | ✅ Раздел "Валидация архитектуры" |
| 006 | Husky + lint-staged | ✅ Раздел "Pre-commit хуки" |
| 007 | TypeDoc | ✅ Раздел "Документация" |
| 008 | commitlint | ✅ Раздел "Commit-сообщения" |
| **009** | **Обновление документации** | ✅ **Эта спецификация** |

---

## Поддержание актуальности

### При добавлении нового инструмента

1. Добавить в таблицу инструментов в `QWEN.md`
2. Добавить раздел в `docs/DEVELOPMENT.md`
3. Обновить `docs/INDEX.md`
4. Добавить команду в `package.json`

### При изменении workflow

1. Обновить схему проверок
2. Обновить примеры команд
3. Проверить актуальность ссылок

### Ревизия документации

Раз в квартал проверять:
- Актуальность версий инструментов
- Работоспособность команд
- Отсутствие битых ссылок

---

## Решение проблем

### Ссылки не работают

**Проблема:** Ссылки в документации ведут на несуществующие разделы

**Решение:**
1. Проверить все относительные пути
2. Использовать абсолютные пути от корня проекта
3. Протестировать переход по ссылкам

### Устаревшая информация

**Проблема:** Документация не соответствует текущему состоянию

**Решение:**
1. Добавить дату последней ревизии
2. Настроить напоминание о проверке (раз в квартал)
3. Включить проверку документации в CI

### Слишком объёмная документация

**Проблема:** Файлы стали слишком большими

**Решение:**
1. Вынести детали в отдельные файлы
2. Оставить краткую сводку в основных файлах
3. Использовать навигацию между разделами

---

## Связанные спецификации

- [SPEC-001](./001-setup-prettier.md) — Настройка Prettier
- [SPEC-002](./002-setup-eslint.md) — Настройка ESLint
- [SPEC-003](./003-setup-vitest.md) — Настройка Vitest
- [SPEC-004](./004-bundle-analysis.md) — Анализ размера бандлов
- [SPEC-005](./005-architecture-dependency-validator.md) — Валидация зависимостей
- [SPEC-006](./006-pre-commit-hooks.md) — Pre-commit хуки
- [SPEC-007](./007-typedoc-api-documentation.md) — TypeDoc документация
- [SPEC-008](./008-commitlint.md) — Валидация commit-сообщений

---

## История

- **Создано:** 2026-02-28
- **Статус:** TODO
- **Исполнитель:** TBD
