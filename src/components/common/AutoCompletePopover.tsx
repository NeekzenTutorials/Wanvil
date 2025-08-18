// src/components/common/AutocompletePopover.tsx
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export type AcItem = { id: string; type: 'character'|'place'|'item'; label: string; hint?: string | null }

interface Props {
  anchor: { x: number; y: number } | null
  items: AcItem[]
  activeIndex: number
  onHover: (i:number) => void
  onSelect: (i:number) => void
  onClose: () => void
}

export default function AutocompletePopover({ anchor, items, activeIndex, onHover, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement|null>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return
      if (e.target instanceof Node && !ref.current.contains(e.target)) onClose()
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [onClose])

  if (!anchor || !items.length) return null

  const icon = (t: AcItem['type']) => (t === 'character' ? '👤' : t === 'place' ? '📍' : '📦')

  return createPortal(
    <div
      ref={ref}
      className="z-50 bg-white border rounded shadow-lg max-h-64 overflow-auto w-80"
      style={{ position: 'fixed', left: anchor.x, top: anchor.y }}
      role="listbox"
      aria-activedescendant={items[activeIndex]?.id}
    >
      {items.map((s, i) => (
        <div
          key={`${s.type}-${s.id}`}
          role="option"
          aria-selected={i===activeIndex}
          className={`flex gap-2 items-center px-3 py-2 cursor-pointer ${i===activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          onMouseEnter={() => onHover(i)}
          onMouseDown={(e) => { e.preventDefault(); onSelect(i) }} // mousedown pour éviter la perte de focus TinyMCE
        >
          <div className="shrink-0">{icon(s.type)}</div>
          <div className="min-w-0">
            <div className="font-medium truncate">{s.label}</div>
            {s.hint ? <div className="text-xs text-gray-500 truncate">{s.hint}</div> : null}
          </div>
          <div className="ml-auto text-xs text-gray-400 uppercase">{s.type}</div>
        </div>
      ))}
    </div>,
    document.body
  )
}
