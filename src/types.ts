// Базовые типы игры

export enum TileType {
  WATER = 'W',
  SAND = '.',
  GRASS = ',',
  FOREST = '♣',
  HILL = '^',
  MOUNTAIN = '▲',
  SWAMP = '≈'
}

export enum ResourceType {
  FOOD = 'food',
  WOOD = 'wood',
  STONE = 'stone',
  METAL = 'metal'
}

export enum TribeActionType {
  MOVE = 'move',
  GATHER = 'gather',
  HUNT = 'hunt',
  BUILD = 'build',
  EXPLORE = 'explore',
  TRADE = 'trade',
  ATTACK = 'attack',
  MIGRATE = 'migrate'
}

export enum EventType {
  HARVEST = 'harvest',
  DISEASE = 'disease',
  RAID = 'raid',
  DISCOVERY = 'discovery',
  BIRTH_BOOM = 'birth_boom',
  DROUGHT = 'drought',
  ALLIANCE = 'alliance',
  WAR = 'war'
}

export interface Position {
  x: number
  y: number
}

export interface Resource {
  type: ResourceType
  amount: number
}

export interface TribeConfig {
  id: number
  name: string
  isPlayer: boolean
  color: string
}
