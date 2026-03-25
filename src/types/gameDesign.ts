// ─── Game Design – 2D Map Editor types ───

export interface Point {
  x: number
  y: number
}

/** A room is either a rectangle or a custom polygon */
export interface MapRoom {
  id: string
  name: string
  /** 'rect' = axis-aligned rectangle defined by x,y,w,h ; 'poly' = arbitrary polygon */
  type: 'rect' | 'poly'
  x: number
  y: number
  w: number
  h: number
  /** For polygon rooms – relative to (x,y) */
  points?: Point[]
  color: string
  zoneId: string
  layerIndex: number
}

export type StickerTag = 'key-item' | 'collectable' | 'resource' | 'door' | 'save-point' | 'enemy' | 'npc' | 'custom'

export interface MapSticker {
  id: string
  x: number
  y: number
  tag: StickerTag
  label: string
  zoneId: string
  layerIndex: number
}

export interface MapLayer {
  index: number
  name: string       // e.g. "1F", "2F", "B1"
  visible: boolean
}

export interface MapZone {
  id: string
  name: string       // e.g. "Hospital", "Residence"
  layers: MapLayer[]
}

/** A saved custom room shape that can be re-used */
export interface RoomTemplate {
  id: string
  name: string
  type: 'rect' | 'poly'
  w: number
  h: number
  points?: Point[]
  color: string
}

export type MapEditorMode = 'view' | 'edit'

export type EditTool =
  | 'select'
  | 'rect'
  | 'poly'
  | 'sticker'
  | 'pan'

export interface MapState {
  zones: MapZone[]
  rooms: MapRoom[]
  stickers: MapSticker[]
  roomBank: RoomTemplate[]
  activeZoneId: string
  activeLayerIndex: number
  mode: MapEditorMode
  tool: EditTool
  /** Canvas pan / zoom */
  camera: { x: number; y: number; zoom: number }
}

export type GameDesignComponent = 'map-editor'

/** Record stored in the backend for an enabled game design component */
export interface GameDesignComponentRecord {
  id: string
  projectId: string
  componentType: GameDesignComponent
  data: Record<string, unknown>
  createdAt: string | null
  updatedAt: string | null
}
