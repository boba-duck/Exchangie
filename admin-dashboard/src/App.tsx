import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', users: 40, emails: 240, delivered: 221 },
  { name: 'Feb', users: 50, emails: 300, delivered: 290 },
  { name: 'Mar', users: 45, emails: 280, delivered: 270 },
  { name: 'Apr', users: 60, emails: 350, delivered: 320 },
];

export function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold">Email Server Admin Dashboard</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Users</p>
                <p className="text-3xl font-bold">1,234</p>
              </div>
              <div className="text-4xl text-blue-500">👥</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Emails Today</p>
                <p className="text-3xl font-bold">5,432</p>
              </div>
              <div className="text-4xl text-green-500">📧</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Spam Blocked</p>
                <p className="text-3xl font-bold">234</p>
              </div>
              <div className="text-4xl text-red-500">🚫</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">System Health</p>
                <p className="text-3xl font-bold">98%</p>
              </div>
              <div className="text-4xl text-yellow-500">⚙️</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Monthly Statistics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
              <Legend />
              <Bar dataKey="users" stackId="a" fill="#3b82f6" />
              <Bar dataKey="emails" stackId="a" fill="#10b981" />
              <Bar dataKey="delivered" stackId="a" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
            <ul className="space-y-3 text-gray-300">
              <li>✓ User john@example.com registered</li>
              <li>✓ Domain example.org added</li>
              <li>⚠ Spam filter rule updated</li>
              <li>✓ Backup completed successfully</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">System Status</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex justify-between">
                <span>Database</span>
                <span className="text-green-500">● Running</span>
              </li>
              <li className="flex justify-between">
                <span>SMTP Service</span>
                <span className="text-green-500">● Running</span>
              </li>
              <li className="flex justify-between">
                <span>IMAP Service</span>
                <span className="text-green-500">● Running</span>
              </li>
              <li className="flex justify-between">
                <span>Email Gateway</span>
                <span className="text-green-500">● Running</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
