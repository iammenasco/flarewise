export type SafetyTier =
  | 'flare-safe'
  | 'low-risk'
  | 'remission-road'
  | 'danger-zone'

export type CategoryFolder =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'asian-indian'
  | 'mexican-southwest'
  | 'italian-med'
  | 'diner-bbq'
  | 'snacks-desserts'
  | 'drinks-sauces'
  | 'produce-sides'
  | 'high-protein'
  | 'frozen-aisle'

export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'dessert'
  | 'drink'
  | 'sauce'
  | 'takeout'

export type Region =
  | 'American'
  | 'Japanese'
  | 'Korean'
  | 'Chinese'
  | 'Indian'
  | 'Mexican/Southwest'
  | 'Italian/Med'
  | 'Euro/Bistro'
  | 'Global'

export type PrepMethod =
  | 'ready-to-eat'
  | 'toaster-oven'
  | 'stovetop'
  | 'skillet'
  | 'slow-cooker'
  | 'drive-thru'
  | 'no-microwave'

export type PersonalStatus = 'safe' | 'iffy' | 'trigger'

export interface CrohnsFoodItem {
  id: string
  name: string
  categoryFolder: CategoryFolder
  brandOrRestaurant?: string
  crohnsScore: number
  safetyTier: SafetyTier
  mealTypes: MealType[]
  region: Region
  costTier: 1 | 2 | 3
  typicalPriceText?: string
  convenienceScore: number
  prepMethod: PrepMethod[]
  fiberGramsPerServing: number
  lactoseSafe: boolean
  glutenFree?: boolean
  citrusFree: boolean
  groceryIngredients?: string[]
  familyMealMod?: string
  tags: string[]
  searchKeywords: string[]
  whyItWorks: string
  prepOrOrderInstructions: string
  flareEmergencySwap?: string
  watchOuts?: string[]
  imageUrl?: string
  links?: { label: string; url: string }[]
  _sourcePath?: string
}

export interface Guardrails {
  citrusFreeOnly: boolean
  lactoseSafeOnly: boolean
  toasterOvenOnly: boolean
  grabAndGoOnly: boolean
  cruiseMode: boolean
  hideDangerZone: boolean
  showDangerZone: boolean
}

export interface CatalogPreferences {
  starredIds: string[]
  groceryIds: string[]
  checkedGroceryIngredients: string[]
  minScore: number
  guardrails: Guardrails
  personalStatus: Record<string, PersonalStatus>
  /** Opt-in: show "Show server card" on food drawers. Off by default. */
  showServerCard: boolean
}
