import React from 'react';

export function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Email Webmail Client</h1>
          <p className="mt-2 text-gray-600">Modern, responsive email client interface</p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Compose</h3>
              <p className="mt-2 text-gray-600">Write and send emails</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Inbox</h3>
              <p className="mt-2 text-gray-600">View and manage messages</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
              <p className="mt-2 text-gray-600">Manage your contacts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
