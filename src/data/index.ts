import type { CrohnsFoodItem } from '../types'

const modules = import.meta.glob<{ default: CrohnsFoodItem }>(
  './items/**/*.json',
  { eager: true },
)

export const allFoods: CrohnsFoodItem[] = Object.entries(modules)
  .map(([filepath, mod]) => ({
    ...mod.default,
    _sourcePath: filepath.replace(/^\.\//, 'src/data/'),
  }))
  .sort((a, b) => b.crohnsScore - a.crohnsScore || a.name.localeCompare(b.name))

export const foodById = new Map(allFoods.map((item) => [item.id, item]))
