# Игровые системы

## 1. Генерация мира

### Алгоритм

Мир генерируется процедурно с использованием **Perlin-подобного шума** для создания естественного ландшафта.

```
┌─────────────────────────────────────────────────────────┐
│                    World Generation                     │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌─────────────────┐              ┌─────────────────┐
│  Elevation Map  │              │  Moisture Map   │
│  (4 октавы)     │              │  (3 октавы)     │
└─────────────────┘              └─────────────────┘
          │                               │
          └───────────────┬───────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │   Smoothing     │
                │   (2 прохода)   │
                └─────────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │  Biome Mapping  │
                │  (elevation +   │
                │   moisture)     │
                └─────────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │ Resource Spawn  │
                │  (by biome)     │
                └─────────────────┘
```

### Функции шума

**Базовый шум:**
```typescript
function noise(x, y, seed): number
  n = sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453
  return n - floor(n)
```

**Сглаженный шум:**
```typescript
function smoothedNoise(x, y, seed): number
  corners = (noise(x-1,y-1) + noise(x+1,y-1) + 
             noise(x-1,y+1) + noise(x+1,y+1)) / 16
  sides   = (noise(x-1,y) + noise(x+1,y) + 
             noise(x,y-1) + noise(x,y+1)) / 8
  center  = noise(x,y) / 4
  return corners + sides + center
```

**Интерполяция:**
```typescript
function interpolate(a, b, x): number
  ft = x * PI
  f = (1 - cos(ft)) * 0.5
  return a * (1 - f) + b * f
```

**Perlin-подобный шум (октавы):**
```typescript
function perlinNoise(x, y, seed, octaves = 4): number
  total = 0, frequency = 0.01, amplitude = 1, maxValue = 0
  
  for i in 0..octaves:
    total += interpolatedNoise(x*freq, y*freq, seed+i) * amp
    maxValue += amp
    amplitude *= 0.5
    frequency *= 2
  
  return total / maxValue
```

### Определение биомов

```typescript
function getTileType(elevation, moisture): TileType
  if elevation < 0.3:   return WATER
  if elevation < 0.35:  return SAND
  if elevation < 0.6:
    if moisture > 0.6:  return SWAMP
    if moisture > 0.3:  return GRASS
    else:               return FOREST
  if elevation < 0.8:   return HILL
  else:                 return MOUNTAIN
```

### Спавн ресурсов

| Биом | Ресурс | Шанс | Количество |
|------|--------|------|------------|
| **Лес** | Дерево | 80% | 50–100 |
| | Еда | 40% | 20–50 |
| **Трава** | Еда | 60% | 30–70 |
| **Холмы** | Камень | 50% | 20–50 |
| | Дерево | 30% | 10–30 |
| **Горы** | Камень | 70% | 30–80 |
| | Металл | 40% | 10–30 |
| **Болото** | Дерево | 50% | 20–50 |
| | Еда | 30% | 10–30 |

### Пример генерации

```typescript
const world = generateWorld(seed = 0.12345)

// world.tiles[y][x] содержит:
{
  type: TileType.FOREST,
  resources: [
    { type: 'wood', amount: 73 },
    { type: 'food', amount: 34 }
  ]
}
```

---

## 2. Система племён

### Жизненный цикл племени

```
┌─────────────────────────────────────────────────────────┐
│                  Tribe Life Cycle                       │
└─────────────────────────────────────────────────────────┘

  ┌─────────┐
  │  Spawn  │ ──▶ Random position on passable tile
  └─────────┘
       │
       ▼
  ┌─────────┐
  │ Nomadic │ ──▶ Explore, gather, move
  └─────────┘
       │
       │ population >= 30
       ▼
  ┌─────────┐
  │Settling │ ──▶ Found settlement, stop moving
  └─────────┘
       │
       │ relations change
       ▼
  ┌─────────┐     ┌─────────┐
  │  War    │◀───▶│Alliance │
  └─────────┘     └─────────┘
       │
       │ population = 0
       ▼
  ┌─────────┐
  | Extinct |
  └─────────┘
```

### Демография

**Ежедневный тик:**

```typescript
tick():
  // 1. Потребление еды
  foodNeeded = population × FOOD_CONSUMPTION
  
  if resources.food >= foodNeeded:
    resources.food -= foodNeeded
  else:
    // Голод
    starvationLoss = floor(population × STARVATION_RATE)
    population -= starvationLoss
    resources.food = 0
  
  // 2. Рождаемость (при избытке еды)
  if resources.food > 50:
    births = floor(population × BIRTH_RATE)
    population += births
  
  // 3. Смертность
  deaths = floor(population × DEATH_RATE)
  population -= deaths
  
  // 4. Кулдаун действий
  if actionCooldown > 0:
    actionCooldown--
  
  // 5. ИИ действие (если не игрок)
  if !isPlayer && actionCooldown <= 0:
    performAITick()
```

**Баланс:**
- При `food > 50` — рост населения
- При `food = 0` — убыль от голода
- Естественная смертность всегда присутствует

### ИИ племени

**Простое поведение:**

```typescript
performAITick():
  currentTile = getTile(world, position)
  
  if currentTile.resources.length > 0:
    // Есть ресурсы — собираем
    gatherResources(currentTile.resources[0].type)
  else:
    // Нет ресурсов — исследуем
    explore()
```

**Исследование:**
```typescript
explore():
  directions = shuffle([(0,-1), (0,1), (-1,0), (1,0)])
  
  for dir in directions:
    newPos = position + dir
    tile = getTile(world, newPos)
    
    if tile && isPassable(tile):
      position = newPos
      actionCooldown = 3
      return
```

**Встреча с другим племенем:**
```typescript
handleTribeEncounter(otherTribeId):
  relation = relations.get(otherTribeId) || 0
  roll = random()
  
  if roll < 0.3:
    // Торговля (30%)
    relations.set(otherTribeId, relation + 5)
  else if roll < 0.5:
    // Конфликт (20%)
    relations.set(otherTribeId, relation - 10)
  // Иначе ничего (50%)
```

### Действия племени

#### Сбор ресурсов

```typescript
gatherResources(resourceType):
  tile = getTile(world, position)
  resource = tile.resources.find(r => r.type === resourceType)
  
  if !resource || resource.amount <= 0:
    return
  
  gatherAmount = min(resource.amount, floor(population × 0.5))
  resource.amount -= gatherAmount
  resources[resourceType] += gatherAmount
  actionCooldown = 5
```

#### Перемещение

```typescript
move(direction):
  newPos = position + direction
  tile = getTile(world, newPos)
  
  if !tile || !isPassable(tile):
    return false
  
  if tile.tribeId !== undefined && tile.tribeId !== id:
    // Другое племя
    handleTribeEncounter(tile.tribeId)
    return false
  
  position = newPos
  actionCooldown = 2
  return true
```

#### Основание поселения

```typescript
settle():
  if state !== NOMADIC:
    return false
  
  if population < 30:
    return false
  
  tile = getTile(world, position)
  if !tile || !isPassable(tile):
    return false
  
  state = SETTLING
  homeTile = position
  tile.tribeId = id
  return true
```

---

## 3. Дерево технологий

### Структура

```
Каменный век
├── Простые инструменты
│   ├── Копьё
│   ├── Плетение корзин
│   │   └── Земледелие
│   └── Укрытие
│       └── Земледелие
└── Огонь

Бронзовый век
├── Земледелие (требует: Корзины, Укрытие)
├── Гончарство (требует: Корзины)
│   └── Письменность
├── Добыча камня (требует: Инструменты)
│   └── Колесо
└── Колесо (требует: Добыча камня)

Железный век
├── Обработка бронзы (требует: Добыча, Гончарство)
│   └── Обработка железа
├── Письменность (требует: Гончарство)
└── Обработка железа (требует: Бронза)
```

### Проверка доступности

```typescript
canResearch(tribeTechs, techId):
  tech = TECH_TREE[techId]
  
  if !tech:
    return false
  
  if tribeTechs.has(techId):
    return false  // Уже изучено
  
  // Проверка всех пререквизитов
  for prereq in tech.prerequisites:
    if !tribeTechs.has(prereq):
      return false
  
  return true
```

### Эффекты технологий

| Технология | Эффект | Значение |
|------------|--------|----------|
| Простые инструменты | GATHER_RATE | +20% |
| Огонь | BIRTH_RATE | +10% |
| Копьё | COMBAT | +30% |
| Плетение корзин | STORAGE | +50% |
| Укрытие | BIRTH_RATE | +20% |
| Земледелие | GATHER_RATE | +50% |
| Гончарство | STORAGE | +100% |
| Добыча камня | GATHER_RATE (stone) | +30% |
| Колесо | MOVE_SPEED | +30% |
| Обработка бронзы | GATHER_RATE | +80% |
| Письменность | BIRTH_RATE | +30% |
| Обработка железа | COMBAT | +100% |

---

## 4. Система событий

### Генерация событий

**Каждый тик:**
```typescript
generateTick(tribes):
  newEvents = []
  
  for tribe in tribes:
    if population <= 0:
      continue
    
    roll = random()
    
    if roll < 0.1:  // 10% шанс
      event = generateRandomEvent(tribe)
      if event:
        newEvents.push(event)
        eventQueue.push(event)
  
  // Очистка старых (старше 5 минут)
  eventQueue = eventQueue.filter(e => 
    !e.resolved && now - e.timestamp < 300000
  )
  
  return newEvents
```

### Распределение типов событий

```
┌──────────────────────────────────────────────────────┐
│          Event Type Distribution                     │
├──────────────────────────────────────────────────────┤
│  Удачный сбор        ████████████████████  20%       │
│  Болезнь             ███████████████       15%       │
│  Открытие            ███████████████       15%       │
│  Прирост населения   ███████████████       15%       │
│  Засуха              ███████████████       15%       │
│  Рейд                ██████████            10%       │
│  Предложение союза   █████                 5%        │
│  Объявлена война     █████                 5%        │
└──────────────────────────────────────────────────────┘
```

### Приоритеты событий

| Приоритет | Типы | Цвет в UI |
|-----------|------|-----------|
| 9 | Война | Красный |
| 8 | Рейд | Красный |
| 7 | Болезнь, Засуха | Оранжевый |
| 6 | Открытие, Союз | Жёлтый |
| 5 | Урожай, Прирост | Зелёный |

### События с выбором

**Рейд:**
```typescript
createRaidEvent(tribe, tribes):
  attacker = random(other tribe with relation < -50)
  
  return {
    title: "Рейд!",
    description: `"${attacker.name}" совершило рейд!`,
    choices: [
      {
        label: "Защититься",
        effect: () => {
          attack = attacker.population × 0.3
          defense = tribe.population × 0.4
          
          if attack > defense:
            stolen = min(50, tribe.resources.food)
            tribe.resources.food -= stolen
            attacker.resources.food += stolen
        }
      },
      {
        label: "Откупиться",
        effect: () => {
          tribute = min(30, tribe.resources.food)
          tribe.resources.food -= tribute
          attacker.resources.food += tribute
          tribe.addRelation(attacker.id, 10)
        }
      }
    ]
  }
```

**Предложение союза:**
```typescript
createAllianceEvent(tribe, tribes):
  potentialAlly = random(other tribe with relation >= 20)
  
  return {
    title: "Предложение союза",
    description: `"${potentialAlly.name}" предлагает союз!`,
    choices: [
      {
        label: "Принять",
        effect: () => {
          tribe.addRelation(potentialAlly.id, 30)
          potentialAlly.addRelation(tribe.id, 30)
        }
      },
      {
        label: "Отклонить",
        effect: () => {
          tribe.addRelation(potentialAlly.id, -10)
        }
      }
    ]
  }
```

---

## 5. Боевая система (заготовка)

### Простая модель боя

```typescript
resolveCombat(attacker, defender):
  attackStrength = attacker.population × 0.3
  defenseStrength = defender.population × 0.4
  
  if attackStrength > defenseStrength:
    // Атакующий победил
    casualties = floor(defender.population × 0.1)
    defender.population -= casualties
    stolen = min(50, defender.resources.food)
    defender.resources.food -= stolen
    attacker.resources.food += stolen
  else:
    // Защитник победил
    casualties = floor(attacker.population × 0.15)
    attacker.population -= casualties
```

### Отношения и война

```typescript
// Автоматическое объявление войны
if relation < -70:
  state = AT_WAR
  // Шанс рейда увеличивается

// Мир после войны
if relation > -50:
  state = NOMADIC  // Выход из войны
```

---

## 6. Камера и рендеринг

### Камера

```typescript
interface Camera {
  x: number       // Позиция X в мире
  y: number       // Позиция Y в мире
  zoom: number    // Масштаб (0.5–3.0)
}
```

**Преобразование координат:**

```typescript
// Мир → Экран
worldToScreen(worldX, worldY, camera):
  return {
    x: (worldX - camera.x) × camera.zoom
    y: (worldY - camera.y) × camera.zoom
  }

// Экран → Мир
screenToWorld(screenX, screenY, camera):
  return {
    x: floor(screenX / camera.zoom + camera.x)
    y: floor(screenY / camera.zoom + camera.y)
  }
```

### Оптимизация рендеринга

Рендерятся только видимые тайлы:

```typescript
render():
  startCol = floor(camera.x / TILE_SIZE)
  endCol = startCol + ceil(screenWidth / (TILE_SIZE × zoom)) + 1
  startRow = floor(camera.y / TILE_SIZE)
  endRow = startRow + ceil(screenHeight / (TILE_SIZE × zoom)) + 1
  
  for y from startRow to endRow:
    for x from startCol to endCol:
      if inBounds(x, y):
        renderTile(tiles[y][x])
```

### Отрисовка племени

```typescript
renderTribe(tribe, screenX, screenY, size, isSelected):
  centerX = screenX + size / 2
  centerY = screenY + size / 2
  
  // Основной маркер
  fillCircle(centerX, centerY, size × 0.4, tribe.color)
  
  // Выделение
  if isSelected:
    strokeCircle(centerX, centerY, size × 0.6, 'yellow', 2)
  
  // Индикатор размера популяции
  popSize = min(1, population / 100)
  fillCircle(centerX, centerY, size × 0.2 × popSize, 'white')
```

---

## 7. Сохранения

### Структура сохранения

```typescript
interface SavedGame {
  id: string           // 'quicksave', 'autosave', etc.
  name: string         // Отображаемое имя
  state: {
    world: World
    tribes: Tribe[]    // Сериализованные
    events: GameEvent[]
    playerTribeId: number | null
    tick: number
    isPaused: boolean
    gameSpeed: number
  }
  createdAt: number    // Timestamp создания
  updatedAt: number    // Timestamp последнего изменения
}
```

### Сериализация

```typescript
// Tribe → JSON
tribe.toJSON():
  return {
    config: data.config,
    population: data.population,
    position: data.position,
    resources: data.resources,
    state: data.state,
    relations: Array.from(data.relations.entries()),
    discoveredTechs: Array.from(data.discoveredTechs),
    actionCooldown: data.actionCooldown,
    lastAction: data.lastAction,
    homeTile: data.homeTile
  }

// JSON → Tribe
Tribe.fromJSON(json):
  tribe = new Tribe(json.config, json.position)
  tribe.data.population = json.population
  tribe.data.resources = json.resources
  tribe.data.state = json.state
  tribe.data.relations = new Map(json.relations)
  tribe.data.discoveredTechs = new Set(json.discoveredTechs)
  // ...
  return tribe
```

### Автосохранение

```typescript
// Каждые 100 тиков
if tick % 100 === 0:
  await storage.autoSave(gameState)
```

---

Этот документ описывает внутренние механизмы игровых систем.
