# SPEC-002: Настройка ESLint

## Описание

Настройка статического анализатора кода ESLint для TypeScript с интеграцией Prettier.

## Проблема

В проекте отсутствует линтинг кода, что приводит к:
- Возможным ошибкам в коде (undefined, unused variables)
- Несоблюдению лучших практик TypeScript
- Отсутствию единого стиля кода

## Решение

Интегрировать ESLint с правилами для TypeScript и интеграцией с Prettier.

## Зависимости

```json
{
  "devDependencies": {
    "eslint": "^8.57.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.0"
  }
}
```

## Файлы для создания

### `eslint.config.js` (Flat Config)

```javascript
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      // TypeScript specific
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      
      // General
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Prettier
      'prettier/prettier': 'error'
    }
  },
  {
    ignores: ['node_modules', 'dist', 'docs', 'public']
  }
)
```

### `.eslintignore`

```
node_modules
dist
docs
public
*.config.js
*.config.ts
```

## Изменения в существующих файлах

### `package.json`

Обновить скрипт lint:

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix"
  }
}
```

### `tsconfig.json`

Добавить правила для строгой типизации:

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Критерии приемки (Definition of Done)

- [ ] ESLint установлен и настроен
- [ ] Все файлы в `src/` проходят линтинг без ошибок
- [ ] Скрипт `yarn lint` работает корректно
- [ ] Скрипт `yarn lint:fix` исправляет автоматические ошибки
- [ ] Интеграция с Prettier работает (нет конфликтов)
- [ ] Настроены правила для unused variables с игнорированием `_` префикса

## Команды для проверки

```bash
# Установка зависимостей
yarn add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier

# Линтинг
yarn lint

# Автоисправление
yarn lint:fix
```

## Дополнительные улучшения (опционально)

### Строгие правила TypeScript

Создать кастомную конфигурацию для строгой типизации:

```javascript
export default tseslint.config(
  // ...
  {
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn'
    }
  }
)
```

### Интеграция с CI

Добавить шаг в CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: yarn lint
```

## Связанные спецификации

- [SPEC-001](./001-setup-prettier.md) — Настройка Prettier
- [SPEC-003](./003-test-coverage-100.md) — Покрытие тестами

## История

- **Создано:** 2026-02-21
- **Статус:** TODO
- **Исполнитель:** TBD
