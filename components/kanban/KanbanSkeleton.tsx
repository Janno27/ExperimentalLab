'use client'

export function KanbanSkeleton() {
  // Simuler l'état par défaut : les 2 premières colonnes sont repliées
  const foldedColumns = ['To be prioritized', 'Denied']
  const unfoldedColumns = ['Open', 'Refinement', 'Design & Development', 'Setup', 'Running', 'Ready for Analysis', 'Analysing', 'Done']

  return (
    <div className="w-full max-w-full overflow-x-auto pb-2 flex">
      {/* Mini-columns pour les colonnes repliées (comme dans le vrai composant) */}
      {foldedColumns.length > 0 && (
        <div className="flex flex-row gap-2 mr-4 items-start pt-2">
          {foldedColumns.map((col) => (
            <div key={col} className="flex flex-col items-center w-8 transition-all duration-300 ease-in-out opacity-100">
              {/* Colonne repliée avec texte vertical */}
              <div className="rounded-lg px-1 py-1 text-xs font-medium mb-1 flex flex-col items-center justify-center min-h-[4rem] w-full bg-zinc-200 text-zinc-700 animate-pulse"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                <div className="h-3 w-16 bg-gray-300 rounded animate-pulse" />
              </div>
              {/* Compteur */}
              <div className="text-xs text-zinc-500 font-medium mb-1">
                <div className="h-3 w-4 bg-gray-300 rounded animate-pulse" />
              </div>
              {/* Bouton unfold */}
              <div className="p-1 rounded bg-gray-200 w-4 h-4 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Main Kanban board */}
      <div className="flex gap-4 min-w-[900px] max-w-6xl">
        {unfoldedColumns.map((col, colIndex) => (
          <div
            key={col}
            className="bg-muted/50 rounded-xl p-4 min-h-[75vh] flex flex-col max-h-[75vh] w-64 min-w-[16rem] max-w-xs overflow-y-auto transition-all duration-300 ease-in-out opacity-100"
          >
            {/* Header de la colonne */}
            <div className="flex items-center justify-between mb-2 group relative">
              <div className="flex items-center gap-2">
                {/* Badge de statut */}
                <div className="h-5 w-20 bg-gray-300 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-1">
                {/* Compteur */}
                <div className="h-3 w-6 bg-gray-300 rounded animate-pulse" />
                {/* Bouton fold */}
                <div className="opacity-0 group-hover:opacity-100 ml-1 p-1 rounded bg-gray-200 w-4 h-4 animate-pulse" />
              </div>
            </div>

            {/* Cartes skeleton */}
            <div className="flex flex-col gap-2 flex-1">
              {/* Générer 2-4 cartes par colonne pour varier */}
              {Array.from({ length: Math.max(2, 3 + (colIndex % 3)) }).map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="bg-white dark:bg-zinc-800 rounded-xl shadow p-3 text-xs text-zinc-800 dark:text-zinc-100 flex flex-col gap-2 border border-zinc-100 dark:border-zinc-700 relative"
                >
                  {/* Header de la carte avec icône et scope */}
                  <div className="flex items-center justify-between mb-1 min-h-[20px]">
                    <div className="flex items-center gap-2">
                      {/* Icône de type */}
                      <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
                      {/* Scope */}
                      <div className="h-4 w-12 bg-gray-300 rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Titre de la carte */}
                  <div className="font-medium text-xs break-words line-clamp-2 min-h-[32px]">
                    <div className="h-3 w-full bg-gray-300 rounded animate-pulse mb-1" />
                    <div className="h-3 w-3/4 bg-gray-300 rounded animate-pulse" />
                  </div>

                  {/* Tags des propriétaires */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="h-5 w-16 bg-violet-200 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-violet-200 rounded animate-pulse" />
                  </div>

                  {/* Bouton expand (positionné en bas à droite) */}
                  <div className="absolute bottom-2 right-2 p-1 rounded bg-gray-200 w-4 h-4 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 