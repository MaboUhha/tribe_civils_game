# SPEC-001: Настройка Prettier

## Описание

Настройка инструмента автоматического форматирования кода Prettier для обеспечения единого стиля кода в проекте.

## Проблема

В проекте отсутствует автоматическое форматирование кода, что приводит к:
- Несогласованному стилю кода
- Лишним правкам в code review
- Потере времени на ручное форматирование

## Решение

Интегрировать Prettier в проект для автоматического форматирования TypeScript, JSON, Markdown и других файлов.

## Зависимости

```json
{
  "devDependencies": {
    "prettier": "^3.2.0",
    "prettier-plugin-organize-imports": "^3.2.4"
  }
}
```

## Файлы для создания

### `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-organize-imports"]
}
```

### `.prettierignore`

```
node_modules
dist
docs
*.md
public
```

## Изменения в существующих файлах

### `package.json`

Добавить скрипты:

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json}\""
  }
}
```

## Критерии приемки (Definition of Done)

- [ ] Prettier установлен и настроен
- [ ] Все файлы в `src/` отформатированы
- [ ] Скрипт `yarn format` работает корректно
- [ ] Скрипт `yarn format:check` проходит без ошибок
- [ ] Настроен `.prettierignore` для исключения ненужных файлов

## Команды для проверки

```bash
# Установка зависимостей
yarn add -D prettier prettier-plugin-organize-imports

# Форматирование всех файлов
yarn format

# Проверка формата (для CI)
yarn format:check
```

## Дополнительные улучшения (опционально)

### Pre-commit хук

Установить `lint-staged` для автоматического форматирования перед коммитом:

```bash
yarn add -D lint-staged husky
```

`.github/lint-staged.config.js`:
```javascript
export default {
  '*.{ts,tsx,json}': ['prettier --write']
}
```

`package.json`:
```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx,json}": ["prettier --write"]
  }
}
```

## История

- **Создано:** 2026-02-21
- **Статус:** TODO
- **Исполнитель:** TBD
