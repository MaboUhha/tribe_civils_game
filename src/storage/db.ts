// IndexedDB хранилище

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { World } from '../core/world'
import { Tribe } from '../core/tribe'
import { GameEvent } from '../core/events'

export interface GameState {
  world: World
  tribes: Map<number, Tribe>
  events: GameEvent[]
  playerTribeId: number | null
  gameSpeed: number
  isPaused: boolean
  tick: number
  lastSave: number
}

interface TribeDBSchema extends DBSchema {
  saves: {
    key: string
    value: {
      id: string
      name: string
      state: SerializedGameState
      createdAt: number
      updatedAt: number
    }
  }
  settings: {
    key: string
    value: {
      key: string
      value: any
    }
  }
}

interface SerializedGameState {
  world: World
  tribes: Array<any>
  events: GameEvent[]
  playerTribeId: number | null
  gameSpeed: number
  isPaused: boolean
  tick: number
  lastSave: number
}

const DB_NAME = 'tribe-civils-game'
const DB_VERSION = 1

export class GameStorage {
  private db: IDBPDatabase<TribeDBSchema> | null = null

  async init(): Promise<void> {
    this.db = await openDB<TribeDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Хранилище сохранений
        if (!db.objectStoreNames.contains('saves')) {
          db.createObjectStore('saves', { keyPath: 'id' })
        }
        // Хранилище настроек
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }

  private serializeState(state: GameState): SerializedGameState {
    return {
      world: state.world,
      tribes: Array.from(state.tribes.values()).map(t => t.toJSON()),
      events: state.events,
      playerTribeId: state.playerTribeId,
      gameSpeed: state.gameSpeed,
      isPaused: state.isPaused,
      tick: state.tick,
      lastSave: state.lastSave
    }
  }

  private deserializeState(serialized: SerializedGameState): GameState {
    return {
      world: serialized.world,
      tribes: new Map(serialized.tribes.map(t => [t.config.id, Tribe.fromJSON(t)])),
      events: serialized.events,
      playerTribeId: serialized.playerTribeId,
      gameSpeed: serialized.gameSpeed,
      isPaused: serialized.isPaused,
      tick: serialized.tick,
      lastSave: serialized.lastSave
    }
  }

  async saveGame(slotId: string, name: string, state: GameState): Promise<void> {
    if (!this.db) throw new Error('DB not initialized')

    const existing = await this.db.get('saves', slotId)
    const now = Date.now()

    await this.db.put('saves', {
      id: slotId,
      name: name || existing?.name || `Сохранение ${new Date().toLocaleString('ru-RU')}`,
      state: this.serializeState(state),
      createdAt: existing?.createdAt || now,
      updatedAt: now
    })
  }

  async loadGame(slotId: string): Promise<GameState | null> {
    if (!this.db) throw new Error('DB not initialized')

    const save = await this.db.get('saves', slotId)
    if (!save) return null

    return this.deserializeState(save.state)
  }

  async deleteSave(slotId: string): Promise<void> {
    if (!this.db) throw new Error('DB not initialized')
    await this.db.delete('saves', slotId)
  }

  async listSaves(): Promise<Array<{ id: string; name: string; updatedAt: number }>> {
    if (!this.db) throw new Error('DB not initialized')

    const saves = await this.db.getAll('saves')
    return saves.map(s => ({
      id: s.id,
      name: s.name,
      updatedAt: s.updatedAt
    }))
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    if (!this.db) throw new Error('DB not initialized')

    const setting = await this.db.get('settings', key)
    return setting ? setting.value : defaultValue
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    if (!this.db) throw new Error('DB not initialized')

    await this.db.put('settings', { key, value })
  }

  async autoSave(state: GameState): Promise<void> {
    await this.saveGame('autosave', 'Автосохранение', state)
  }

  async getQuickSave(): Promise<GameState | null> {
    return this.loadGame('quicksave')
  }

  async quickSave(state: GameState): Promise<void> {
    await this.saveGame('quicksave', 'Быстрое сохранение', state)
  }
}

export const storage = new GameStorage()
