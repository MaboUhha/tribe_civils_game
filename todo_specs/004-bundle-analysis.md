# SPEC-004: Настройка анализа размера бандлов

## Описание

Настройка инструмента для визуализации и анализа размера выходных бандлов после сборки.

## Проблема

В проекте отсутствует возможность анализировать состав выходных файлов после сборки, что приводит к:
- Невозможности выявить «раздувание» бандла
- Скрытым зависимостям, увеличивающим размер
- Отсутствию контроля за размером продакшен-сборки
- Сложности оптимизации размера бандлов

## Решение

Интегрировать плагин **rollup-plugin-visualizer** для визуализации состава бандлов в виде интерактивной sunburst-диаграммы.

### Почему rollup-plugin-visualizer

| Критерий | Решение |
|----------|---------|
| Совместимость с Vite | ✅ Работает нативно (Vite использует Rollup) |
| Визуализация | ✅ Интерактивная sunburst-диаграмма |
| Детализация | ✅ Показывает размер каждого модуля |
| Простота | ✅ Минимальная конфигурация |
| Отчётность | ✅ HTML-отчёт + JSON-данные |

### Альтернативы

| Инструмент | Почему не выбрали |
|------------|-------------------|
| **webpack-bundle-analyzer** | Требует перехода на Webpack, не совместим с Vite |
| **source-map-explorer** | Работает только с source maps, менее точный |
| **rollup-plugin-visualizer** ✅ | Нативный для Rollup/Vite, богатая визуализация |

---

## Зависимости

```json
{
  "devDependencies": {
    "rollup-plugin-visualizer": "^5.12.0"
  }
}
```

---

## Файлы для создания/изменения

### `vite.config.ts`

Добавить плагин визуализации с условной активацией:

```typescript
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    VitePWA({
      // ... существующая конфигурация PWA
    }),
    // Плагин для анализа размера бандлов (только в режиме analyze)
    mode === 'analyze' ? visualizer({
      // Генерировать отчёт только при сборке
      open: false,
      // Формат отчёта
      template: 'sunburst',
      // Имя файла отчёта
      filename: 'dist/stats.html',
      // Включать зависимости из node_modules
      gzipSize: true,
      // Показывать brotli-размер
      brotliSize: true,
      // Детализация (показывать все модули)
      verbose: true,
      // Не включать исходный код в отчёт (для безопасности)
      emitFile: true
    }) : null
  ],
  server: {
    port: 3000,
    host: true
  },
  build: {
    // Включить source maps для анализа
    sourcemap: true,
    // Минификация
    minify: 'terser',
    // Детализация отчёта о сборке
    reportCompressedSize: true,
    // Разделение кода
    rollupOptions: {
      output: {
        manualChunks: {
          // Выделить зависимости в отдельный чанк
          vendor: ['idb'],
          // PWA-зависимости в отдельный чанк
          pwa: ['workbox-window']
        }
      }
    }
  }
}))
```

---

## Изменения в существующих файлах

### `package.json`

Добавить скрипты для анализа:

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:analyze": "tsc && vite build --mode analyze",
    "analyze": "yarn build:analyze && open dist/stats.html",
    "analyze:win": "yarn build:analyze && start dist/stats.html",
    "preview": "vite preview",
    "dev": "vite",
    "lint": "eslint src --ext .ts"
  }
}
```

**Описание скриптов:**

| Команда | Описание |
|---------|----------|
| `yarn build` | Обычная сборка (без отчёта) |
| `yarn build:analyze` | Сборка с генерацией отчёта (без открытия) |
| `yarn analyze` | Сборка + открытие отчёта (macOS/Linux) |
| `yarn analyze:win` | Сборка + открытие отчёта (Windows) |

### `.gitignore`

Добавить игнорирование файлов отчёта:

```
node_modules
dist
docs
*.md
public
# Анализ бандлов
dist/stats.html
dist/stats.json
```

---

## Использование

### Быстрый анализ

```bash
# Сборка + генерация отчёта (без открытия)
yarn build:analyze

# Открыть отчёт вручную
start dist/stats.html   # Windows
```

### Анализ с автооткрытием

```bash
# macOS/Linux
yarn analyze

# Windows
yarn analyze:win
```

### Режим анализа (с автооткрытием в конфиге)

Для удобства можно временно изменить конфиг:

```typescript
visualizer({
  open: true,  // Автоматически открыть браузер после сборки
  // ...
})
```

---

## Интерпретация отчёта

### Sunburst-диаграмма

```
                    ┌─────────────────┐
                    │   bundle.js     │  ← Корневой файл
                    │   (125 KB)      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
   │  core/  │         │   ui/   │         │ vendor  │
   │  45 KB  │         │  30 KB  │         │  50 KB  │
   └────┬────┘         └────┬────┘         └────┬────┘
        │                    │                    │
   ┌────┴────┐         ┌────┴────┐
   │world.ts │         │map.ts   │
   │25 KB    │         │30 KB    │
   └─────────┘         └─────────┘
```

### Цветовая кодировка

| Цвет | Значение |
|------|----------|
| 🔵 Синий | Исходный код проекта |
| 🟢 Зелёный | Зависимости (node_modules) |
| 🟡 Жёлтый | Динамические импорты |
| 🔴 Красный | Дубликаты модулей |

### Размеры

- **Original** — исходный размер (без сжатия)
- **Gzip** — размер после gzip-сжатия
- **Brotli** — размер после brotli-сжатия (наиболее точный для продакшена)

---

## Критерии приемки (Definition of Done)

### Обязательные

- [ ] `rollup-plugin-visualizer` установлен
- [ ] Плагин настроен в `vite.config.ts`
- [ ] Скрипт `yarn build:analyze` генерирует `dist/stats.html`
- [ ] Скрипт `yarn analyze` (или `yarn analyze:win`) открывает отчёт в браузере
- [ ] Отчёт открывается в браузере и отображает sunburst-диаграмму
- [ ] Отчёт показывает:
  - Размер каждого модуля
  - Размер зависимостей из `node_modules`
  - Gzip и Brotli размеры
- [ ] Настроено разделение на чанки (vendor, pwa)
- [ ] Включены source maps для анализа

### Дополнительные улучшения

- [ ] Настроен отдельный скрипт `yarn build:analyze` с автооткрытием
- [ ] Добавлен лимит на размер бандла (fail CI при превышении)
- [ ] Настроено отслеживание размера в CI/CD

---

## Команды для проверки

```bash
# Установка зависимости
yarn add -D rollup-plugin-visualizer

# Сборка + генерация отчёта
yarn build:analyze

# Сборка + автооткрытие отчёта в браузере
yarn analyze        # macOS/Linux
yarn analyze:win    # Windows

# Или вручную открыть отчёт
start dist/stats.html   # Windows
open dist/stats.html    # macOS
xdg-open dist/stats.html # Linux
```

---

## Пример отчёта

### Структура бандла

После сборки `yarn build` отчёт покажет:

```
dist/
├── index.html                 # HTML-файл
├── assets/
│   ├── index-abc123.js       # Основной бандл (~125 KB)
│   ├── vendor-def456.js      # Зависимости (~50 KB)
│   ├── pwa-ghi789.js         # PWA-функционал (~30 KB)
│   └── style-jkl012.css      # Стили (~15 KB)
└── stats.html                # ← Отчёт визуализатора
```

### Детализация

Кликнув на модуль в диаграмме, можно увидеть:
- Исходный размер
- Gzip-размер
- Brotli-размер
- Путь к файлу
- Импортирующие модули

---

## Оптимизация размера бандла

### Рекомендации по результатам анализа

#### 1. Выявление больших зависимостей

Если в отчёте видна большая зависимость:

```
node_modules/
└── heavy-library/  ← 200 KB
```

**Решение:**
- Найти лёгкую альтернативу
- Импортировать только нужные функции (tree-shaking)
- Загрузить через CDN

#### 2. Дубликаты модулей

Если один модуль встречается в нескольких чанках:

```
⚠️ Duplicate: lodash found in 3 chunks
```

**Решение:**
- Настроить `manualChunks` для выделения в общий чанк
- Проверить версии зависимостей

#### 3. Разделение кода

Для оптимизации загрузки:

```typescript
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['idb'],
      pwa: ['workbox-window'],
      // Динамический импорт для тяжёлых модулей
      heavy: ['./src/core/world.ts']
    }
  }
}
```

#### 4. Tree-shaking

Убедиться, что неиспользуемый код удаляется:

```typescript
// ✅ Хорошо
import { generateWorld } from './world'

// ❌ Плохо (может предотвратить tree-shaking)
import * as World from './world'
```

---

## CI/CD интеграция

### Проверка размера в CI

`.github/workflows/bundle-size.yml`:

```yaml
name: Bundle Size Check

on: [push, pull_request]

jobs:
  bundle-size:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Build
        run: yarn build

      - name: Check bundle size
        run: |
          MAIN_BUNDLE=$(find dist/assets -name "index-*.js" -exec stat -c%s {} \;)
          MAX_SIZE=$((150 * 1024))  # 150 KB

          if [ $MAIN_BUNDLE -gt $MAX_SIZE ]; then
            echo "❌ Bundle size exceeds limit!"
            echo "Current: $((MAIN_BUNDLE / 1024)) KB"
            echo "Limit: $((MAX_SIZE / 1024)) KB"
            exit 1
          fi

          echo "✅ Bundle size OK: $((MAIN_BUNDLE / 1024)) KB"

      - name: Upload stats artifact
        uses: actions/upload-artifact@v4
        with:
          name: bundle-stats
          path: dist/stats.html
```

### Отслеживание изменений размера

Для отслеживания динамики можно использовать сервисы:

- **Bundlephobia** — анализ размера npm-пакетов
- **Webpack Bundle Analyzer** (через CI)
- **Custom script** — логировать размер в файл

---

## Расширенные настройки

### Кастомизация отчёта

```typescript
visualizer({
  // Шаблон: 'sunburst', 'treemap', 'network'
  template: 'sunburst',
  
  // Заголовок отчёта
  title: 'Tribe Civils Game - Bundle Analysis',
  
  // Показывать размеры в KB вместо байт
  gzipSize: true,
  brotliSize: true,
  
  // Не включать содержимое модулей (для безопасности)
  projectRoot: '.',
  
  // Паттерны для исключения из отчёта
  exclude: ['node_modules/@types/**'],
  
  // Автоматически открыть после сборки
  open: false,
  
  // Сохранить JSON-данные отдельно
  json: true
})
```

### Альтернативные шаблоны

#### Treemap (прямоугольники)

```typescript
visualizer({
  template: 'treemap'
})
```

```
┌────────────────────────────────────────────┐
│  bundle.js                                 │
│  ┌──────────────┬──────────┬─────────────┐ │
│  │   core/      │   ui/    │   vendor    │ │
│  │  ████████    │  █████   │  ███████    │ │
│  │  45 KB       │  30 KB   │  50 KB      │ │
│  └──────────────┴──────────┴─────────────┘ │
└────────────────────────────────────────────┘
```

#### Network (граф зависимостей)

```typescript
visualizer({
  template: 'network'
})
```

Показывает связи между модулями в виде графа.

---

## Сравнение с конкурентами

### rollup-plugin-visualizer vs webpack-bundle-analyzer

| Функция | rollup-plugin-visualizer | webpack-bundle-analyzer |
|---------|--------------------------|-------------------------|
| Совместимость с Vite | ✅ Нативная | ❌ Требует Webpack |
| Шаблоны | 3 (sunburst, treemap, network) | 1 (treemap) |
| Gzip/Brotli | ✅ Оба | ✅ Gzip |
| Автооткрытие | ✅ | ✅ |
| JSON-экспорт | ✅ | ❌ |
| Кастомизация | ✅ | ⚠️ Ограничена |

---

## Решение проблем

### Отчёт не генерируется

**Проблема:** После сборки нет `dist/stats.html`

**Причина:** Плагин не добавлен в конфиг или не вызывается

**Решение:**
```typescript
// Проверить, что плагин импортирован
import { visualizer } from 'rollup-plugin-visualizer'

// Проверить, что плагин в массиве plugins
plugins: [
  VitePWA({...}),
  visualizer({...})  // ← Должен быть здесь
]
```

### Неправильные размеры

**Проблема:** Размеры в отчёте не совпадают с реальными

**Причина:** Не включены опции gzip/brotli

**Решение:**
```typescript
visualizer({
  gzipSize: true,
  brotliSize: true
})
```

### Отчёт не открывается

**Проблема:** Файл `stats.html` не открывается в браузере

**Причина:** Файл может быть пустым или повреждённым

**Решение:**
- Пересобрать проект: `yarn build`
- Проверить размер файла: `ls -lh dist/stats.html`
- Открыть вручную через браузер (File → Open)

---

## Связанные спецификации

- [SPEC-001](./001-setup-prettier.md) — Настройка Prettier
- [SPEC-002](./002-setup-eslint.md) — Настройка ESLint
- [SPEC-003](./003-setup-vitest.md) — Настройка Vitest

---

## История

- **Создано:** 2026-02-28
- **Статус:** TODO
- **Исполнитель:** TBD
