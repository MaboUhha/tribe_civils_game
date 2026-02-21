// Рендеринг карты на Canvas

import { World, Tile } from '../core/world'
import { Tribe } from '../core/tribe'
import { TILE_SIZE, COLORS } from '../core/constants'
import { TileType } from '../types'

export interface RenderConfig {
  showGrid: boolean
  showResources: boolean
  showTribeNames: boolean
  highlightSelected: boolean
  smoothCamera: boolean
}

export class MapRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: RenderConfig

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get 2D context')
    this.ctx = ctx
    this.config = {
      showGrid: false,
      showResources: false,
      showTribeNames: false,
      highlightSelected: true,
      smoothCamera: true
    }
    this.resize()
  }

  resize(): void {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  setConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  render(
    world: World,
    tribes: Map<number, Tribe>,
    camera: { x: number; y: number; zoom: number },
    selectedTribeId: number | null
  ): void {
    const { width, height } = this.canvas
    const tileSize = TILE_SIZE * camera.zoom

    // Очистка
    this.ctx.fillStyle = '#000'
    this.ctx.fillRect(0, 0, width, height)

    // Видимая область карты
    const startCol = Math.floor(camera.x / TILE_SIZE)
    const endCol = startCol + Math.ceil(width / tileSize) + 1
    const startRow = Math.floor(camera.y / TILE_SIZE)
    const endRow = startRow + Math.ceil(height / tileSize) + 1

    // Рендеринг тайлов
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        if (y < 0 || y >= world.height || x < 0 || x >= world.width) continue

        const tile = world.tiles[y][x]
        const screenX = Math.floor((x - camera.x) * camera.zoom)
        const screenY = Math.floor((y - camera.y) * camera.zoom)

        this.renderTile(tile, screenX, screenY, tileSize)
      }
    }

    // Рендеринг племён
    for (const tribe of tribes.values()) {
      if (tribe.data.population <= 0) continue

      const screenX = Math.floor((tribe.data.position.x - camera.x) * camera.zoom)
      const screenY = Math.floor((tribe.data.position.y - camera.y) * camera.zoom)

      // Проверка видимости
      if (screenX < -tileSize || screenX > width || screenY < -tileSize || screenY > height) continue

      const isSelected = selectedTribeId === tribe.data.config.id
      this.renderTribe(tribe, screenX, screenY, tileSize, isSelected)
    }

    // Сетка (опционально)
    if (this.config.showGrid) {
      this.renderGrid(camera, tileSize, startCol, endCol, startRow, endRow)
    }
  }

  private renderTile(tile: Tile, x: number, y: number, size: number): void {
    // Базовый цвет тайла
    this.ctx.fillStyle = this.getTileColor(tile.type)
    this.ctx.fillRect(x, y, size, size)

    // Ресурсы
    if (this.config.showResources && tile.resources.length > 0) {
      const resource = tile.resources[0]
      this.ctx.fillStyle = this.getResourceColor(resource.type)
      const resourceSize = size * 0.3
      this.ctx.fillRect(
        x + size * 0.35,
        y + size * 0.35,
        resourceSize,
        resourceSize
      )
    }

    // Граница тайла
    this.ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x, y, size, size)
  }

  private renderTribe(
    tribe: Tribe,
    x: number,
    y: number,
    size: number,
    isSelected: boolean
  ): void {
    const centerX = x + size / 2
    const centerY = y + size / 2

    // Маркер племени
    this.ctx.fillStyle = tribe.data.config.color
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, size * 0.4, 0, Math.PI * 2)
    this.ctx.fill()

    // Выделение
    if (isSelected && this.config.highlightSelected) {
      this.ctx.strokeStyle = COLORS.selected
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.arc(centerX, centerY, size * 0.6, 0, Math.PI * 2)
      this.ctx.stroke()
    }

    // Размер популяции (визуально)
    const popSize = Math.min(1, tribe.data.population / 100)
    this.ctx.fillStyle = 'rgba(255,255,255,0.7)'
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, size * 0.2 * popSize, 0, Math.PI * 2)
    this.ctx.fill()

    // Название (опционально)
    if (this.config.showTribeNames) {
      this.ctx.fillStyle = '#fff'
      this.ctx.font = `${Math.max(8, size * 0.5)}px monospace`
      this.ctx.textAlign = 'center'
      this.ctx.fillText(
        tribe.data.config.name,
        centerX,
        y - size * 0.2
      )
    }
  }

  private renderGrid(
    camera: { x: number; y: number; zoom: number },
    _tileSize: number,
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number
  ): void {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    this.ctx.lineWidth = 1

    for (let x = startCol; x <= endCol; x++) {
      const screenX = (x - camera.x) * camera.zoom
      this.ctx.beginPath()
      this.ctx.moveTo(screenX, 0)
      this.ctx.lineTo(screenX, this.canvas.height)
      this.ctx.stroke()
    }

    for (let y = startRow; y <= endRow; y++) {
      const screenY = (y - camera.y) * camera.zoom
      this.ctx.beginPath()
      this.ctx.moveTo(0, screenY)
      this.ctx.lineTo(this.canvas.width, screenY)
      this.ctx.stroke()
    }
  }

  private getTileColor(type: TileType): string {
    switch (type) {
      case TileType.WATER: return COLORS.water
      case TileType.SAND: return COLORS.sand
      case TileType.GRASS: return COLORS.grass
      case TileType.FOREST: return COLORS.forest
      case TileType.HILL: return COLORS.hill
      case TileType.MOUNTAIN: return COLORS.mountain
      case TileType.SWAMP: return COLORS.swamp
      default: return '#ff00ff'
    }
  }

  private getResourceColor(type: string): string {
    switch (type) {
      case 'food': return '#8bc34a'
      case 'wood': return '#795548'
      case 'stone': return '#9e9e9e'
      case 'metal': return '#607d8b'
      default: return '#ffffff'
    }
  }

  worldToScreen(worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }): { x: number; y: number } {
    return {
      x: (worldX - camera.x) * camera.zoom,
      y: (worldY - camera.y) * camera.zoom
    }
  }

  screenToWorld(screenX: number, screenY: number, camera: { x: number; y: number; zoom: number }): { x: number; y: number } {
    return {
      x: Math.floor(screenX / camera.zoom + camera.x),
      y: Math.floor(screenY / camera.zoom + camera.y)
    }
  }
}
