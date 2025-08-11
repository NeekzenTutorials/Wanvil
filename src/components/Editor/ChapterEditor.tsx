import { useEffect, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { apiGet, apiPut } from '../../utils/fetcher'

type Chapter = { id: string; title: string; content: string; position?: number }

interface ChapterEditorProps {
  chapterId: string
  onSaved?: () => void
}

export default function ChapterEditor({ chapterId, onSaved }: ChapterEditorProps) {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiGet<Chapter>(`chapters/${chapterId}`)
      .then((c) => setContent(c.content || ''))
      .finally(() => setLoading(false))
  }, [chapterId])

  const save = async () => {
    setSaving(true)
    try {
      await apiPut(`chapters/${chapterId}`, { content })
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Chargement du chapitre…</p>

  return (
    <div className="space-y-3">
      <Editor
        value={content}
        onEditorChange={(v) => setContent(v)}
        apiKey="ll8xm35gqhxdg1vzghapkgye0nj2t7ob6xigqmhm8ne5na5h"
        init={{
          height: 600,
          menubar: false,
          branding: false,
          toolbar_mode: 'sliding',
          plugins:
            'lists link image table code help wordcount fullscreen searchreplace visualblocks pagebreak',
          toolbar:
            'undo redo | blocks | bold italic underline strikethrough | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | link image table pagebreak | ' +
            'removeformat | fullscreen | code',
        }}
      />

      <div className="flex justify-end">
        <button onClick={save} className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le chapitre'}
        </button>
      </div>
    </div>
  )
}
