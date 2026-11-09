import type { CategoryFolder, CrohnsFoodItem, MealType, PrepMethod } from '../types'
import { tierFromScore, tierLabel } from './score'

export function draftHasContent(draft: CrohnsFoodItem) {
  return Boolean(
    draft.name.trim() ||
      draft.whyItWorks.trim() ||
      draft.prepOrOrderInstructions.trim() ||
      (draft.brandOrRestaurant ?? '').trim() ||
      draft.tags.some((t) => t.trim() && t !== 'example' && t !== 'todo') ||
      draft.searchKeywords.some((k) => k.trim() && k !== 'example'),
  )
}

/** True when connectivity flips offline → online with something waiting. */
export function shouldPromptSubmitOnReconnect(
  wasOnline: boolean,
  isOnline: boolean,
  hasPendingDraft: boolean,
) {
  return !wasOnline && isOnline && hasPendingDraft
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildSubmitItem(draft: CrohnsFoodItem): CrohnsFoodItem {
  const id = draft.id || slugify(draft.name)
  return {
    ...draft,
    id,
    safetyTier: tierFromScore(draft.crohnsScore),
    tags: draft.tags.map((t) => t.trim()).filter(Boolean),
    searchKeywords: draft.searchKeywords.map((k) => k.trim()).filter(Boolean),
  }
}

/** Plain-language checklist — never show schema paths or regex to users. */
export function friendlySubmitGaps(item: CrohnsFoodItem): string[] {
  const gaps: string[] = []
  if (!item.name.trim()) gaps.push('Give this food a name')
  if (!slugify(item.name) && !item.id) {
    gaps.push('Use a name with letters or numbers so we can save it')
  }
  if (!item.mealTypes.length) gaps.push('Pick at least one meal time')
  if (!item.prepMethod.length) gaps.push('Pick how you usually make or get it')
  if (item.tags.length < 2) {
    gaps.push('Add at least two short tags (e.g. broth, takeout)')
  }
  if (item.searchKeywords.length < 1) {
    gaps.push('Add a search word people might type (e.g. stock)')
  }
  if (!item.whyItWorks.trim()) {
    gaps.push(
      'Say why it’s gentle — low fiber, warm, easy to digest, etc.',
    )
  }
  if (!item.prepOrOrderInstructions.trim()) {
    gaps.push('Add a quick how-to or order script')
  }
  return gaps
}

export function submitIssueTitle(item: Pick<CrohnsFoodItem, 'name'>) {
  return `Add food: ${item.name}`
}

export function submitIssueBody(item: CrohnsFoodItem) {
  return [
    `## ${item.name}`,
    '',
    `**Score:** ${item.crohnsScore} (${tierLabel(item.safetyTier)})`,
    `**Category:** ${categoryLabel(item.categoryFolder)}`,
    `**Region:** ${item.region}`,
    '',
    '### Why it works',
    item.whyItWorks,
    '',
    '### Prep / order',
    item.prepOrOrderInstructions,
    '',
    '```json',
    JSON.stringify(item, null, 2),
    '```',
    '',
    '_Submitted via Flarewise /submit_',
  ].join('\n')
}

export function categoryLabel(folder: CategoryFolder): string {
  switch (folder) {
    case 'breakfast':
      return 'Breakfast'
    case 'lunch':
      return 'Lunch'
    case 'dinner':
      return 'Dinner'
    case 'asian-indian':
      return 'Asian & Indian'
    case 'mexican-southwest':
      return 'Mexican & Southwest'
    case 'italian-med':
      return 'Italian & Med'
    case 'diner-bbq':
      return 'Diner & BBQ'
    case 'snacks-desserts':
      return 'Snacks & desserts'
    case 'drinks-sauces':
      return 'Drinks & sauces'
    case 'produce-sides':
      return 'Produce & sides'
    case 'high-protein':
      return 'High protein'
    case 'frozen-aisle':
      return 'Frozen aisle'
  }
}

export function mealLabel(meal: MealType): string {
  switch (meal) {
    case 'breakfast':
      return 'Breakfast'
    case 'lunch':
      return 'Lunch'
    case 'dinner':
      return 'Dinner'
    case 'snack':
      return 'Snack'
    case 'dessert':
      return 'Dessert'
    case 'drink':
      return 'Drink'
    case 'sauce':
      return 'Sauce'
    case 'takeout':
      return 'Takeout'
  }
}

export function prepLabel(prep: PrepMethod): string {
  switch (prep) {
    case 'ready-to-eat':
      return 'Ready to eat'
    case 'toaster-oven':
      return 'Toaster oven'
    case 'stovetop':
      return 'Stovetop'
    case 'skillet':
      return 'Skillet'
    case 'slow-cooker':
      return 'Slow cooker'
    case 'drive-thru':
      return 'Drive-thru'
    case 'no-microwave':
      return 'No microwave'
  }
}

export const MEAL_OPTIONS = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'dessert',
  'drink',
  'sauce',
  'takeout',
] as const satisfies readonly MealType[]

export const PREP_OPTIONS = [
  'ready-to-eat',
  'toaster-oven',
  'stovetop',
  'skillet',
  'slow-cooker',
  'drive-thru',
  'no-microwave',
] as const satisfies readonly PrepMethod[]

export const emptyDraft: CrohnsFoodItem = {
  id: '',
  name: '',
  categoryFolder: 'breakfast',
  crohnsScore: 9,
  safetyTier: 'flare-safe',
  mealTypes: ['breakfast'],
  region: 'American',
  costTier: 1,
  convenienceScore: 4,
  prepMethod: ['ready-to-eat'],
  fiberGramsPerServing: 0,
  lactoseSafe: true,
  citrusFree: true,
  tags: [],
  searchKeywords: [],
  whyItWorks: '',
  prepOrOrderInstructions: '',
}
