'use client'

export function ConnectedAppsSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Intégrations actives</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">A</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Airtable</p>
                <p className="text-xs text-gray-500">Connecté • Dernière sync: il y a 2h</p>
              </div>
            </div>
            <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded cursor-pointer">
              Déconnecter
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-semibold">S</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Slack</p>
                <p className="text-xs text-gray-500">Connecté • Notifications activées</p>
              </div>
            </div>
            <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded cursor-pointer">
              Déconnecter
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Intégrations disponibles</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-semibold">G</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Google Analytics</p>
                <p className="text-xs text-gray-500">Synchroniser les données analytics</p>
              </div>
            </div>
            <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded cursor-pointer">
              Connecter
            </button>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-semibold">M</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Mixpanel</p>
                <p className="text-xs text-gray-500">Importer les événements utilisateur</p>
              </div>
            </div>
            <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded cursor-pointer">
              Connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 