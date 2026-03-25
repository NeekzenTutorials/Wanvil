import type { FC } from 'react'
import {
  X, Gamepad2, BookOpen, Palette, Music, Cpu,
  Map as MapIcon, Monitor, DollarSign, CalendarDays, Info, FileText
} from 'lucide-react'
import type { GddData } from '../../types/gdd'
import { useTranslation } from '../../i18n'
import ModalPortal from '../common/ModalPortal'

interface Props {
  open: boolean
  data: GddData
  onClose: () => void
  onEdit?: () => void
}

interface ViewSection {
  labelKey: string
  icon: typeof Info
  color: string
  entries: { labelKey: string; value: string }[]
}

export const GddViewModal: FC<Props> = ({ open, data, onClose, onEdit }) => {
  const { t } = useTranslation()
  if (!open) return null

  const sections: ViewSection[] = [
    {
      labelKey: 'gdd.sectionOverview', icon: Info, color: 'text-blue-500',
      entries: [
        { labelKey: 'gdd.fieldTitle', value: data.title },
        { labelKey: 'gdd.fieldHighConcept', value: data.highConcept },
        { labelKey: 'gdd.fieldGenre', value: data.genre },
        { labelKey: 'gdd.fieldPlatforms', value: data.platforms },
        { labelKey: 'gdd.fieldTargetAudience', value: data.targetAudience },
      ],
    },
    {
      labelKey: 'gdd.sectionGameplay', icon: Gamepad2, color: 'text-purple-500',
      entries: [
        { labelKey: 'gdd.fieldCoreMechanics', value: data.coreMechanics },
        { labelKey: 'gdd.fieldPlayerExperience', value: data.playerExperience },
        { labelKey: 'gdd.fieldGameLoop', value: data.gameLoop },
        { labelKey: 'gdd.fieldControls', value: data.controls },
      ],
    },
    {
      labelKey: 'gdd.sectionStory', icon: BookOpen, color: 'text-amber-500',
      entries: [
        { labelKey: 'gdd.fieldSynopsis', value: data.synopsis },
        { labelKey: 'gdd.fieldSetting', value: data.setting },
        { labelKey: 'gdd.fieldMainCharacters', value: data.mainCharacters },
        { labelKey: 'gdd.fieldThemes', value: data.themes },
      ],
    },
    {
      labelKey: 'gdd.sectionArt', icon: Palette, color: 'text-pink-500',
      entries: [
        { labelKey: 'gdd.fieldVisualStyle', value: data.visualStyle },
        { labelKey: 'gdd.fieldColorPalette', value: data.colorPalette },
        { labelKey: 'gdd.fieldArtReferences', value: data.artReferences },
      ],
    },
    {
      labelKey: 'gdd.sectionAudio', icon: Music, color: 'text-emerald-500',
      entries: [
        { labelKey: 'gdd.fieldMusicDirection', value: data.musicDirection },
        { labelKey: 'gdd.fieldSoundDesign', value: data.soundDesign },
        { labelKey: 'gdd.fieldAmbiance', value: data.ambiance },
      ],
    },
    {
      labelKey: 'gdd.sectionTechnical', icon: Cpu, color: 'text-slate-500',
      entries: [
        { labelKey: 'gdd.fieldEngine', value: data.engine },
        { labelKey: 'gdd.fieldTools', value: data.tools },
        { labelKey: 'gdd.fieldPerformanceTargets', value: data.performanceTargets },
      ],
    },
    {
      labelKey: 'gdd.sectionLevelDesign', icon: MapIcon, color: 'text-orange-500',
      entries: [
        { labelKey: 'gdd.fieldLevelProgression', value: data.levelProgression },
        { labelKey: 'gdd.fieldDifficultyDesign', value: data.difficultyDesign },
        { labelKey: 'gdd.fieldLevelStructure', value: data.levelStructure },
      ],
    },
    {
      labelKey: 'gdd.sectionUiUx', icon: Monitor, color: 'text-cyan-500',
      entries: [
        { labelKey: 'gdd.fieldInterfaceDesign', value: data.interfaceDesign },
        { labelKey: 'gdd.fieldNavigation', value: data.navigation },
        { labelKey: 'gdd.fieldAccessibility', value: data.accessibility },
      ],
    },
    {
      labelKey: 'gdd.sectionMonetization', icon: DollarSign, color: 'text-yellow-500',
      entries: [
        { labelKey: 'gdd.fieldBusinessModel', value: data.businessModel },
        { labelKey: 'gdd.fieldRevenueStreams', value: data.revenueStreams },
      ],
    },
    {
      labelKey: 'gdd.sectionRoadmap', icon: CalendarDays, color: 'text-indigo-500',
      entries: [
        { labelKey: 'gdd.fieldMilestones', value: data.milestones },
        { labelKey: 'gdd.fieldPhases', value: data.phases },
      ],
    },
  ]

  const filledSections = sections.filter(s => s.entries.some(e => e.value.trim()))
  const totalFields = sections.reduce((sum, s) => sum + s.entries.length, 0)
  const filledFields = sections.reduce((sum, s) => sum + s.entries.filter(e => e.value.trim()).length, 0)
  const progressPct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
  const hasCustom = data.customSections.some(cs => cs.title.trim() || cs.content.trim())

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                  <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {data.title || t('gdd.viewTitle')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('gdd.viewSubtitle')}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {filledFields}/{totalFields} {t('gdd.fieldsCompleted')}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {filledSections.length === 0 && !hasCustom && (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">{t('gdd.emptyGdd')}</p>
                {onEdit && (
                  <button onClick={() => { onClose(); onEdit() }}
                    className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
                    {t('gdd.startEditing')}
                  </button>
                )}
              </div>
            )}

            {filledSections.map(section => {
              const Icon = section.icon
              const filledEntries = section.entries.filter(e => e.value.trim())
              return (
                <div key={section.labelKey} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-3 bg-gray-50 dark:bg-gray-800/50">
                    <Icon className={`w-5 h-5 ${section.color} shrink-0`} />
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {t(section.labelKey as any)}
                    </h3>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    {filledEntries.map(entry => (
                      <div key={entry.labelKey}>
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                          {t(entry.labelKey as any)}
                        </p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                          {entry.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Custom sections */}
            {data.customSections.filter(cs => cs.title.trim() || cs.content.trim()).map(cs => (
              <div key={cs.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3 bg-gray-50 dark:bg-gray-800/50">
                  <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {cs.title || t('gdd.untitledSection')}
                  </h3>
                </div>
                {cs.content.trim() && (
                  <div className="px-5 py-4">
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {cs.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            {onEdit && (
              <button onClick={() => { onClose(); onEdit() }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                {t('common.edit')}
              </button>
            )}
            <button onClick={onClose}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
