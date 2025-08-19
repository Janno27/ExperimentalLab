'use client'

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Authentification</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Authentification à deux facteurs</p>
              <p className="text-xs text-gray-500">Ajouter une couche de sécurité supplémentaire</p>
            </div>
            <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Changer le mot de passe</p>
              <p className="text-xs text-gray-500">Mettre à jour votre mot de passe</p>
            </div>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded cursor-pointer">
              Modifier
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Sessions actives</h3>
        
        <div className="space-y-3">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-sm">💻</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">MacBook Pro - Chrome</p>
                  <p className="text-xs text-gray-500">Paris, France • Connecté il y a 2h</p>
                </div>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Actuel</span>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 text-sm">📱</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">iPhone - Safari</p>
                  <p className="text-xs text-gray-500">Paris, France • Connecté il y a 1j</p>
                </div>
              </div>
              <button className="text-xs text-red-600 hover:text-red-700 cursor-pointer">
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Accès API</p>
              <p className="text-xs text-gray-500">Autoriser l&apos;accès aux données via l&apos;API</p>
            </div>
            <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Notifications push</p>
              <p className="text-xs text-gray-500">Autoriser les notifications dans le navigateur</p>
            </div>
            <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 