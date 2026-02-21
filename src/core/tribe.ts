// Логика племени

import { ResourceType, Position, TribeActionType } from '../types'
import { World, getTile, isPassable } from './world'
import { MIN_TRIBE_SIZE, MAX_TRIBE_SIZE, BIRTH_RATE, DEATH_RATE, STARVATION_RATE, FOOD_CONSUMPTION } from './constants'

export enum TribeState {
  NOMADIC = 'nomadic',
  SETTLING = 'settling',
  EXPANDING = 'expanding',
  AT_WAR = 'war',
  ALLIANCE = 'alliance'
}

export interface TribeConfig {
  id: number
  name: string
  isPlayer: boolean
  color: string
}

export interface TribeData {
  config: TribeConfig
  population: number
  position: Position
  resources: Record<ResourceType, number>
  state: TribeState
  relations: Map<number, number> // tribeId -> отношение (-100 до 100)
  discoveredTechs: Set<string>
  actionCooldown: number
  lastAction: TribeActionType | null
  homeTile?: Position
}

export class Tribe {
  public data: TribeData

  constructor(config: TribeConfig, position: Position) {
    this.data = {
      config,
      population: Math.floor(Math.random() * (MAX_TRIBE_SIZE - MIN_TRIBE_SIZE)) + MIN_TRIBE_SIZE,
      position,
      resources: {
        [ResourceType.FOOD]: 100,
        [ResourceType.WOOD]: 0,
        [ResourceType.STONE]: 0,
        [ResourceType.METAL]: 0
      },
      state: TribeState.NOMADIC,
      relations: new Map(),
      discoveredTechs: new Set(),
      actionCooldown: 0,
      lastAction: null
    }
  }

  tick(world: World): void {
    // Потребление еды
    const foodNeeded = this.data.population * FOOD_CONSUMPTION
    if (this.data.resources[ResourceType.FOOD] >= foodNeeded) {
      this.data.resources[ResourceType.FOOD] -= foodNeeded
    } else {
      // Голод
      const starvationLoss = Math.floor(this.data.population * STARVATION_RATE)
      this.data.population = Math.max(0, this.data.population - starvationLoss)
      this.data.resources[ResourceType.FOOD] = 0
    }

    // Рождаемость
    if (this.data.resources[ResourceType.FOOD] > 50) {
      const births = Math.floor(this.data.population * BIRTH_RATE)
      this.data.population += births
    }

    // Смертность
    const deaths = Math.floor(this.data.population * DEATH_RATE)
    this.data.population = Math.max(0, this.data.population - deaths)

    // Кулдаун действий
    if (this.data.actionCooldown > 0) {
      this.data.actionCooldown--
    }

    // Вымирание
    if (this.data.population <= 0) {
      // Племя вымерло
      return
    }

    // Автоматические действия ИИ (не для игрока)
    if (!this.data.config.isPlayer && this.data.actionCooldown <= 0) {
      this.performAITick(world)
    }
  }

  private performAITick(world: World): void {
    // Простое ИИ: сбор ресурсов, перемещение
    const currentTile = getTile(world, this.data.position)
    if (!currentTile) return

    // Сбор ресурсов на текущей клетке
    if (currentTile.resources.length > 0) {
      this.gatherResources(world, currentTile.resources[0].type)
    } else {
      // Поиск ресурсов поблизости
      this.explore(world)
    }
  }

  gatherResources(world: World, resourceType: ResourceType): void {
    const currentTile = getTile(world, this.data.position)
    if (!currentTile) return

    const resource = currentTile.resources.find(r => r.type === resourceType)
    if (!resource || resource.amount <= 0) return

    // Сбор зависит от населения
    const gatherAmount = Math.min(resource.amount, Math.floor(this.data.population * 0.5))
    resource.amount -= gatherAmount
    this.data.resources[resourceType] += gatherAmount
    this.data.lastAction = TribeActionType.GATHER
    this.data.actionCooldown = 5
  }

  explore(world: World): void {
    // Случуйное перемещение в поисках ресурсов
    const directions = [
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: 0 }, { x: 1, y: 0 }
    ]

    const shuffled = directions.sort(() => Math.random() - 0.5)

    for (const dir of shuffled) {
      const newPos = { x: this.data.position.x + dir.x, y: this.data.position.y + dir.y }
      const tile = getTile(world, newPos)
      if (tile && isPassable(tile)) {
        this.data.position = newPos
        this.data.lastAction = TribeActionType.EXPLORE
        this.data.actionCooldown = 3
        return
      }
    }
  }

  move(world: World, direction: Position): boolean {
    const newPos = { x: this.data.position.x + direction.x, y: this.data.position.y + direction.y }
    const tile = getTile(world, newPos)
    
    if (!tile || !isPassable(tile)) return false

    // Проверка на другие племена
    if (tile.tribeId !== undefined && tile.tribeId !== this.data.config.id) {
      // Встреча с другим племенем
      this.handleTribeEncounter(world, tile.tribeId)
      return false
    }

    this.data.position = newPos
    this.data.lastAction = TribeActionType.MOVE
    this.data.actionCooldown = 2
    return true
  }

  private handleTribeEncounter(_world: World, otherTribeId: number): void {
    const currentRelation = this.data.relations.get(otherTribeId) || 0
    
    // Простая логика: случайное взаимодействие
    const roll = Math.random()
    if (roll < 0.3) {
      // Торговля
      this.data.relations.set(otherTribeId, currentRelation + 5)
    } else if (roll < 0.5) {
      // Конфликт
      this.data.relations.set(otherTribeId, currentRelation - 10)
    }
    // Иначе ничего не происходит
  }

  settle(world: World): boolean {
    if (this.data.state !== TribeState.NOMADIC) return false
    if (this.data.population < 30) return false

    const currentTile = getTile(world, this.data.position)
    if (!currentTile || !isPassable(currentTile)) return false

    this.data.state = TribeState.SETTLING
    this.data.homeTile = { ...this.data.position }
    currentTile.tribeId = this.data.config.id
    return true
  }

  addRelation(tribeId: number, amount: number): void {
    const current = this.data.relations.get(tribeId) || 0
    this.data.relations.set(tribeId, Math.max(-100, Math.min(100, current + amount)))
  }

  discoverTech(techId: string): void {
    this.data.discoveredTechs.add(techId)
  }

  hasTech(techId: string): boolean {
    return this.data.discoveredTechs.has(techId)
  }

  toJSON(): any {
    return {
      config: this.data.config,
      population: this.data.population,
      position: this.data.position,
      resources: this.data.resources,
      state: this.data.state,
      relations: Array.from(this.data.relations.entries()),
      discoveredTechs: Array.from(this.data.discoveredTechs),
      actionCooldown: this.data.actionCooldown,
      lastAction: this.data.lastAction,
      homeTile: this.data.homeTile
    }
  }

  static fromJSON(json: any): Tribe {
    const tribe = new Tribe(json.config, json.position)
    tribe.data.population = json.population
    tribe.data.resources = json.resources
    tribe.data.state = json.state
    tribe.data.relations = new Map(json.relations)
    tribe.data.discoveredTechs = new Set(json.discoveredTechs)
    tribe.data.actionCooldown = json.actionCooldown
    tribe.data.lastAction = json.lastAction
    tribe.data.homeTile = json.homeTile
    return tribe
  }
}

export function generateTribeName(): string {
  const prefixes = ['Древ', 'Молод', 'Силь', 'Быст', 'Хитр', 'Мудр', 'Храбр', 'Воль', 'Тих', 'Гром']
  const suffixes = ['овичи', 'ецы', 'яне', 'цы', 'ки', 'цы', 'не', 'ты', 'ры', 'ды']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  return prefix + suffix
}
