# SPEC-007: Настройка TypeDoc для генерации документации

## Описание

Настройка **TypeDoc** для автоматической генерации документации по TypeScript коду проекта.

## Проблема

В проекте отсутствует документация по API модулей, что приводит к:
- Необходимости читать исходный код для понимания интерфейсов
- Сложности онбординга новых разработчиков
- Устареванию документации при изменении кода
- Отсутствию единого источника истины по API
- Потере времени на объяснение структуры проекта

## Решение

Интегрировать **TypeDoc** — инструмент для генерации документации из TypeScript комментариев и типов.

### Почему TypeDoc

| Критерий | Решение |
|----------|---------|
| Поддержка TypeScript | ✅ Нативная, от создателей TS |
| Формат документации | ✅ HTML, JSON, Markdown |
| Комментарии в коде | ✅ JSDoc, TSDoc |
| Темы и кастомизация | ✅ Встроенные темы + плагины |
| Интеграция с CI | ✅ Автоматическая генерация |
| Активность | ✅ Активно поддерживается |

### Альтернативы

| Инструмент | Почему не выбрали |
|------------|-------------------|
| **Compodoc** | Ориентирован на Angular, менее гибкий |
| **ESDoc** | Устарел, слабая поддержка TypeScript |
| **Docusaurus + MDX** | Требует ручного написания документации |
| **TypeDoc** ✅ | Специализирован для TypeScript, автогенерация |

---

## Зависимости

```json
{
  "devDependencies": {
    "typedoc": "^0.25.0",
    "typedoc-plugin-merge-modules": "^5.1.0",
    "typedoc-plugin-markdown": "^4.0.0"
  }
}
```

**Опциональные плагины:**
- `typedoc-plugin-merge-modules` — объединяет модули с одинаковым именем
- `typedoc-plugin-markdown` — экспорт в Markdown для интеграции с docs/
- `typedoc-theme-hierarchy` — тема с иерархической навигацией

---

## Файлы для создания

### `typedoc.json`

Основной конфигурационный файл:

```json
{
  "$schema": "https://typedoc.org/schema.json",
  
  /* Входные файлы */
  "entryPoints": [
    "src/core/world.ts",
    "src/core/tribe.ts",
    "src/core/tech.ts",
    "src/core/events.ts",
    "src/game/state.ts",
    "src/storage/db.ts",
    "src/ui/map.ts",
    "src/ui/panels.ts",
    "src/types.ts",
    "src/main.ts"
  ],
  
  /* Выходная директория */
  "out": "docs/api",
  
  /* Настройки темы */
  "theme": "default",
  "name": "Tribe Civils Game API",
  
  /* Настройки документации */
  "includeVersion": true,
  "readme": "docs/README.md",
  "documentationEntryPoint": "docs/README.md",
  
  /* Группировка */
  "categorizeByGroup": true,
  "categoryOrder": [
    "Types",
    "Classes",
    "Interfaces",
    "Enums",
    "Functions",
    "Variables",
    "*"
  ],
  
  /* Исключения */
  "exclude": [
    "**/node_modules/**",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  
  /* Дополнительные опции */
  "skipErrorChecking": true,
  "sort": [
    "alphabetical",
    "visibility"
  ],
  "visibilityFilters": {
    "protected": false,
    "private": false,
    "inherited": true,
    "external": false
  },
  
  /* Ссылки */
  "gitRevision": "main",
  "sourceLinkTemplate": "https://github.com/your-repo/tribe_civils_game/blob/{gitRevision}/{path}#L{line}"
}
```

### `docs/README.md` (обновление)

Добавить ссылку на API документацию:

```markdown
# Tribe Civils Game

**Симулятор племён глубокой древности** — гибрид Dwarf Fortress × WorldBox × Civilization

## 📋 Содержание

- [Обзор проекта](#обзор-проекта)
- [Архитектура](#архитектура)
- [Игровые системы](#игровые-системы)
- [API Документация](#api-документация) ← Добавить
- [Управление](#управление)
- [Технологии](#технологии)
- [Разработка](#разработка)

---

## API Документация

Автогенерированная документация по TypeScript API:

- 📄 [API Reference](./api/index.html) — полная документация по всем модулям
- 📦 [Modules](./api/modules.html) — список всех модулей
- 🏗️ [Classes](./api/classes.html) — все классы проекта
- 📐 [Interfaces](./api/interfaces.html) — все интерфейсы
- 🔣 [Enums](./api/enums.html) — все перечисления
- 📝 [Types](./api/types.html) — все типы

### Ключевые модули

| Модуль | Описание |
|--------|----------|
| [`World`](./api/modules/src_core_world.html) | Генерация мира, карта, биомы |
| [`Tribe`](./api/modules/src_core_tribe.html) | Логика племени, ИИ, демография |
| [`Tech`](./api/modules/src_core_tech.html) | Дерево технологий |
| [`Events`](./api/modules/src_core_events.html) | Генератор случайных событий |
| [`Game`](./api/modules/src_game_state.html) | Игровое состояние, цикл |
| [`Storage`](./api/modules/src_storage_db.html) | Сохранения, IndexedDB |
| [`UI`](./api/modules/src_ui_map.html) | Рендеринг, интерфейс |

---

[Продолжение документации...]
```

### `package.json`

Добавить скрипты для генерации документации:

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
    "docs:api": "typedoc",
    "docs:api:watch": "typedoc --watch",
    "docs:api:json": "typedoc --json docs/api.json",
    "docs:api:md": "typedoc --plugin typedoc-plugin-markdown --out docs/api-md",
    "docs:build": "yarn docs:api",
    "docs:serve": "npx serve docs/api"
  }
}
```

### `.gitignore`

Добавить игнорирование сгенерированной документации:

```
node_modules
dist
docs
*.md
public

# TypeDoc (опционально, можно коммитить)
docs/api/
docs/api.json
docs/api-md/
```

### `.vscode/settings.json` (опционально)

Настройки для VS Code:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  
  /* TypeDoc: автогенерация комментариев */
  "typescript.preferences.generateReturnTypesForFunctionDeclarations": true,
  
  /* Рекомендации по расширениям */
  "extensions.recommendations": [
    "jebbs.plantuml",
    "bierner.markdown-mermaid",
    "usernamehw.errorlens"
  ]
}
```

---

## Комментарии в коде

### Формат TSDoc

Использовать стандарт **TSDoc** для комментариев:

```typescript
/**
 * Генерирует новый мир с использованием Perlin-шума.
 * 
 * @param seed - Число для инициализации генератора случайных чисел.
 *               Одинаковый seed производит одинаковый мир.
 * @returns Объект World с заполненной картой тайлов.
 * 
 * @example
 * ```typescript
 * const world = generateWorld(0.12345);
 * console.log(`World size: ${world.width}x${world.height}`);
 * ```
 * 
 * @remarks
 * Использует 4 октавы шума для высот и 3 октавы для влажности.
 * Время генерации: ~100-200ms для карты 200x150.
 * 
 * @see {@link https://en.wikipedia.org/wiki/Perlin_noise | Perlin Noise}
 * @see {@link getTile} для получения конкретного тайла
 * 
 * @throws {Error} Если seed отрицательный
 * 
 * @beta
 */
export function generateWorld(seed: number): World {
  if (seed < 0) {
    throw new Error('Seed must be non-negative')
  }
  // ...
}
```

### Теги TSDoc

| Тег | Описание | Пример |
|-----|----------|--------|
| `@param` | Описание параметра | `@param seed - число для генерации` |
| `@returns` | Описание возврата | `@returns объект World` |
| `@throws` | Возможные ошибки | `@throws {Error} если seed < 0` |
| `@example` | Пример использования | `@example const w = generateWorld(0.5)` |
| `@remarks` | Дополнительные заметки | `@remarks Использует Perlin-шум` |
| `@see` | Ссылки на связанные элементы | `@see {@link getTile}` |
| `@deprecated` | Устаревший элемент | `@deprecated Используйте {@link newFunc}` |
| `@beta` / `@alpha` | Стабильность API | `@beta` |
| `@internal` | Внутренний API | `@internal` |
| `@inheritDoc` | Наследование документации | `@inheritDoc` |

### Примеры комментариев

#### Класс

```typescript
/**
 * Представляет племя в игре.
 * 
 * @typeParam TConfig - Тип конфигурации племени
 * 
 * @example
 * ```typescript
 * const tribe = new Tribe(
 *   { id: 1, name: 'My Tribe', isPlayer: true },
 *   { x: 50, y: 50 }
 * );
 * tribe.tick(world);
 * ```
 * 
 * @public
 */
export class Tribe {
  /**
   * Конфигурация племени (ID, название, цвет)
   * @public
   */
  public readonly config: TribeConfig
  
  /**
   * Текущее население племени
   * @remarks Изменяется каждый тик в зависимости от еды
   * @public
   */
  public population: number
  
  /**
   * Создаёт новое племя.
   * 
   * @param config - Конфигурация племени
   * @param position - Начальная позиция на карте
   * 
   * @throws {Error} Если позиция непроходима
   */
  constructor(config: TribeConfig, position: Position) {
    // ...
  }
  
  /**
   * Обновляет состояние племени на один тик.
   * 
   * @param world - Объект мира для проверки тайлов
   * 
   * @remarks
   * Выполняет следующие действия:
   * 1. Потребление еды
   * 2. Проверка голода
   * 3. Рождаемость/смертность
   * 4. ИИ-действие (если не игрок)
   * 
   * @public
   */
  tick(world: World): void {
    // ...
  }
}
```

#### Интерфейс

```typescript
/**
 * Конфигурация игры.
 * 
 * @public
 */
export interface GameConfig {
  /**
   * Ширина карты в тайлах
   * @default 200
   */
  width: number
  
  /**
   * Высота карты в тайлах
   * @default 150
   */
  height: number
  
  /**
   * Максимальное количество племён
   * @default 500
   */
  maxTribes: number
  
  /**
   * Начальная скорость игры
   * @defaultValue GameSpeed.NORMAL
   */
  initialSpeed: GameSpeed
}
```

#### Перечисление

```typescript
/**
 * Типы биомов в игре.
 * 
 * @remarks
 * Каждый тип имеет уникальные характеристики:
 * - WATER: непроходимый, нет ресурсов
 * - FOREST: проходимый, много дерева
 * - MOUNTAIN: непроходимый, много камня и металла
 * 
 * @public
 */
export enum TileType {
  /** Вода (непроходимо) */
  WATER = 'W',
  
  /** Песок (проходимо, мало ресурсов) */
  SAND = '.',
  
  /** Трава (проходимо, еда) */
  GRASS = ',',
  
  /** Лес (проходимо, дерево + еда) */
  FOREST = '♣',
  
  /** Холмы (проходимо, камень) */
  HILL = '^',
  
  /** Горы (непроходимо, камень + металл) */
  MOUNTAIN = '▲',
  
  /** Болото (проходимо, дерево + еда) */
  SWAMP = '≈'
}
```

---

## Использование

### Базовая генерация

```bash
# Сгенерировать HTML документацию
yarn docs:api

# Открыть в браузере
start docs/api/index.html   # Windows
open docs/api/index.html    # macOS
```

### Watch-режим

```bash
# Автоперегенерация при изменении файлов
yarn docs:api:watch
```

### Экспорт в JSON

```bash
# Экспорт для программного анализа
yarn docs:api:json

# Использовать в скриптах
import api from './docs/api.json'
```

### Экспорт в Markdown

```bash
# Экспорт в Markdown для интеграции с docs/
yarn docs:api:md

# Файлы будут в docs/api-md/
```

### Локальный сервер

```bash
# Запустить локальный сервер для просмотра
yarn docs:serve

# Откроет http://localhost:3000
```

---

## Критерии приемки (Definition of Done)

### Обязательные

- [ ] `typedoc` установлен и настроен
- [ ] Скрипт `yarn docs:api` генерирует HTML документацию
- [ ] Документация включает все ключевые модули:
  - `core/world.ts`
  - `core/tribe.ts`
  - `core/tech.ts`
  - `core/events.ts`
  - `game/state.ts`
  - `storage/db.ts`
  - `ui/map.ts`
  - `ui/panels.ts`
  - `types.ts`
- [ ] Ключевые классы и функции закомментированы в формате TSDoc
- [ ] Ссылка на API добавлена в `docs/README.md`

### Дополнительные улучшения

- [ ] Настроен watch-режим для разработки
- [ ] Экспорт в Markdown для интеграции с docs/
- [ ] Кастомная тема оформления
- [ ] Автогенерация в CI/CD
- [ ] Плагин для диаграмм (typedoc-plugin-mermaid)

---

## Команды для проверки

```bash
# Установка зависимостей
yarn add -D typedoc typedoc-plugin-merge-modules typedoc-plugin-markdown

# Генерация HTML документации
yarn docs:api

# Watch-режим (автоперегенерация)
yarn docs:api:watch

# Экспорт в JSON
yarn docs:api:json

# Экспорт в Markdown
yarn docs:api:md

# Локальный сервер для просмотра
yarn docs:serve
```

---

## Структура выходной документации

```
docs/api/
├── index.html              # Главная страница
├── modules.html            # Список модулей
├── classes.html            # Список классов
├── interfaces.html         # Список интерфейсов
├── enums.html              # Список перечислений
├── types.html              # Список типов
├── functions.html          # Список функций
├── assets/                 # CSS, JS, шрифты
├── modules/
│   ├── src_core_world.html
│   ├── src_core_tribe.html
│   ├── src_core_tech.html
│   ├── src_core_events.html
│   ├── src_game_state.html
│   ├── src_storage_db.html
│   ├── src_ui_map.html
│   └── src_ui_panels.html
└── ...
```

---

## Примеры страниц документации

### Страница модуля

```
┌─────────────────────────────────────────────────────────┐
│  Tribe Civils Game API > Modules > src/core/world.ts   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  generateWorld(seed: number): World                     │
│  ─────────────────────────────────────────────────────  │
│  Генерирует новый мир с использованием Perlin-шума.     │
│                                                         │
│  Parameters:                                            │
│  • seed: number - число для генерации                   │
│                                                         │
│  Returns: World                                         │
│                                                         │
│  Example:                                               │
│  const world = generateWorld(0.12345);                  │
│                                                         │
│  See: getTile, isPassable                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Страница класса

```
┌─────────────────────────────────────────────────────────┐
│  Tribe Civils Game API > Classes > Tribe                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  class Tribe                                            │
│  ─────────────────────────────────────────────────────  │
│  Представляет племя в игре.                             │
│                                                         │
│  Constructors:                                          │
│  • constructor(config, position)                        │
│                                                         │
│  Properties:                                            │
│  • config: TribeConfig                                  │
│  • population: number                                   │
│  • resources: Resources                                 │
│                                                         │
│  Methods:                                               │
│  • tick(world): void                                    │
│  • move(world, direction): boolean                      │
│  • gatherResources(type): number                        │
│  • discoverTech(techId): void                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Интеграция с CI/CD

### GitHub Actions

`.github/workflows/docs.yml`:

```yaml
name: Generate Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Generate API documentation
        run: yarn docs:api

      - name: Upload documentation
        uses: actions/upload-artifact@v4
        with:
          name: api-docs
          path: docs/api/

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        if: github.ref == 'refs/heads/main'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/api
          destination_dir: api
```

### Деплой на GitHub Pages

После настройки workflow документация будет доступна по адресу:

```
https://your-username.github.io/tribe_civils_game/api/
```

---

## Расширенные возможности

### Кастомизация темы

Создать кастомную тему или использовать готовую:

```bash
yarn add -D typedoc-theme-hierarchy
```

```json
{
  "theme": "hierarchy",
  "themeStyle": "light"
}
```

### Диаграммы классов

Добавить плагин для генерации диаграмм:

```bash
yarn add -D typedoc-plugin-mermaid
```

```json
{
  "plugin": ["typedoc-plugin-mermaid"],
  "mermaidTheme": "default"
}
```

### Группировка по слоям

```json
{
  "categorizeByGroup": true,
  "categoryOrder": [
    "Types",
    "Core Layer",
    "Game Layer",
    "UI Layer",
    "Storage Layer",
    "*"
  ],
  "groupOrder": [
    "Classes",
    "Interfaces",
    "Enums",
    "Functions",
    "Variables"
  ]
}
```

### Исключение внутренних API

```json
{
  "visibilityFilters": {
    "protected": false,
    "private": false,
    "inherited": true,
    "external": false
  },
  "excludeInternal": true,
  "excludePrivate": true
}
```

### Наследование документации

```typescript
/**
 * @inheritDoc BaseTribe
 */
export class PlayerTribe extends BaseTribe {
  // ...
}
```

---

## Решение проблем

### TypeDoc не находит файлы

**Проблема:** Пустая документация или ошибки импорта

**Причина:** Неправильные пути в `entryPoints`

**Решение:**
```json
{
  "entryPoints": [
    "./src/core/world.ts",
    "./src/core/tribe.ts"
  ],
  "tsconfig": "./tsconfig.json"
}
```

### Ошибки компиляции TypeScript

**Проблема:** TypeDoc выдаёт ошибки TypeScript

**Решение:**
```json
{
  "skipErrorChecking": true
}
```

Или исправить ошибки в `tsconfig.json`.

### Медленная генерация

**Проблема:** Генерация занимает больше 30 секунд

**Решение:**
1. Уменьшить количество entry points
2. Исключить тестовые файлы
3. Использовать кэширование:

```json
{
  "cache": "docs/.typedoc-cache.json"
}
```

### Ссылки не работают

**Проблема:** Ссылки между страницами не работают

**Причина:** Неправильный `sourceLinkTemplate`

**Решение:** Проверить шаблон:
```json
{
  "sourceLinkTemplate": "https://github.com/{repo}/blob/{gitRevision}/{path}#L{line}"
}
```

---

## Сравнение с конкурентами

| Функция | TypeDoc | Compodoc | ESDoc |
|---------|---------|----------|-------|
| TypeScript поддержка | ✅ Отличная | ✅ Хорошая | ⚠️ Базовая |
| Форматы вывода | ✅ HTML, JSON, MD | ✅ HTML, JSON | ⚠️ HTML |
| Темы | ✅ Встроенные + плагины | ⚠️ Ограничены | ⚠️ Минимум |
| TSDoc поддержка | ✅ Полная | ⚠️ Частичная | ⚠️ Частичная |
| Активность | ✅ Активно | ✅ Активно | ❌ Заброшен |
| Плагины | ✅ Много | ⚠️ Мало | ❌ Нет |

---

## Связанные спецификации

- [SPEC-001](./001-setup-prettier.md) — Настройка Prettier
- [SPEC-002](./002-setup-eslint.md) — Настройка ESLint
- [SPEC-003](./003-setup-vitest.md) — Настройка Vitest
- [SPEC-004](./004-bundle-analysis.md) — Анализ размера бандлов
- [SPEC-005](./005-architecture-dependency-validator.md) — Валидация зависимостей
- [SPEC-006](./006-pre-commit-hooks.md) — Pre-commit хуки

---

## История

- **Создано:** 2026-02-28
- **Статус:** TODO
- **Исполнитель:** TBD
