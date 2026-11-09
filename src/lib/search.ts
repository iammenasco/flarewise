import Fuse, { type IFuseOptions } from 'fuse.js'
import type { CrohnsFoodItem } from '../types'

export const fuseOptions: IFuseOptions<CrohnsFoodItem> = {
  threshold: 0.35,
  ignoreLocation: true,
  keys: [
    { name: 'name', weight: 1.0 },
    { name: 'tags', weight: 0.9 },
    { name: 'searchKeywords', weight: 0.8 },
    { name: 'brandOrRestaurant', weight: 0.7 },
    { name: 'region', weight: 0.5 },
    { name: 'whyItWorks', weight: 0.3 },
    { name: 'prepOrOrderInstructions', weight: 0.2 },
  ],
}

export function createFoodSearch(items: CrohnsFoodItem[]) {
  return new Fuse(items, fuseOptions)
}
