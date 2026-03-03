# SPEC-006: Настройка pre-commit хуков

## Описание

Настройка автоматических pre-commit хуков для запуска проверок кода перед каждым коммитом.

## Проблема

В проекте отсутствуют автоматические проверки перед коммитом, что приводит к:
- Коммитам с неотформатированным кодом
- Коммитам с ошибками линтера
- Коммитам с непрошедшими тестами
- Необходимости ручного запуска всех проверок
- «Сломанным» коммитам в истории

## Решение

Интегрировать **Husky** для управления Git-хуками и **lint-staged** для запуска проверок только на изменённых файлах.

### Почему Husky + lint-staged

| Критерий | Решение |
|----------|---------|
| Простота настройки | ✅ Минимальная конфигурация |
| Производительность | ✅ Запуск только на staged файлах |
| Гибкость | ✅ Любые команды в хуках |
| Совместимость | ✅ Работает с любым инструментом |
| Сообщество | ✅ Стандарт де-факто для Git-хуков |

### Альтернативы

| Инструмент | Почему не выбрали |
|------------|-------------------|
| **pre-commit** (Python) | Требует Python, сложнее для JS-проектов |
| **Lefthook** | Менее популярен, меньше документации |
| **Husky + lint-staged** ✅ | Стандарт индустрии, простая настройка |

---

## Зависимости

```json
{
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0"
  }
}
```

---

## Файлы для создания

### `.husky/pre-commit`

Git-хук для pre-commit проверок:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### `.lintstagedrc.js` (или `.lintstagedrc.json`)

Конфигурация lint-staged:

```javascript
export default {
  // TypeScript файлы
  '*.{ts,tsx}': [
    // Форматирование
    'prettier --write',
    // Линтинг
    'eslint --fix',
    // Тесты (только для изменённых файлов)
    // 'vitest run --related'
  ],
  
  // JSON файлы
  '*.json': [
    'prettier --write'
  ],
  
  // Markdown файлы
  '*.md': [
    'prettier --write'
  ],
  
  // Конфигурационные файлы
  '*.{js,jsx,cjs,mjs}': [
    'prettier --write',
    'eslint --fix'
  ]
}
```

### `package.json`

Обновить скрипты и добавить prepare:

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
    "prepare": "husky"
  }
}
```

### `.editorconfig`

Единые настройки редактора для всех разработчиков:

```editorconfig
# EditorConfig помогает поддерживать единый стиль кода
# https://editorconfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{yaml,yml}]
indent_size = 2

[Makefile]
indent_size = tab
```

### `.gitignore`

Добавить игнорирование служебных файлов:

```
node_modules
dist
docs
*.md
public

# Husky
.husky/*.sh
.husky/.gitignore

# lint-staged
.lintstagedrc.json

# EditorConfig
.editorconfig
```

---

## Настройка шаг за шагом

### Шаг 1: Установка зависимостей

```bash
yarn add -D husky lint-staged
```

### Шаг 2: Инициализация Husky

```bash
# Инициализация .husky/ директории
yarn husky init
```

Это создаст:
- `.husky/` директорию
- `.husky/pre-commit` файл
- Добавит `"prepare": "husky"` в `package.json`

### Шаг 3: Настройка pre-commit хука

Отредактировать `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### Шаг 4: Настройка lint-staged

Создать `.lintstagedrc.js`:

```javascript
export default {
  '*.{ts,tsx}': ['prettier --write', 'eslint --fix'],
  '*.json': ['prettier --write'],
  '*.md': ['prettier --write']
}
```

### Шаг 5: Создание .editorconfig

Создать файл `.editorconfig` в корне проекта.

### Шаг 6: Проверка работы

```bash
# Добавить файл
echo "console.log('test')" > src/test.ts
git add src/test.ts

# Попробовать сделать коммит
git commit -m "test: pre-commit hook check"

# Ожидается:
# - Prettier отформатирует файл
# - ESLint проверит и исправит ошибки
# - Коммит будет создан
```

---

## Конфигурация проверок

### Базовая конфигурация (рекомендуется)

```javascript
// .lintstagedrc.js
export default {
  '*.{ts,tsx}': ['prettier --write', 'eslint --fix'],
  '*.json': ['prettier --write'],
  '*.md': ['prettier --write']
}
```

**Что делает:**
- Форматирует TypeScript файлы
- Исправляет ошибки ESLint
- Форматирует JSON и Markdown

### Расширенная конфигурация

```javascript
// .lintstagedrc.js
export default {
  // TypeScript файлы
  '*.{ts,tsx}': [
    // 1. Форматирование
    'prettier --write',
    // 2. Линтинг
    'eslint --fix',
    // 3. Проверка типов TypeScript
    // 'tsc --noEmit',  // Медленно, лучше в CI
    // 4. Тесты (опционально, может быть медленно)
    // 'vitest run --related'
  ],
  
  // JSON файлы
  '*.json': [
    'prettier --write'
  ],
  
  // Markdown файлы
  '*.md': [
    'prettier --write'
  ],
  
  // Конфигурационные файлы
  '*.{js,jsx,cjs,mjs}': [
    'prettier --write',
    'eslint --fix'
  ],
  
  // YAML файлы
  '*.{yaml,yml}': [
    'prettier --write'
  ]
}
```

### Конфигурация для CI

Создать отдельный конфиг для CI (опционально):

```javascript
// .lintstagedrc.ci.js
export default {
  '*.{ts,tsx}': [
    'prettier --check',  // Не исправлять, только проверять
    'eslint'             // Не исправлять, только проверять
  ],
  '*.json': ['prettier --check'],
  '*.md': ['prettier --check']
}
```

---

## Pre-commit хуки для разных сценариев

### Сценарий 1: Только форматирование

```javascript
// .lintstagedrc.js
export default {
  '*.{ts,tsx,json,md}': ['prettier --write']
}
```

### Сценарий 2: Форматирование + линтинг

```javascript
// .lintstagedrc.js
export default {
  '*.{ts,tsx}': ['prettier --write', 'eslint --fix'],
  '*.{json,md}': ['prettier --write']
}
```

### Сценарий 3: Полная проверка (медленно)

```javascript
// .lintstagedrc.js
export default {
  '*.{ts,tsx}': [
    'prettier --write',
    'eslint --fix',
    'vitest run --related',
    'depcruise --config .dependency-cruiser.js'
  ]
}
```

### Сценарий 4: Только для src/

```javascript
// .lintstagedrc.js
export default {
  'src/**/*.{ts,tsx}': ['prettier --write', 'eslint --fix']
}
```

---

## Критерии приемки (Definition of Done)

### Обязательные

- [ ] `husky` установлен и инициализирован
- [ ] `lint-staged` установлен и настроен
- [ ] Pre-commit хук запускается автоматически
- [ ] Форматирование (Prettier) работает на staged файлах
- [ ] Линтинг (ESLint) работает на staged файлах
- [ ] `.editorconfig` создан и настроен
- [ ] Скрипт `yarn prepare` настроен

### Дополнительные улучшения

- [ ] Тесты запускаются на изменённых файлах (опционально)
- [ ] Проверка зависимостей в pre-commit (опционально)
- [ ] Отдельный конфиг для CI
- [ ] Commit message валидация (commitlint)

---

## Команды для проверки

```bash
# Установка зависимостей
yarn add -D husky lint-staged

# Инициализация Husky
yarn husky init

# Проверка pre-commit хука
echo "console.log('test')" > src/test.ts
git add src/test.ts
git commit -m "test: pre-commit check"

# Запуск lint-staged вручную
npx lint-staged

# Запуск lint-staged для конкретных файлов
npx lint-staged "src/**/*.ts"

# Проверка .editorconfig
npx editorconfig-checker
```

---

## Примеры работы

### Успешный коммит

```bash
$ git add src/core/tribe.ts
$ git commit -m "feat: add new tribe method"

Running tasks for src/core/tribe.ts...

✓ prettier --write (took 0.5s)
✓ eslint --fix (took 1.2s)

✔ Pre-commit checks passed
[main abc123] feat: add new tribe method
 1 file changed, 5 insertions(+)
```

### Коммит с ошибками

```bash
$ git add src/ui/panels.ts
$ git commit -m "feat: add new panel"

Running tasks for src/ui/panels.ts...

✓ prettier --write (took 0.5s)
✖ eslint --fix (took 1.2s)

✖ Pre-commit checks failed!

src/ui/panels.ts
  15:1  error  'unusedVar' is defined but never used  no-unused-vars

✖ Commit aborted

Please fix the errors and try again.
```

**Решение:**
```bash
# Исправить вручную
yarn lint:fix

# Или запустить lint-staged ещё раз
npx lint-staged

# Затем повторить коммит
git add src/ui/panels.ts
git commit -m "feat: add new panel"
```

### Коммит с несколькими файлами

```bash
$ git add src/core/world.ts src/core/tribe.ts src/ui/map.ts
$ git commit -m "feat: update world generation"

Running tasks...

✓ prettier --write (3 files, took 1.1s)
✓ eslint --fix (3 files, took 2.3s)

✔ Pre-commit checks passed
[main def456] feat: update world generation
 3 files changed, 25 insertions(+), 10 deletions(-)
```

---

## Интеграция с CI/CD

### GitHub Actions

`.github/workflows/ci.yml`:

```yaml
name: CI

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

      - name: Check formatting
        run: yarn format:check

      - name: Run linter
        run: yarn lint

      - name: Run tests
        run: yarn test:run

      - name: Validate dependencies
        run: yarn deps:validate

      - name: Build
        run: yarn build
```

### Pre-commit в CI (опционально)

Для полной эмуляции pre-commit в CI:

```yaml
- name: Run lint-staged
  run: npx lint-staged --concurrent false
```

---

## Расширенные возможности

### Пропуск pre-commit

Иногда нужно сделать коммит без проверок:

```bash
# Пропустить pre-commit хук
git commit --no-verify -m "WIP: temporary commit"

# Или короткая версия
git commit -n -m "WIP: temporary commit"
```

**Важно:** Не используйте это в production-коде!

### Кастомизация вывода

Создать свой скрипт для красивого вывода:

```javascript
// scripts/pre-commit.js
import { execSync } from 'child_process'
import lintStaged from 'lint-staged'

console.log('🔍 Running pre-commit checks...\n')

try {
  await lintStaged({
    '*.{ts,tsx}': ['prettier --write', 'eslint --fix'],
    '*.json': ['prettier --write']
  })
  
  console.log('✅ All checks passed!')
  process.exit(0)
} catch (error) {
  console.error('❌ Pre-commit checks failed!')
  process.exit(1)
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
node scripts/pre-commit.js
```

### Валидация commit message

Добавить `commitlint` для проверки сообщений коммитов:

```bash
yarn add -D @commitlint/config-conventional @commitlint/cli
```

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']
    ]
  }
}
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
npx commitlint --edit $1
```

### Проверка на секреты

Добавить `detect-secrets` для проверки на утечку секретов:

```bash
yarn add -D detect-secrets
```

```javascript
// .lintstagedrc.js
export default {
  '*.{ts,tsx,json}': [
    'prettier --write',
    'eslint --fix',
    'detect-secrets scan --diff-staged'
  ]
}
```

---

## Решение проблем

### Хук не запускается

**Проблема:** Pre-commit хук не срабатывает

**Причина:** Хук не имеет прав на выполнение

**Решение:**
```bash
chmod +x .husky/pre-commit
```

### lint-staged не находит файлы

**Проблема:** lint-staged говорит «No staged files»

**Причина:** Файлы не добавлены в staging area

**Решение:**
```bash
git add <files>
git commit
```

### Конфликт между Prettier и ESLint

**Проблема:** Prettier и ESLint конфликтуют

**Причина:** Неправильный порядок или настройка

**Решение:**
1. Всегда запускать Prettier перед ESLint
2. Использовать `eslint-config-prettier` для отключения конфликтующих правил

```javascript
// .lintstagedrc.js
export default {
  '*.{ts,tsx}': [
    'prettier --write',  // Сначала форматирование
    'eslint --fix'       // Потом линтинг
  ]
}
```

### Медленный pre-commit

**Проблема:** Хук выполняется больше 10 секунд

**Решение:**
1. Убрать тяжёлые проверки (тесты, typecheck)
2. Использовать кэширование
3. Запускать только на изменённых файлах

```javascript
// .lintstagedrc.js
export default {
  '*.{ts,tsx}': [
    'prettier --write',
    'eslint --fix'
    // Убрать: 'vitest run --related'  // Медленно
    // Убрать: 'tsc --noEmit'          // Медленно
  ]
}
```

Тяжёлые проверки перенести в CI.

---

## Сравнение подходов

### Pre-commit vs CI проверки

| Характеристика | Pre-commit | CI |
|----------------|------------|----|
| Скорость | ✅ Быстро (локально) | ⚠️ Медленнее (сеть) |
| Обратная связь | ✅ Мгновенная | ⚠️ Через минуты |
| Надёжность | ⚠️ Можно пропустить (`--no-verify`) | ✅ Обязательно |
| Производительность | ✅ Только изменённые файлы | ⚠️ Все файлы |

**Рекомендация:** Использовать оба подхода:
- **Pre-commit:** Быстрые проверки (форматирование, линтинг)
- **CI:** Полные проверки (тесты, типизация, сборка)

---

## Связанные спецификации

- [SPEC-001](./001-setup-prettier.md) — Настройка Prettier
- [SPEC-002](./002-setup-eslint.md) — Настройка ESLint
- [SPEC-003](./003-setup-vitest.md) — Настройка Vitest
- [SPEC-005](./005-architecture-dependency-validator.md) — Валидация зависимостей
- [SPEC-007](./007-ci-cd-github-actions.md) — CI/CD (планируется)

---

## История

- **Создано:** 2026-02-28
- **Статус:** TODO
- **Исполнитель:** TBD
