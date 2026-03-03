# SPEC-005: Настройка валидации архитектурных зависимостей

## Описание

Настройка статического анализатора зависимостей **dependency-cruiser** для валидации архитектурных правил и предотвращения нарушений между модулями.

## Проблема

В проекте отсутствует контроль за зависимостями между модулями, что приводит к:
- Нарушению границ между архитектурными слоями
- Циклическим зависимостям, усложняющим поддержку
- Скрытому coupling между модулями
- Постепенной деградации архитектуры («архитектурная эрозия»)
- Сложности рефакторинга из-за неизвестных связей

## Решение

Интегрировать **dependency-cruiser** — статический анализатор зависимостей для TypeScript с поддержкой валидации архитектурных правил.

### Почему dependency-cruiser

| Критерий | Решение |
|----------|---------|
| Валидация правил | ✅ Декларативное описание запретов |
| Поддержка TypeScript | ✅ Нативная с tsconfig |
| Поиск циклов | ✅ С детальными путями |
| Интеграция с CI | ✅ Exit code при нарушениях |
| Гибкость | ✅ Регулярки, отрицания, условия |
| Отчётность | ✅ Текст, JSON, HTML, DOT |

### Альтернативы

| Инструмент | Почему не выбрали |
|------------|-------------------|
| **Madge** | Лучше для визуализации, слабее для валидации правил |
| **ESLint import/** | Требует много правил, нет единой конфигурации |
| **ts-graphviz** | Только визуализация, нет валидации |
| **dependency-cruiser** ✅ | Специализирован для архитектурных правил |

---

## Зависимости

```json
{
  "devDependencies": {
    "dependency-cruiser": "^16.0.0"
  }
}
```

---

## Файлы для создания

### `.dependency-cruiser.js`

Конфигурационный файл с архитектурными правилами:

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    /*
     * Правило 1: UI не должен импортировать Core напрямую
     * UI может работать только через Game layer
     */
    {
      name: 'no-ui-to-core',
      severity: 'error',
      comment: 'UI слой не должен зависеть от ядра симуляции. Используйте Game layer.',
      from: {
        path: 'src/ui'
      },
      to: {
        path: 'src/core',
        pathNot: 'src/core/constants.ts' // Константы разрешены
      }
    },

    /*
     * Правило 2: Storage не должен импортировать Game или UI
     * Storage — это инфраструктурный слой, должен быть независим
     */
    {
      name: 'no-storage-to-game-ui',
      severity: 'error',
      comment: 'Storage слой должен быть независим от Game и UI',
      from: {
        path: 'src/storage'
      },
      to: {
        pathNot: ['src/storage', 'src/types', 'node_modules']
      }
    },

    /*
     * Правило 3: Core модули не должны импортировать UI
     * Ядро симуляции должно быть независимо от представления
     */
    {
      name: 'no-core-to-ui',
      severity: 'error',
      comment: 'Ядро симуляции не должно зависеть от UI',
      from: {
        path: 'src/core'
      },
      to: {
        path: 'src/ui'
      }
    },

    /*
     * Правило 4: Core модули не должны импортировать Storage
     * Ядро не должно зависеть от инфраструктуры хранения
     */
    {
      name: 'no-core-to-storage',
      severity: 'error',
      comment: 'Ядро симуляции не должно зависеть от Storage',
      from: {
        path: 'src/core'
      },
      to: {
        path: 'src/storage'
      }
    },

    /*
     * Правило 5: Запрет циклических зависимостей
     */
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Циклические зависимости усложняют поддержку кода',
      from: {},
      to: {
        circular: true
      }
    },

    /*
     * Правило 6: Типы должны импортироваться только из types.ts
     * Избегаем импортов типов из реализации
     */
    {
      name: 'types-only-from-types-file',
      severity: 'warn',
      comment: 'Импортируйте типы из src/types.ts, а не из модулей реализации',
      from: {},
      to: {
        path: 'src/(core|game|ui|storage)/.*',
        typesOnly: true,
        pathNot: 'src/types.ts'
      }
    }
  ],

  /*
   * Настройки парсинга TypeScript
   */
  tsConfig: {
    fileName: './tsconfig.json'
  },

  /*
   * Глобальные настройки
   */
  options: {
    /*
     * Игнорируемые паттерны
     */
    doNotFollow: {
      path: ['node_modules', 'dist', 'docs', 'public']
    },

    /*
     * Исключённые файлы из анализа
     */
    exclude: {
      path: ['**/*.test.ts', '**/*.spec.ts']
    },

    /*
     * Высокоточный режим (медленнее, но точнее)
     */
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },

    /*
     * Настройки отчётов
     */
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(?:@[^/]+/[^/]+|[^/]+)'
      },
      archi: {
        collapsePattern: '^(?:packages|src|lib|app|bin|test|spec)/([^/]+)'
      }
    }
  }
}
```

### `package.json`

Добавить скрипты для валидации:

```json
{
  "scripts": {
    "deps:validate": "depcruise --config .dependency-cruiser.js src",
    "deps:validate:ci": "depcruise --config .dependency-cruiser.js --output-type err-long src",
    "deps:circular": "depcruise --config .dependency-cruiser.js --output-type circular src",
    "deps:html": "depcruise --config .dependency-cruiser.js --output-type html > dist/deps-report.html",
    "deps:dot": "depcruise --config .dependency-cruiser.js --output-type dot > dist/deps.dot",
    "deps:archi": "depcruise --config .dependency-cruiser.js --output-type archi src",
    "deps:summary": "depcruise --config .dependency-cruiser.js --output-type summary src",
    "deps:json": "depcruise --config .dependency-cruiser.js --output-type json > dist/deps.json"
  }
}
```

**Описание скриптов:**

| Команда | Описание |
|---------|----------|
| `yarn deps:validate` | Проверка всех правил (базовый вывод) |
| `yarn deps:validate:ci` | Проверка для CI (детальный вывод ошибок) |
| `yarn deps:circular` | Показать только циклические зависимости |
| `yarn deps:html` | Сгенерировать HTML-отчёт |
| `yarn deps:dot` | Экспорт в DOT (Graphviz) для визуализации |
| `yarn deps:archi` | Архитектурный обзор (свёрнутые модули) |
| `yarn deps:summary` | Краткая сводка по модулям |
| `yarn deps:json` | Экспорт в JSON для программного анализа |

### `.gitignore`

Добавить игнорирование файлов отчётов:

```
node_modules
dist
docs
*.md
public
# Отчёты dependency-cruiser
dist/deps-report.html
dist/deps.dot
dist/deps.json
```

---

## Архитектурные правила проекта

### Слои архитектуры

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  main.ts    │  │  panels.ts  │  │    map.ts       │  │
│  │  (App)      │  │  (UIManager)│  │  (MapRenderer)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                        src/ui/                          │
└─────────────────────────────────────────────────────────┘
                          │ зависит от
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Game Logic Layer                     │
│  ┌─────────────────────────────────────────────────────┐│
│  │              state.ts (Game)                        ││
│  │  - Game Loop  - Action Handler  - State Management ││
│  └─────────────────────────────────────────────────────┘│
│                       src/game/                         │
└─────────────────────────────────────────────────────────┘
                          │ зависит от
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Simulation Core                       │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐  │
│  │  world   │ │  tribe   │ │  tech  │ │    events    │  │
│  │  (map)   │ │ (AI/logic)│ │(tree)  │ │  (generator) │  │
│  └──────────┘ └──────────┘ └────────┘ └──────────────┘  │
│                       src/core/                         │
└─────────────────────────────────────────────────────────┘
                          │ использует
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Storage Layer                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │              db.ts (IndexedDB)                      ││
│  │  - Saves (quicksave, autosave)  - Settings         ││
│  └─────────────────────────────────────────────────────┘│
│                      src/storage/                       │
└─────────────────────────────────────────────────────────┘
```

### Разрешённые зависимости

| Откуда | Куда может импортировать |
|--------|-------------------------|
| **src/ui/** | src/game/, src/types, src/storage |
| **src/game/** | src/core/, src/types, src/storage |
| **src/core/** | src/types, src/core/* (внутри слоя) |
| **src/storage/** | src/types |
| **src/main.ts** | Все слои (точка входа) |

### Запрещённые зависимости

| Откуда | Куда запрещено | Причина |
|--------|---------------|---------|
| **src/ui/** | src/core/ | Нарушение границ представления |
| **src/ui/** | src/storage/ | UI не должен знать о хранении |
| **src/game/** | src/ui/ | Логика не должна зависеть от UI |
| **src/core/** | src/ui/, src/storage/ | Ядро должно быть независимым |
| **src/storage/** | src/game/, src/core/, src/ui/ | Инфраструктура должна быть независимой |
| **Любой** | Циклы | Усложняют поддержку |

---

## Использование

### Базовая валидация

```bash
# Проверка всех правил
yarn deps:validate

# Пример вывода при нарушениях:
# ✖ src/ui/panels.ts → src/core/tribe.ts
#   error no-ui-to-core: UI слой не должен зависеть от ядра симуляции
```

### Поиск циклов

```bash
# Найти циклические зависимости
yarn deps:circular

# Пример вывода:
# src/core/tribe.ts → src/core/events.ts → src/core/tribe.ts
```

### Генерация отчётов

```bash
# HTML-отчёт для просмотра в браузере
yarn deps:html
start dist/deps-report.html

# DOT для визуализации в Graphviz
yarn deps:dot
# Затем: dot -Tsvg dist/deps.dot -o dist/deps.svg
```

### Архитектурный обзор

```bash
# Свёрнутый вид по модулям
yarn deps:archi

# Пример вывода:
# src/core/ (5 файлов)
#   → src/types.ts
# src/game/ (1 файл)
#   → src/core/*
#   → src/types.ts
# src/ui/ (2 файла)
#   → src/game/*
#   → src/types.ts
```

---

## Критерии приемки (Definition of Done)

### Обязательные

- [ ] `dependency-cruiser` установлен
- [ ] Создан `.dependency-cruiser.js` с правилами для 4 слоёв
- [ ] Скрипт `yarn deps:validate` проверяет все правила
- [ ] Скрипт `yarn deps:circular` находит циклические зависимости
- [ ] Скрипт `yarn deps:html` генерирует HTML-отчёт
- [ ] Все существующие нарушения задокументированы или исправлены
- [ ] Настроены исключения для тестовых файлов

### Дополнительные улучшения

- [ ] Проверка в CI/CD (блокировка PR при нарушениях)
- [ ] Pre-commit хук для автоматической проверки
- [ ] Визуализация графа зависимостей (через DOT)
- [ ] Документирование архитектурных решений в правилах

---

## Команды для проверки

```bash
# Установка зависимости
yarn add -D dependency-cruiser

# Инициализация (создаст базовый конфиг)
yarn depcruise --init

# Проверка всех правил
yarn deps:validate

# Проверка для CI (детальный вывод)
yarn deps:validate:ci

# Найти циклы
yarn deps:circular

# Сгенерировать HTML-отчёт
yarn deps:html

# Открыть отчёт
start dist/deps-report.html   # Windows
open dist/deps-report.html    # macOS
```

---

## Интеграция с CI/CD

### GitHub Actions

`.github/workflows/deps-validate.yml`:

```yaml
name: Dependencies Validate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Validate dependencies
        run: yarn deps:validate:ci

      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: deps-report
          path: dist/deps-report.html
```

### Pre-commit хук (опционально)

Установить `husky`:

```bash
yarn add -D husky
yarn husky install
yarn husky add .husky/pre-commit "yarn deps:validate"
```

Или добавить в `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

---

## Интерпретация отчётов

### Ошибки валидации

**Пример нарушения:**

```
✖ src/ui/panels.ts:15:1 → src/core/tribe.ts:8:1
  error no-ui-to-core: UI слой не должен зависеть от ядра симуляции.
  Используйте Game layer.
  
  Правило: no-ui-to-core
  Конфигурация: .dependency-cruiser.js:18
```

**Как исправить:**

```typescript
// ❌ Было (нарушение)
// src/ui/panels.ts
import { Tribe } from '../core/tribe'

// ✅ Стало (через Game layer)
// src/ui/panels.ts
import { Game } from '../game/state'
// Tribe доступен через game.getSelectedTribe()
```

### Циклические зависимости

**Пример цикла:**

```
src/core/tribe.ts:22:1 → src/core/events.ts:15:1 → src/core/tribe.ts:8:1

Путь:
  src/core/tribe.ts (импортирует)
    → src/core/events.ts (импортирует)
      → src/core/tribe.ts
```

**Как исправить:**

```typescript
// ❌ Было (цикл)
// src/core/tribe.ts
import { EventGenerator } from './events'

// src/core/events.ts
import { Tribe } from './tribe'

// ✅ Стало (через интерфейс)
// src/types.ts
export interface ITribeData {
  id: number
  population: number
  // ...
}

// src/core/tribe.ts
import { ITribeData } from '../types'
export class Tribe implements ITribeData { ... }

// src/core/events.ts
import { ITribeData } from '../types'
export class EventGenerator {
  generate(tribe: ITribeData) { ... }
}
```

---

## Расширенные возможности

### Кастомизация правил

#### Разрешить конкретные импорты

```javascript
{
  name: 'no-ui-to-core',
  severity: 'error',
  from: { path: 'src/ui' },
  to: {
    path: 'src/core',
    pathNot: [
      'src/core/constants.ts',  // Константы разрешены
      'src/core/types.ts'       // Типы ядра разрешены
    ]
  }
}
```

#### Предупреждения вместо ошибок

```javascript
{
  name: 'types-only-from-types-file',
  severity: 'warn',  // Не блокирует сборку, но предупреждает
  from: {},
  to: {
    path: 'src/(core|game|ui|storage)/.*',
    typesOnly: true
  }
}
```

#### Условные правила

```javascript
{
  name: 'no-external-to-types',
  severity: 'error',
  from: {
    pathNot: 'src/types.ts'  // Все файлы, кроме types.ts
  },
  to: {
    path: 'src/types.ts',
    external: true  // Только внешние импорты
  }
}
```

### Программное использование

```typescript
// scripts/analyze-deps.ts
import { cruise } from 'dependency-cruiser'

async function analyze() {
  const result = await cruise(
    ['src'],
    {
      tsConfig: './tsconfig.json',
      exclude: ['**/*.test.ts'],
      ruleSet: {
        forbidden: [
          {
            name: 'no-ui-to-core',
            severity: 'error',
            from: { path: 'src/ui' },
            to: { path: 'src/core' }
          }
        ]
      }
    }
  )
  
  console.log('Violations:', result.violations)
  console.log('Modules:', result.modules.length)
}

analyze()
```

### Экспорт в различные форматы

```bash
# JSON для программного анализа
yarn deps:json

# DOT для Graphviz
yarn deps:dot
dot -Tsvg dist/deps.dot -o dist/deps.svg

# HTML для браузера
yarn deps:html

# Текстовый summary
yarn deps:summary

# Развёрнутый список (err-long)
yarn deps:validate:ci
```

---

## Решение проблем

### Ложные срабатывания

**Проблема:** Правило срабатывает на легитимные импорты

**Решение:** Добавить исключение в `.dependency-cruiser.js`:

```javascript
{
  name: 'no-ui-to-core',
  severity: 'error',
  from: { path: 'src/ui' },
  to: {
    path: 'src/core',
    pathNot: [
      'src/core/constants.ts',  // Исключение
      'src/core/types.ts'
    ]
  }
}
```

### Медленная проверка

**Проблема:** Проверка занимает больше 10 секунд

**Решение:** Добавить исключения:

```javascript
options: {
  doNotFollow: {
    path: ['node_modules', 'dist', 'docs']
  },
  exclude: {
    path: ['**/*.test.ts', '**/*.spec.ts']
  }
}
```

### Ошибки парсинга TypeScript

**Проблема:** dependency-cruiser не может распарсить файлы

**Решение:** Убедиться, что `tsconfig.json` корректен:

```javascript
tsConfig: {
  fileName: './tsconfig.json'
}
```

Проверить, что все path aliases разрешаются.

---

## Сравнение с Madge

| Функция | dependency-cruiser | Madge |
|---------|-------------------|-------|
| **Валидация правил** | ✅ Продвинутая | ⚠️ Базовая |
| **Поиск циклов** | ✅ С путями и строками | ✅ |
| **Визуализация** | ⚠️ Через DOT | ✅ Прямая |
| **Конфигурация** | ✅ Гибкая (JS) | ⚠️ Простая |
| **CI интеграция** | ✅ Детальные отчёты | ✅ |
| **Архитектурные правила** | ✅ Декларативные | ❌ |
| **Скорость** | ✅ Быстрее | ⚠️ Средняя |
| **Learning curve** | ⚠️ Средняя | ✅ Низкая |

**Вывод:** dependency-cruiser выбран для **валидации архитектурных правил**, Madge лучше подходит для **визуализации зависимостей**.

---

## Связанные спецификации

- [SPEC-001](./001-setup-prettier.md) — Настройка Prettier
- [SPEC-002](./002-setup-eslint.md) — Настройка ESLint
- [SPEC-003](./003-setup-vitest.md) — Настройка Vitest
- [SPEC-004](./004-bundle-analysis.md) — Анализ размера бандлов

---

## История

- **Создано:** 2026-02-28
- **Статус:** TODO
- **Исполнитель:** TBD
