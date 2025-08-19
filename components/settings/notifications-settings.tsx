'use client'

export function NotificationsSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">New Tests</p>
              <p className="text-xs text-gray-500">Receive a notification when a new test is created</p>
            </div>
            <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Test Results</p>
              <p className="text-xs text-gray-500">Receive a notification when a test ends</p>
            </div>
            <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Team Updates</p>
              <p className="text-xs text-gray-500">Receive notifications about team changes</p>
            </div>
            <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Push Notifications</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Push Notifications</p>
              <p className="text-xs text-gray-500">Enable push notifications in the browser</p>
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