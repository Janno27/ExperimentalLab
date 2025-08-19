'use client'

export function PersonalizationSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Interface</h3>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Interface Density</label>
            <select className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer">
              <option>Comfortable</option>
              <option>Compact</option>
              <option>Very Compact</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Font Size</label>
            <select className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer">
              <option>Small</option>
              <option>Medium</option>
              <option>Large</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Animations</p>
              <p className="text-xs text-gray-500">Show animations and transitions</p>
            </div>
            <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Dashboard</h3>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Default View</label>
            <select className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer">
              <option>Overview</option>
              <option>Running Tests</option>
              <option>Recent Results</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Show Charts</p>
              <p className="text-xs text-gray-500">Include charts in the dashboard</p>
            </div>
            <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 