# SPEC-010: Стартовый экран игры

## Описание

Проектирование и реализация стартового экрана игры с главным меню, настройками и информацией об игре.

## Проблема

В проекте отсутствует стартовый экран, что приводит к:
- Мгновенному запуску игры без возможности настройки
- Отсутствию главного меню для навигации
- Невозможности просмотра настроек перед началом игры
- Отсутствию информации об игре и управления звуком
- Неясности для новых игроков как начать игру

## Решение

Создать стартовый экран с главным меню, настройками, информацией об игре и управлением звуком.

### Концепция стартового экрана

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    TRIBE CIVILS GAME                    │
│              Симулятор племён глубокой древности        │
│                                                         │
│                    ┌─────────────┐                      │
│                    │  НОВАЯ ИГРА │                      │
│                    └─────────────┘                      │
│                    ┌─────────────┐                      │
│                    │  ЗАГРУЗИТЬ  │                      │
│                    └─────────────┘                      │
│                    ┌─────────────┐                      │
│                    │  НАСТРОЙКИ  │                      │
│                    └─────────────┘                      │
│                    ┌─────────────┐                      │
│                    │  ОБ ИГРЕ    │                      │
│                    └─────────────┘                      │
│                                                         │
│              v0.1.0 | © 2026 Tribe Civils Game         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Файлы для создания

### `src/ui/screens/start-screen.ts`

Компонент стартового экрана:

```typescript
import { GameSettings } from '../../types'

export interface StartScreenOptions {
  onNewGame: () => void
  onLoadGame: () => void
  onSettings: () => void
  onAbout: () => void
}

export class StartScreen {
  private container: HTMLElement | null = null
  private options: StartScreenOptions
  
  constructor(options: StartScreenOptions) {
    this.options = options
  }
  
  /**
   * Создаёт и отображает стартовый экран
   */
  show(): void {
    this.container = document.createElement('div')
    this.container.className = 'start-screen'
    this.container.innerHTML = this.render()
    
    document.body.appendChild(this.container)
    this.attachEventListeners()
  }
  
  /**
   * Скрывает стартовый экран
   */
  hide(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }
  
  /**
   * Рендерит HTML стартового экрана
   */
  private render(): string {
    return `
      <div class="start-screen__background"></div>
      
      <div class="start-screen__content">
        <header class="start-screen__header">
          <h1 class="start-screen__title">TRIBE CIVILS GAME</h1>
          <p class="start-screen__subtitle">
            Симулятор племён глубокой древности
          </p>
          <p class="start-screen__tagline">
            Dwarf Fortress × WorldBox × Civilization
          </p>
        </header>
        
        <nav class="start-screen__menu">
          <button class="start-screen__button" data-action="new-game">
            <span class="start-screen__button-icon">🎮</span>
            <span class="start-screen__button-text">Новая игра</span>
          </button>
          
          <button class="start-screen__button" data-action="load-game">
            <span class="start-screen__button-icon">📁</span>
            <span class="start-screen__button-text">Загрузить</span>
          </button>
          
          <button class="start-screen__button" data-action="settings">
            <span class="start-screen__button-icon">⚙️</span>
            <span class="start-screen__button-text">Настройки</span>
          </button>
          
          <button class="start-screen__button" data-action="about">
            <span class="start-screen__button-icon">ℹ️</span>
            <span class="start-screen__button-text">Об игре</span>
          </button>
        </nav>
        
        <footer class="start-screen__footer">
          <p class="start-screen__version">Версия 0.1.0</p>
          <p class="start-screen__copyright">© 2026 Tribe Civils Game</p>
        </footer>
      </div>
    `
  }
  
  /**
   * Навешивает обработчики событий
   */
  private attachEventListeners(): void {
    if (!this.container) return
    
    const buttons = this.container.querySelectorAll('[data-action]')
    
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action
        
        switch (action) {
          case 'new-game':
            this.options.onNewGame()
            break
          case 'load-game':
            this.options.onLoadGame()
            break
          case 'settings':
            this.options.onSettings()
            break
          case 'about':
            this.options.onAbout()
            break
        }
      })
    })
    
    // Обработка клавиши Enter для навигации
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement
        if (target.tagName === 'BUTTON') {
          target.click()
        }
      }
    })
  }
}
```

### `src/ui/screens/settings-screen.ts`

Компонент экрана настроек:

```typescript
import { GameSettings } from '../../types'

export interface SettingsScreenOptions {
  settings: GameSettings
  onSave: (settings: GameSettings) => void
  onBack: () => void
}

export class SettingsScreen {
  private container: HTMLElement | null = null
  private options: SettingsScreenOptions
  private currentSettings: GameSettings
  
  constructor(options: SettingsScreenOptions) {
    this.options = options
    this.currentSettings = { ...options.settings }
  }
  
  show(): void {
    this.container = document.createElement('div')
    this.container.className = 'settings-screen'
    this.container.innerHTML = this.render()
    
    document.body.appendChild(this.container)
    this.attachEventListeners()
    this.loadCurrentSettings()
  }
  
  hide(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }
  
  private render(): string {
    return `
      <div class="settings-screen__background"></div>
      
      <div class="settings-screen__content">
        <header class="settings-screen__header">
          <h2 class="settings-screen__title">Настройки</h2>
          <button class="settings-screen__close" data-action="back">
            ✕
          </button>
        </header>
        
        <div class="settings-screen__sections">
          <!-- Звук -->
          <section class="settings-screen__section">
            <h3 class="settings-screen__section-title">🔊 Звук</h3>
            
            <div class="settings-screen__setting">
              <label class="settings-screen__label">
                <span class="settings-screen__label-text">
                  Общая громкость
                </span>
                <input 
                  type="range" 
                  class="settings-screen__slider"
                  data-setting="masterVolume"
                  min="0" 
                  max="100" 
                  value="${this.currentSettings.masterVolume ?? 50}"
                />
                <span class="settings-screen__value" data-setting="masterVolume">
                  ${this.currentSettings.masterVolume ?? 50}%
                </span>
              </label>
            </div>
            
            <div class="settings-screen__setting">
              <label class="settings-screen__label">
                <span class="settings-screen__label-text">
                  Музыка
                </span>
                <input 
                  type="range" 
                  class="settings-screen__slider"
                  data-setting="musicVolume"
                  min="0" 
                  max="100" 
                  value="${this.currentSettings.musicVolume ?? 30}"
                />
                <span class="settings-screen__value" data-setting="musicVolume">
                  ${this.currentSettings.musicVolume ?? 30}%
                </span>
              </label>
            </div>
            
            <div class="settings-screen__setting">
              <label class="settings-screen__label">
                <span class="settings-screen__label-text">
                  Звуковые эффекты
                </span>
                <input 
                  type="range" 
                  class="settings-screen__slider"
                  data-setting="sfxVolume"
                  min="0" 
                  max="100" 
                  value="${this.currentSettings.sfxVolume ?? 50}"
                />
                <span class="settings-screen__value" data-setting="sfxVolume">
                  ${this.currentSettings.sfxVolume ?? 50}%
                </span>
              </label>
            </div>
          </section>
          
          <!-- Графика -->
          <section class="settings-screen__section">
            <h3 class="settings-screen__section-title">🎨 Графика</h3>
            
            <div class="settings-screen__setting">
              <label class="settings-screen__label">
                <span class="settings-screen__label-text">
                  Размер тайла
                </span>
                <select 
                  class="settings-screen__select"
                  data-setting="tileSize"
                >
                  <option value="12" ${this.currentSettings.tileSize === 12 ? 'selected' : ''}>
                    Маленький (12px)
                  </option>
                  <option value="16" ${this.currentSettings.tileSize === 16 || !this.currentSettings.tileSize ? 'selected' : ''}>
                    Средний (16px)
                  </option>
                  <option value="20" ${this.currentSettings.tileSize === 20 ? 'selected' : ''}>
                    Большой (20px)
                  </option>
                  <option value="24" ${this.currentSettings.tileSize === 24 ? 'selected' : ''}>
                    Огромный (24px)
                  </option>
                </select>
              </label>
            </div>
            
            <div class="settings-screen__setting">
              <label class="settings-screen__label">
                <span class="settings-screen__label-text">
                  Показывать сетку
                </span>
                <input 
                  type="checkbox" 
                  class="settings-screen__checkbox"
                  data-setting="showGrid"
                  ${this.currentSettings.showGrid ? 'checked' : ''}
                />
              </label>
            </div>
            
            <div class="settings-screen__setting">
              <label class="settings-screen__label">
                <span class="settings-screen__label-text">
                  Показывать ресурсы
                </span>
                <input 
                  type="checkbox" 
                  class="settings-screen__checkbox"
                  data-setting="showResources"
                  ${this.currentSettings.showResources ? 'checked' : ''}
                />
              </label>
            </div>
          </section>
          
          <!-- Игра -->
          <section class="settings-screen__section">
            <h3 class="settings-screen__section-title">🎮 Игра</h3>
            
            <div class="settings-screen__setting">
              <label class="settings-screen__label">
                <span class="settings-screen__label-text">
                  Автосохранение
                </span>
                <input 
                  type="checkbox" 
                  class="settings-screen__checkbox"
                  data-setting="autoSave"
                  ${this.currentSettings.autoSave !== false ? 'checked' : ''}
                />
              </label>
            </div>
            
            <div class="settings-screen__setting">
              <label class="settings-screen__label">
                <span class="settings-screen__label-text">
                  Интервал автосохранения (тиков)
                </span>
                <input 
                  type="number" 
                  class="settings-screen__input"
                  data-setting="autoSaveInterval"
                  min="50" 
                  max="1000" 
                  step="50"
                  value="${this.currentSettings.autoSaveInterval ?? 100}"
                />
              </label>
            </div>
          </section>
        </div>
        
        <footer class="settings-screen__footer">
          <button class="settings-screen__button settings-screen__button--secondary" data-action="back">
            Отмена
          </button>
          <button class="settings-screen__button settings-screen__button--primary" data-action="save">
            Сохранить
          </button>
        </footer>
      </div>
    `
  }
  
  private attachEventListeners(): void {
    if (!this.container) return
    
    // Слайдеры
    const sliders = this.container.querySelectorAll('[type="range"]')
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement
        const setting = target.dataset.setting
        const value = parseInt(target.value, 10)
        
        if (setting && this.currentSettings[setting] !== undefined) {
          this.currentSettings[setting] = value
          
          // Обновить отображение значения
          const valueDisplay = this.container.querySelector(
            `[data-setting="${setting}"].settings-screen__value`
          )
          if (valueDisplay) {
            valueDisplay.textContent = `${value}%`
          }
        }
      })
    })
    
    // Select
    const selects = this.container.querySelectorAll('select')
    selects.forEach(select => {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement
        const setting = target.dataset.setting
        const value = target.value
        
        if (setting && this.currentSettings[setting] !== undefined) {
          this.currentSettings[setting] = parseInt(value, 10)
        }
      })
    })
    
    // Checkbox
    const checkboxes = this.container.querySelectorAll('[type="checkbox"]')
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        const setting = target.dataset.setting
        
        if (setting && this.currentSettings[setting] !== undefined) {
          this.currentSettings[setting] = target.checked
        }
      })
    })
    
    // Number input
    const numberInputs = this.container.querySelectorAll('[type="number"]')
    numberInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        const setting = target.dataset.setting
        const value = parseInt(target.value, 10)
        
        if (setting && this.currentSettings[setting] !== undefined) {
          this.currentSettings[setting] = value
        }
      })
    })
    
    // Кнопки
    const buttons = this.container.querySelectorAll('[data-action]')
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action
        
        switch (action) {
          case 'save':
            this.options.onSave(this.currentSettings)
            this.hide()
            break
          case 'back':
            this.hide()
            this.options.onBack()
            break
        }
      })
    })
  }
  
  private loadCurrentSettings(): void {
    if (!this.container) return
    
    // Заполнить текущие значения
    Object.entries(this.currentSettings).forEach(([key, value]) => {
      const element = this.container.querySelector(`[data-setting="${key}"]`)
      if (element) {
        if (element instanceof HTMLInputElement) {
          if (element.type === 'checkbox') {
            element.checked = value as boolean
          } else if (element.type === 'range' || element.type === 'number') {
            element.value = String(value)
          }
        } else if (element instanceof HTMLSelectElement) {
          element.value = String(value)
        }
      }
    })
  }
}
```

### `src/ui/screens/about-screen.ts`

Компонент экрана "Об игре":

```typescript
export interface AboutScreenOptions {
  onBack: () => void
}

export class AboutScreen {
  private container: HTMLElement | null = null
  private options: AboutScreenOptions
  
  constructor(options: AboutScreenOptions) {
    this.options = options
  }
  
  show(): void {
    this.container = document.createElement('div')
    this.container.className = 'about-screen'
    this.container.innerHTML = this.render()
    
    document.body.appendChild(this.container)
    this.attachEventListeners()
  }
  
  hide(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }
  
  private render(): string {
    return `
      <div class="about-screen__background"></div>
      
      <div class="about-screen__content">
        <header class="about-screen__header">
          <h2 class="about-screen__title">Об игре</h2>
          <button class="about-screen__close" data-action="back">
            ✕
          </button>
        </header>
        
        <div class="about-screen__body">
          <section class="about-screen__section">
            <h3 class="about-screen__section-title">
              🏛️ Tribe Civils Game
            </h3>
            <p class="about-screen__description">
              Симулятор племён глубокой древности — гибрид 
              <strong>Dwarf Fortress</strong> × <strong>WorldBox</strong> × <strong>Civilization</strong>
            </p>
          </section>
          
          <section class="about-screen__section">
            <h3 class="about-screen__section-title">
              📖 Описание
            </h3>
            <p class="about-screen__text">
              Начните с небольшим племенем в процедурно сгенерированном мире 
              глубокой древности. Наблюдайте за ростом населения, освоением 
              технологий и расширением территории. Превратите кочевое племя 
              в прото-государство!
            </p>
          </section>
          
          <section class="about-screen__section">
            <h3 class="about-screen__section-title">
              🎮 Особенности
            </h3>
            <ul class="about-screen__features">
              <li>Процедурная генерация мира (Perlin-шум)</li>
              <li>До 500 племён с уникальным ИИ</li>
              <li>Дерево технологий (3 эпохи, 13 технологий)</li>
              <li>Динамические события (рейды, союзы, катастрофы)</li>
              <li>Система отношений между племенами</li>
              <li>PWA с оффлайн-режимом</li>
            </ul>
          </section>
          
          <section class="about-screen__section">
            <h3 class="about-screen__section-title">
              ⌨️ Управление
            </h3>
            <table class="about-screen__controls">
              <tr>
                <td><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></td>
                <td>Перемещение камеры</td>
              </tr>
              <tr>
                <td><kbd>+</kbd> <kbd>-</kbd></td>
                <td>Зум камеры</td>
              </tr>
              <tr>
                <td><kbd>Пробел</kbd></td>
                <td>Пауза / Старт</td>
              </tr>
              <tr>
                <td><kbd>F</kbd></td>
                <td>Показать сетку</td>
              </tr>
              <tr>
                <td><kbd>R</kbd></td>
                <td>Показать ресурсы</td>
              </tr>
              <tr>
                <td>Клик мыши</td>
                <td>Выбрать племя</td>
              </tr>
            </table>
          </section>
          
          <section class="about-screen__section">
            <h3 class="about-screen__section-title">
              🛠️ Технологии
            </h3>
            <ul class="about-screen__tech">
              <li>TypeScript 5.6</li>
              <li>Vite 6.0</li>
              <li>Canvas API</li>
              <li>IndexedDB</li>
              <li>PWA (Workbox)</li>
            </ul>
          </section>
          
          <section class="about-screen__section">
            <h3 class="about-screen__section-title">
              📄 Лицензия
            </h3>
            <p class="about-screen__license">
              MIT License
            </p>
          </section>
        </div>
        
        <footer class="about-screen__footer">
          <p class="about-screen__version">Версия 0.1.0</p>
          <p class="about-screen__copyright">© 2026 Tribe Civils Game</p>
          <button class="about-screen__button" data-action="back">
            Закрыть
          </button>
        </footer>
      </div>
    `
  }
  
  private attachEventListeners(): void {
    if (!this.container) return
    
    const closeButton = this.container.querySelector('[data-action="back"]')
    closeButton?.addEventListener('click', () => {
      this.hide()
      this.options.onBack()
    })
    
    // Закрытие по Escape
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide()
        this.options.onBack()
      }
    })
  }
}
```

### `src/types.ts` (обновление)

Добавить типы для настроек:

```typescript
// Добавить в конец файла

/**
 * Настройки игры
 */
export interface GameSettings {
  /** Общая громкость (0-100) */
  masterVolume?: number
  
  /** Громкость музыки (0-100) */
  musicVolume?: number
  
  /** Громкость звуковых эффектов (0-100) */
  sfxVolume?: number
  
  /** Размер тайла в пикселях */
  tileSize?: number
  
  /** Показывать сетку */
  showGrid?: boolean
  
  /** Показывать ресурсы */
  showResources?: boolean
  
  /** Автосохранение включено */
  autoSave?: boolean
  
  /** Интервал автосохранения в тиках */
  autoSaveInterval?: number
}

/**
 * Состояние стартового экрана
 */
export enum StartScreenState {
  HIDDEN = 'hidden',
  MAIN_MENU = 'main_menu',
  SETTINGS = 'settings',
  ABOUT = 'about'
}
```

### `src/ui/screens/_index.ts`

Экспорт компонентов экранов:

```typescript
export * from './start-screen'
export * from './settings-screen'
export * from './about-screen'
```

---

## Файлы для обновления

### `src/main.ts`

Интеграция стартового экрана в приложение:

```typescript
// Точка входа приложения

import { Game, GameSpeed } from './game/state'
import { MapRenderer } from './ui/map'
import { UIManager } from './ui/panels'
import { storage } from './storage/db'
import { ResourceType, GameSettings } from './types'
import { Tribe } from './core/tribe'
import { StartScreen, SettingsScreen, AboutScreen } from './ui/screens'

class App {
  private game: Game
  private renderer: MapRenderer
  private ui: UIManager
  private lastFrameTime: number = 0
  private animationFrameId: number | null = null
  
  // Экраны
  private startScreen: StartScreen | null = null
  private settingsScreen: SettingsScreen | null = null
  private aboutScreen: AboutScreen | null = null
  
  // Настройки
  private settings: GameSettings = {}
  
  // Состояние
  private isGameStarted: boolean = false

  constructor() {
    this.game = new Game()
    this.renderer = new MapRenderer('gameCanvas')
    this.ui = new UIManager()

    this.setupScreens()
    this.setupEventListeners()
    this.ui.setOnAction(this.handleAction.bind(this))
  }
  
  /**
   * Создаёт экраны
   */
  private setupScreens(): void {
    this.startScreen = new StartScreen({
      onNewGame: () => this.startNewGame(),
      onLoadGame: () => this.loadGame(),
      onSettings: () => this.showSettings(),
      onAbout: () => this.showAbout()
    })
    
    this.settingsScreen = new SettingsScreen({
      settings: this.settings,
      onSave: (settings) => this.saveSettings(settings),
      onBack: () => this.showStartScreen()
    })
    
    this.aboutScreen = new AboutScreen({
      onBack: () => this.showStartScreen()
    })
  }

  async init(): Promise<void> {
    // Инициализация хранилища
    await storage.init()

    // Загрузка настроек
    this.settings = await storage.getSetting('settings', {})
    
    // Применение настроек
    this.applySettings()

    // Показываем стартовый экран
    this.showStartScreen()

    console.log('Tribe Civils Game initialized!')
    console.log('Нажмите "Новая игра" для начала игры')
  }
  
  /**
   * Показывает стартовый экран
   */
  private showStartScreen(): void {
    this.startScreen?.show()
    this.settingsScreen?.hide()
    this.aboutScreen?.hide()
  }
  
  /**
   * Показывает экран настроек
   */
  private showSettings(): void {
    this.startScreen?.hide()
    this.settingsScreen?.show()
  }
  
  /**
   * Показывает экран "Об игре"
   */
  private showAbout(): void {
    this.startScreen?.hide()
    this.aboutScreen?.show()
  }
  
  /**
   * Запускает новую игру
   */
  private startNewGame(): void {
    this.startScreen?.hide()
    this.isGameStarted = true
    
    // Инициализация игры
    this.game.init()
    
    // Применение настроек камеры
    this.game.state.camera = {
      x: 0,
      y: 0,
      zoom: 1
    }
    
    // Запуск игрового цикла
    this.start()
    
    console.log('Новая игра началась!')
  }
  
  /**
   * Загружает сохранение
   */
  private async loadGame(): Promise<void> {
    try {
      const state = await storage.getQuickSave()
      if (state) {
        const gameState = this.game.exportState()
        gameState.world = state.world
        gameState.tribes = state.tribes
        gameState.events = state.events
        gameState.playerTribeId = state.playerTribeId
        gameState.tick = state.tick
        gameState.isPaused = state.isPaused
        gameState.gameSpeed = state.gameSpeed
        this.game.importState(gameState)
        
        this.startScreen?.hide()
        this.isGameStarted = true
        this.start()
        
        console.log('Игра загружена')
      } else {
        console.log('Нет сохранений')
        // Показать сообщение игроку
      }
    } catch (error) {
      console.error('Failed to load game:', error)
    }
  }
  
  /**
   * Сохраняет настройки
   */
  private async saveSettings(settings: GameSettings): Promise<void> {
    this.settings = settings
    await storage.setSetting('settings', settings)
    this.applySettings()
    console.log('Настройки сохранены')
  }
  
  /**
   * Применяет настройки
   */
  private applySettings(): void {
    // Применить размер тайла
    if (this.settings.tileSize) {
      this.renderer.setConfig({
        tileSize: this.settings.tileSize
      })
    }
    
    // Применить отображение сетки
    if (this.settings.showGrid !== undefined) {
      this.renderer.setConfig({
        showGrid: this.settings.showGrid
      })
    }
    
    // Применить отображение ресурсов
    if (this.settings.showResources !== undefined) {
      this.renderer.setConfig({
        showResources: this.settings.showResources
      })
    }
    
    // Применить громкость (когда будет аудио система)
    // this.audio.setMasterVolume(this.settings.masterVolume ?? 50)
  }

  // ... остальные методы без изменений ...
}

// Запуск приложения
const app = new App()
app.init().then(() => {
  // Игра начинается со стартового экрана
})
```

### `src/styles/screens.css` (новый файл)

Стили для экранов:

```css
/* ============================================
   Стартовый экран
   ============================================ */

.start-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  z-index: 1000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.start-screen__background {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.start-screen__content {
  position: relative;
  text-align: center;
  padding: 2rem;
  max-width: 600px;
}

.start-screen__header {
  margin-bottom: 3rem;
}

.start-screen__title {
  font-size: 3rem;
  font-weight: 700;
  color: #e94560;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  text-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
}

.start-screen__subtitle {
  font-size: 1.2rem;
  color: #a0a0a0;
  margin: 0 0 0.5rem 0;
}

.start-screen__tagline {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  font-style: italic;
}

.start-screen__menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 3rem;
}

.start-screen__button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
  border: 2px solid #e94560;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 300px;
}

.start-screen__button:hover {
  background: linear-gradient(135deg, #e94560 0%, #c73e54 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(233, 69, 96, 0.3);
}

.start-screen__button:active {
  transform: translateY(0);
}

.start-screen__button-icon {
  font-size: 1.5rem;
}

.start-screen__footer {
  display: flex;
  justify-content: center;
  gap: 2rem;
  color: #666;
  font-size: 0.9rem;
}

.start-screen__version,
.start-screen__copyright {
  margin: 0;
}

/* ============================================
   Экран настроек
   ============================================ */

.settings-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.settings-screen__content {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #e94560;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.settings-screen__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-screen__title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #e94560;
  margin: 0;
}

.settings-screen__close {
  width: 32px;
  height: 32px;
  font-size: 1.5rem;
  color: #a0a0a0;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.3s ease;
}

.settings-screen__close:hover {
  color: #e94560;
}

.settings-screen__sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
}

.settings-screen__section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
}

.settings-screen__section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1rem 0;
}

.settings-screen__setting {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.settings-screen__setting:last-child {
  margin-bottom: 0;
}

.settings-screen__label {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  color: #a0a0a0;
}

.settings-screen__label-text {
  flex: 1;
  font-size: 1rem;
}

.settings-screen__slider {
  width: 150px;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
}

.settings-screen__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #e94560;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.settings-screen__slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.settings-screen__value {
  min-width: 40px;
  text-align: right;
  color: #e94560;
  font-weight: 600;
}

.settings-screen__select,
.settings-screen__input {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  outline: none;
}

.settings-screen__select:focus,
.settings-screen__input:focus {
  border-color: #e94560;
}

.settings-screen__checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.settings-screen__footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-screen__button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.settings-screen__button--primary {
  color: #ffffff;
  background: #e94560;
  border: none;
}

.settings-screen__button--primary:hover {
  background: #c73e54;
}

.settings-screen__button--secondary {
  color: #a0a0a0;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.settings-screen__button--secondary:hover {
  border-color: #e94560;
  color: #e94560;
}

/* ============================================
   Экран "Об игре"
   ============================================ */

.about-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.about-screen__content {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #e94560;
  border-radius: 12px;
  padding: 2rem;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.about-screen__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.about-screen__title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #e94560;
  margin: 0;
}

.about-screen__close {
  width: 32px;
  height: 32px;
  font-size: 1.5rem;
  color: #a0a0a0;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.3s ease;
}

.about-screen__close:hover {
  color: #e94560;
}

.about-screen__body {
  margin-bottom: 2rem;
}

.about-screen__section {
  margin-bottom: 2rem;
}

.about-screen__section:last-child {
  margin-bottom: 0;
}

.about-screen__section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #e94560;
  margin: 0 0 1rem 0;
}

.about-screen__description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #a0a0a0;
}

.about-screen__text {
  font-size: 1rem;
  line-height: 1.8;
  color: #a0a0a0;
}

.about-screen__features,
.about-screen__tech {
  list-style: none;
  padding: 0;
  margin: 0;
}

.about-screen__features li,
.about-screen__tech li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #a0a0a0;
}

.about-screen__features li::before,
.about-screen__tech li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #e94560;
  font-weight: 700;
}

.about-screen__controls {
  width: 100%;
  border-collapse: collapse;
}

.about-screen__controls td {
  padding: 0.5rem 1rem;
  color: #a0a0a0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.about-screen__controls td:first-child {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #e94560;
  white-space: nowrap;
}

.about-screen__controls tr:last-child td {
  border-bottom: none;
}

kbd {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  font-size: 0.85rem;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.about-screen__license {
  font-size: 1rem;
  color: #a0a0a0;
  margin: 0;
}

.about-screen__footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #666;
}

.about-screen__version,
.about-screen__copyright {
  margin: 0;
  font-size: 0.9rem;
}

.about-screen__button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background: #e94560;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.about-screen__button:hover {
  background: #c73e54;
}

/* ============================================
   Адаптивность
   ============================================ */

@media (max-width: 768px) {
  .start-screen__title {
    font-size: 2rem;
  }
  
  .start-screen__button {
    min-width: 250px;
    padding: 0.75rem 2rem;
    font-size: 1rem;
  }
  
  .settings-screen__content,
  .about-screen__content {
    margin: 1rem;
    padding: 1.5rem;
    max-width: none;
  }
  
  .settings-screen__label {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .settings-screen__slider {
    width: 100%;
  }
  
  .settings-screen__footer {
    flex-direction: column;
  }
  
  .settings-screen__button {
    width: 100%;
  }
}
```

### `index.html`

Подключение стилей экранов:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tribe Civils Game</title>
  <link rel="stylesheet" href="src/styles/screens.css">
  <!-- остальные стили -->
</head>
<body>
  <!-- остальной контент -->
</body>
</html>
```

---

## Критерии приемки (Definition of Done)

### Обязательные

- [ ] Создан компонент `StartScreen` с главным меню
- [ ] Создан компонент `SettingsScreen` с настройками
- [ ] Создан компонент `AboutScreen` с информацией об игре
- [ ] Реализована навигация между экранами
- [ ] Настройки сохраняются в хранилище
- [ ] Настройки применяются к игре
- [ ] Стили для всех экранов
- [ ] Адаптивный дизайн для мобильных устройств
- [ ] Поддержка навигации с клавиатуры (Enter, Escape)

### Дополнительные улучшения

- [ ] Анимации переходов между экранами
- [ ] Фоновая музыка на стартовом экране
- [ ] Эффекты при наведении на кнопки
- [ ] Поддержка геймпада (опционально)

---

## Команды для проверки

```bash
# Запуск dev-сервера
yarn dev

# Открыть http://localhost:3000
# Проверить стартовый экран

# Проверка навигации:
# 1. Клик по "Новая игра" → запуск игры
# 2. Клик по "Настройки" → экран настроек
# 3. Клик по "Об игре" → экран информации
# 4. Клик по "Загрузить" → загрузка сохранения
```

---

## Макет стартового экрана

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│              TRIBE CIVILS GAME                          │
│         Симулятор племён глубокой древности             │
│      Dwarf Fortress × WorldBox × Civilization           │
│                                                         │
│                                                         │
│              ╔═══════════════════════╗                  │
│              ║  🎮  НОВАЯ ИГРА       ║                  │
│              ╚═══════════════════════╝                  │
│                                                         │
│              ╔═══════════════════════╗                  │
│              ║  📁  ЗАГРУЗИТЬ        ║                  │
│              ╚═══════════════════════╝                  │
│                                                         │
│              ╔═══════════════════════╗                  │
│              ║  ⚙️  НАСТРОЙКИ        ║                  │
│              ╚═══════════════════════╝                  │
│                                                         │
│              ╔═══════════════════════╗                  │
│              ║  ℹ️  ОБ ИГРЕ          ║                  │
│              ╚═══════════════════════╝                  │
│                                                         │
│                                                         │
│                  Версия 0.1.0                           │
│              © 2026 Tribe Civils Game                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Связанные спецификации

- [SPEC-006](./006-pre-commit-hooks.md) — Pre-commit хуки
- [SPEC-007](./007-typedoc-api-documentation.md) — TypeDoc документация
- [SPEC-009](./009-documentation-update.md) — Обновление документации

---

## История

- **Создано:** 2026-02-28
- **Статус:** TODO
- **Исполнитель:** TBD
