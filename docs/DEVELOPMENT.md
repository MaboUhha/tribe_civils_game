# Руководство разработчика

## Быстрый старт

### Установка

```bash
# Клонировать репозиторий
cd C:\projects\hobby\games\tribe_civils_game

# Установить зависимости
yarn install

# Запустить dev-сервер
yarn dev
```

Открыть http://localhost:3000

### Сборка для продакшена

```bash
yarn build
```

Файлы в папке `dist/` готовы к деплою.

---

## Структура кода

### Добавление новой фичи

**Пример: новый тип ресурса**

1. **Добавить тип** (`src/types.ts`):
```typescript
export enum ResourceType {
  FOOD = 'food',
  WOOD = 'wood',
  STONE = 'stone',
  METAL = 'metal',
  HERBS = 'herbs'  // Новое!
}
```

2. **Добавить спавн** (`src/core/world.ts`):
```typescript
function spawnResources(tile: Tile): void {
  // ...
  if (tile.type === TileType.FOREST) {
    if (Math.random() < 0.3) {
      tile.resources.push({
        type: ResourceType.HERBS,
        amount: Math.floor(Math.random() * 20) + 10
      })
    }
  }
}
```

3. **Добавить цвет в UI** (`src/ui/panels.ts`):
```typescript
private getResourceColor(type: string): string {
  switch (type) {
    case 'food': return '#8bc34a'
    case 'wood': return '#795548'
    case 'stone': return '#9e9e9e'
    case 'metal': return '#607d8b'
    case 'herbs': return '#a5d6a7'  // Новое!
    default: return '#ffffff'
  }
}
```

4. **Обновить Tribe** (`src/core/tribe.ts`):
```typescript
this.data.resources = {
  [ResourceType.FOOD]: 100,
  [ResourceType.WOOD]: 0,
  [ResourceType.STONE]: 0,
  [ResourceType.METAL]: 0,
  [ResourceType.HERBS]: 0  // Новое!
}
```

### Добавление технологии

1. **Открыть** `src/core/tech.ts`

2. **Добавить в TECH_TREE**:
```typescript
'new_tech': {
  id: 'new_tech',
  name: 'Новая технология',
  description: 'Описание эффекта',
  era: TechEra.BRONZE_AGE,
  prerequisites: ['basic_tools'],
  cost: { food: 150, wood: 100 },
  effect: {
    type: TechEffectType.GATHER_RATE,
    value: 0.4,
    target: 'herbs'
  }
}
```

### Добавление события

1. **Добавить тип** (`src/types.ts`):
```typescript
export enum EventType {
  // ...
  EARTHQUAKE = 'earthquake'  // Новое!
}
```

2. **Создать генератор** (`src/core/events.ts`):
```typescript
private createEarthquakeEvent(tribe: Tribe): GameEvent {
  const damage = Math.floor(tribe.data.population * 0.2)
  
  return {
    id: `event_${++this.eventCounter}`,
    type: EventType.EARTHQUAKE,
    title: 'Землетрясение!',
    description: `Землетрясение потрясло "${tribe.data.config.name}"! Погибло ${damage} человек.`,
    tribeId: tribe.data.config.id,
    timestamp: Date.now(),
    priority: 8,
    resolved: false
  }
}
```

3. **Добавить в пул** (`generateRandomEvent`):
```typescript
const events: Array<() => GameEvent | null> = [
  () => this.createHarvestEvent(tribe),
  // ...
  () => this.createEarthquakeEvent(tribe)  // Новое!
]

const weights = [0.2, 0.15, 0.15, 0.15, 0.15, 0.1, 0.05, 0.05, 0.05]
```

---

## Отладка

### Логирование

```typescript
// В main.ts
class App {
  private gameLoop(currentTime: number): void {
    // ...
    console.log(`Tick: ${this.game.state.tick}, Tribes: ${this.game.state.tribes.size}`)
  }
}
```

### Инспекция состояния

Открыть консоль браузера (F12):

```javascript
// Получить доступ к игре
const app = window.app  // если экспортировать

// Посмотреть состояние
app.game.state

// Посмотреть племя
app.game.getPlayerTribe()

// Посмотреть мир
app.game.state.world.tiles[50][50]
```

### Отладка генерации мира

```typescript
// В world.ts после генерации
console.log('World generated:', {
  width: world.width,
  height: world.height,
  tiles: world.tiles.length,
  seaLevel: world.seaLevel
})

// Подсчитать биомы
const biomeCount = {}
for (let y = 0; y < world.height; y++) {
  for (let x = 0; x < world.width; x++) {
    const type = world.tiles[y][x].type
    biomeCount[type] = (biomeCount[type] || 0) + 1
  }
}
console.log('Biomes:', biomeCount)
```

---

## Тестирование

### Ручное тестирование

**Чеклист:**

- [ ] Мир генерируется корректно
- [ ] Все биомы присутствуют
- [ ] Племена спавнятся на проходимых тайлах
- [ ] Племена собирают ресурсы
- [ ] Племена перемещаются
- [ ] События генерируются
- [ ] UI обновляется
- [ ] Сохранение работает
- [ ] Загрузка работает
- [ ] PWA устанавливается

### Автотесты (планируется)

```typescript
// tests/world.test.ts
describe('World Generation', () => {
  it('should generate valid world', () => {
    const world = generateWorld()
    expect(world.width).toBe(200)
    expect(world.height).toBe(150)
    expect(world.tiles.length).toBe(150)
  })
  
  it('should have passable spawn points', () => {
    const world = generateWorld()
    for (const tribe of tribes) {
      const tile = getTile(world, tribe.position)
      expect(isPassable(tile)).toBe(true)
    }
  })
})
```

---

## Производительность

### Оптимизация рендеринга

**Проблема:** 30,000 тайлов (200×150), но видим только ~500

**Решение:** Рендерить только видимые

```typescript
// ✅ Хорошо
for (let y = startRow; y <= endRow; y++) {
  for (let x = startCol; x <= endCol; x++) {
    if (inBounds(x, y)) {
      renderTile(tiles[y][x])
    }
  }
}

// ❌ Плохо
for (let y = 0; y < world.height; y++) {
  for (let x = 0; x < world.width; x++) {
    renderTile(tiles[y][x])
  }
}
```

### Оптимизация обновлений

**Проблема:** 500 племён × 60 FPS = 30,000 обновлений/сек

**Решение:** Tick rate отдельный

```typescript
// Game Loop (60 FPS)
update(currentTime):
  if (elapsed >= tickInterval):
    tick()  // Логика
    lastTickTime = currentTime
  
  render()  // Отрисовка каждый кадр
```

### Профилирование

Открыть Chrome DevTools → Performance:

1. Записать 10 секунд
2. Найти узкие места
3. Оптимизировать

---

## Стиль кода

### TypeScript

```typescript
// ✅ Использовать типы
interface Position {
  x: number
  y: number
}

function move(pos: Position, dir: Position): Position {
  return { x: pos.x + dir.x, y: pos.y + dir.y }
}

// ❌ Избегать any
function move(pos: any, dir: any): any {
  // ...
}
```

### Именование

```typescript
// Классы: PascalCase
class Tribe { }

// Функции: camelCase
function generateWorld() { }

// Константы: UPPER_SNAKE_CASE
const MAX_TRIBES_COUNT = 500

// Приватные поля: # или _
class Game {
  #privateField: number
  _internalState: State
}
```

### Комментарии

```typescript
// ✅ Объяснять "почему"
// Используем Perlin шум для естественного ландшафта
// вместо случайных значений, чтобы избежать резких переходов

// ❌ Не объяснять "что"
// Увеличиваем x на 1
x = x + 1
```

---

## Деплой

### Vercel

1. Запушить на GitHub
2. Импортировать в Vercel
3. Deploy

### GitHub Pages

```bash
yarn build
npx gh-pages -d dist
```

### Локальный хостинг

```bash
yarn build
npx serve dist
```

---

## Расширение функционала

### Идеи для реализации

**Ближайшие:**

1. **Улучшенный ИИ**
   - Приоритет целей (еда > ресурсы > исследование)
   - Избегание опасности
   - Кооперация между племенами

2. **Здания**
   - Хижина (увеличивает макс. население)
   - Склад (увеличивает хранение)
   - Мастерская (ускоряет сбор)

3. **Юниты**
   - Разведчик (быстрый, мало здоровья)
   - Воин (медленный, много здоровья)
   - Рабочий (бонус к сбору)

4. **Климат**
   - Сезоны (весна, лето, осень, зима)
   - Влияние на сбор ресурсов
   - Влияние на рождаемость

**Долгосрочные:**

1. **Культура**
   - Традиции племени
   - Религиозные верования
   - Язык (влияет на торговлю)

2. **Эволюция технологий**
   - Ветвящееся дерево
   - Уникальные технологии
   - Потерянные знания

3. **Легендарные личности**
   - Вожди с бонусами
   - Герои с способностями
   - Пророки с предсказаниями

---

## Решение проблем

### Племена застревают

**Проблема:** Племя не может двигаться

**Причина:** Окружено водой или горами

**Решение:**
```typescript
// В tribe.ts
explore():
  // Использовать BFS для поиска пути
  const path = findPath(world, position, radius=10)
  if (path.length > 0):
    position = path[0]
```

### Слишком много событий

**Проблема:** Лог событий переполнен

**Решение:**
```typescript
// В events.ts
generateTick():
  // Ограничить количество событий на тик
  if (newEvents.length >= 3):
    return newEvents.slice(0, 3)
```

### Медленный рендеринг

**Проблема:** Низкий FPS

**Причина:** Рендер всех тайлов

**Решение:** Проверить culling в `MapRenderer.render()`

---

## Контакты

Вопросы и предложения: [добавить контакты]
