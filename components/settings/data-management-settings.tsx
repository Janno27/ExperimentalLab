'use client'

export function DataManagementSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Sauvegarde et export</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Exporter toutes les données</p>
              <p className="text-xs text-gray-500">Télécharger un fichier JSON avec toutes vos données</p>
            </div>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded cursor-pointer">
              Exporter
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Sauvegarde automatique</p>
              <p className="text-xs text-gray-500">Sauvegarder automatiquement les données toutes les 24h</p>
            </div>
            <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Nettoyage des données</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Supprimer les tests terminés</p>
              <p className="text-xs text-gray-500">Supprimer automatiquement les tests terminés depuis plus de 1 an</p>
            </div>
            <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Nettoyer les logs</p>
              <p className="text-xs text-gray-500">Supprimer les logs de plus de 30 jours</p>
            </div>
            <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Synchronisation</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Fréquence de synchronisation</p>
              <p className="text-xs text-gray-500">Synchroniser les données avec Airtable</p>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer">
              <option>Toutes les heures</option>
              <option>Toutes les 6 heures</option>
              <option>Une fois par jour</option>
              <option>Manuel</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Dernière synchronisation</p>
              <p className="text-xs text-gray-500">Il y a 2 heures • 1,234 enregistrements synchronisés</p>
            </div>
            <button className="px-4 py-2 text-sm bg-gray-600 text-white rounded cursor-pointer">
              Synchroniser maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 