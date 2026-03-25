export interface GddCustomSection {
  id: string
  title: string
  content: string
}

export interface GddData {
  title: string
  highConcept: string
  genre: string
  platforms: string
  targetAudience: string

  coreMechanics: string
  playerExperience: string
  gameLoop: string
  controls: string

  synopsis: string
  setting: string
  mainCharacters: string
  themes: string

  visualStyle: string
  colorPalette: string
  artReferences: string

  musicDirection: string
  soundDesign: string
  ambiance: string

  engine: string
  tools: string
  performanceTargets: string

  levelProgression: string
  difficultyDesign: string
  levelStructure: string

  interfaceDesign: string
  navigation: string
  accessibility: string

  businessModel: string
  revenueStreams: string

  milestones: string
  phases: string

  customSections: GddCustomSection[]
}

export const DEFAULT_GDD: GddData = {
  title: '',
  highConcept: '',
  genre: '',
  platforms: '',
  targetAudience: '',
  coreMechanics: '',
  playerExperience: '',
  gameLoop: '',
  controls: '',
  synopsis: '',
  setting: '',
  mainCharacters: '',
  themes: '',
  visualStyle: '',
  colorPalette: '',
  artReferences: '',
  musicDirection: '',
  soundDesign: '',
  ambiance: '',
  engine: '',
  tools: '',
  performanceTargets: '',
  levelProgression: '',
  difficultyDesign: '',
  levelStructure: '',
  interfaceDesign: '',
  navigation: '',
  accessibility: '',
  businessModel: '',
  revenueStreams: '',
  milestones: '',
  phases: '',
  customSections: [],
}
