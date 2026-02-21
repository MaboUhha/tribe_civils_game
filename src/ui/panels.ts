// UI панели и интерфейс

import { Tribe } from '../core/tribe'
import { GameEvent } from '../core/events'
import { ResourceType } from '../types'
import { TECH_TREE } from '../core/tech'

export interface UIPanels {
  topBar: HTMLElement
  sidePanel: HTMLElement
  eventLog: HTMLElement
}

export class UIManager {
  private panels: UIPanels
  private onActionCallback: (action: string, payload?: any) => void = () => {}

  constructor() {
    this.panels = {
      topBar: document.getElementById('topBar') as HTMLElement,
      sidePanel: document.getElementById('sidePanel') as HTMLElement,
      eventLog: document.getElementById('eventLog') as HTMLElement
    }

    this.initStyles()
  }

  private initStyles(): void {
    // Базовые стили
    const style = document.createElement('style')
    style.textContent = `
      #ui {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      
      #topBar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 40px;
        background: rgba(26, 26, 46, 0.9);
        border-bottom: 2px solid #333;
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 24px;
        pointer-events: auto;
        color: #fff;
        font-family: monospace;
        font-size: 14px;
      }
      
      #sidePanel {
        position: absolute;
        top: 40px;
        right: 0;
        width: 280px;
        bottom: 0;
        background: rgba(26, 26, 46, 0.9);
        border-left: 2px solid #333;
        overflow-y: auto;
        pointer-events: auto;
        color: #fff;
        font-family: monospace;
        padding: 12px;
      }
      
      #eventLog {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 280px;
        height: 150px;
        background: rgba(26, 26, 46, 0.8);
        border-top: 2px solid #333;
        overflow-y: auto;
        pointer-events: auto;
        padding: 8px;
        font-family: monospace;
        font-size: 12px;
      }
      
      .stat {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .stat-label {
        color: #888;
      }
      
      .stat-value {
        color: #fff;
        font-weight: bold;
      }
      
      .panel-section {
        margin-bottom: 16px;
        border-bottom: 1px solid #333;
        padding-bottom: 12px;
      }
      
      .panel-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
        color: #4fc3f7;
      }
      
      .tribe-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        font-size: 12px;
      }
      
      .resource-row {
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
      }
      
      .btn {
        background: #333;
        color: #fff;
        border: 1px solid #555;
        padding: 6px 12px;
        cursor: pointer;
        font-family: monospace;
        font-size: 12px;
        margin: 2px;
        transition: background 0.2s;
      }
      
      .btn:hover {
        background: #444;
      }
      
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .btn-primary {
        background: #1976d2;
        border-color: #1565c0;
      }
      
      .btn-primary:hover {
        background: #1565c0;
      }
      
      .btn-danger {
        background: #c62828;
        border-color: #b71c1c;
      }
      
      .btn-danger:hover {
        background: #b71c1c;
      }
      
      .event-item {
        padding: 8px;
        margin: 4px 0;
        background: rgba(51, 51, 51, 0.5);
        border-left: 3px solid #4fc3f7;
      }
      
      .event-item.high-priority {
        border-left-color: #f44336;
      }
      
      .event-title {
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .event-desc {
        font-size: 11px;
        color: #aaa;
      }
      
      .event-choices {
        margin-top: 8px;
        display: flex;
        gap: 8px;
      }
      
      .tech-item {
        padding: 8px;
        margin: 4px 0;
        background: rgba(51, 51, 51, 0.5);
        border-left: 3px solid #888;
        cursor: pointer;
      }
      
      .tech-item.available {
        border-left-color: #4caf50;
      }
      
      .tech-item.researched {
        border-left-color: #2196f3;
        opacity: 0.7;
      }
      
      .tech-name {
        font-weight: bold;
        font-size: 13px;
      }
      
      .tech-cost {
        font-size: 11px;
        color: #aaa;
      }
      
      .control-row {
        display: flex;
        gap: 4px;
        margin: 4px 0;
        flex-wrap: wrap;
      }
      
      .speed-indicator {
        padding: 4px 8px;
        background: #333;
        border-radius: 4px;
        font-size: 12px;
      }
      
      .speed-indicator.active {
        background: #1976d2;
      }
    `
    document.head.appendChild(style)
  }

  setOnAction(callback: (action: string, payload?: any) => void): void {
    this.onActionCallback = callback
  }

  updateTopBar(gameState: {
    tick: number
    population: number
    tribes: number
    isPaused: boolean
    gameSpeed: number
  }): void {
    const speedLabels = ['Пауза', '1x', '2x', '3x']
    
    this.panels.topBar.innerHTML = `
      <div class="stat">
        <span class="stat-label">Тик:</span>
        <span class="stat-value">${gameState.tick}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Население:</span>
        <span class="stat-value">${gameState.population}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Племён:</span>
        <span class="stat-value">${gameState.tribes}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Скорость:</span>
        <span class="speed-indicator ${gameState.isPaused ? '' : 'active'}">${speedLabels[gameState.gameSpeed]}</span>
      </div>
      <div style="flex-grow: 1"></div>
      <button class="btn" id="btnPause">${gameState.isPaused ? '▶ Старт' : '⏸ Пауза'}</button>
      <button class="btn" id="btnSave">💾 Сохранить</button>
      <button class="btn" id="btnLoad">📂 Загрузить</button>
    `

    this.panels.topBar.querySelector('#btnPause')?.addEventListener('click', () => {
      this.onActionCallback('toggle_pause')
    })
    this.panels.topBar.querySelector('#btnSave')?.addEventListener('click', () => {
      this.onActionCallback('save_game')
    })
    this.panels.topBar.querySelector('#btnLoad')?.addEventListener('click', () => {
      this.onActionCallback('load_game')
    })
  }

  updateSidePanel(
    selectedTribe: Tribe | null,
    playerTribe: Tribe | null,
    events: GameEvent[]
  ): void {
    if (selectedTribe) {
      this.renderTribePanel(selectedTribe)
    } else {
      this.renderWorldPanel(playerTribe, events)
    }
  }

  private renderTribePanel(tribe: Tribe): void {
    const resources = tribe.data.resources
    const isPlayer = tribe.data.config.isPlayer

    this.panels.sidePanel.innerHTML = `
      <div class="panel-section">
        <div class="panel-title">${tribe.data.config.name}</div>
        <div class="tribe-info">
          <div>Население:</div><div>${tribe.data.population}</div>
          <div>Состояние:</div><div>${tribe.data.state}</div>
          <div>Позиция:</div><div>[${tribe.data.position.x}, ${tribe.data.position.y}]</div>
        </div>
      </div>
      
      <div class="panel-section">
        <div class="panel-title">Ресурсы</div>
        <div class="resource-row"><span>🍖 Еда:</span><span>${resources.food}</span></div>
        <div class="resource-row"><span>🪵 Дерево:</span><span>${resources.wood}</span></div>
        <div class="resource-row"><span>🪨 Камень:</span><span>${resources.stone}</span></div>
        <div class="resource-row"><span>⚙️ Металл:</span><span>${resources.metal}</span></div>
      </div>
      
      ${isPlayer ? `
      <div class="panel-section">
        <div class="panel-title">Действия</div>
        <div class="control-row">
          <button class="btn" id="btnUp">↑</button>
        </div>
        <div class="control-row">
          <button class="btn" id="btnLeft">←</button>
          <button class="btn" id="btnDown">↓</button>
          <button class="btn" id="btnRight">→</button>
        </div>
        <div class="control-row" style="margin-top: 8px">
          <button class="btn btn-primary" id="btnSettle" ${tribe.data.state !== 'nomadic' || tribe.data.population < 30 ? 'disabled' : ''}>🏠 Основать поселение</button>
        </div>
        <div class="control-row">
          <button class="btn" id="btnGather">🔨 Собирать ресурсы</button>
        </div>
      </div>
      
      <div class="panel-section">
        <div class="panel-title">Технологии</div>
        ${this.renderTechList(tribe)}
      </div>
      ` : ''}
      
      <div class="panel-section">
        <div class="panel-title">Отношения</div>
        ${this.renderRelations(tribe)}
      </div>
    `

    if (isPlayer) {
      this.attachTribePanelListeners(tribe)
    }
  }

  private renderTechList(tribe: Tribe): string {
    const availableTechs = Object.values(TECH_TREE).filter(tech => {
      const hasPrereqs = tech.prerequisites.every(p => tribe.hasTech(p))
      const notResearched = !tribe.hasTech(tech.id)
      return hasPrereqs && notResearched
    })

    const researchedTechs = Object.values(TECH_TREE).filter(tech => tribe.hasTech(tech.id))

    let html = ''

    if (researchedTechs.length > 0) {
      html += '<div style="margin-bottom: 8px; font-size: 11px; color: #888;">Изучено:</div>'
      for (const tech of researchedTechs) {
        html += `
          <div class="tech-item researched">
            <div class="tech-name">✓ ${tech.name}</div>
          </div>
        `
      }
    }

    if (availableTechs.length > 0) {
      html += '<div style="margin-bottom: 8px; font-size: 11px; color: #888;">Доступно:</div>'
      for (const tech of availableTechs) {
        const costParts = []
        if (tech.cost.food) costParts.push(`🍖${tech.cost.food}`)
        if (tech.cost.wood) costParts.push(`🪵${tech.cost.wood}`)
        if (tech.cost.stone) costParts.push(`🪨${tech.cost.stone}`)
        if (tech.cost.metal) costParts.push(`⚙️${tech.cost.metal}`)

        html += `
          <div class="tech-item available" data-tech="${tech.id}">
            <div class="tech-name">${tech.name}</div>
            <div class="tech-cost">${costParts.join(' ') || 'Бесплатно'}</div>
          </div>
        `
      }
    }

    if (availableTechs.length === 0 && researchedTechs.length === 0) {
      html += '<div style="color: #666; font-size: 12px;">Нет доступных технологий</div>'
    }

    return html
  }

  private renderRelations(_tribe: Tribe): string {
    return '<div style="color: #666; font-size: 12px;">Нет данных об отношениях</div>'
  }

  private renderWorldPanel(playerTribe: Tribe | null, events: GameEvent[]): void {
    const pendingEvents = events.filter(e => !e.resolved)

    this.panels.sidePanel.innerHTML = `
      <div class="panel-section">
        <div class="panel-title">Мир</div>
        <div style="color: #888; font-size: 12px;">
          Выберите племя для управления или наблюдайте за миром.
        </div>
      </div>
      
      ${playerTribe ? `
      <div class="panel-section">
        <div class="panel-title">Ваше племя</div>
        <div class="tribe-info">
          <div>Название:</div><div>${playerTribe.data.config.name}</div>
          <div>Население:</div><div>${playerTribe.data.population}</div>
          <div>Позиция:</div><div>[${playerTribe.data.position.x}, ${playerTribe.data.position.y}]</div>
        </div>
      </div>
      ` : ''}
      
      <div class="panel-section">
        <div class="panel-title">События (${pendingEvents.length})</div>
        ${pendingEvents.length > 0 ? pendingEvents.slice(0, 5).map(e => `
          <div class="event-item ${e.priority > 7 ? 'high-priority' : ''}">
            <div class="event-title">${e.title}</div>
            <div class="event-desc">${e.description}</div>
          </div>
        `).join('') : '<div style="color: #666; font-size: 12px;">Нет активных событий</div>'}
      </div>
    `
  }

  private attachTribePanelListeners(_tribe: Tribe): void {
    // Управление движением
    this.panels.sidePanel.querySelector('#btnUp')?.addEventListener('click', () => {
      this.onActionCallback('move', { x: 0, y: -1 })
    })
    this.panels.sidePanel.querySelector('#btnDown')?.addEventListener('click', () => {
      this.onActionCallback('move', { x: 0, y: 1 })
    })
    this.panels.sidePanel.querySelector('#btnLeft')?.addEventListener('click', () => {
      this.onActionCallback('move', { x: -1, y: 0 })
    })
    this.panels.sidePanel.querySelector('#btnRight')?.addEventListener('click', () => {
      this.onActionCallback('move', { x: 1, y: 0 })
    })

    // Основать поселение
    this.panels.sidePanel.querySelector('#btnSettle')?.addEventListener('click', () => {
      this.onActionCallback('settle')
    })

    // Сбор ресурсов
    this.panels.sidePanel.querySelector('#btnGather')?.addEventListener('click', () => {
      this.onActionCallback('gather', ResourceType.FOOD)
    })

    // Технологии
    this.panels.sidePanel.querySelectorAll('.tech-item.available').forEach(el => {
      el.addEventListener('click', () => {
        const techId = el.getAttribute('data-tech')
        if (techId) {
          this.onActionCallback('research', techId)
        }
      })
    })
  }

  logEvent(event: GameEvent): void {
    const item = document.createElement('div')
    item.className = `event-item ${event.priority > 7 ? 'high-priority' : ''}`
    item.innerHTML = `
      <div class="event-title">[${new Date(event.timestamp).toLocaleTimeString()}] ${event.title}</div>
      <div class="event-desc">${event.description}</div>
    `

    this.panels.eventLog.insertBefore(item, this.panels.eventLog.firstChild)

    // Ограничение истории
    while (this.panels.eventLog.children.length > 50) {
      this.panels.eventLog.removeChild(this.panels.eventLog.lastChild!)
    }
  }

  clearEventLog(): void {
    this.panels.eventLog.innerHTML = ''
  }

  showSpeedControls(): void {
    const speedContainer = document.createElement('div')
    speedContainer.style.cssText = 'display: flex; gap: 4px;'
    speedContainer.innerHTML = `
      <button class="btn speed-indicator" data-speed="0">⏸</button>
      <button class="btn speed-indicator" data-speed="1">1x</button>
      <button class="btn speed-indicator" data-speed="2">2x</button>
      <button class="btn speed-indicator" data-speed="3">3x</button>
    `

    speedContainer.querySelectorAll('.speed-indicator').forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseInt(btn.getAttribute('data-speed') || '1')
        this.onActionCallback('change_speed', speed)
      })
    })

    this.panels.topBar.appendChild(speedContainer)
  }
}
