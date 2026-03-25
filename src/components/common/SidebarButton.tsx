import type { FC } from 'react';

export const SidebarButton: FC<{
    icon: React.ReactNode
    label: string
    active: boolean
    onClick: () => void
  }> = ({ icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
        active ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  )