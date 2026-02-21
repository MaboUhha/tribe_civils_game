// Точка входа приложения

import { Game, GameSpeed } from './game/state'
import { MapRenderer } from './ui/map'
import { UIManager } from './ui/panels'
import { storage } from './storage/db'
import { ResourceType } from './types'
import { Tribe } from './core/tribe'

class App {
  private game: Game
  private renderer: MapRenderer
  private ui: UIManager
  private lastFrameTime: number = 0
  private animationFrameId: number | null = null

  constructor() {
    this.game = new Game()
    this.renderer = new MapRenderer('gameCanvas')
    this.ui = new UIManager()
    
    this.setupEventListeners()
    this.ui.setOnAction(this.handleAction.bind(this))
  }

  async init(): Promise<void> {
    // Инициализация хранилища
    await storage.init()

    // Инициализация игры
    this.game.init()

    // Загрузка настроек
    const camera = await storage.getSetting('camera', { x: 0, y: 0, zoom: 1 })
    this.game.state.camera = camera

    // Первый рендер
    this.render()
    this.updateUI()

    // Показываем элементы управления скоростью
    this.ui.showSpeedControls()

    console.log('Tribe Civils Game initialized!')
    console.log('Нажмите "Старт" для начала игры')
  }

  private setupEventListeners(): void {
    // Изменение размера окна
    window.addEventListener('resize', () => {
      this.renderer.resize()
      this.render()
    })

    // Управление камерой (WASD или стрелки)
    window.addEventListener('keydown', (e) => {
      const cameraSpeed = 10 / this.game.state.camera.zoom
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.game.state.camera.y = Math.max(0, this.game.state.camera.y - cameraSpeed)
          break
        case 's':
        case 'arrowdown':
          this.game.state.camera.y = Math.min(
            this.game.state.world.height - 50,
            this.game.state.camera.y + cameraSpeed
          )
          break
        case 'a':
        case 'arrowleft':
          this.game.state.camera.x = Math.max(0, this.game.state.camera.x - cameraSpeed)
          break
        case 'd':
        case 'arrowright':
          this.game.state.camera.x = Math.min(
            this.game.state.world.width - 100,
            this.game.state.camera.x + cameraSpeed
          )
          break
        case '+':
        case '=':
          this.game.state.camera.zoom = Math.min(3, this.game.state.camera.zoom + 0.1)
          break
        case '-':
        case '_':
          this.game.state.camera.zoom = Math.max(0.5, this.game.state.camera.zoom - 0.1)
          break
        case ' ':
          this.game.togglePause()
          break
        case 'f':
          this.renderer.setConfig({ showGrid: !this.renderer['config'].showGrid })
          break
        case 'r':
          this.renderer.setConfig({ showResources: !this.renderer['config'].showResources })
          break
      }

      this.render()
      this.saveCameraSettings()
    })

    // Клик по карте для выбора племени
    this.renderer['canvas'].addEventListener('click', (e) => {
      const rect = this.renderer['canvas'].getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top

      const worldPos = this.renderer.screenToWorld(
        screenX,
        screenY,
        this.game.state.camera
      )

      const tile = this.game.state.world.tiles[worldPos.y]?.[worldPos.x]
      if (tile && tile.tribeId !== undefined) {
        this.game.selectTribe(tile.tribeId)
        this.updateUI()
        this.render()
      }
    })

    // Сохранение при закрытии
    window.addEventListener('beforeunload', () => {
      this.saveGame()
    })
  }

  private handleAction(action: string, payload?: any): void {
    switch (action) {
      case 'toggle_pause':
        this.game.togglePause()
        break

      case 'change_speed':
        this.game.setSpeed(payload as GameSpeed)
        break

      case 'save_game':
        this.saveGame()
        break

      case 'load_game':
        this.loadGame()
        break

      case 'move':
        this.game.moveSelectedTribe(payload.x, payload.y)
        this.render()
        this.updateUI()
        break

      case 'settle':
        this.game.settleSelectedTribe()
        this.render()
        this.updateUI()
        break

      case 'gather':
        const tribe = this.game.getSelectedTribe()
        if (tribe) {
          this.game.gatherResources(tribe.data.config.id, payload as ResourceType)
          this.updateUI()
        }
        break

      case 'research':
        const researchingTribe = this.game.getSelectedTribe()
        if (researchingTribe && this.canAffordTech(researchingTribe, payload)) {
          this.researchTech(researchingTribe, payload)
          this.updateUI()
        }
        break
    }

    this.updateUI()
  }

  private canAffordTech(_tribe: Tribe, _techId: string): boolean {
    // Упрощённая проверка - можно расширить
    return true
  }

  private researchTech(_tribe: Tribe, techId: string): void {
    const selectedTribe = this.game.getSelectedTribe()
    if (selectedTribe) {
      selectedTribe.discoverTech(techId)
    }
    // Здесь можно добавить логику затрат ресурсов
  }

  private async saveGame(): Promise<void> {
    try {
      await storage.quickSave(this.game.exportState())
      this.ui.logEvent({
        id: 'save_event',
        type: 'discovery' as any,
        title: 'Игра сохранена',
        description: 'Прогресс успешно сохранён',
        timestamp: Date.now(),
        priority: 5,
        resolved: false
      })
      console.log('Game saved')
    } catch (error) {
      console.error('Failed to save game:', error)
    }
  }

  private async loadGame(): Promise<void> {
    try {
      const state = await storage.getQuickSave()
      if (state) {
        const gameState = this.game.exportState()
        // Восстанавливаем только основные поля
        gameState.world = state.world
        gameState.tribes = state.tribes
        gameState.events = state.events
        gameState.playerTribeId = state.playerTribeId
        gameState.tick = state.tick
        gameState.isPaused = state.isPaused
        gameState.gameSpeed = state.gameSpeed
        this.game.importState(gameState)
        this.render()
        this.updateUI()
        console.log('Game loaded')
      } else {
        console.log('No save found')
      }
    } catch (error) {
      console.error('Failed to load game:', error)
    }
  }

  private async saveCameraSettings(): Promise<void> {
    await storage.setSetting('camera', this.game.state.camera)
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = currentTime - this.lastFrameTime

    if (deltaTime >= 16) { // ~60 FPS
      this.game.update(currentTime)
      this.render()
      this.updateUI()
      this.lastFrameTime = currentTime
    }

    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t))
  }

  private render(): void {
    this.renderer.render(
      this.game.state.world,
      this.game.state.tribes,
      this.game.state.camera,
      this.game.state.selectedTribeId
    )
  }

  private updateUI(): void {
    const playerTribe = this.game.getPlayerTribe()
    const selectedTribe = this.game.getSelectedTribe()

    this.ui.updateTopBar({
      tick: this.game.state.tick,
      population: playerTribe?.data.population || 0,
      tribes: this.game.state.tribes.size,
      isPaused: this.game.state.isPaused,
      gameSpeed: this.game.state.gameSpeed
    })

    this.ui.updateSidePanel(selectedTribe, playerTribe, this.game.getPendingEvents())

    // Логирование новых событий
    const pendingEvents = this.game.getPendingEvents()
    for (const event of pendingEvents) {
      if (!event.resolved) {
        this.ui.logEvent(event)
        event.resolved = true // Чтобы не логировать повторно
      }
    }
  }

  start(): void {
    this.lastFrameTime = performance.now()
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t))
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }
}

// Запуск приложения
const app = new App()
app.init().then(() => {
  app.start()
})
