# Tribe Civils Game — Контекст проекта

## Обзор проекта

**Tribe Civils Game** — симулятор племён глубокой древности, гибрид Dwarf Fortress × WorldBox × Civilization.

Веб-приложение (PWA) на TypeScript/Vite, где игрок управляет племенем от кочевого образа жизни до прото-государства. Процедурная генерация мира, ИИ племён, дерево технологий, случайные события.

### Ключевые характеристики

| Параметр | Значение |
|----------|----------|
| Размер карты | 200×150 тайлов |
| Максимум племён | 500 |
| Население племени | 10–500 человек |
| Тип игры | Real-time с паузой |
| Графика | ASCII/символьная (Canvas) |
| Платформа | PWA (оффлайн-режим) |

---

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
yarn lint             # Линтинг кода
```

---

## Архитектура проекта

```
src/
├── core/              # Ядро симуляции (чистая логика, без UI)
│   ├── constants.ts   # Игровые константы
│   ├── world.ts       # Генерация мира (Perlin-шум, биомы, ресурсы)
│   ├── tribe.ts       # Логика племени (ИИ, демография, действия)
│   ├── tech.ts        # Дерево технологий (3 эпохи, 13 технологий)
│   └── events.ts      # Генератор событий (рейды, союзы, катастрофы)
│
├── game/              # Игровая логика
│   └── state.ts       # GameState, игровой цикл, действия
│
├── storage/           # Работа с данными
│   └── db.ts          # IndexedDB (сохранения, настройки)
│
├── ui/                # Пользовательский интерфейс
│   ├── map.ts         # Рендеринг карты на Canvas, камера
│   └── panels.ts      # UI панели (статы, события, действия)
│
├── types.ts           # Общие типы TypeScript (enums, interfaces)
└── main.ts            # Точка входа, App class, event listeners
```

### Слои архитектуры

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  main.ts    │  │  panels.ts  │  │    map.ts       │  │
│  │  (App)      │  │  (UIManager)│  │  (MapRenderer)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Game Logic Layer                     │
│  ┌─────────────────────────────────────────────────────┐│
│  │              state.ts (Game)                        ││
│  │  - Game Loop  - Action Handler  - State Management ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Simulation Core                       │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐  │
│  │  world   │ │  tribe   │ │  tech  │ │    events    │  │
│  │  (map)   │ │ (AI/logic)│ │(tree)  │ │  (generator) │  │
│  └──────────┘ └──────────┘ └────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Storage Layer                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │              db.ts (IndexedDB)                      ││
│  │  - Saves (quicksave, autosave)  - Settings         ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Игровые системы

### 1. Генерация мира

**Алгоритм:** Perlin-подобный шум (4 октавы для высот, 3 для влажности)

```
seed → elevation map + moisture map → smoothing → biome mapping → resources
```

**Биомы (по высоте и влажности):**
- `W` (WATER) — elevation < 0.3
- `.` (SAND) — 0.3–0.35
- `,` (GRASS) — 0.35–0.6, moisture < 0.3
- `♣` (FOREST) — 0.35–0.6, moisture > 0.3
- `^` (HILL) — 0.6–0.8
- `▲` (MOUNTAIN) — > 0.8
- `≈` (SWAMP) — 0.35–0.6, moisture > 0.6

**Ресурсы спавнятся** в зависимости от биома (еда, дерево, камень, металл).

### 2. Племена

**Состояние племени:**
```typescript
interface TribeData {
  config: { id, name, isPlayer, color }
  population: number           // 10–500
  position: { x, y }
  resources: { food, wood, stone, metal }
  state: 'nomadic' | 'settling' | 'war' | 'alliance'
  relations: Map<tribeId, -100..100>
  discoveredTechs: Set<techId>
  actionCooldown: number
}
```

**Ежедневный тик:**
1. Потребление еды (`population × 1`)
2. Проверка голода (смерть при нехватке)
3. Рождаемость (шанс при `food > 50`)
4. Смертность (естественная)
5. ИИ-действие (сбор, перемещение, исследование)

**Действия:** `gatherResources()`, `move()`, `explore()`, `settle()`, `discoverTech()`

### 3. Технологии

**3 эпохи, 13 технологий:**

| Эпоха | Технологии |
|-------|------------|
| **Каменный век** | Простые инструменты, Огонь, Копьё, Плетение корзин, Укрытие |
| **Бронзовый век** | Земледелие, Гончарство, Добыча камня, Колесо |
| **Железный век** | Обработка бронзы, Письменность, Обработка железа |

**Эффекты:** `GATHER_RATE`, `BIRTH_RATE`, `MOVE_SPEED`, `STORAGE`, `COMBAT`

### 4. События

**Генерация:** 10% шанс каждый тик для каждого племени

| Событие | Шанс | Приоритет |
|---------|------|-----------|
| Удачный сбор | 20% | 5 |
| Болезнь | 15% | 7 |
| Открытие | 15% | 6 |
| Прирост населения | 15% | 5 |
| Засуха | 15% | 7 |
| Рейд | 10% | 8 |
| Предложение союза | 5% | 6 |
| Объявлена война | 5% | 9 |

**События с выбором:** рейд (защититься/откупиться), союз (принять/отклонить).

### 5. Отношения племён

**Шкала:** `-100 … +100`

| Диапазон | Статус | Реакция |
|----------|--------|---------|
| < -70 | Война | Нападение, рейды |
| -70 … -20 | Вражда | Избегание, конфликты |
| -20 … 20 | Нейтралитет | Случайные взаимодействия |
| 20 … 50 | Дружба | Торговля, помощь |
| > 50 | Союз | Совместные действия |

---

## Игровой цикл

```
requestAnimationFrame (60 FPS)
    │
    ▼
┌─────────────┐
│  update()   │ ──▶ tick() если не пауза и deltaTime >= 16ms
└─────────────┘
    │
    ▼
┌─────────────┐
│  render()   │ ──▶ Canvas (только видимые тайлы)
└─────────────┘
    │
    ▼
┌─────────────┐
│  updateUI() │ ──▶ TopBar, SidePanel, EventLog
└─────────────┘
```

**Скорости игры:**
- `PAUSED` (0) — пауза
- `NORMAL` (1) — 1 тик/сек
- `FAST` (2) — 2 тика/сек
- `ULTRA` (3) — 3 тика/сек

---

## Управление

### Клавиатура

| Клавиша | Действие |
|---------|----------|
| `W` / `↑` | Камера вверх |
| `S` / `↓` | Камера вниз |
| `A` / `←` | Камера влево |
| `D` / `→` | Камера вправо |
| `+` / `=` | Увеличить зум |
| `-` / `_` | Уменьшить зум |
| `Пробел` | Пауза / Старт |
| `F` | Показать сетку |
| `R` | Показать ресурсы |

### Мышь

- **Клик по тайлу** — выбрать племя на тайле

---

## Технологии

### Стек

| Компонент | Технология |
|-----------|------------|
| Язык | TypeScript 5.6 (strict mode) |
| Сборка | Vite 6.0 (ESNext, HMR) |
| Рендеринг | Canvas API |
| Хранение | IndexedDB (idb) |
| PWA | Workbox (оффлайн, кэш) |

### Зависимости

```json
{
  "dependencies": {
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "workbox-window": "^7.3.0"
  }
}
```

---

## Хранение данных

### IndexedDB схема

```
┌──────────────────────────────────────┐
│     Tribe Civils Game DB             │
├──────────────────────────────────────┤
│  Object Stores:                      │
│  • saves     (key: id, value: state) │
│  • settings  (key: key, value: val)  │
└──────────────────────────────────────┘
```

**Методы:**
- `saveGame(slotId, name, state)` / `loadGame(slotId)`
- `quickSave(state)` / `getQuickSave()`
- `autoSave(state)` — каждые 100 тиков
- `getSetting(key, default)` / `setSetting(key, value)`

---

## Основные типы

```typescript
// Enums
enum TileType { WATER, SAND, GRASS, FOREST, HILL, MOUNTAIN, SWAMP }
enum ResourceType { FOOD, WOOD, STONE, METAL }
enum TribeState { NOMADIC, SETTLING, EXPANDING, AT_WAR, ALLIANCE }
enum GameSpeed { PAUSED, NORMAL, FAST, ULTRA }
enum EventType { HARVEST, DISEASE, RAID, DISCOVERY, ... }

// Interfaces
interface Position { x: number, y: number }
interface Resource { type: ResourceType, amount: number }
interface Tile { type: TileType, resources: Resource[], tribeId?: number }
interface World { width: number, height: number, tiles: Tile[][], seaLevel: number }
interface TribeConfig { id: number, name: string, isPlayer: boolean, color: string }
interface GameEvent { id: string, type: EventType, title: string, description: string, ... }
```

---

## Константы

```typescript
// Карта
TILE_SIZE = 16           // пикселей
MAP_WIDTH = 200          // тайлов
MAP_HEIGHT = 150         // тайлов
MAX_TRIBES_COUNT = 500

// Демография
BIRTH_RATE = 0.002       // шанс рождения в тик
DEATH_RATE = 0.001       // шанс смерти в тик
STARVATION_RATE = 0.005  // шанс смерти от голода
FOOD_CONSUMPTION = 1     // еды на человека в тик

// Время
TICK_RATE = 1000         // мс
SEASON_DURATION = 30000  // мс
```

---

## Расширение функционала

### Добавление ресурса

1. `src/types.ts` — добавить в `ResourceType`
2. `src/core/world.ts` — обновить `spawnResources()`
3. `src/ui/panels.ts` — добавить цвет в `getResourceColor()`
4. `src/core/tribe.ts` — добавить в начальные ресурсы

### Добавление технологии

1. `src/core/tech.ts` — добавить в `TECH_TREE`:
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

### Добавление события

1. `src/types.ts` — добавить тип в `EventType`
2. `src/core/events.ts` — создать метод генерации
3. `src/core/events.ts` — добавить в `generateRandomEvent()` с весом

---

## Отладка

### Консоль браузера (F12)

```javascript
// Доступ к состоянию игры (если экспортировать app)
window.app.game.state
window.app.game.getPlayerTribe()
window.app.game.state.world.tiles[50][50]
```

### Логирование

Добавить в `main.ts`:
```typescript
console.log(`Tick: ${this.game.state.tick}, Tribes: ${this.game.state.tribes.size}`)
```

### Профилирование

Chrome DevTools → Performance → записать 10 секунд → найти узкие места.

---

## Планы развития

### Ближайшие

- [ ] Боевая система (осады, сражения)
- [ ] Здания и улучшения территории
- [ ] Торговые пути между племенами
- [ ] Динамические названия племён
- [ ] Система героев/лидеров

### Долгосрочные

- [ ] Мультиплеер (WebRTC)
- [ ] Моддинг (JSON-конфиги)
- [ ] Сценарии и достижения
- [ ] Экспорт/импорт сохранений
- [ ] Мобильная адаптация

---

## Структура документации

```
docs/
├── README.md          # Обзор проекта, управление, технологии
├── ARCHITECTURE.md    # Детальная архитектура, слои, типы данных
├── GAME_SYSTEMS.md    # Игровые системы (генерация, демография, ИИ)
├── DEVELOPMENT.md     # Гид разработчика, примеры кода, отладка
└── INDEX.md           # Навигация по документации
```

---

## Ссылки

- **Dev-сервер:** http://localhost:3000
- **Репозиторий:** `C:\projects\hobby\games\tribe_civils_game`
- **PWA:** Устанавливается как нативное приложение
