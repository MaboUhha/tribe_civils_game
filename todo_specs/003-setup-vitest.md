# SPEC-003: Настройка Vitest и покрытие тестами

## Описание

Настройка фреймворка для тестирования Vitest и написание тестов для ключевых модулей проекта.

## Проблема

В проекте полностью отсутствуют автоматические тесты, что приводит к:
- Риску регрессий при изменении кода
- Отсутствию уверенности в корректности работы систем
- Сложности рефакторинга без гарантии работоспособности
- Невозможности автоматической проверки в CI/CD

## Решение

Интегрировать Vitest (нативный для Vite фреймворк тестирования) и покрыть тестами ключевые модули ядра симуляции.

## Зависимости

```json
{
  "devDependencies": {
    "vitest": "^1.3.0",
    "@vitest/coverage-v8": "^1.3.0",
    "jsdom": "^24.0.0",
    "@testing-library/dom": "^9.3.0"
  }
}
```

## Файлы для создания

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'docs', 'public'],
    // Покрытие показывается при каждом запуске yarn test
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Включаем ВСЮ кодовую базу для анализа покрытия
      include: ['src/**/*.ts'],
      // Исключаем только UI и точку входа (визуальный слой)
      exclude: ['src/ui/**/*.ts', 'src/main.ts'],
      // Показываем покрытие даже для файлов БЕЗ тестов
      all: true,
      // Пороговые значения для CI
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  }
})
```

### `src/core/world.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { generateWorld, getTile, isPassable } from './world'
import { TileType } from '../types'

describe('World Generation', () => {
  describe('generateWorld', () => {
    it('должен генерировать мир корректного размера', () => {
      const world = generateWorld(0.12345)

      expect(world.width).toBe(200)
      expect(world.height).toBe(150)
      expect(world.tiles).toHaveLength(150)
      expect(world.tiles[0]).toHaveLength(200)
    })

    it('должен генерировать все типы биомов', () => {
      const world = generateWorld(0.12345)
      const biomes = new Set<TileType>()

      for (let y = 0; y < world.height; y++) {
        for (let x = 0; x < world.width; x++) {
          biomes.add(world.tiles[y][x].type)
        }
      }

      expect(biomes.has(TileType.WATER)).toBe(true)
      expect(biomes.has(TileType.GRASS)).toBe(true)
      expect(biomes.has(TileType.FOREST)).toBe(true)
      expect(biomes.has(TileType.MOUNTAIN)).toBe(true)
    })

    it('должен генерировать одинаковый мир при одинаковом seed', () => {
      const world1 = generateWorld(0.42)
      const world2 = generateWorld(0.42)

      expect(world1.tiles[50][50].type).toBe(world2.tiles[50][50].type)
      expect(world1.tiles[100][100].type).toBe(world2.tiles[100][100].type)
    })

    it('должен генерировать разный мир при разном seed', () => {
      const world1 = generateWorld(0.42)
      const world2 = generateWorld(0.99)

      // Миры должны отличаться (хотя бы в некоторых тайлах)
      const differences = []
      for (let y = 0; y < world1.height; y++) {
        for (let x = 0; x < world1.width; x++) {
          if (world1.tiles[y][x].type !== world2.tiles[y][x].type) {
            differences.push({ x, y })
          }
        }
      }

      expect(differences.length).toBeGreaterThan(0)
    })
  })

  describe('getTile', () => {
    let world: ReturnType<typeof generateWorld>

    beforeEach(() => {
      world = generateWorld(0.12345)
    })

    it('должен возвращать тайл по корректным координатам', () => {
      const tile = getTile(world, { x: 50, y: 50 })
      expect(tile).toBeDefined()
      expect(tile.type).toBeDefined()
    })

    it('должен возвращать undefined для координат за пределами карты', () => {
      expect(getTile(world, { x: -1, y: 0 })).toBeUndefined()
      expect(getTile(world, { x: 200, y: 0 })).toBeUndefined()
      expect(getTile(world, { x: 0, y: -1 })).toBeUndefined()
      expect(getTile(world, { x: 0, y: 150 })).toBeUndefined()
    })
  })

  describe('isPassable', () => {
    it('должен возвращать true для проходимых тайлов', () => {
      expect(isPassable({ type: TileType.GRASS, resources: [] })).toBe(true)
      expect(isPassable({ type: TileType.FOREST, resources: [] })).toBe(true)
      expect(isPassable({ type: TileType.SAND, resources: [] })).toBe(true)
    })

    it('должен возвращать false для непроходимых тайлов', () => {
      expect(isPassable({ type: TileType.WATER, resources: [] })).toBe(false)
      expect(isPassable({ type: TileType.MOUNTAIN, resources: [] })).toBe(false)
    })
  })
})
```

### `src/core/tribe.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { Tribe } from './tribe'
import { generateWorld } from './world'
import { TileType, ResourceType } from '../types'

describe('Tribe', () => {
  let tribe: Tribe
  let world: ReturnType<typeof generateWorld>

  beforeEach(() => {
    world = generateWorld(0.12345)
    tribe = new Tribe(
      { id: 1, name: 'Test Tribe', isPlayer: false, color: '#ff0000' },
      { x: 50, y: 50 }
    )
  })

  describe('constructor', () => {
    it('должен создавать племя с корректными начальными значениями', () => {
      expect(tribe.data.config.id).toBe(1)
      expect(tribe.data.config.name).toBe('Test Tribe')
      expect(tribe.data.population).toBe(20)
      expect(tribe.data.resources.food).toBe(100)
      expect(tribe.data.state).toBe('nomadic')
    })
  })

  describe('tick', () => {
    it('должен потреблять еду каждый тик', () => {
      const initialFood = tribe.data.resources.food
      const population = tribe.data.population

      tribe.tick(world)

      expect(tribe.data.resources.food).toBeLessThanOrEqual(initialFood - population)
    })

    it('должен уменьшать население при голоде', () => {
      // Устанавливаем мало еды
      tribe.data.resources.food = 0
      const initialPopulation = tribe.data.population

      tribe.tick(world)

      // При голоде население должно уменьшаться
      expect(tribe.data.population).toBeLessThanOrEqual(initialPopulation)
    })

    it('должен увеличивать население при избытке еды', () => {
      // Устанавливаем много еды
      tribe.data.resources.food = 500
      const initialPopulation = tribe.data.population

      // Запускаем несколько тиков для статистической значимости
      for (let i = 0; i < 100; i++) {
        tribe.data.resources.food = 500 // Поддерживаем избыток
        tribe.tick(world)
      }

      expect(tribe.data.population).toBeGreaterThan(initialPopulation)
    })
  })

  describe('gatherResources', () => {
    it('должен собирать ресурсы с тайла', () => {
      // Создаём тайл с ресурсами
      const tile = world.tiles[50][50]
      tile.resources = [{ type: ResourceType.FOOD, amount: 100 }]
      tribe.data.position = { x: 50, y: 50 }

      const gathered = tribe.gatherResources(ResourceType.FOOD)

      expect(gathered).toBeGreaterThan(0)
      expect(tribe.data.resources.food).toBeGreaterThanOrEqual(100)
    })

    it('не должен собирать ресурсы с пустого тайла', () => {
      const tile = world.tiles[50][50]
      tile.resources = []
      tribe.data.position = { x: 50, y: 50 }

      const gathered = tribe.gatherResources(ResourceType.FOOD)

      expect(gathered).toBe(0)
    })
  })

  describe('move', () => {
    it('должен перемещать племя на проходимый тайл', () => {
      const initialPos = { ...tribe.data.position }

      // Находим проходимый соседний тайл
      const newPos = { x: initialPos.x + 1, y: initialPos.y }
      world.tiles[newPos.y][newPos.x].type = TileType.GRASS

      const success = tribe.move(world, { x: 1, y: 0 })

      expect(success).toBe(true)
      expect(tribe.data.position).toEqual(newPos)
    })

    it('не должен перемещать племя на непроходимый тайл', () => {
      const initialPos = { ...tribe.data.position }

      // Создаём непроходимый тайл
      const newPos = { x: initialPos.x + 1, y: initialPos.y }
      world.tiles[newPos.y][newPos.x].type = TileType.WATER

      const success = tribe.move(world, { x: 1, y: 0 })

      expect(success).toBe(false)
      expect(tribe.data.position).toEqual(initialPos)
    })
  })

  describe('discoverTech', () => {
    it('должен добавлять технологию в изученные', () => {
      const techId = 'basic_tools'

      tribe.discoverTech(techId)

      expect(tribe.data.discoveredTechs.has(techId)).toBe(true)
    })

    it('не должен дублировать изученные технологии', () => {
      const techId = 'basic_tools'

      tribe.discoverTech(techId)
      tribe.discoverTech(techId)

      expect(tribe.data.discoveredTechs.size).toBe(1)
    })
  })

  describe('addRelation', () => {
    it('должен изменять отношения с другим племенем', () => {
      const otherTribeId = 2

      tribe.addRelation(otherTribeId, 10)

      expect(tribe.data.relations.get(otherTribeId)).toBe(10)
    })

    it('должен ограничивать отношения диапазоном [-100, 100]', () => {
      const otherTribeId = 2

      tribe.addRelation(otherTribeId, 150)
      expect(tribe.data.relations.get(otherTribeId)).toBe(100)

      tribe.addRelation(otherTribeId, -200)
      expect(tribe.data.relations.get(otherTribeId)).toBe(-100)
    })
  })
})
```

### `src/core/tech.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { TECH_TREE, canResearch, getAvailableTechs, getTechsByEra } from './tech'
import { TechEra } from '../types'

describe('Tech Tree', () => {
  describe('TECH_TREE', () => {
    it('должен содержать все технологии', () => {
      expect(Object.keys(TECH_TREE).length).toBeGreaterThan(0)
    })

    it('должен иметь корректную структуру для каждой технологии', () => {
      for (const [id, tech] of Object.entries(TECH_TREE)) {
        expect(tech.id).toBe(id)
        expect(tech.name).toBeDefined()
        expect(tech.description).toBeDefined()
        expect(tech.era).toBeDefined()
        expect(tech.prerequisites).toBeDefined()
        expect(tech.cost).toBeDefined()
        expect(tech.effect).toBeDefined()
      }
    })
  })

  describe('canResearch', () => {
    it('должен разрешать изучение технологии без пререквизитов', () => {
      const discoveredTechs = new Set<string>()
      // Технология без пререквизитов (например, 'basic_tools')
      const techId = 'basic_tools'

      const result = canResearch(discoveredTechs, techId)

      expect(result).toBe(true)
    })

    it('должен запрещать изучение без необходимых пререквизитов', () => {
      const discoveredTechs = new Set<string>()
      // Технология с пререквизитами
      const techId = 'agriculture'

      const result = canResearch(discoveredTechs, techId)

      expect(result).toBe(false)
    })

    it('должен разрешать изучение при наличии всех пререквизитов', () => {
      const discoveredTechs = new Set(['basic_tools', 'basket_weaving'])
      const techId = 'agriculture'

      const result = canResearch(discoveredTechs, techId)

      expect(result).toBe(true)
    })

    it('должен запрещать повторное изучение', () => {
      const discoveredTechs = new Set(['basic_tools'])

      const result = canResearch(discoveredTechs, 'basic_tools')

      expect(result).toBe(false)
    })
  })

  describe('getAvailableTechs', () => {
    it('должен возвращать доступные технологии для пустого прогресса', () => {
      const discoveredTechs = new Set<string>()
      const available = getAvailableTechs(discoveredTechs)

      expect(available.length).toBeGreaterThan(0)
      // Все доступные технологии не должны иметь пререквизитов
      for (const techId of available) {
        expect(TECH_TREE[techId].prerequisites.length).toBe(0)
      }
    })

    it('должен открывать новые технологии после изучения', () => {
      const discoveredTechs = new Set(['basic_tools'])
      const available = getAvailableTechs(discoveredTechs)

      expect(available).not.toContain('basic_tools') // Уже изучено
    })
  })

  describe('getTechsByEra', () => {
    it('должен возвращать технологии указанной эпохи', () => {
      const stoneAgeTechs = getTechsByEra(TechEra.STONE_AGE)

      expect(stoneAgeTechs.length).toBeGreaterThan(0)
      for (const techId of stoneAgeTechs) {
        expect(TECH_TREE[techId].era).toBe(TechEra.STONE_AGE)
      }
    })

    it('должен возвращать пустой массив для несуществующей эпохи', () => {
      const techs = getTechsByEra('invalid_era' as TechEra)
      expect(techs).toHaveLength(0)
    })
  })
})
```

### `src/core/events.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { EventGenerator } from './events'
import { Tribe } from './tribe'
import { generateWorld } from './world'
import { EventType } from '../types'

describe('EventGenerator', () => {
  let generator: EventGenerator
  let tribe: Tribe
  let world: ReturnType<typeof generateWorld>

  beforeEach(() => {
    generator = new EventGenerator()
    world = generateWorld(0.12345)
    tribe = new Tribe(
      { id: 1, name: 'Test Tribe', isPlayer: false, color: '#ff0000' },
      { x: 50, y: 50 }
    )
  })

  describe('generateTick', () => {
    it('должен генерировать события с вероятностью ~10%', () => {
      const tribes = [tribe]
      let eventCount = 0
      const iterations = 1000

      for (let i = 0; i < iterations; i++) {
        const events = generator.generateTick(tribes)
        if (events.length > 0) {
          eventCount++
        }
      }

      // Проверяем, что частота событий близка к 10% (с допустимой погрешностью)
      const frequency = eventCount / iterations
      expect(frequency).toBeGreaterThan(0.05)
      expect(frequency).toBeLessThan(0.15)
    })

    it('не должен генерировать события для мёртвых племён', () => {
      tribe.data.population = 0
      const tribes = [tribe]

      const events = generator.generateTick(tribes)

      expect(events).toHaveLength(0)
    })
  })

  describe('Типы событий', () => {
    it('должен генерировать событие HARVEST', () => {
      // Принудительно создаём событие урожая
      const event = generator['createHarvestEvent'](tribe)

      expect(event.type).toBe(EventType.HARVEST)
      expect(event.priority).toBe(5)
    })

    it('должен генерировать событие DISEASE', () => {
      const event = generator['createDiseaseEvent'](tribe)

      expect(event.type).toBe(EventType.DISEASE)
      expect(event.priority).toBe(7)
    })

    it('должен генерировать событие RAID', () => {
      const otherTribe = new Tribe(
        { id: 2, name: 'Enemy Tribe', isPlayer: false, color: '#00ff00' },
        { x: 60, y: 60 }
      )
      otherTribe.addRelation(1, -80) // Враждебные отношения

      const event = generator['createRaidEvent'](tribe, [otherTribe])

      expect(event.type).toBe(EventType.RAID)
      expect(event.priority).toBe(8)
    })

    it('должен генерировать событие ALLIANCE', () => {
      const otherTribe = new Tribe(
        { id: 2, name: 'Friendly Tribe', isPlayer: false, color: '#00ff00' },
        { x: 60, y: 60 }
      )
      otherTribe.addRelation(1, 50) // Дружественные отношения

      const event = generator['createAllianceEvent'](tribe, [otherTribe])

      expect(event.type).toBe(EventType.ALLIANCE)
      expect(event.priority).toBe(6)
    })
  })

  describe('События с выбором', () => {
    it('должно иметь choices для события RAID', () => {
      const otherTribe = new Tribe(
        { id: 2, name: 'Enemy Tribe', isPlayer: false, color: '#00ff00' },
        { x: 60, y: 60 }
      )
      otherTribe.addRelation(1, -80)

      const event = generator['createRaidEvent'](tribe, [otherTribe])

      expect(event.choices).toBeDefined()
      expect(event.choices!.length).toBeGreaterThan(0)
    })

    it('должно иметь choices для события ALLIANCE', () => {
      const otherTribe = new Tribe(
        { id: 2, name: 'Friendly Tribe', isPlayer: false, color: '#00ff00' },
        { x: 60, y: 60 }
      )
      otherTribe.addRelation(1, 50)

      const event = generator['createAllianceEvent'](tribe, [otherTribe])

      expect(event.choices).toBeDefined()
      expect(event.choices!.length).toBeGreaterThan(0)
    })
  })
})
```

### `src/game/state.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { Game, GameSpeed } from './state'

describe('Game', () => {
  let game: Game

  beforeEach(() => {
    game = new Game()
    game.init()
  })

  describe('init', () => {
    it('должен инициализировать мир', () => {
      expect(game.state.world).toBeDefined()
      expect(game.state.world.width).toBe(200)
      expect(game.state.world.height).toBe(150)
    })

    it('должен создавать племена', () => {
      expect(game.state.tribes.size).toBeGreaterThan(0)
      expect(game.state.tribes.size).toBeLessThanOrEqual(500)
    })

    it('должен устанавливать игрока', () => {
      expect(game.state.playerTribeId).toBeDefined()
      expect(game.getPlayerTribe()).toBeDefined()
    })

    it('должен начинать с паузой', () => {
      expect(game.state.isPaused).toBe(true)
    })
  })

  describe('togglePause', () => {
    it('должен переключать состояние паузы', () => {
      const initialState = game.state.isPaused

      game.togglePause()
      expect(game.state.isPaused).toBe(!initialState)

      game.togglePause()
      expect(game.state.isPaused).toBe(initialState)
    })
  })

  describe('setSpeed', () => {
    it('должен устанавливать скорость игры', () => {
      game.setSpeed(GameSpeed.FAST)
      expect(game.state.gameSpeed).toBe(GameSpeed.FAST)

      game.setSpeed(GameSpeed.ULTRA)
      expect(game.state.gameSpeed).toBe(GameSpeed.ULTRA)
    })

    it('должен снимать паузу при установке скорости', () => {
      game.setSpeed(GameSpeed.NORMAL)
      expect(game.state.isPaused).toBe(false)
    })
  })

  describe('selectTribe', () => {
    it('должен выбирать племя', () => {
      const tribeId = game.state.playerTribeId!
      game.selectTribe(tribeId)

      expect(game.state.selectedTribeId).toBe(tribeId)
      expect(game.getSelectedTribe()).toBeDefined()
    })

    it('должен снимать выделение при выборе несуществующего племени', () => {
      game.selectTribe(99999)
      expect(game.state.selectedTribeId).toBeNull()
    })
  })

  describe('exportState/importState', () => {
    it('должен экспортировать и импортировать состояние', () => {
      const originalState = game.exportState()

      game.importState(originalState)

      const newState = game.exportState()
      expect(newState.world).toEqual(originalState.world)
      expect(newState.tick).toBe(originalState.tick)
    })
  })
})
```

### `src/storage/db.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { storage } from './db'
import { generateWorld } from '../core/world'

describe('Storage', () => {
  beforeEach(async () => {
    await storage.init()
    // Очищаем хранилище перед каждым тестом
    const db = await storage['getDb']()
    const tx = db.transaction(['saves', 'settings'], 'readwrite')
    tx.objectStore('saves').clear()
    tx.objectStore('settings').clear()
  })

  describe('init', () => {
    it('должен инициализировать базу данных', async () => {
      await storage.init()
      // Если не выбросило ошибку — успех
      expect(true).toBe(true)
    })
  })

  describe('saveGame / loadGame', () => {
    it('должен сохранять и загружать игру', async () => {
      const world = generateWorld(0.12345)
      const state = {
        world,
        tribes: [],
        events: [],
        playerTribeId: 1,
        tick: 100,
        isPaused: false,
        gameSpeed: 1
      }

      await storage.saveGame('test-save', 'Test Save', state)
      const loaded = await storage.loadGame('test-save')

      expect(loaded.name).toBe('Test Save')
      expect(loaded.state.tick).toBe(100)
      expect(loaded.state.world.width).toBe(200)
    })

    it('должен возвращать null для несуществующего сохранения', async () => {
      const loaded = await storage.loadGame('nonexistent')
      expect(loaded).toBeNull()
    })
  })

  describe('quickSave / getQuickSave', () => {
    it('должен сохранять и загружать быстрое сохранение', async () => {
      const world = generateWorld(0.12345)
      const state = {
        world,
        tribes: [],
        events: [],
        playerTribeId: 1,
        tick: 50,
        isPaused: true,
        gameSpeed: 1
      }

      await storage.quickSave(state)
      const loaded = await storage.getQuickSave()

      expect(loaded.state.tick).toBe(50)
      expect(loaded.state.isPaused).toBe(true)
    })
  })

  describe('getSetting / setSetting', () => {
    it('должен сохранять и загружать настройки', async () => {
      await storage.setSetting('volume', 0.8)
      const volume = await storage.getSetting('volume', 1)

      expect(volume).toBe(0.8)
    })

    it('должен возвращать значение по умолчанию', async () => {
      const value = await storage.getSetting('nonexistent', 'default')
      expect(value).toBe('default')
    })

    it('должен сохранять сложные объекты', async () => {
      const camera = { x: 100, y: 100, zoom: 1.5 }

      await storage.setSetting('camera', camera)
      const loaded = await storage.getSetting('camera', { x: 0, y: 0, zoom: 1 })

      expect(loaded).toEqual(camera)
    })
  })
})
```

## Изменения в существующих файлах

### `package.json`

Добавить скрипты и зависимости:

```json
{
  "devDependencies": {
    "vitest": "^1.3.0",
    "@vitest/coverage-v8": "^1.3.0",
    "jsdom": "^24.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### `.gitignore`

Добавить игнорирование:

```
coverage/
test-results/
```

---

## Критерии приемки (Definition of Done)

### Обязательные

- [ ] Vitest установлен и настроен
- [ ] Все тесты запускаются через `yarn test`
- [ ] **Покрытие показывается автоматически** при каждом запуске `yarn test`
- [ ] Покрытие включает **всю кодовую базу** (файлы с тестами + файлы без тестов)
- [ ] Покрытие кода не менее **70%** по всем метрикам:
  - Statements: ≥ 70%
  - Branches: ≥ 70%
  - Functions: ≥ 70%
  - Lines: ≥ 70%
- [ ] Тесты покрывают ключевые модули:
  - `core/world.ts` — генерация мира
  - `core/tribe.ts` — логика племени
  - `core/tech.ts` — дерево технологий
  - `core/events.ts` — генератор событий
  - `game/state.ts` — игровое состояние
  - `storage/db.ts` — сохранения
- [ ] CI проходит без ошибок

### Дополнительные улучшения

- [ ] Настроен HTML-отчёт о покрытии
- [ ] Настроен UI для интерактивного запуска тестов
- [ ] Добавлены тесты для UI-компонентов (опционально)

---

## Команды для проверки

```bash
# Установка зависимостей
yarn add -D vitest @vitest/coverage-v8 jsdom

# Запуск тестов в watch-режиме + ОТОБРАЖЕНИЕ ПОКРЫТИЯ
yarn test

# Однократный запуск всех тестов + покрытие
yarn test:run

# Запуск с HTML-отчётом о покрытии (откроет браузер)
yarn test:coverage

# Запуск с UI для интерактивной отладки
yarn test:ui
```

**Важно:** Покрытие показывается **автоматически** при каждом запуске `yarn test` — не нужно добавлять флаги. Отчёт включает **всю кодовую базу** (кроме UI), даже для файлов без тестов.

---

## Структура тестов

```
src/
├── core/
│   ├── world.test.ts      # Тесты генерации мира
│   ├── tribe.test.ts      # Тесты логики племени
│   ├── tech.test.ts       # Тесты дерева технологий
│   └── events.test.ts     # Тесты генератора событий
├── game/
│   └── state.test.ts      # Тесты игрового состояния
├── storage/
│   └── db.test.ts         # Тесты хранилища
└── ui/
    └── (опционально)      # Тесты UI-компонентов
```

---

## Примечание о покрытии кода

По умолчанию Vitest показывает покрытие **только для файлов, на которые есть тесты**.

В данной спецификации настроено покрытие **всей кодовой базы** благодаря опции `all: true` в `vitest.config.ts`:

```typescript
coverage: {
  all: true,  // ← Включает все файлы из include, даже без тестов
  include: ['src/**/*.ts'],
  exclude: ['src/ui/**/*.ts', 'src/main.ts'],
  // ...
}
```

**Пример вывода `yarn test`:**

```
 ✓ src/core/world.test.ts (5)
 ✓ src/core/tribe.test.ts (8)
 ✓ src/core/tech.test.ts (6)
 ✓ src/core/events.test.ts (7)
 ✓ src/game/state.test.ts (6)
 ✓ src/storage/db.test.ts (6)

 Coverage Report
 ┌──────────────────────┬────────────┬─────────┬────────────┐
 │ File                 │  % Stmts  │ % Branch│  % Functions│
 ├──────────────────────┼────────────┼─────────┼────────────┤
 │ src/core/world.ts    │    85.2%   │   72.3% │     90.1%   │
 │ src/core/tribe.ts    │    78.4%   │   68.5% │     82.7%   │
 │ src/core/tech.ts     │    92.1%   │   85.0% │     95.3%   │
 │ src/core/events.ts   │    71.3%   │   65.2% │     76.8%   │
 │ src/game/state.ts    │    88.9%   │   78.4% │     91.2%   │
 │ src/storage/db.ts    │    75.6%   │   70.1% │     80.4%   │
 │ src/ui/map.ts        │     0.0%   │    0.0% │      0.0%   │ ← исключён
 │ src/main.ts          │     0.0%   │    0.0% │      0.0%   │ ← исключён
 ├──────────────────────┼────────────┼─────────┼────────────┤
 │ All files            │    78.5%   │   71.2% │     82.3%   │
 └──────────────────────┴────────────┴─────────┴────────────┘
```

---

## Стратегия тестирования

### Unit-тесты (приоритет)

Тестирование отдельных функций и классов изолированно:

- `generateWorld()` — детерминированность по seed
- `Tribe.tick()` — демографические изменения
- `canResearch()` — проверка пререквизитов
- `EventGenerator.generateTick()` — вероятность событий

### Интеграционные тесты (вторично)

Тестирование взаимодействия модулей:

- Сохранение/загрузка состояния игры
- Полный игровой цикл (update → render)

### Что НЕ тестируем

- UI-рендеринг (Canvas)
- Обработчики событий браузера
- Сторонние библиотеки

---

## CI/CD интеграция

### GitHub Actions (опционально)

`.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Run tests
        run: yarn test:run

      - name: Run coverage
        run: yarn test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Поддержание качества тестов

### Правила написания тестов

1. **Названия тестов** должны описывать ожидаемое поведение:
   ```typescript
   it('должен возвращать undefined для координат за пределами карты', () => {
     // ...
   })
   ```

2. **Arrange-Act-Assert** паттерн:
   ```typescript
   it('должен собирать ресурсы', () => {
     // Arrange
     const tile = world.tiles[50][50]
     tile.resources = [{ type: 'food', amount: 100 }]

     // Act
     const gathered = tribe.gatherResources('food')

     // Assert
     expect(gathered).toBeGreaterThan(0)
   })
   ```

3. **Тестировать граничные случаи**:
   - Пустые входные данные
   - Максимальные значения
   - Недопустимые аргументы

4. **Избегать хрупких тестов**:
   - Не зависеть от случайных значений без seed
   - Не проверять внутренние детали реализации

### Рефакторинг тестов

- Выносить повторяющуюся логику в `beforeEach`
- Использовать тестовые фабрики для сложных объектов
- Группировать связанные тесты в `describe` блоки

---

## Связанные спецификации

- [SPEC-001](./001-setup-prettier.md) — Настройка Prettier
- [SPEC-002](./002-setup-eslint.md) — Настройка ESLint

---

## История

- **Создано:** 2026-02-28
- **Статус:** TODO
- **Исполнитель:** TBD
