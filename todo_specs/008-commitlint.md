# SPEC-008: Настройка валидации commit-сообщений

## Описание

Настройка **commitlint** для валидации сообщений коммитов по стандарту **Conventional Commits**.

## Проблема

В проекте отсутствуют правила оформления коммитов, что приводит к:
- Разнобою в формате сообщений коммитов
- Невозможности автоматической генерации changelog
- Сложности понимания истории изменений
- Отсутствию семантической значимости коммитов
- Проблемам при откате изменений (cherry-pick, revert)

## Решение

Интегрировать **commitlint** — валидатор commit-сообщений с интеграцией в pre-commit хуки через Husky.

### Почему commitlint

| Критерий | Решение |
|----------|---------|
| Стандарт | ✅ Conventional Commits (индустриальный стандарт) |
| Интеграция | ✅ Husky, CI/CD, GitHub Actions |
| Гибкость | ✅ Кастомные правила и типы |
| Экосистема | ✅ Совместимость с changelog-генераторами |
| Популярность | ✅ Стандарт де-факто для валидации коммитов |

### Альтернативы

| Инструмент | Почему не выбрали |
|------------|-------------------|
| **commitizen** | Требует интерактивного режима, не валидирует |
| **git-cz** | Обёртка над commitizen, та же проблема |
| **pre-commit-commitlint** | Менее популярен, меньше документации |
| **commitlint** ✅ | Стандарт, гибкость, отличная интеграция |

---

## Зависимости

```json
{
  "devDependencies": {
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0"
  }
}
```

**Опционально:**
- `@commitlint/cz-commitlint` — для интерактивного режима (Commitizen)
- `commitizen` — интерактивный ввод коммитов

---

## Файлы для создания

### `commitlint.config.js`

Конфигурационный файл с правилами валидации:

```javascript
/** @type {import('@commitlint/types').UserConfig} */
export default {
  // Базовая конфигурация
  extends: ['@commitlint/config-conventional'],
  
  // Правила
  rules: {
    /*
     * Тип коммита обязателен
     * Допустимые значения: feat, fix, docs, style, refactor, test, chore, ci, perf, revert
     */
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Новая функциональность
        'fix',      // Исправление бага
        'docs',     // Изменение документации
        'style',    // Форматирование, пробелы, точки с запятой
        'refactor', // Рефакторинг без изменения поведения
        'test',     // Добавление или изменение тестов
        'chore',    // Изменение сборки, конфигурации
        'ci',       // Изменение CI/CD конфигурации
        'perf',     // Улучшение производительности
        'revert'    // Откат предыдущего коммита
      ]
    ],
    
    // Тип должен быть в нижнем регистре
    'type-case': [2, 'always', 'lower-case'],
    
    // Тип не может быть пустым
    'type-empty': [2, 'never'],
    
    // Scope опционален (можно комментировать для обязательности)
    'scope-empty': [0],
    
    // Scope должен быть в нижнем регистре
    'scope-case': [0, 'always', 'lower-case'],
    
    // Описание обязательно
    'subject-empty': [2, 'never'],
    
    // Описание не должно заканчиваться точкой
    'subject-full-stop': [2, 'never', '.'],
    
    // Описание должно начинаться с заглавной буквы (опционально)
    'subject-case': [
      0,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case']
    ],
    
    // Максимальная длина заголовка (72 символа — стандарт Git)
    'header-max-length': [2, 'always', 72],
    
    // Максимальная длина описания (subject)
    'subject-max-length': [2, 'always', 50],
    
    // Минимальная длина описания
    'subject-min-length': [2, 'always', 10],
    
    // Тело коммита опционально
    'body-empty': [0],
    
    // Тело должно начинаться с пустой строки после заголовка
    'body-leading-blank': [2, 'always'],
    
    // Максимальная длина тела
    'body-max-line-length': [2, 'always', 100],
    
    // Футер опционален
    'footer-empty': [0],
    
    // Футер должен начинаться с пустой строки
    'footer-leading-blank': [0, 'always'],
    
    // Максимальная длина футера
    'footer-max-line-length': [2, 'always', 100],
    
    // Header не может быть пустым
    'header-max-length': [2, 'always', 120]
  },
  
  // Плагины (опционально)
  plugins: [
    // Можно добавить кастомные плагины
  ],
  
  // Помощники для кастомизации
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
  
  // Форматирование ошибок
  prompt: {
    questions: {
      type: {
        description: "Выберите тип изменения"
      },
      scope: {
        description: "Выберите область изменения (опционально)"
      },
      subject: {
        description: "Введите краткое описание изменения"
      }
    }
  }
}
```

### `.husky/commit-msg`

Git-хук для валидации сообщения коммита:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
```

### `package.json`

Добавить скрипты для работы с commitlint:

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
    "prepare": "husky",
    "commitlint": "commitlint --edit",
    "commitlint:from": "commitlint --from",
    "commit:retry": "git commit --amend --no-edit"
  }
}
```

### `.commitlintrc.json` (альтернатива JS-конфигу)

JSON-версия конфигурации (если предпочитаете JSON):

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "ci", "perf", "revert"]
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 72]
  }
}
```

### `.gitignore`

Добавить игнорирование (опционально):

```
node_modules
dist
docs
*.md
public

# Commitlint
.commitlintrc.json
```

---

## Conventional Commits стандарт

### Формат

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Типы коммитов

| Тип | Описание | Пример |
|-----|----------|--------|
| `feat` | Новая функциональность | `feat: add tribe AI behavior` |
| `fix` | Исправление бага | `fix: resolve crash on save` |
| `docs` | Изменение документации | `docs: update API reference` |
| `style` | Форматирование, стиль | `style: fix indentation` |
| `refactor` | Рефакторинг | `refactor: simplify world generation` |
| `test` | Тесты | `test: add world generation tests` |
| `chore` | Обслуживание | `chore: update dependencies` |
| `ci` | CI/CD | `ci: add lint workflow` |
| `perf` | Производительность | `perf: optimize render loop` |
| `revert` | Откат | `revert: revert "feat: add AI"` |

### Scope (область изменений)

Опциональная часть для указания модуля:

```
feat(core): add new tribe method
fix(ui): resolve rendering issue
chore(deps): bump vitest version
docs(api): update examples
```

**Рекомендуемые scope для проекта:**

| Scope | Модуль |
|-------|--------|
| `core` | `src/core/*` |
| `game` | `src/game/*` |
| `ui` | `src/ui/*` |
| `storage` | `src/storage/*` |
| `deps` | Зависимости |
| `config` | Конфигурационные файлы |
| `api` | API документация |
| `infra` | Инфраструктура (CI/CD, хуки) |

### Примеры правильных коммитов

```bash
# Простые
feat: add new tribe AI behavior
fix: resolve circular dependency in events
docs: update API documentation
style: fix code formatting
refactor: simplify map rendering logic
test: add world generation tests
chore: update dependencies
ci: add lint workflow

# Со scope
feat(core): add resource gathering AI
fix(ui): resolve canvas rendering issue
chore(deps): bump vitest to 1.3.0
docs(api): add examples for Tribe class
refactor(game): extract tick logic to separate method

# С телом коммита
feat: add tribe settlement system

Tribes can now settle when population reaches 30+.
Settled tribes stop moving and gain resource bonuses.

Closes #42

# С футером
fix: resolve save game corruption

BREAKING CHANGE: save format changed from v0.1.0
Migration required for existing saves.
```

### Примеры неправильных коммитов

```bash
# ❌ Нет типа
add new feature
fixed bug
update docs

# ❌ Неправильный регистр
FEAT: add new feature
Feat: add new feature

# ❌ Точка в конце
feat: add new feature.

# ❌ Слишком длинный
feat: add new tribe AI behavior for resource gathering and settlement and other stuff that is way too long

# ❌ Неправильный тип
feature: add new feature
bugfix: fix crash
```

---

## Интеграция с Husky

### Настройка pre-commit хука

```bash
# Установить зависимости
yarn add -D @commitlint/cli @commitlint/config-conventional

# Создать commit-msg хук
yarn husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'

# Сделать хук исполняемым (Windows не требуется)
chmod +x .husky/commit-msg
```

### Проверка работы

```bash
# Тестовый коммит
echo "test" > test.txt
git add test.txt
git commit -m "feat: add test file"

# Ожидается: ✅ Коммит создан

# Неправильный коммит
git commit --amend -m "added test file"

# Ожидается: ❌ Ошибка валидации
```

---

## Интерактивный режим (опционально)

### Установка Commitizen

```bash
yarn add -D commitizen @commitlint/cz-commitlint
```

### Настройка

```javascript
// .czrc
{
  "path": "@commitlint/cz-commitlint"
}
```

### Использование

```bash
# Интерактивный коммит
yarn commit

# Или через npx
npx cz
```

Интерактивный режим задаст вопросы:
1. Тип изменения (feat, fix, docs...)
2. Область (scope) — опционально
3. Краткое описание
4. Подробное описание — опционально
5. Breaking changes — опционально

---

## Использование

### Базовая валидация

```bash
# Проверить последнее сообщение коммита
yarn commitlint

# Проверить коммиты в диапазоне
yarn commitlint --from HEAD~3 --to HEAD

# Проверить все коммиты в ветке
yarn commitlint --from main --to HEAD
```

### В pre-commit

```bash
# Автоматическая проверка при git commit
git commit -m "feat: add new feature"
# ✅ Принято

git commit -m "added new feature"
# ❌ Отклонено: type must be one of [feat, fix, docs...]
```

### В CI/CD

```bash
# Проверка всех коммитов в PR
yarn commitlint --from origin/main --to HEAD
```

---

## Критерии приемки (Definition of Done)

### Обязательные

- [ ] `@commitlint/cli` установлен
- [ ] `@commitlint/config-conventional` установлен
- [ ] Создан `commitlint.config.js` с правилами
- [ ] Создан `.husky/commit-msg` хук
- [ ] Pre-commit хук работает автоматически
- [ ] Правильные коммиты принимаются
- [ ] Неправильные коммиты отклоняются
- [ ] Скрипт `yarn commitlint` работает

### Дополнительные улучшения

- [ ] Настроен интерактивный режим (Commitizen)
- [ ] Проверка в CI/CD
- [ ] Кастомные типы коммитов
- [ ] Документация по форматам для команды

---

## Команды для проверки

```bash
# Установка зависимостей
yarn add -D @commitlint/cli @commitlint/config-conventional

# Создание commit-msg хука
yarn husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'

# Проверка последнего коммита
yarn commitlint

# Проверка диапазона коммитов
yarn commitlint --from HEAD~5

# Проверка с указанием ветки
yarn commitlint --from origin/main --to HEAD

# Повторить последний коммит с исправлением
yarn commit:retry
```

---

## Примеры работы

### Успешный коммит

```bash
$ git commit -m "feat(core): add tribe resource gathering AI"

✅ Commit message passed validation!
[main abc123] feat(core): add tribe resource gathering AI
 1 file changed, 15 insertions(+)
```

### Неудачный коммит

```bash
$ git commit -m "added tribe AI"

❌ Commit message validation failed!

✖   type must be one of [feat, fix, docs, style, refactor, test, chore, ci, perf, revert]
✖   subject must not be empty
✖   header must not be longer than 72 characters

Please fix your commit message and try again.

See: https://www.conventionalcommits.org/
```

### Исправление коммита

```bash
# Отмена последнего коммита
git commit --amend

# Исправление сообщения
git commit --amend -m "feat(core): add tribe AI for resource gathering"

# Или через скрипт
yarn commit:retry
```

### Проверка нескольких коммитов

```bash
$ yarn commitlint --from HEAD~3

📝 Checking 3 commits...

✅ feat: add tribe AI
✅ fix: resolve save issue
❌ update docs

✖   type must be one of [feat, fix, docs...]

Found 1 invalid commit(s)
```

---

## Интеграция с CI/CD

### GitHub Actions

`.github/workflows/commitlint.yml`:

```yaml
name: Commitlint

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  commitlint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Важно для получения истории коммитов

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Validate PR commits
        run: yarn commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }}
        
      - name: Validate last commit (push)
        if: github.event_name == 'push'
        run: yarn commitlint --from HEAD~1
```

### Использование готового action

```yaml
# .github/workflows/commitlint.yml
name: Commitlint

on: [push, pull_request]

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: wagoid/commitlint-github-action@v5
        with:
          failOnWarnings: false
          helpURL: 'https://github.com/conventional-changelog/commitlint'
```

---

## Расширенные возможности

### Кастомные типы

Добавить свои типы коммитов:

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'ci',
        'perf',
        'revert',
        // Кастомные типы
        'merge',    // Слияние веток
        'release',  // Релизы
        'wip'       // Work in progress
      ]
    ]
  }
}
```

### Обязательный scope

Требовать указание scope для определённых типов:

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Scope обязателен для feat и fix
    'scope-empty': [2, 'never'],
    'scope-enum': [
      2,
      'always',
      ['core', 'game', 'ui', 'storage', 'deps', 'config', 'api', 'infra']
    ]
  },
  // Но только для определённых типов
  ignores: [(commit) => !['feat', 'fix'].includes(commit.type)]
}
```

### Валидация по веткам

Разные правила для разных веток:

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']],
    'header-max-length': [2, 'always', 72]
  },
  // Ослабленные правила для develop
  overrides: [
    {
      branches: ['develop'],
      rules: {
        'header-max-length': [1, 'always', 100]  // Warning вместо error
      }
    }
  ]
}
```

### Пропуск валидации

Иногда нужно сделать коммит без валидации:

```bash
# Пропустить хуки
git commit --no-verify -m "WIP: temporary commit"

# Или короткая версия
git commit -n -m "WIP: temporary commit"
```

**Важно:** Не используйте в production-коде!

---

## Решение проблем

### Хук не запускается

**Проблема:** Commit-msg хук не срабатывает

**Причина:** Хук не имеет прав на выполнение

**Решение:**
```bash
chmod +x .husky/commit-msg
```

### Ошибка "Cannot find module"

**Проблема:** commitlint не находит конфигурацию

**Причина:** Неправильный путь или формат конфига

**Решение:**
1. Проверить наличие `commitlint.config.js` в корне
2. Убедиться, что формат правильный (ESM или CommonJS)
3. Пересоздать хук:
```bash
yarn husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

### Конфликт с pre-commit хуком

**Проблема:** Husky pre-commit запускается до commit-msg

**Решение:** Это нормальное поведение. Pre-commit проверяет код, commit-msg проверяет сообщение.

### Проверка старых коммитов

**Проблема:** Нужно проверить существующие коммиты

**Решение:**
```bash
# Проверить последние 10 коммитов
yarn commitlint --from HEAD~10

# Проверить все коммиты в ветке
yarn commitlint --from $(git rev-list --max-parents=0 HEAD)
```

### Слишком строгие правила

**Проблема:** Команда не может адаптироваться к строгим правилам

**Решение:** Ослабить правила постепенно:

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Warning вместо error
    'subject-max-length': [1, 'always', 50],
    
    // Отключить правило
    'scope-empty': [0],
    
    // Увеличить лимит
    'header-max-length': [2, 'always', 100]
  }
}
```

---

## Интеграция с другими инструментами

### Связь с pre-commit хуками (SPEC-006)

Commitlint работает **после** pre-commit хука:

```
git commit
    │
    ▼
┌─────────────┐
│ pre-commit  │ ← Husky + lint-staged (проверка кода)
└──────┬──────┘
       │ ✅
       ▼
┌─────────────┐
│ commit-msg  │ ← commitlint (проверка сообщения)
└──────┬──────┘
       │ ✅
       ▼
   Коммит создан
```

### Связь с CI/CD

В CI проверяются все коммиты в PR:

```
Pull Request
    │
    ▼
┌─────────────────┐
│ GitHub Actions  │
│  - Tests        │
│  - Lint         │
│  - Commitlint   │ ← Проверка всех коммитов в PR
│  - Build        │
└─────────────────┘
```

### Генерация changelog (опционально)

Commitlint совместим с генераторами changelog:

```bash
yarn add -D conventional-changelog-cli
```

```bash
# Сгенерировать changelog
yarn conventional-changelog -p angular -i CHANGELOG.md -s
```

---

## Сравнение подходов

### Commitlint vs Commitizen

| Характеристика | Commitlint | Commitizen |
|----------------|------------|------------|
| **Назначение** | Валидация сообщений | Интерактивный ввод |
| **Режим** | Автоматический (хук) | Интерактивный (CLI) |
| **Блокировка** | ✅ Отклоняет коммиты | ❌ Только помогает |
| **Интеграция** | Husky, CI | CLI |
| **Рекомендация** | Обязательно | Опционально |

**Идеальная комбинация:** Commitlint (валидация) + Commitizen (помощь)

---

## Связанные спецификации

- [SPEC-001](./001-setup-prettier.md) — Настройка Prettier
- [SPEC-002](./002-setup-eslint.md) — Настройка ESLint
- [SPEC-003](./003-setup-vitest.md) — Настройка Vitest
- [SPEC-004](./004-bundle-analysis.md) — Анализ размера бандлов
- [SPEC-005](./005-architecture-dependency-validator.md) — Валидация зависимостей
- [SPEC-006](./006-pre-commit-hooks.md) — Pre-commit хуки
- [SPEC-007](./007-typedoc-api-documentation.md) — TypeDoc документация

---

## История

- **Создано:** 2026-02-28
- **Статус:** TODO
- **Исполнитель:** TBD
