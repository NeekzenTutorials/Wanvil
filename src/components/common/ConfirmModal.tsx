// src/components/common/ConfirmModal.tsx
// Reusable confirmation modal dialog

import type { FC } from 'react'
import { AlertTriangle, X } from 'lucide-react'

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
  confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  variant = 'danger',
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <button onClick={onCancel} className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-lg shrink-0 ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={`text-sm px-4 py-2 rounded-lg text-white ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
