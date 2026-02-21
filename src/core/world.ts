// Генерация мира и карта

import { MAP_WIDTH, MAP_HEIGHT } from './constants'
import { TileType, Position, Resource, ResourceType } from '../types'

export interface Tile {
  type: TileType
  resources: Resource[]
  tribeId?: number
}

export interface World {
  width: number
  height: number
  tiles: Tile[][]
  seaLevel: number
}

// Простая шум-функция для генерации ландшафта
function noise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453
  return n - Math.floor(n)
}

// Сглаженный шум для более естественного ландшафта
function smoothedNoise(x: number, y: number, seed: number): number {
  const corners = (noise(x - 1, y - 1, seed) + noise(x + 1, y - 1, seed) +
                   noise(x - 1, y + 1, seed) + noise(x + 1, y + 1, seed)) / 16
  const sides = (noise(x - 1, y, seed) + noise(x + 1, y, seed) +
                 noise(x, y - 1, seed) + noise(x, y + 1, seed)) / 8
  const center = noise(x, y, seed) / 4
  return corners + sides + center
}

// Интерполяция для плавных переходов
function interpolate(a: number, b: number, x: number): number {
  const ft = x * Math.PI
  const f = (1 - Math.cos(ft)) * 0.5
  return a * (1 - f) + b * f
}

// Интерполированный шум
function interpolatedNoise(x: number, y: number, seed: number): number {
  const intX = Math.floor(x)
  const fracX = x - intX
  const intY = Math.floor(y)
  const fracY = y - intY

  const v1 = smoothedNoise(intX, intY, seed)
  const v2 = smoothedNoise(intX + 1, intY, seed)
  const v3 = smoothedNoise(intX, intY + 1, seed)
  const v4 = smoothedNoise(intX + 1, intY + 1, seed)

  const i1 = interpolate(v1, v2, fracX)
  const i2 = interpolate(v3, v4, fracX)

  return interpolate(i1, i2, fracY)
}

// Перлин-подобный шум с октавами
function perlinNoise(x: number, y: number, seed: number, octaves: number = 4): number {
  let total = 0
  let frequency = 0.01
  let amplitude = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    total += interpolatedNoise(x * frequency, y * frequency, seed + i) * amplitude
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  return total / maxValue
}

function getTileType(elevation: number, moisture: number): TileType {
  if (elevation < 0.3) return TileType.WATER
  if (elevation < 0.35) return TileType.SAND
  if (elevation < 0.6) {
    if (moisture > 0.6) return TileType.SWAMP
    if (moisture > 0.3) return TileType.GRASS
    return TileType.FOREST
  }
  if (elevation < 0.8) {
    return TileType.HILL
  }
  return TileType.MOUNTAIN
}

function spawnResources(tile: Tile, _elevation: number, _moisture: number): void {
  tile.resources = []
  
  if (tile.type === TileType.FOREST) {
    if (Math.random() < 0.8) tile.resources.push({ type: ResourceType.WOOD, amount: Math.floor(Math.random() * 50) + 50 })
    if (Math.random() < 0.4) tile.resources.push({ type: ResourceType.FOOD, amount: Math.floor(Math.random() * 30) + 20 })
  } else if (tile.type === TileType.GRASS) {
    if (Math.random() < 0.6) tile.resources.push({ type: ResourceType.FOOD, amount: Math.floor(Math.random() * 40) + 30 })
  } else if (tile.type === TileType.HILL) {
    if (Math.random() < 0.5) tile.resources.push({ type: ResourceType.STONE, amount: Math.floor(Math.random() * 30) + 20 })
    if (Math.random() < 0.3) tile.resources.push({ type: ResourceType.WOOD, amount: Math.floor(Math.random() * 20) + 10 })
  } else if (tile.type === TileType.MOUNTAIN) {
    if (Math.random() < 0.7) tile.resources.push({ type: ResourceType.STONE, amount: Math.floor(Math.random() * 50) + 30 })
    if (Math.random() < 0.4) tile.resources.push({ type: ResourceType.METAL, amount: Math.floor(Math.random() * 20) + 10 })
  } else if (tile.type === TileType.SWAMP) {
    if (Math.random() < 0.5) tile.resources.push({ type: ResourceType.WOOD, amount: Math.floor(Math.random() * 30) + 20 })
    if (Math.random() < 0.3) tile.resources.push({ type: ResourceType.FOOD, amount: Math.floor(Math.random() * 20) + 10 })
  }
}

export function generateWorld(seed: number = Math.random()): World {
  const world: World = {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tiles: [],
    seaLevel: 0.3
  }

  const elevationMap: number[][] = []
  const moistureMap: number[][] = []

  // Генерируем карты высот и влажности
  for (let y = 0; y < MAP_HEIGHT; y++) {
    elevationMap[y] = []
    moistureMap[y] = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      elevationMap[y][x] = perlinNoise(x, y, seed, 4)
      moistureMap[y][x] = perlinNoise(x, y, seed + 1000, 3)
    }
  }

  // Сглаживаем карту
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        let sum = 0
        let count = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
              sum += elevationMap[ny][nx]
              count++
            }
          }
        }
        elevationMap[y][x] = sum / count
      }
    }
  }

  // Создаём тайлы
  for (let y = 0; y < MAP_HEIGHT; y++) {
    world.tiles[y] = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      const elevation = elevationMap[y][x]
      const moisture = moistureMap[y][x]
      const type = getTileType(elevation, moisture)
      
      const tile: Tile = {
        type,
        resources: []
      }
      
      spawnResources(tile, elevation, moisture)
      world.tiles[y][x] = tile
    }
  }

  return world
}

export function getTile(world: World, pos: Position): Tile | null {
  if (pos.x < 0 || pos.x >= world.width || pos.y < 0 || pos.y >= world.height) {
    return null
  }
  return world.tiles[pos.y][pos.x]
}

export function getAdjacentTiles(world: World, pos: Position): Tile[] {
  const adjacent: Tile[] = []
  const directions = [
    { x: 0, y: -1 }, { x: 0, y: 1 },
    { x: -1, y: 0 }, { x: 1, y: 0 }
  ]

  for (const dir of directions) {
    const tile = getTile(world, { x: pos.x + dir.x, y: pos.y + dir.y })
    if (tile) adjacent.push(tile)
  }

  return adjacent
}

export function isPassable(tile: Tile): boolean {
  return tile.type !== TileType.WATER
}

export function findPassableNearby(world: World, pos: Position, radius: number = 5): Position | null {
  for (let r = 1; r <= radius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
        const checkPos = { x: pos.x + dx, y: pos.y + dy }
        const tile = getTile(world, checkPos)
        if (tile && isPassable(tile)) {
          return checkPos
        }
      }
    }
  }
  return null
}
