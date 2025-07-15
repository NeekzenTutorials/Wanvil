import type { FC } from 'react'
import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface EditorProps {
  nodeId: string
}

const Editor: FC<EditorProps> = ({ nodeId }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Commencez à écrire...</p>',
  })

  useEffect(() => {
    // TODO: load content for nodeId from store
    // editor?.commands.setContent(storedContent)
  }, [nodeId])

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      {editor && <EditorContent editor={editor} />}
    </div>
  )
}

export default Editor