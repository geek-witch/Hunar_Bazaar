import React from 'react';
import { LogEntry } from '../types';
import { Terminal, Download, Info, AlertTriangle, XCircle, Clock, User } from 'lucide-react';

const MOCK_LOGS: LogEntry[] = [
  { id: 'L001', timestamp: '2023-10-26 14:30:22', level: 'INFO', message: 'User login successful', user: 'Ali Khan' },
  { id: 'L002', timestamp: '2023-10-26 14:32:10', level: 'WARNING', message: 'Failed login attempt - invalid password', user: 'unknown' },
  { id: 'L003', timestamp: '2023-10-26 15:00:01', level: 'INFO', message: 'Subscription updated to Premium', user: 'Zainab Bibi' },
  { id: 'L004', timestamp: '2023-10-26 15:15:00', level: 'ERROR', message: 'Payment gateway timeout', user: 'System' },
  { id: 'L005', timestamp: '2023-10-26 16:45:33', level: 'INFO', message: 'New user registered', user: 'Bilal Tech' },
  { id: 'L006', timestamp: '2023-10-26 17:10:05', level: 'ERROR', message: 'Database connection failed', user: 'System' },
  { id: 'L007', timestamp: '2023-10-26 17:10:10', level: 'INFO', message: 'System recovery initiated', user: 'Admin' },
];

export const LogsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal size={24} /> System Logs
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#E6EEF9] border border-blue-200 rounded-lg text-sm font-medium text-[#0E4B5B] hover:bg-white shadow-sm w-full sm:w-auto justify-center">
          <Download size={16} /> Export Logs
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-[#E6EEF9] rounded-xl shadow-lg overflow-hidden font-mono text-sm border border-blue-200">
        <div className="bg-blue-100/50 px-6 py-3 border-b border-blue-200 flex items-center gap-2">
          <Terminal size={16} className="text-[#0E4B5B]" />
          <span className="text-[#0E4B5B] font-semibold">system_monitor.log</span>
        </div>
        <div className="p-4 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 border-b border-blue-200">
                <th className="px-4 py-2 w-48">Timestamp</th>
                <th className="px-4 py-2 w-24">Level</th>
                <th className="px-4 py-2">Message</th>
                <th className="px-4 py-2 w-32">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-200">
              {MOCK_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-blue-200/30 transition-colors">
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      log.level === 'INFO' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                      log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                      'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{log.message}</td>
                  <td className="px-4 py-2 text-gray-500">{log.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 font-mono text-sm">
        {MOCK_LOGS.map((log) => (
          <div key={log.id} className="bg-[#E6EEF9] p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                log.level === 'INFO' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {log.level}
              </span>
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Clock size={12} /> {log.timestamp}
              </span>
            </div>
            <p className="text-gray-800 font-medium leading-snug">
              {log.message}
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-xs border-t border-blue-200 pt-2 mt-1">
              <User size={12} />
              <span>{log.user}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};