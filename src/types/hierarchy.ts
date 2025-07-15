export type NodeType = 'collection'|'saga'|'tome'|'chapitre'
export interface Node {
  id: string
  parentId: string | null
  type: NodeType
  title: string
  order: number
}