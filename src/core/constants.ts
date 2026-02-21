// Константы игры

export const TILE_SIZE = 16
export const MAP_WIDTH = 200
export const MAP_HEIGHT = 150
export const MAX_TRIBES_COUNT = 500
export const MIN_TRIBE_SIZE = 10
export const MAX_TRIBE_SIZE = 500

// Шансы генерации ресурсов на типе местности
export const RESOURCE_SPAWN_RATES = {
  forest: { wood: 0.8, food: 0.3 },
  grass: { food: 0.5 },
  hill: { stone: 0.4, wood: 0.2 },
  mountain: { stone: 0.7, metal: 0.3 },
  swamp: { food: 0.2, wood: 0.4 }
}

// Демографические константы
export const BIRTH_RATE = 0.002 // шанс рождения в тик
export const DEATH_RATE = 0.001 // шанс смерти в тик
export const STARVATION_RATE = 0.005 // шанс смерти от голода
export const FOOD_CONSUMPTION = 1 // еды на человека в тик

// Длительности (в миллисекундах)
export const TICK_RATE = 1000 // базовая скорость тика
export const SEASON_DURATION = 30000 // длительность сезона (30 секунд)

// Цвета для рендеринга
export const COLORS = {
  water: '#4a90d9',
  sand: '#d4c685',
  grass: '#7cb342',
  forest: '#2e7d32',
  hill: '#8d6e63',
  mountain: '#616161',
  swamp: '#558b2f',
  tribe: '#ff5722',
  player: '#2196f3',
  selected: '#ffeb3b'
}
