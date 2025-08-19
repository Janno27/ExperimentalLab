'use client'

export function AccountSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Informations personnelles</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nom complet</label>
            <input 
              type="text" 
              defaultValue="Jean Rosset"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              defaultValue="jean.rosset@example.com"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Téléphone</label>
            <input 
              type="tel" 
              defaultValue="+33 6 12 34 56 78"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Fuseau horaire</label>
            <select className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer">
              <option>Europe/Paris (UTC+1)</option>
              <option>UTC</option>
              <option>America/New_York (UTC-5)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Organisation</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Organisation actuelle</p>
              <p className="text-xs text-gray-500">Emma • Rôle: Admin</p>
            </div>
            <button className="px-4 py-2 text-sm bg-gray-600 text-white rounded cursor-pointer">
              Changer
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Inviter des membres</p>
              <p className="text-xs text-gray-500">Envoyer une invitation par email</p>
            </div>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded cursor-pointer">
              Inviter
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Préférences</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Newsletter</p>
              <p className="text-xs text-gray-500">Recevoir les mises à jour et nouveautés</p>
            </div>
            <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Emails marketing</p>
              <p className="text-xs text-gray-500">Recevoir des offres et promotions</p>
            </div>
            <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Actions dangereuses</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <p className="text-sm font-medium text-red-700">Supprimer le compte</p>
              <p className="text-xs text-red-600">Cette action est irréversible</p>
            </div>
            <button className="px-4 py-2 text-sm bg-red-600 text-white rounded cursor-pointer">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 