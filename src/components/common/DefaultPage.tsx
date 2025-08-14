export function DefaultPage({ title, description }: { title: string; description: string }) {
    return (
      <div className="max-w-3xl mx-auto mt-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="text-gray-500 mt-2">{description}</p>
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Astuce : utilisez la barre latérale pour naviguer entre les sections.
          </p>
        </div>
      </div>
    )
  }
  