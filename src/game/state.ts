// Игровая логика и состояние

import { World, generateWorld, getTile } from '../core/world'
import { Tribe, generateTribeName, TribeState } from '../core/tribe'
import { EventGenerator, GameEvent } from '../core/events'
import { TICK_RATE, MAX_TRIBES_COUNT, COLORS } from '../core/constants'
import { Position, TribeConfig, ResourceType } from '../types'

export enum GameSpeed {
  PAUSED = 0,
  NORMAL = 1,
  FAST = 2,
  ULTRA = 3
}

export interface GameState {
  world: World
  tribes: Map<number, Tribe>
  events: GameEvent[]
  playerTribeId: number | null
  gameSpeed: GameSpeed
  isPaused: boolean
  tick: number
  lastSave: number
  selectedTribeId: number | null
  camera: {
    x: number
    y: number
    zoom: number
  }
}

export interface GameAction {
  type: ActionType
  payload?: any
}

export enum ActionType {
  SELECT_TRIBE = 'select_tribe',
  MOVE_TRIBE = 'move_tribe',
  GATHER = 'gather',
  SETTLE = 'settle',
  RESEARCH = 'research',
  TRADE = 'trade',
  ATTACK = 'attack',
  TOGGLE_PAUSE = 'toggle_pause',
  CHANGE_SPEED = 'change_speed',
  SAVE_GAME = 'save_game',
  LOAD_GAME = 'load_game'
}

export class Game {
  public state: GameState
  private eventGenerator: EventGenerator
  private lastTickTime: number = 0
  private tickInterval: number = TICK_RATE
  private tribeIdCounter: number = 0

  constructor() {
    this.eventGenerator = new EventGenerator()
    this.state = this.createInitialState()
  }

  private createInitialState(): GameState {
    return {
      world: generateWorld(),
      tribes: new Map(),
      events: [],
      playerTribeId: null,
      gameSpeed: GameSpeed.PAUSED,
      isPaused: true,
      tick: 0,
      lastSave: Date.now(),
      selectedTribeId: null,
      camera: {
        x: 0,
        y: 0,
        zoom: 1
      }
    }
  }

  init(playerStartPos?: Position): void {
    // Генерация племён
    const tribeCount = Math.min(MAX_TRIBES_COUNT, 500)
    const placed = new Set<string>()

    for (let i = 0; i < tribeCount; i++) {
      let pos: Position

      if (i === 0 && playerStartPos) {
        pos = playerStartPos
      } else {
        // Случайная позиция на карте
        let attempts = 0
        do {
          pos = {
            x: Math.floor(Math.random() * this.state.world.width),
            y: Math.floor(Math.random() * this.state.world.height)
          }
          attempts++
        } while (placed.has(`${pos.x},${pos.y}`) && attempts < 100)
      }

      const tile = getTile(this.state.world, pos)
      if (!tile || tile.type === 'W' as any) continue

      const key = `${pos.x},${pos.y}`
      if (placed.has(key)) continue

      placed.add(key)

      const isPlayer = i === 0
      const config: TribeConfig = {
        id: ++this.tribeIdCounter,
        name: generateTribeName(),
        isPlayer,
        color: isPlayer ? COLORS.player : this.getRandomTribeColor()
      }

      const tribe = new Tribe(config, pos)

      if (isPlayer) {
        this.state.playerTribeId = config.id
        this.state.selectedTribeId = config.id
      }

      this.state.tribes.set(config.id, tribe)
    }

    // Центрирование камеры на игроке
    if (this.state.playerTribeId) {
      const playerTribe = this.state.tribes.get(this.state.playerTribeId)
      if (playerTribe) {
        this.state.camera.x = playerTribe.data.position.x - 50
        this.state.camera.y = playerTribe.data.position.y - 37
      }
    }
  }

  private getRandomTribeColor(): string {
    const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#009688', '#ff9800', '#795548']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  start(): void {
    this.state.isPaused = false
    this.state.gameSpeed = GameSpeed.NORMAL
    this.lastTickTime = performance.now()
  }

  pause(): void {
    this.state.isPaused = true
    this.state.gameSpeed = GameSpeed.PAUSED
  }

  togglePause(): void {
    if (this.state.isPaused) {
      this.start()
    } else {
      this.pause()
    }
  }

  setSpeed(speed: GameSpeed): void {
    if (speed === GameSpeed.PAUSED) {
      this.pause()
    } else {
      this.state.gameSpeed = speed
      this.state.isPaused = false
      // Ускорение тика
      this.tickInterval = TICK_RATE / speed
    }
  }

  update(currentTime: number): void {
    if (this.state.isPaused) return

    const elapsed = currentTime - this.lastTickTime
    const speedMultiplier = this.state.gameSpeed

    if (elapsed >= this.tickInterval / speedMultiplier) {
      this.tick()
      this.lastTickTime = currentTime
    }
  }

  private tick(): void {
    this.state.tick++

    // Обновление племён
    for (const tribe of this.state.tribes.values()) {
      if (tribe.data.population <= 0) continue
      tribe.tick(this.state.world)

      // Обновление тайла племени
      const tile = getTile(this.state.world, tribe.data.position)
      if (tile) {
        tile.tribeId = tribe.data.config.id
      }
    }

    // Очистка вымерших племён
    for (const [id, tribe] of this.state.tribes.entries()) {
      if (tribe.data.population <= 0) {
        this.state.tribes.delete(id)
        if (this.state.playerTribeId === id) {
          this.state.playerTribeId = null
          this.state.selectedTribeId = null
        }
      }
    }

    // Генерация событий
    const newEvents = this.eventGenerator.generateTick(this.state.world, this.state.tribes)
    this.state.events.push(...newEvents)

    // Автосохранение каждые 100 тиков
    if (this.state.tick % 100 === 0) {
      this.state.lastSave = Date.now()
    }
  }

  // Действия игрока
  selectTribe(tribeId: number): void {
    if (this.state.tribes.has(tribeId)) {
      this.state.selectedTribeId = tribeId
    }
  }

  getSelectedTribe(): Tribe | null {
    if (!this.state.selectedTribeId) return null
    return this.state.tribes.get(this.state.selectedTribeId) || null
  }

  getPlayerTribe(): Tribe | null {
    if (!this.state.playerTribeId) return null
    return this.state.tribes.get(this.state.playerTribeId) || null
  }

  moveSelectedTribe(dx: number, dy: number): boolean {
    const tribe = this.getSelectedTribe()
    if (!tribe) return false

    return tribe.move(this.state.world, { x: dx, y: dy })
  }

  settleSelectedTribe(): boolean {
    const tribe = this.getSelectedTribe()
    if (!tribe) return false

    const success = tribe.settle(this.state.world)
    if (success) {
      tribe.data.state = TribeState.SETTLING
    }
    return success
  }

  gatherResources(tribeId: number, resourceType: ResourceType): boolean {
    const tribe = this.state.tribes.get(tribeId)
    if (!tribe) return false

    tribe.gatherResources(this.state.world, resourceType)
    return true
  }

  resolveEvent(eventId: string, choiceIndex?: number): void {
    this.eventGenerator.resolveEvent(eventId, choiceIndex)
  }

  getPendingEvents(): GameEvent[] {
    return this.eventGenerator.getPendingEvents()
  }

  exportState(): GameState {
    return this.state
  }

  importState(state: GameState): void {
    this.state = state
  }
}

export const game = new Game()
