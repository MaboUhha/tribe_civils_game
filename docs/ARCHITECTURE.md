# Архитектура проекта

## Общая структура

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    PWA Service Worker                 │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Application Layer                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │  │
│  │  │   main.ts   │  │  UI Manager │  │ Map Renderer  │  │  │
│  │  │  (App Class)│  │  (panels)   │  │    (map.ts)   │  │  │
│  │  └─────────────┘  └─────────────┘  └───────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Game Logic Layer                    │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Game (state.ts)                    │  │  │
│  │  │  - Game Loop                                    │  │  │
│  │  │  - Action Handler                               │  │  │
│  │  │  - State Management                             │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Simulation Core                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐  │  │
│  │  │  World   │ │  Tribe   │ │  Tech  │ │  Events   │  │  │
│  │  │  (map)   │ │ (AI/logic)│ │(tree) │ │(generator)│  │  │
│  │  └──────────┘ └──────────┘ └────────┘ └───────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Storage Layer                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           IndexedDB (db.ts)                     │  │  │
│  │  │  - Saves (quicksave, autosave)                  │  │  │
│  │  │  - Settings (camera, options)                   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Слои архитектуры

### 1. Presentation Layer (UI)

**Ответственность:** Отображение состояния игры и ввод пользователя

#### Компоненты:

**`MapRenderer`** (`src/ui/map.ts`)
```typescript
class MapRenderer {
  render(world, tribes, camera, selectedTribeId)
  worldToScreen(worldX, worldY, camera)
  screenToWorld(screenX, screenY, camera)
}
```

- Рендерит карту на Canvas
- Обрабатывает камеру (позиция, зум)
- Отрисовывает тайлы, ресурсы, племена
- Поддерживает выделение выбранного племени

**`UIManager`** (`src/ui/panels.ts`)
```typescript
class UIManager {
  updateTopBar(gameState)
  updateSidePanel(selectedTribe, playerTribe, events)
  logEvent(event)
  setOnAction(callback)
}
```

- Верхняя панель (статистика, кнопки)
- Боковая панель (инфо о племени, действия)
- Лог событий
- Обработка кликов по кнопкам

### 2. Game Logic Layer

**Ответственность:** Управление состоянием игры и действиями

#### `Game`** (`src/game/state.ts`)
```typescript
class Game {
  state: GameState
  update(currentTime)
  tick()
  handleAction(action, payload)
}
```

**GameState:**
```typescript
interface GameState {
  world: World
  tribes: Map<number, Tribe>
  events: GameEvent[]
  playerTribeId: number | null
  gameSpeed: GameSpeed
  isPaused: boolean
  tick: number
  camera: { x, y, zoom }
  selectedTribeId: number | null
}
```

**Игровой цикл:**
```
requestAnimationFrame
    │
    ▼
┌─────────────┐
│   update()  │ ──▶ Если не пауза и время тика пришло
└─────────────┘
    │
    ▼
┌─────────────┐
│   tick()    │ ──▶ Обновление всех племён
└─────────────┘
    │
    ▼
┌─────────────┐
│  events()   │ ──▶ Генерация случайных событий
└─────────────┘
    │
    ▼
┌─────────────┐
│  render()   │ ──▶ Отрисовка кадра
└─────────────┘
```

### 3. Simulation Core

**Ответственность:** Чистая логика симуляции без зависимостей от UI

#### `World`** (`src/core/world.ts`)

**Генерация:**
```
seed ──▶ Perlin Noise ──▶ elevation map
                          moisture map
                               │
                               ▼
                        biome mapping
                               │
                               ▼
                        resource spawn
```

**Функции:**
- `generateWorld(seed)` — создание новой карты
- `getTile(world, pos)` — получение тайла
- `getAdjacentTiles(world, pos)` — соседние тайлы
- `isPassable(tile)` — проверка проходимости

#### `Tribe`** (`src/core/tribe.ts`)

**Состояние:**
```typescript
interface TribeData {
  config: TribeConfig      // id, name, isPlayer, color
  population: number
  position: Position
  resources: Record<ResourceType, number>
  state: TribeState
  relations: Map<tribeId, relation>
  discoveredTechs: Set<techId>
  actionCooldown: number
}
```

**Методы:**
- `tick(world)` — обновление состояния
- `move(world, direction)` — перемещение
- `gatherResources(world, type)` — сбор ресурсов
- `settle(world)` — основание поселения
- `discoverTech(techId)` — изучение технологии

#### `Tech Tree`** (`src/core/tech.ts`)

**Структура:**
```typescript
interface Tech {
  id: string
  name: string
  description: string
  era: TechEra
  prerequisites: string[]
  cost: { food?, wood?, stone?, metal? }
  effect: { type: TechEffectType, value: number }
}
```

**Функции:**
- `canResearch(tribeTechs, techId)` — проверка доступности
- `getAvailableTechs(tribeTechs)` — список доступных
- `getTechsByEra(era)` — технологии эпохи

#### `EventGenerator`** (`src/core/events.ts`)

**Алгоритм:**
```
каждый тик:
  для каждого племени:
    с шансом 10%:
      выбрать тип события (взвешенный random)
      создать событие с choices
      добавить в очередь
```

### 4. Storage Layer

**Ответственность:** Сохранение и загрузка данных

#### `GameStorage`** (`src/storage/db.ts`)

**IndexedDB схема:**
```
┌──────────────────────────────────────┐
│         Tribe Civils Game DB         │
├──────────────────────────────────────┤
│  Object Stores:                      │
│  ┌────────────────────────────────┐  │
│  │ saves                          │  │
│  │   key: string (id)             │  │
│  │   value: {                     │  │
│  │     id, name, state,           │  │
│  │     createdAt, updatedAt       │  │
│  │   }                            │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ settings                       │  │
│  │   key: string                  │  │
│  │   value: { key, value }        │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Методы:**
- `saveGame(slotId, name, state)` — сохранение
- `loadGame(slotId)` — загрузка
- `quickSave(state)` — быстрое сохранение
- `getQuickSave()` — быстрая загрузка
- `autoSave(state)` — автосохранение
- `getSetting(key, default)` — получение настройки
- `setSetting(key, value)` — установка настройки

**Сериализация:**
```typescript
serializeState(state): SerializedGameState {
  return {
    world: state.world,
    tribes: Array.from(tribes).map(t => t.toJSON()),
    events: state.events,
    // ...
  }
}

deserializeState(serialized): GameState {
  return {
    world: serialized.world,
    tribes: new Map(serialized.tribes.map(t => 
      [t.config.id, Tribe.fromJSON(t)]
    )),
    // ...
  }
}
```

## Взаимодействие компонентов

### Поток данных при действии игрока

```
1. Клик по кнопке UI
         │
         ▼
2. UIManager.onActionCallback('move', {x: 0, y: -1})
         │
         ▼
3. App.handleAction('move', payload)
         │
         ▼
4. Game.moveSelectedTribe(0, -1)
         │
         ▼
5. Tribe.move(world, direction)
         │
         ▼
6. Обновление состояния Tribe.data
         │
         ▼
7. Возврат через цепочку
         │
         ▼
8. App.updateUI() ──▶ UIManager.updateSidePanel()
         │
         ▼
9. App.render() ──▶ MapRenderer.render()
```

### Игровой цикл

```
┌─────────────────────────────────────────────────────┐
│             requestAnimationFrame loop              │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │  currentTime    │
            └─────────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │ deltaTime >= 16?│ ──▶ No ──┐
            └─────────────────┘            │
                      │ Yes                │
                      ▼                    │
            ┌─────────────────┐            │
            │  Game.update()  │            │
            │  - tick если    │            │
            │    не пауза     │            │
            └─────────────────┘            │
                      │                    │
                      ▼                    │
            ┌─────────────────┐            │
            │  render()       │            │
            │  - очистка      │            │
            │  - тайлы        │            │
            │  - племена      │            │
            └─────────────────┘            │
                      │                    │
                      ▼                    │
            ┌─────────────────┐            │
            │  updateUI()     │            │
            │  - topBar       │            │
            │  - sidePanel    │            │
            │  - events       │            │
            └─────────────────┘            │
                      │                    │
                      └────────────────────┘
```

## Типы данных

### Основные интерфейсы

```typescript
// Позиция на карте
interface Position {
  x: number
  y: number
}

// Ресурс
interface Resource {
  type: ResourceType  // 'food' | 'wood' | 'stone' | 'metal'
  amount: number
}

// Тайл
interface Tile {
  type: TileType      // 'W' | '.' | ',' | '♣' | '^' | '▲' | '≈'
  resources: Resource[]
  tribeId?: number
}

// Мир
interface World {
  width: number
  height: number
  tiles: Tile[][]
  seaLevel: number
}

// Племя
interface TribeConfig {
  id: number
  name: string
  isPlayer: boolean
  color: string
}

// Событие
interface GameEvent {
  id: string
  type: EventType
  title: string
  description: string
  tribeId?: number
  timestamp: number
  priority: number       // 1-10
  resolved: boolean
  choices?: EventChoice[]
}
```

### Перечисления

```typescript
enum TileType {
  WATER = 'W',
  SAND = '.',
  GRASS = ',',
  FOREST = '♣',
  HILL = '^',
  MOUNTAIN = '▲',
  SWAMP = '≈'
}

enum ResourceType {
  FOOD = 'food',
  WOOD = 'wood',
  STONE = 'stone',
  METAL = 'metal'
}

enum TribeState {
  NOMADIC = 'nomadic',
  SETTLING = 'settling',
  EXPANDING = 'expanding',
  AT_WAR = 'war',
  ALLIANCE = 'alliance'
}

enum GameSpeed {
  PAUSED = 0,
  NORMAL = 1,
  FAST = 2,
  ULTRA = 3
}

enum TechEra {
  STONE_AGE = 'stone_age',
  BRONZE_AGE = 'bronze_age',
  IRON_AGE = 'iron_age'
}
```

## Константы

### Игровые

```typescript
TILE_SIZE = 16           // Размер тайла в пикселях
MAP_WIDTH = 200          // Ширина карты в тайлах
MAP_HEIGHT = 150         // Высота карты в тайлах
MAX_TRIBES_COUNT = 500   // Максимум племён
MIN_TRIBE_SIZE = 10      // Мин. население
MAX_TRIBE_SIZE = 500     // Макс. население
```

### Демографические

```typescript
BIRTH_RATE = 0.002       // Шанс рождения в тик
DEATH_RATE = 0.001       // Шанс смерти в тик
STARVATION_RATE = 0.005  // Шанс смерти от голода
FOOD_CONSUMPTION = 1     // Еды на человека в тик
```

### Временные

```typescript
TICK_RATE = 1000         // Базовая скорость тика (мс)
SEASON_DURATION = 30000  // Длительность сезона (мс)
```

## Расширяемость

### Добавление новой технологии

1. Добавить в `TECH_TREE` (`src/core/tech.ts`):
```typescript
'new_tech': {
  id: 'new_tech',
  name: 'Название',
  description: 'Описание',
  era: TechEra.IRON_AGE,
  prerequisites: ['existing_tech'],
  cost: { food: 100, wood: 50 },
  effect: { type: TechEffectType.GATHER_RATE, value: 0.5 }
}
```

### Добавление нового типа события

1. Добавить тип в `EventType` (`src/types.ts`)
2. Добавить метод создания в `EventGenerator` (`src/core/events.ts`)
3. Добавить в пул событий в `generateRandomEvent`

### Добавление нового ресурса

1. Добавить в `ResourceType` (`src/types.ts`)
2. Добавить цвет в `UIManager.getResourceColor`
3. Обновить `spawnResources` в `world.ts`

---

Этот документ описывает архитектуру проекта для разработчиков.
