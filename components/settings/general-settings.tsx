'use client'

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Theme</label>
        <select className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer">
          <option>System</option>
          <option>Light</option>
          <option>Dark</option>
        </select>
      </div>

      {/* Accent Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Accent Color</label>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
          <span className="text-sm text-gray-600">Default</span>
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Language</label>
        <select className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer">
          <option>Auto-detect</option>
          <option>French</option>
          <option>English</option>
        </select>
      </div>

      {/* Spoken Language */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Spoken Language</label>
        <select className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer">
          <option>Auto-detect</option>
          <option>French</option>
          <option>English</option>
        </select>
        <p className="text-xs text-gray-500">
          For best results, select your primary language. Even if it&apos;s not in the list, it may still be supported via auto-detection.
        </p>
      </div>

      {/* Voice */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Voice</label>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded cursor-pointer">
            Read
          </button>
          <select className="px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer">
            <option>Ember</option>
          </select>
        </div>
      </div>

      {/* Follow-up suggestions */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Show follow-up suggestions in chats
        </label>
        <div className="flex items-center">
          <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer">
            <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 