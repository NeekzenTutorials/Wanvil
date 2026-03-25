// src/components/common/ConfirmModal.tsx
// Reusable confirmation modal dialog

import type { FC } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from '../../i18n'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning'
}

export const ConfirmModal: FC<Props> = ({
  open, title, message, onConfirm, onCancel,
  confirmLabel, cancelLabel,
  variant = 'danger',
}) => {
  const { t } = useTranslation()
  if (!open) return null

  const confirm = confirmLabel ?? t('common.confirm')
  const cancel = cancelLabel ?? t('common.cancel')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <button onClick={onCancel} className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-lg shrink-0 ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">{cancel}</button>
          <button
            onClick={onConfirm}
            className={`text-sm px-4 py-2 rounded-lg text-white ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
          >{confirm}</button>
        </div>
      </div>
    </div>
  )
}
