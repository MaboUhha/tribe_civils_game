// Генератор событий

import { EventType } from '../types'
import { Tribe } from './tribe'
import { World } from './world'

export interface GameEvent {
  id: string
  type: EventType
  title: string
  description: string
  tribeId?: number
  timestamp: number
  priority: number // 1-10, где 10 - самое важное
  resolved: boolean
  choices?: EventChoice[]
}

export interface EventChoice {
  label: string
  effect: (world: World, tribes: Map<number, Tribe>) => void
}

export class EventGenerator {
  private eventQueue: GameEvent[] = []
  private eventCounter = 0

  generateTick(_world: World, tribes: Map<number, Tribe>): GameEvent[] {
    const newEvents: GameEvent[] = []

    // Шанс случайного события на каждое племя
    for (const [_id, tribe] of tribes) {
      if (tribe.data.population <= 0) continue

      const roll = Math.random()
      
      // 10% шанс события на тик
      if (roll < 0.1) {
        const event = this.generateRandomEvent(tribe, _world, tribes)
        if (event) {
          newEvents.push(event)
          this.eventQueue.push(event)
        }
      }
    }

    // Очистка старых событий
    this.eventQueue = this.eventQueue.filter(e => !e.resolved && Date.now() - e.timestamp < 300000)

    return newEvents
  }

  private generateRandomEvent(tribe: Tribe, _world: World, tribes: Map<number, Tribe>): GameEvent | null {
    const events: Array<() => GameEvent | null> = [
      () => this.createHarvestEvent(tribe),
      () => this.createDiseaseEvent(tribe),
      () => this.createDiscoveryEvent(tribe),
      () => this.createBirthBoomEvent(tribe),
      () => this.createDroughtEvent(tribe),
      () => this.createRaidEvent(tribe, tribes),
      () => this.createAllianceEvent(tribe, tribes),
      () => this.createWarEvent(tribe, tribes)
    ]

    const weights = [0.2, 0.15, 0.15, 0.15, 0.15, 0.1, 0.05, 0.05]
    
    const weightedRoll = Math.random()
    let cumulative = 0
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]
      if (weightedRoll < cumulative) {
        return events[i]()
      }
    }

    return events[0]()
  }

  private createHarvestEvent(tribe: Tribe): GameEvent {
    const bonus = Math.floor(tribe.data.population * 2)
    return {
      id: `event_${++this.eventCounter}`,
      type: EventType.HARVEST,
      title: 'Удачный сбор',
      description: `Племя "${tribe.data.config.name}" собрало отличный урожай! +${bonus} еды.`,
      tribeId: tribe.data.config.id,
      timestamp: Date.now(),
      priority: 5,
      resolved: false,
      choices: [
        {
          label: 'Собрать урожай',
          effect: (_world, _tribes) => {
            tribe.data.resources.food += bonus
          }
        }
      ]
    }
  }

  private createDiseaseEvent(tribe: Tribe): GameEvent {
    const loss = Math.floor(tribe.data.population * 0.1) + 1
    return {
      id: `event_${++this.eventCounter}`,
      type: EventType.DISEASE,
      title: 'Болезнь',
      description: `В племени "${tribe.data.config.name}" вспышка болезни! Погибло ${loss} человек.`,
      tribeId: tribe.data.config.id,
      timestamp: Date.now(),
      priority: 7,
      resolved: false
    }
  }

  private createDiscoveryEvent(tribe: Tribe): GameEvent {
    return {
      id: `event_${++this.eventCounter}`,
      type: EventType.DISCOVERY,
      title: 'Открытие',
      description: `Племя "${tribe.data.config.name}" обнаружило новые земли!`,
      tribeId: tribe.data.config.id,
      timestamp: Date.now(),
      priority: 6,
      resolved: false
    }
  }

  private createBirthBoomEvent(tribe: Tribe): GameEvent {
    const gain = Math.floor(tribe.data.population * 0.15) + 2
    return {
      id: `event_${++this.eventCounter}`,
      type: EventType.BIRTH_BOOM,
      title: 'Прирост населения',
      description: `В племени "${tribe.data.config.name}" бум рождаемости! +${gain} человек.`,
      tribeId: tribe.data.config.id,
      timestamp: Date.now(),
      priority: 5,
      resolved: false
    }
  }

  private createDroughtEvent(tribe: Tribe): GameEvent {
    const loss = Math.floor(tribe.data.resources.food * 0.3)
    return {
      id: `event_${++this.eventCounter}`,
      type: EventType.DROUGHT,
      title: 'Засуха',
      description: `Засуха ударила по племени "${tribe.data.config.name}"! Потеряно ${loss} еды.`,
      tribeId: tribe.data.config.id,
      timestamp: Date.now(),
      priority: 7,
      resolved: false
    }
  }

  private createRaidEvent(tribe: Tribe, tribes: Map<number, Tribe>): GameEvent | null {
    // Найти другое племя поблизости
    const otherTribes = Array.from(tribes.values()).filter(
      t => t.data.config.id !== tribe.data.config.id && t.data.population > 0
    )
    
    if (otherTribes.length === 0) return null

    const attacker = otherTribes[Math.floor(Math.random() * otherTribes.length)]
    const relation = tribe.data.relations.get(attacker.data.config.id) || 0

    if (relation > -50) return null // Слишком хорошие отношения для рейда

    return {
      id: `event_${++this.eventCounter}`,
      type: EventType.RAID,
      title: 'Рейд!',
      description: `Племя "${attacker.data.config.name}" совершило рейд на "${tribe.data.config.name}"!`,
      tribeId: tribe.data.config.id,
      timestamp: Date.now(),
      priority: 8,
      resolved: false,
      choices: [
        {
          label: 'Защититься',
          effect: (_world, _tribesMap) => {
            // Простая логика боя
            const attackStrength = attacker.data.population * 0.3
            const defenseStrength = tribe.data.population * 0.4
            if (attackStrength > defenseStrength) {
              const stolen = Math.min(50, tribe.data.resources.food)
              tribe.data.resources.food -= stolen
              attacker.data.resources.food += stolen
            }
          }
        },
        {
          label: 'Откупиться',
          effect: (_world, _tribesMap) => {
            const tribute = Math.min(30, tribe.data.resources.food)
            tribe.data.resources.food -= tribute
            attacker.data.resources.food += tribute
            tribe.addRelation(attacker.data.config.id, 10)
          }
        }
      ]
    }
  }

  private createAllianceEvent(tribe: Tribe, tribes: Map<number, Tribe>): GameEvent | null {
    const otherTribes = Array.from(tribes.values()).filter(
      t => t.data.config.id !== tribe.data.config.id && t.data.population > 0
    )
    
    if (otherTribes.length === 0) return null

    const potentialAlly = otherTribes[Math.floor(Math.random() * otherTribes.length)]
    const relation = tribe.data.relations.get(potentialAlly.data.config.id) || 0

    if (relation < 20) return null // Слишком плохие отношения для союза

    return {
      id: `event_${++this.eventCounter}`,
      type: EventType.ALLIANCE,
      title: 'Предложение союза',
      description: `Племя "${potentialAlly.data.config.name}" предлагает союз!`,
      tribeId: tribe.data.config.id,
      timestamp: Date.now(),
      priority: 6,
      resolved: false,
      choices: [
        {
          label: 'Принять',
          effect: (_world, _tribesMap) => {
            tribe.addRelation(potentialAlly.data.config.id, 30)
            potentialAlly.addRelation(tribe.data.config.id, 30)
          }
        },
        {
          label: 'Отклонить',
          effect: (_world, _tribesMap) => {
            tribe.addRelation(potentialAlly.data.config.id, -10)
          }
        }
      ]
    }
  }

  private createWarEvent(tribe: Tribe, tribes: Map<number, Tribe>): GameEvent | null {
    const otherTribes = Array.from(tribes.values()).filter(
      t => t.data.config.id !== tribe.data.config.id && t.data.population > 0
    )
    
    if (otherTribes.length === 0) return null

    const enemy = otherTribes[Math.floor(Math.random() * otherTribes.length)]
    const relation = tribe.data.relations.get(enemy.data.config.id) || 0

    if (relation > -70) return null // Слишком хорошие отношения для войны

    return {
      id: `event_${++this.eventCounter}`,
      type: EventType.WAR,
      title: 'Объявлена война!',
      description: `Племя "${enemy.data.config.name}" объявило войну "${tribe.data.config.name}"!`,
      tribeId: tribe.data.config.id,
      timestamp: Date.now(),
      priority: 9,
      resolved: false
    }
  }

  getPendingEvents(): GameEvent[] {
    return this.eventQueue.filter(e => !e.resolved)
  }

  resolveEvent(eventId: string, choiceIndex?: number): void {
    const event = this.eventQueue.find(e => e.id === eventId)
    if (!event || event.resolved) return

    if (choiceIndex !== undefined && event.choices && event.choices[choiceIndex]) {
      // Эффект будет применён в game loop
      event.choices[choiceIndex].effect({} as World, new Map())
    }

    event.resolved = true
  }
}
