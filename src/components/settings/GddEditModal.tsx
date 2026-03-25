import { useState, type FC } from 'react'
import {
  X, ChevronDown, ChevronRight, Plus, Trash2,
  Gamepad2, BookOpen, Palette, Music, Cpu,
  Map as MapIcon, Monitor, DollarSign, CalendarDays, Info
} from 'lucide-react'
import type { GddData, GddCustomSection } from '../../types/gdd'
import { useTranslation } from '../../i18n'
import ModalPortal from '../common/ModalPortal'

interface Props {
  open: boolean
  data: GddData
  onSave: (data: GddData) => void
  onClose: () => void
}

interface SectionDef {
  key: string
  labelKey: string
  icon: typeof Info
  fields: { key: keyof GddData; labelKey: string; multiline?: boolean }[]
}

const SECTIONS: SectionDef[] = [
  {
    key: 'overview', labelKey: 'gdd.sectionOverview', icon: Info,
    fields: [
      { key: 'title', labelKey: 'gdd.fieldTitle' },
      { key: 'highConcept', labelKey: 'gdd.fieldHighConcept', multiline: true },
      { key: 'genre', labelKey: 'gdd.fieldGenre' },
      { key: 'platforms', labelKey: 'gdd.fieldPlatforms' },
      { key: 'targetAudience', labelKey: 'gdd.fieldTargetAudience' },
    ],
  },
  {
    key: 'gameplay', labelKey: 'gdd.sectionGameplay', icon: Gamepad2,
    fields: [
      { key: 'coreMechanics', labelKey: 'gdd.fieldCoreMechanics', multiline: true },
      { key: 'playerExperience', labelKey: 'gdd.fieldPlayerExperience', multiline: true },
      { key: 'gameLoop', labelKey: 'gdd.fieldGameLoop', multiline: true },
      { key: 'controls', labelKey: 'gdd.fieldControls', multiline: true },
    ],
  },
  {
    key: 'story', labelKey: 'gdd.sectionStory', icon: BookOpen,
    fields: [
      { key: 'synopsis', labelKey: 'gdd.fieldSynopsis', multiline: true },
      { key: 'setting', labelKey: 'gdd.fieldSetting', multiline: true },
      { key: 'mainCharacters', labelKey: 'gdd.fieldMainCharacters', multiline: true },
      { key: 'themes', labelKey: 'gdd.fieldThemes', multiline: true },
    ],
  },
  {
    key: 'art', labelKey: 'gdd.sectionArt', icon: Palette,
    fields: [
      { key: 'visualStyle', labelKey: 'gdd.fieldVisualStyle', multiline: true },
      { key: 'colorPalette', labelKey: 'gdd.fieldColorPalette' },
      { key: 'artReferences', labelKey: 'gdd.fieldArtReferences', multiline: true },
    ],
  },
  {
    key: 'audio', labelKey: 'gdd.sectionAudio', icon: Music,
    fields: [
      { key: 'musicDirection', labelKey: 'gdd.fieldMusicDirection', multiline: true },
      { key: 'soundDesign', labelKey: 'gdd.fieldSoundDesign', multiline: true },
      { key: 'ambiance', labelKey: 'gdd.fieldAmbiance', multiline: true },
    ],
  },
  {
    key: 'technical', labelKey: 'gdd.sectionTechnical', icon: Cpu,
    fields: [
      { key: 'engine', labelKey: 'gdd.fieldEngine' },
      { key: 'tools', labelKey: 'gdd.fieldTools' },
      { key: 'performanceTargets', labelKey: 'gdd.fieldPerformanceTargets', multiline: true },
    ],
  },
  {
    key: 'levelDesign', labelKey: 'gdd.sectionLevelDesign', icon: MapIcon,
    fields: [
      { key: 'levelProgression', labelKey: 'gdd.fieldLevelProgression', multiline: true },
      { key: 'difficultyDesign', labelKey: 'gdd.fieldDifficultyDesign', multiline: true },
      { key: 'levelStructure', labelKey: 'gdd.fieldLevelStructure', multiline: true },
    ],
  },
  {
    key: 'uiux', labelKey: 'gdd.sectionUiUx', icon: Monitor,
    fields: [
      { key: 'interfaceDesign', labelKey: 'gdd.fieldInterfaceDesign', multiline: true },
      { key: 'navigation', labelKey: 'gdd.fieldNavigation', multiline: true },
      { key: 'accessibility', labelKey: 'gdd.fieldAccessibility', multiline: true },
    ],
  },
  {
    key: 'monetization', labelKey: 'gdd.sectionMonetization', icon: DollarSign,
    fields: [
      { key: 'businessModel', labelKey: 'gdd.fieldBusinessModel', multiline: true },
      { key: 'revenueStreams', labelKey: 'gdd.fieldRevenueStreams', multiline: true },
    ],
  },
  {
    key: 'roadmap', labelKey: 'gdd.sectionRoadmap', icon: CalendarDays,
    fields: [
      { key: 'milestones', labelKey: 'gdd.fieldMilestones', multiline: true },
      { key: 'phases', labelKey: 'gdd.fieldPhases', multiline: true },
    ],
  },
]

export const GddEditModal: FC<Props> = ({ open, data, onSave, onClose }) => {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<GddData>({ ...data, customSections: data.customSections.map(s => ({ ...s })) })
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['overview']))

  if (!open) return null

  const toggle = (key: string) =>
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const setField = (key: keyof GddData, value: string) =>
    setDraft(prev => ({ ...prev, [key]: value }))

  const addCustomSection = () => {
    const id = crypto.randomUUID()
    setDraft(prev => ({
      ...prev,
      customSections: [...prev.customSections, { id, title: '', content: '' }],
    }))
    setOpenSections(prev => new Set(prev).add(`custom-${id}`))
  }

  const updateCustom = (id: string, field: keyof GddCustomSection, value: string) =>
    setDraft(prev => ({
      ...prev,
      customSections: prev.customSections.map(s => s.id === id ? { ...s, [field]: value } : s),
    }))

  const removeCustom = (id: string) =>
    setDraft(prev => ({
      ...prev,
      customSections: prev.customSections.filter(s => s.id !== id),
    }))

  const filledCount = (section: SectionDef) =>
    section.fields.filter(f => (draft[f.key] as string).trim().length > 0).length

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('gdd.editTitle')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('gdd.editSubtitle')}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {SECTIONS.map(section => {
              const isOpen = openSections.has(section.key)
              const Icon = section.icon
              const filled = filledCount(section)
              return (
                <div key={section.key} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggle(section.key)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-left"
                  >
                    <Icon className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex-1">
                      {t(section.labelKey as any)}
                    </span>
                    {filled > 0 && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                        {filled}/{section.fields.length}
                      </span>
                    )}
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100 dark:border-gray-700">
                      {section.fields.map(field => (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {t(field.labelKey as any)}
                          </label>
                          {field.multiline ? (
                            <textarea
                              value={draft[field.key] as string}
                              onChange={e => setField(field.key, e.target.value)}
                              rows={4}
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                              placeholder={t(field.labelKey as any)}
                            />
                          ) : (
                            <input
                              type="text"
                              value={draft[field.key] as string}
                              onChange={e => setField(field.key, e.target.value)}
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder={t(field.labelKey as any)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Custom sections */}
            {draft.customSections.map(cs => {
              const csKey = `custom-${cs.id}`
              const isOpen = openSections.has(csKey)
              return (
                <div key={cs.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="flex items-center">
                    <button type="button" onClick={() => toggle(csKey)}
                      className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-left">
                      <Plus className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex-1">
                        {cs.title || t('gdd.untitledSection')}
                      </span>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => removeCustom(cs.id)}
                      className="p-2 mr-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('gdd.customSectionTitle')}</label>
                        <input type="text" value={cs.title} onChange={e => updateCustom(cs.id, 'title', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder={t('gdd.customSectionTitlePlaceholder')} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('gdd.customSectionContent')}</label>
                        <textarea value={cs.content} onChange={e => updateCustom(cs.id, 'content', e.target.value)}
                          rows={6}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                          placeholder={t('gdd.customSectionContentPlaceholder')} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <button type="button" onClick={addCustomSection}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition">
              <Plus className="w-4 h-4" />
              {t('gdd.addCustomSection')}
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              {t('common.cancel')}
            </button>
            <button onClick={() => onSave(draft)}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
