export type LoreType = 'objet'|'lieu'|'événement'
export interface LoreItem {
  id: string
  title: string
  type: LoreType
  description: string
}