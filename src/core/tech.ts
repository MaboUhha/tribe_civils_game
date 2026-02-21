// Дерево технологий

export enum TechEra {
  STONE_AGE = 'stone_age',
  BRONZE_AGE = 'bronze_age',
  IRON_AGE = 'iron_age'
}

export interface Tech {
  id: string
  name: string
  description: string
  era: TechEra
  prerequisites: string[]
  cost: {
    food?: number
    wood?: number
    stone?: number
    metal?: number
  }
  effect: TechEffect
}

export interface TechEffect {
  type: TechEffectType
  value: number
  target?: string
}

export enum TechEffectType {
  GATHER_RATE = 'gather_rate',
  BIRTH_RATE = 'birth_rate',
  MOVE_SPEED = 'move_speed',
  STORAGE = 'storage',
  COMBAT = 'combat',
  UNLOCK_BUILDING = 'unlock_building',
  UNLOCK_UNIT = 'unlock_unit'
}

export const TECH_TREE: Record<string, Tech> = {
  // Каменный век
  'basic_tools': {
    id: 'basic_tools',
    name: 'Простые инструменты',
    description: 'Камни и палки как простые инструменты',
    era: TechEra.STONE_AGE,
    prerequisites: [],
    cost: { food: 50 },
    effect: { type: TechEffectType.GATHER_RATE, value: 0.2 }
  },
  'fire': {
    id: 'fire',
    name: 'Огонь',
    description: 'Приручение огня для тепла и защиты',
    era: TechEra.STONE_AGE,
    prerequisites: [],
    cost: { food: 100 },
    effect: { type: TechEffectType.BIRTH_RATE, value: 0.1 }
  },
  'spear': {
    id: 'spear',
    name: 'Копьё',
    description: 'Охотничье и боевое копьё',
    era: TechEra.STONE_AGE,
    prerequisites: ['basic_tools'],
    cost: { food: 80, wood: 30 },
    effect: { type: TechEffectType.COMBAT, value: 0.3 }
  },
  'basket': {
    id: 'basket',
    name: 'Плетение корзин',
    description: 'Хранение ресурсов в корзинах',
    era: TechEra.STONE_AGE,
    prerequisites: ['basic_tools'],
    cost: { food: 60, wood: 40 },
    effect: { type: TechEffectType.STORAGE, value: 0.5 }
  },
  'shelter': {
    id: 'shelter',
    name: 'Укрытие',
    description: 'Простое укрытие от непогоды',
    era: TechEra.STONE_AGE,
    prerequisites: ['basic_tools'],
    cost: { food: 100, wood: 50 },
    effect: { type: TechEffectType.BIRTH_RATE, value: 0.2 }
  },
  
  // Бронзовый век
  'agriculture': {
    id: 'agriculture',
    name: 'Земледелие',
    description: 'Выращивание растений для пищи',
    era: TechEra.BRONZE_AGE,
    prerequisites: ['basket', 'shelter'],
    cost: { food: 200, wood: 100 },
    effect: { type: TechEffectType.GATHER_RATE, value: 0.5 }
  },
  'pottery': {
    id: 'pottery',
    name: 'Гончарство',
    description: 'Создание керамической посуды',
    era: TechEra.BRONZE_AGE,
    prerequisites: ['basket'],
    cost: { food: 150, stone: 50 },
    effect: { type: TechEffectType.STORAGE, value: 1.0 }
  },
  'mining': {
    id: 'mining',
    name: 'Добыча камня',
    description: 'Улучшенная добыча камня',
    era: TechEra.BRONZE_AGE,
    prerequisites: ['basic_tools'],
    cost: { food: 150, wood: 50 },
    effect: { type: TechEffectType.GATHER_RATE, value: 0.3, target: 'stone' }
  },
  'wheel': {
    id: 'wheel',
    name: 'Колесо',
    description: 'Изобретение колеса для транспорта',
    era: TechEra.BRONZE_AGE,
    prerequisites: ['mining'],
    cost: { food: 200, wood: 150 },
    effect: { type: TechEffectType.MOVE_SPEED, value: 0.3 }
  },
  
  // Железный век
  'bronze_working': {
    id: 'bronze_working',
    name: 'Обработка бронзы',
    description: 'Создание бронзовых инструментов',
    era: TechEra.IRON_AGE,
    prerequisites: ['mining', 'pottery'],
    cost: { food: 300, stone: 100, metal: 50 },
    effect: { type: TechEffectType.GATHER_RATE, value: 0.8 }
  },
  'writing': {
    id: 'writing',
    name: 'Письменность',
    description: 'Запись знаний и истории',
    era: TechEra.IRON_AGE,
    prerequisites: ['pottery'],
    cost: { food: 400, wood: 100 },
    effect: { type: TechEffectType.BIRTH_RATE, value: 0.3 }
  },
  'iron_working': {
    id: 'iron_working',
    name: 'Обработка железа',
    description: 'Создание железных инструментов и оружия',
    era: TechEra.IRON_AGE,
    prerequisites: ['bronze_working'],
    cost: { food: 500, stone: 200, metal: 150 },
    effect: { type: TechEffectType.COMBAT, value: 1.0 }
  }
}

export function getTech(techId: string): Tech | undefined {
  return TECH_TREE[techId]
}

export function canResearch(tribeTechs: Set<string>, techId: string): boolean {
  const tech = getTech(techId)
  if (!tech) return false
  if (tribeTechs.has(techId)) return false
  
  // Проверка всех пререквизитов
  return tech.prerequisites.every(prereq => tribeTechs.has(prereq))
}

export function getAvailableTechs(tribeTechs: Set<string>): Tech[] {
  return Object.values(TECH_TREE).filter(tech => canResearch(tribeTechs, tech.id))
}

export function getTechsByEra(era: TechEra): Tech[] {
  return Object.values(TECH_TREE).filter(tech => tech.era === era)
}
